from datetime import timedelta
import hashlib

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    decode_token
)

from extensions import db
from models import User, Employee
from email_utils import send_password_reset_email


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "message": "Username and password are required"
        }), 400

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(
        user.password_hash,
        password
    ):
        return jsonify({
            "message": "Invalid username or password"
        }), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({
            "message": (
                "Current password and new password "
                "are required"
            )
        }), 400

    if not check_password_hash(
        user.password_hash,
        current_password
    ):
        return jsonify({
            "message": "Current password is incorrect"
        }), 401

    if len(new_password) < 8:
        return jsonify({
            "message": (
                "New password must be at least "
                "8 characters long"
            )
        }), 400

    if current_password == new_password:
        return jsonify({
            "message": (
                "New password must be different "
                "from the current password"
            )
        }), 400

    user.password_hash = generate_password_hash(
        new_password
    )

    db.session.commit()

    return jsonify({
        "message": "Password changed successfully"
    }), 200


# ---------------------------------------------------------
# FORGOT PASSWORD
# ---------------------------------------------------------

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": (
                "If an employee account exists for this email, "
                "a password reset link has been sent."
            )
        }), 200

    email = data.get("email")

    if not email:
        return jsonify({
            "message": (
                "If an employee account exists for this email, "
                "a password reset link has been sent."
            )
        }), 200

    email = email.strip().lower()

    # Find employee using the existing employee email.
    employee = Employee.query.filter(
        db.func.lower(Employee.email) == email
    ).first()

    # Do not reveal whether the email exists.
    if not employee:
        return jsonify({
            "message": (
                "If an employee account exists for this email, "
                "a password reset link has been sent."
            )
        }), 200

    # Find the user account linked to this employee.
    user = User.query.filter_by(
        employee_id=employee.id,
        role="EMPLOYEE"
    ).first()

    # Do not reveal whether an account exists.
    if not user:
        return jsonify({
            "message": (
                "If an employee account exists for this email, "
                "a password reset link has been sent."
            )
        }), 200

    # Create a fingerprint of the current password hash.
    # When the password changes, this fingerprint changes,
    # making previously issued reset tokens invalid.
    password_fingerprint = hashlib.sha256(
        user.password_hash.encode()
    ).hexdigest()

    reset_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "purpose": "password_reset",
            "role": "EMPLOYEE",
            "password_fingerprint": password_fingerprint
        },
        expires_delta=timedelta(minutes=5)
    )

    try:
        send_password_reset_email(
            employee_name=employee.name,
            employee_email=employee.email,
            reset_token=reset_token
        )
    except Exception as error:
        print(
            "Password reset email failed:",
            error
        )

    return jsonify({
        "message": (
            "If an employee account exists for this email, "
            "a password reset link has been sent."
        )
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({
            "message": (
                "Reset token and new password are required"
            )
        }), 400

    if len(new_password) < 8:
        return jsonify({
            "message": (
                "New password must be at least "
                "8 characters long"
            )
        }), 400

    try:
        decoded_token = decode_token(token)

    except Exception:
        return jsonify({
            "message": (
                "Invalid or expired password reset link"
            )
        }), 401

    # Make sure this token was specifically created
    # for password reset.
    if decoded_token.get("purpose") != "password_reset":
        return jsonify({
            "message": "Invalid password reset token"
        }), 401

    if decoded_token.get("role") != "EMPLOYEE":
        return jsonify({
            "message": "Invalid password reset token"
        }), 401

    user_id = int(decoded_token.get("sub"))

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "message": "Invalid password reset token"
        }), 401

    # Make sure the user is still an employee.
    if user.role != "EMPLOYEE":
        return jsonify({
            "message": "Invalid password reset token"
        }), 401

    # Compare the password fingerprint stored inside
    # the reset token with the current password.
    current_fingerprint = hashlib.sha256(
        user.password_hash.encode()
    ).hexdigest()

    token_fingerprint = decoded_token.get(
        "password_fingerprint"
    )

    if current_fingerprint != token_fingerprint:
        return jsonify({
            "message": (
                "This password reset link is no longer valid"
            )
        }), 401

    # Prevent setting the same password.
    if check_password_hash(
        user.password_hash,
        new_password
    ):
        return jsonify({
            "message": (
                "New password must be different "
                "from the current password"
            )
        }), 400

    user.password_hash = generate_password_hash(
        new_password
    )

    db.session.commit()

    return jsonify({
        "message": (
            "Password reset successfully. "
            "You can now log in with your new password."
        )
    }), 200