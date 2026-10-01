from getpass import getpass

from app import app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash


with app.app_context():
    username = input("Enter username: ").strip()
    password = getpass("Enter password: ")
    role = input("Enter role (ADMIN/EMPLOYEE): ").strip().upper()

    employee_id = None

    if role == "EMPLOYEE":
        employee_id = int(input("Enter employee ID: ").strip())

    if role not in ["ADMIN", "EMPLOYEE"]:
        print("Invalid role.")
    else:
        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            print("Username already exists.")
        else:
            user = User(
                username=username,
                password_hash=generate_password_hash(password),
                role=role,
                employee_id=employee_id
            )

            db.session.add(user)
            db.session.commit()

            print("User created successfully.")