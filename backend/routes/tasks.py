from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from extensions import db
from models import Task, Employee, User
from auth_utils import admin_required


tasks_bp = Blueprint(
    "tasks",
    __name__,
    url_prefix="/api/tasks"
)


@tasks_bp.route("", methods=["GET"])
@admin_required
def get_tasks():
    tasks = Task.query.all()

    return jsonify([
        task.to_dict()
        for task in tasks
    ]), 200


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@admin_required
def get_task(task_id):
    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({
            "message": "Task not found"
        }), 404

    return jsonify(task.to_dict()), 200


@tasks_bp.route("", methods=["POST"])
@admin_required
def create_task():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    required_fields = ["title", "assigned_to"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({
                "message": f"{field} is required"
            }), 400

    employee = db.session.get(Employee, data["assigned_to"])

    if not employee:
        return jsonify({
            "message": "Assigned employee not found"
        }), 404

    if employee.status != "ACTIVE":
        return jsonify({
            "message": "Cannot assign task to inactive employee"
        }), 400

    priority = data.get("priority", "MEDIUM")

    if priority not in ["LOW", "MEDIUM", "HIGH"]:
        return jsonify({
            "message": "Invalid priority"
        }), 400

    status = data.get("status", "TODO")

    if status not in ["TODO", "IN_PROGRESS", "COMPLETED"]:
        return jsonify({
            "message": "Invalid status"
        }), 400

    task = Task(
        title=data["title"],
        description=data.get("description"),
        priority=priority,
        status=status,
        assigned_to=data["assigned_to"],
        assigned_by=int(get_jwt_identity()),
        due_date=data.get("due_date")
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        "message": "Task created successfully",
        "task": task.to_dict()
    }), 201

@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@admin_required
def update_task(task_id):
    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({
            "message": "Task not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    if "title" in data:
        if not data["title"]:
            return jsonify({
                "message": "Title cannot be empty"
            }), 400

        task.title = data["title"]

    if "description" in data:
        task.description = data["description"]

    if "priority" in data:
        if data["priority"] not in ["LOW", "MEDIUM", "HIGH"]:
            return jsonify({
                "message": "Invalid priority"
            }), 400

        task.priority = data["priority"]

    if "status" in data:
        if data["status"] not in [
            "TODO",
            "IN_PROGRESS",
            "COMPLETED"
        ]:
            return jsonify({
                "message": "Invalid status"
            }), 400

        task.status = data["status"]

    if "assigned_to" in data:
        employee = db.session.get(
            Employee,
            data["assigned_to"]
        )

        if not employee:
            return jsonify({
                "message": "Assigned employee not found"
            }), 404

        if employee.status != "ACTIVE":
            return jsonify({
                "message": "Cannot assign task to inactive employee"
            }), 400

        task.assigned_to = data["assigned_to"]

    if "due_date" in data:
        task.due_date = data["due_date"]

    db.session.commit()

    return jsonify({
        "message": "Task updated successfully",
        "task": task.to_dict()
    }), 200


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@admin_required
def delete_task(task_id):
    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({
            "message": "Task not found"
        }), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        "message": "Task deleted successfully"
    }), 200

my_tasks_bp = Blueprint(
    "my_tasks",
    __name__,
    url_prefix="/api/my"
)


@my_tasks_bp.route("/tasks", methods=["GET"])
@jwt_required()
def get_my_tasks():
    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if user.role != "EMPLOYEE":
        return jsonify({
            "message": "Employee access required"
        }), 403

    if not user.employee_id:
        return jsonify({
            "message": "User is not linked to an employee"
        }), 400

    tasks = Task.query.filter_by(
        assigned_to=user.employee_id
    ).all()

    return jsonify([
        task.to_dict()
        for task in tasks
    ]), 200


@my_tasks_bp.route("/tasks/<int:task_id>/status", methods=["PATCH"])
@jwt_required()
def update_my_task_status(task_id):
    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if user.role != "EMPLOYEE":
        return jsonify({
            "message": "Employee access required"
        }), 403

    if not user.employee_id:
        return jsonify({
            "message": "User is not linked to an employee"
        }), 400

    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({
            "message": "Task not found"
        }), 404

    if task.assigned_to != user.employee_id:
        return jsonify({
            "message": "You can only update your own tasks"
        }), 403

    data = request.get_json()

    if not data or "status" not in data:
        return jsonify({
            "message": "Status is required"
        }), 400

    if data["status"] not in [
        "TODO",
        "IN_PROGRESS",
        "COMPLETED"
    ]:
        return jsonify({
            "message": "Invalid status"
        }), 400

    task.status = data["status"]

    db.session.commit()

    return jsonify({
        "message": "Task status updated successfully",
        "task": task.to_dict()
    }), 200