from extensions import db
from models.user import User


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    priority = db.Column(
        db.Enum("LOW", "MEDIUM", "HIGH"),
        nullable=False,
        default="MEDIUM"
    )

    status = db.Column(
        db.Enum("TODO", "IN_PROGRESS", "COMPLETED"),
        nullable=False,
        default="TODO"
    )

    assigned_to = db.Column(
        db.Integer,
        db.ForeignKey("employees.id"),
        nullable=False
    )

    assigned_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    due_date = db.Column(db.Date)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    assigned_by_user = db.relationship(
        "User",
        foreign_keys=[assigned_by]
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
            "assigned_to": self.assigned_to,
            "assigned_by": self.assigned_by,
            "assigned_by_username": (
                self.assigned_by_user.username
                if self.assigned_by_user
                else None
            ),
            "due_date": (
                self.due_date.isoformat()
                if self.due_date
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }