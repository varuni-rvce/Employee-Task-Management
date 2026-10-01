from getpass import getpass

from app import app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash


with app.app_context():
    username = input("Enter username: ").strip()
    new_password = getpass("Enter new password: ")

    user = User.query.filter_by(username=username).first()

    if not user:
        print("User not found.")
    else:
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()

        print("Password updated successfully.")