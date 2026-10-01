Employee Task Management System

A full-stack Employee Task Management System built with React.js, Flask, MySQL, and JWT authentication.

The application provides separate access for ADMIN and EMPLOYEE users to manage employees, assign tasks, track progress, and securely manage accounts.

🚀 Features

Admin

Secure admin login

Add, view, edit, and deactivate employees

Bulk employee import using CSV/PDF

Automatically create employee accounts

Create, assign, edit, and delete tasks

Track task priority and status

Generate employee/task reports

Export employee/task data

Email notifications

Employee

Secure employee login

View employee dashboard

View assigned tasks

Update status of own tasks

Change password

Forgot/reset password

🛠️ Tech Stack

Layer

Technology

Frontend

React.js, Vite, JavaScript, CSS

Backend

Python, Flask

Database

MySQL

Authentication

JWT

Authorization

Role-Based Access Control

ORM

Flask-SQLAlchemy

Email

Flask-Mail

Database Driver

PyMySQL

API Testing

Postman

🏗️ Architecture

React Frontend
      │
      │ REST API
      ▼
Flask Backend
      │
      ├── JWT Authentication
      ├── Role-Based Access Control
      ├── Employee Management
      └── Task Management
      │
      ▼
MySQL Database

👥 User Roles

ADMIN

Can manage employees, tasks, assignments, and reports.

EMPLOYEE

Can view assigned tasks and update the status of their own tasks.

Task ownership is enforced by the backend, so employees cannot modify tasks assigned to other employees.

🔐 Authentication & Security

The application uses JWT-based authentication and role-based authorization.

Protected requests use:

Authorization: Bearer <JWT_TOKEN>

Security features include:

JWT authentication

Role-based authorization

Password hashing

Protected admin endpoints

Employee task ownership validation

Time-limited password reset tokens

Environment variables for sensitive configuration

📋 Main APIs

Authentication

POST /api/auth/login
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password

Employees

GET    /api/employees
POST   /api/employees
GET    /api/employees/<id>
PUT    /api/employees/<id>
DELETE /api/employees/<id>

Tasks

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/<id>
PUT    /api/tasks/<id>
DELETE /api/tasks/<id>

Employee Tasks

GET   /api/my/tasks
PATCH /api/my/tasks/<id>/status

🗄️ Database

The application uses three main tables:

employees
users
tasks

Relationships:

Employee ────< Tasks
Employee ──── User
User ────────< Tasks

📧 Email & Reports

Employee welcome emails with login credentials

Password reset emails

Active Employee Task Report in PDF format

Employee/task data export

⚙️ Local Setup

Prerequisites

Python 3.x

Node.js

npm

MySQL

Git

Clone Repository

git clone https://github.com/YOUR_USERNAME/employee-task-management.git
cd employee-task-management

Backend

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

cd backend
python app.py

Backend:

http://127.0.0.1:5000

Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173

🔧 Environment Configuration

Create:

backend/.env

Example:

DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=employee_task_db

JWT_SECRET_KEY=your_secret_key

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com

Do not commit .env files, passwords, or other secrets to GitHub.

🧪 API Testing

APIs can be tested using Postman.

Typical flow:

Login
  ↓
Get JWT Token
  ↓
Authorize Protected APIs
  ↓
Employee CRUD
  ↓
Task CRUD
  ↓
Employee Ownership Testing

🤖 Future Enhancement — AI Task Management Agent

A planned enhancement is an AI Task Management Agent using LangChain and LangGraph.

Example interactions:

"Show me all overdue tasks."

"Which employees have pending high-priority tasks?"

"Show me Jane's tasks."

"Create a high-priority task for Jane to complete API testing."

The agent would use controlled application tools while respecting existing authentication and authorization rules.

🎯 Project Objective

This project demonstrates:

Full-stack application development

REST API development

React frontend development

Flask backend development

MySQL database design

JWT authentication

Role-Based Access Control

Secure password management

Email integration

File import/export

PDF reporting

API testing

Frontend-backend integration

📌 Current Status

Core employee management, task management, authentication, role-based access, employee task ownership, password management, email notifications, employee import, reporting, and React dashboards are implemented.

AI agent functionality using LangChain/LangGraph is planned as a future enhancement.

👨‍💻 Author

Developed as a full-stack learning and implementation project.

📜 License

This project is intended for educational and portfolio purposes.