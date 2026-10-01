from flask import current_app
from flask_mail import Message

from extensions import mail


def send_welcome_email(
    employee_name,
    employee_email,
    username,
    temporary_password
):
    print("Sending welcome email to:", employee_email)

    subject = "Welcome to Our Company - Employee Account"

    body = f"""
Hello {employee_name},

Welcome to our company!

Your employee account has been created successfully.

Here are your login credentials:

Username: {username}
Temporary Password: {temporary_password}

Please log in using these credentials and change your password after your first login.

Login:
http://localhost:5173/

If you did not expect this email, please contact the administrator.

Regards,
Employee Task Management Team
"""

    message = Message(
        subject=subject,
        recipients=[employee_email],
        body=body
    )

    mail.send(message)

    print("Welcome email sent successfully to:", employee_email)

def send_password_reset_email(
    employee_name,
    employee_email,
    reset_token
):
    print(
        "Sending password reset email to:",
        employee_email
    )

    reset_link = (
        "http://localhost:5173/reset-password"
        f"?token={reset_token}"
    )

    subject = "Password Reset - Employee Task Management"

    body = f"""
Hello {employee_name},

We received a request to reset your Employee Task Management password.

Click the link below to reset your password:

{reset_link}

This password reset link will expire in 5 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
Employee Task Management Team
"""

    message = Message(
        subject=subject,
        recipients=[employee_email],
        body=body
    )

    mail.send(message)

    print(
        "Password reset email sent successfully to:",
        employee_email
    )