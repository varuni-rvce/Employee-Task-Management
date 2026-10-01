
import csv
import io
import pdfplumber
from flask import Blueprint, request, jsonify
from auth_utils import admin_required
import secrets
from werkzeug.security import generate_password_hash
from models import Employee, User
from email_utils import send_welcome_email
from extensions import db

employees_bp = Blueprint("employees", __name__, url_prefix="/api/employees")


@employees_bp.route("", methods=["GET"])
@admin_required
def get_employees():
    employees = Employee.query.all()

    return jsonify([
        employee.to_dict()
        for employee in employees
    ]), 200


@employees_bp.route("/<int:employee_id>", methods=["GET"])
@admin_required
def get_employee(employee_id):
    employee = db.session.get(Employee, employee_id)

    if not employee:
        return jsonify({
            "message": "Employee not found"
        }), 404

    return jsonify(employee.to_dict()), 200


@employees_bp.route("", methods=["POST"])
@admin_required
def create_employee():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    required_fields = [
        "employee_code",
        "name",
        "email"
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({
                "message": f"{field} is required"
            }), 400

    employee_code = data["employee_code"].strip()
    name = data["name"].strip()
    email = data["email"].strip().lower()

    # -----------------------------------
    # Check duplicate employee ID
    # -----------------------------------

    existing_employee = Employee.query.filter_by(
        employee_code=employee_code
    ).first()

    if existing_employee:
        return jsonify({
            "message": (
                f"Duplicate employee ID found: "
                f"{employee_code}. "
                "Use a different employee ID."
            )
        }), 409

    # -----------------------------------
    # Check duplicate email
    # -----------------------------------

    existing_email = Employee.query.filter_by(
        email=email
    ).first()

    if existing_email:
        return jsonify({
            "message": (
                f"Duplicate email ID found: "
                f"{email}. "
                "Use a different email ID."
            )
        }), 409

    # -----------------------------------
    # Create employee
    # -----------------------------------

    employee = Employee(
        employee_code=employee_code,
        name=name,
        email=email,
        phone=data.get("phone"),
        department=data.get("department"),
        designation=data.get("designation"),
        joining_date=data.get("joining_date"),
        status=data.get("status", "ACTIVE")
    )

    try:
        db.session.add(employee)

        # Flush so employee.id is generated
        # before creating the User record.
        db.session.flush()

        # -----------------------------------
        # Generate login credentials
        # -----------------------------------

        username = employee_code

        temporary_password = secrets.token_urlsafe(10)

        # -----------------------------------
        # Create employee login account
        # -----------------------------------

        user = User(
            username=username,
            password_hash=generate_password_hash(
                temporary_password
            ),
            role="EMPLOYEE",
            employee_id=employee.id
        )

        db.session.add(user)

        # Save employee + user
        db.session.commit()

        # -----------------------------------
        # Send welcome email
        # -----------------------------------

        try:
            send_welcome_email(
                employee_name=name,
                employee_email=email,
                username=username,
                temporary_password=temporary_password
            )

        except Exception as email_error:
            print(
                "Welcome email could not be sent:",
                email_error
            )

        return jsonify({
            "message": (
                "Employee created successfully. "
                "Login credentials have been generated."
            ),
            "employee": employee.to_dict()
        }), 201

    except Exception as error:
        db.session.rollback()

        print(
            "Employee creation error:",
            error
        )

        return jsonify({
            "message": (
                "Failed to create employee."
            )
        }), 500

@employees_bp.route("/<int:employee_id>", methods=["PUT"])
@admin_required
def update_employee(employee_id):
    employee = db.session.get(Employee, employee_id)

    if not employee:
        return jsonify({
            "message": "Employee not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    if "employee_code" in data:
        existing = Employee.query.filter(
            Employee.employee_code == data["employee_code"],
            Employee.id != employee_id
        ).first()

        if existing:
            return jsonify({
                "message": "Employee code already exists"
            }), 400

        employee.employee_code = data["employee_code"]

    if "name" in data:
        employee.name = data["name"]

    if "email" in data:
        existing = Employee.query.filter(
            Employee.email == data["email"],
            Employee.id != employee_id
        ).first()

        if existing:
            return jsonify({
                "message": "Email already exists"
            }), 400

        employee.email = data["email"]

    if "phone" in data:
        employee.phone = data["phone"]

    if "department" in data:
        employee.department = data["department"]

    if "designation" in data:
        employee.designation = data["designation"]

    if "joining_date" in data:
        employee.joining_date = data["joining_date"]

    if "status" in data:
        if data["status"] not in ["ACTIVE", "INACTIVE"]:
            return jsonify({
                "message": "Invalid status"
            }), 400

        employee.status = data["status"]

    db.session.commit()

    return jsonify({
        "message": "Employee updated successfully",
        "employee": employee.to_dict()
    }), 200


@employees_bp.route("/<int:employee_id>", methods=["DELETE"])
@admin_required
def delete_employee(employee_id):
    employee = db.session.get(Employee, employee_id)

    if not employee:
        return jsonify({
            "message": "Employee not found"
        }), 404

    # Soft delete: keep employee record but mark inactive
    employee.status = "INACTIVE"

    db.session.commit()

    return jsonify({
        "message": "Employee deactivated successfully"
    }), 200

@employees_bp.route("/upload", methods=["POST"])
@admin_required
def upload_employees():
    if "file" not in request.files:
        return jsonify({
            "message": "Please upload a CSV or PDF file."
        }), 400

    file = request.files["file"]

    if not file or file.filename == "":
        return jsonify({
            "message": "Please select a file."
        }), 400

    filename = file.filename.lower()

    if not filename.endswith((".csv", ".pdf")):
        return jsonify({
            "message": "Only CSV and PDF files are allowed."
        }), 400

    try:
        rows = []

        # -----------------------------------
        # CSV
        # -----------------------------------
        if filename.endswith(".csv"):
            content = file.read().decode("utf-8-sig")

            reader = csv.DictReader(
                io.StringIO(content)
            )

            for row in reader:
                rows.append({
                    key.strip().lower(): (
                        value.strip()
                        if value is not None
                        else ""
                    )
                    for key, value in row.items()
                })

        # -----------------------------------
        # PDF
        # -----------------------------------
        elif filename.endswith(".pdf"):
            with pdfplumber.open(file) as pdf:

                for page in pdf.pages:
                    tables = page.extract_tables()

                    for table in tables:

                        if not table or len(table) < 2:
                            continue

                        headers = [
                            str(header).strip().lower()
                            if header
                            else ""
                            for header in table[0]
                        ]

                        for data_row in table[1:]:

                            if not data_row:
                                continue

                            row = {}

                            for index, header in enumerate(headers):
                                if index < len(data_row):
                                    row[header] = (
                                        data_row[index].strip()
                                        if data_row[index]
                                        else ""
                                    )

                            rows.append(row)

        if not rows:
            return jsonify({
                "message": "No employee data found in the uploaded file."
            }), 400

        # -----------------------------------
        # Normalize column names
        # -----------------------------------

        column_aliases = {
            "employee id": "employee_code",
            "employee_id": "employee_code",
            "employee code": "employee_code",
            "id": "employee_code",

            "name": "name",

            "email": "email",
            "email id": "email",
            "email-id": "email",
            "email address": "email",

            "phone": "phone",
            "phone number": "phone",

            "department": "department",

            "designation": "designation",

            "joining date": "joining_date",
            "joining_date": "joining_date",

            "status": "status"
        }

        normalized_rows = []

        for row in rows:

            normalized = {}

            for key, value in row.items():

                clean_key = (
                    str(key)
                    .strip()
                    .lower()
                )

                mapped_key = column_aliases.get(
                    clean_key
                )

                if mapped_key:
                    normalized[mapped_key] = (
                        str(value).strip()
                        if value is not None
                        else ""
                    )

            normalized_rows.append(normalized)

        # -----------------------------------
        # Required columns
        # -----------------------------------

        required_fields = [
            "employee_code",
            "name",
            "email"
        ]

        for index, row in enumerate(
            normalized_rows,
            start=2
        ):

            missing_fields = [
                field
                for field in required_fields
                if not row.get(field)
            ]

            if missing_fields:
                return jsonify({
                    "message": (
                        f"Row {index}: Missing required "
                        f"field(s): "
                        f"{', '.join(missing_fields)}."
                    )
                }), 400

        # -----------------------------------
        # Check duplicate data inside upload
        # -----------------------------------

        employee_codes = set()
        emails = set()

        for index, row in enumerate(
            normalized_rows,
            start=2
        ):

            employee_code = row["employee_code"]
            email = row["email"].lower()

            if employee_code in employee_codes:
                return jsonify({
                    "message": (
                        f"Duplicate employee ID found: "
                        f"{employee_code}. "
                        "Use a different employee ID."
                    )
                }), 409

            if email in emails:
                return jsonify({
                    "message": (
                        f"Duplicate email ID found: "
                        f"{email}. "
                        "Use a different email ID."
                    )
                }), 409

            employee_codes.add(employee_code)
            emails.add(email)

        # -----------------------------------
        # Check duplicates against database
        # -----------------------------------

        existing_employee = Employee.query.filter(
            Employee.employee_code.in_(
                list(employee_codes)
            )
        ).first()

        if existing_employee:
            return jsonify({
                "message": (
                    f"Duplicate employee ID found: "
                    f"{existing_employee.employee_code}. "
                    "Use a different employee ID."
                )
            }), 409

        existing_email = Employee.query.filter(
            db.func.lower(Employee.email).in_(
                list(emails)
            )
        ).first()

        if existing_email:
            return jsonify({
                "message": (
                    f"Duplicate email ID found: "
                    f"{existing_email.email}. "
                    "Use a different email ID."
                )
            }), 409

        # -----------------------------------
        # Validate and prepare employees
        # -----------------------------------

        employees_to_add = []

        for row in normalized_rows:

            status = (
                row.get("status") or "ACTIVE"
            ).upper()

            if status not in [
                "ACTIVE",
                "INACTIVE"
            ]:
                return jsonify({
                    "message": (
                        f"Invalid status for employee "
                        f"{row['employee_code']}. "
                        "Use ACTIVE or INACTIVE."
                    )
                }), 400

            joining_date = row.get(
                "joining_date"
            ) or None

            employee = Employee(
                employee_code=row["employee_code"],
                name=row["name"],
                email=row["email"],
                phone=row.get("phone") or None,
                department=row.get("department") or None,
                designation=row.get("designation") or None,
                joining_date=joining_date,
                status=status
            )

            employees_to_add.append(employee)

        # -----------------------------------
        # Check duplicate usernames
        # -----------------------------------

        existing_user = User.query.filter(
            User.username.in_(list(employee_codes))
        ).first()

        if existing_user:
            return jsonify({
                "message": (
                    f"Username already exists for employee ID "
                    f"{existing_user.username}. "
                    "Use a different employee ID."
                )
            }), 409

        # -----------------------------------
        # Insert employees and create users
        # -----------------------------------

        db.session.add_all(employees_to_add)

        # Flush so employee IDs are generated before
        # creating the linked User records.
        db.session.flush()

        users_to_add = []
        welcome_emails = []

        for employee in employees_to_add:
            username = employee.employee_code
            temporary_password = secrets.token_urlsafe(10)

            user = User(
                username=username,
                password_hash=generate_password_hash(
                    temporary_password
                ),
                role="EMPLOYEE",
                employee_id=employee.id
            )

            users_to_add.append(user)

            welcome_emails.append({
                "employee_name": employee.name,
                "employee_email": employee.email,
                "username": username,
                "temporary_password": temporary_password
            })

        db.session.add_all(users_to_add)

        # Save all employees and user accounts together.
        db.session.commit()

        # -----------------------------------
        # Send welcome emails
        # -----------------------------------

        email_failures = []

        for email_data in welcome_emails:
            try:
                print(
                    "Sending welcome email to:",
                    email_data["employee_email"]
                )

                send_welcome_email(
                    employee_name=email_data["employee_name"],
                    employee_email=email_data["employee_email"],
                    username=email_data["username"],
                    temporary_password=email_data["temporary_password"]
                )

                print(
                    "Welcome email sent successfully to:",
                    email_data["employee_email"]
                )

            except Exception as email_error:
                print(
                    "Welcome email could not be sent to:",
                    email_data["employee_email"],
                    email_error
                )

                email_failures.append(
                    email_data["employee_email"]
                )

        response = {
            "message": (
                f"{len(employees_to_add)} "
                "employee(s) uploaded successfully. "
                f"{len(users_to_add)} user account(s) created."
            ),
            "count": len(employees_to_add),
            "accounts_created": len(users_to_add),
            "email_failures": email_failures
        }

        if email_failures:
            response["warning"] = (
                "Some employee accounts were created, "
                "but welcome emails could not be sent."
            )

        return jsonify(response), 201

    except UnicodeDecodeError:
        db.session.rollback()

        return jsonify({
            "message": (
                "Unable to read the CSV file. "
                "Please save it as UTF-8 CSV."
            )
        }), 400

    except Exception as error:
        db.session.rollback()

        print("Employee upload error:", error)

        return jsonify({
            "message": (
                "Failed to process the uploaded file."
            )
        }), 500
