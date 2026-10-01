from getpass import getpass

from app import app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash


with app.app_context():
    username = input("Enter admin username: ").strip()
    password = getpass("Enter admin password: ")

    existing_user = User.query.filter_by(username=username).first()

    if existing_user:
        print("Username already exists.")
    else:
        admin = User(
            username=username,
            password_hash=generate_password_hash(password),
            role="ADMIN"
        )

        db.session.add(admin)
        db.session.commit()

        print("Admin user created successfully.")