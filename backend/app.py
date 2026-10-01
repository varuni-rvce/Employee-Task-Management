from flask import Flask
from flask_cors import CORS
from routes import tasks
from config import Config
from extensions import db, jwt, mail
from models import Employee, User, Task
from routes.employees import employees_bp
from routes.auth import auth_bp
from routes.tasks import tasks_bp, my_tasks_bp
from routes.reports import reports_bp


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config.from_object(Config)
    app.register_blueprint(employees_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(my_tasks_bp)
    app.register_blueprint(reports_bp)

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    @app.route("/db-test")
    def db_test():
        try:
            db.session.execute(db.text("SELECT 1"))
            return "MySQL connection successful!"
        except Exception as e:
            return f"MySQL connection failed: {str(e)}", 500

    @app.route("/employee-test")
    def employee_test():
        employees = Employee.query.all()

        return {
            "count": len(employees),
            "employees": [employee.to_dict() for employee in employees]
        }

    @app.route("/user-test")
    def user_test():
        users = User.query.all()

        return {
            "count": len(users),
            "users": [user.to_dict() for user in users]
        }

    @app.route("/task-test")
    def task_test():
        tasks = Task.query.all()

        return {
        "count": len(tasks),
        "tasks": [task.to_dict() for task in tasks]
    }

    @app.route("/")
    def welcome():
        return "Hello, Welcome to the Task Management App!"

    return app

app = create_app()


if __name__ == "__main__":
    app.run(debug=True)