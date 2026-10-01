import csv
from io import BytesIO, StringIO

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import get_jwt, jwt_required

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer
)

from extensions import db
from models import Employee, Task, User
from auth_utils import admin_required


reports_bp = Blueprint(
    "reports",
    __name__,
    url_prefix="/api/reports"
)


def get_active_employee_task_data():
    rows = []

    employees = Employee.query.filter_by(
        status="ACTIVE"
    ).order_by(
        Employee.employee_code
    ).all()

    for employee in employees:

        active_tasks = Task.query.filter(
            Task.assigned_to == employee.id,
            Task.status.in_(["TODO", "IN_PROGRESS"])
        ).order_by(
            Task.id
        ).all()

        for task in active_tasks:

            assigned_by_user = db.session.get(
                User,
                task.assigned_by
            )

            rows.append({
                "id": employee.employee_code,
                "name": employee.name,
                "email": employee.email,
                "designation": employee.designation or "",
                "department": employee.department or "",
                "task": task.title,
                "assigned_by": (
                    assigned_by_user.username
                    if assigned_by_user
                    else ""
                ),
                "due_date": (
                    task.due_date.isoformat()
                    if task.due_date
                    else ""
                )
            })

    return rows


@reports_bp.route(
    "/employees",
    methods=["GET"]
)
@admin_required
def export_employee_task_data():

    export_format = request.args.get(
        "format",
        "csv"
    ).lower()

    if export_format not in ["csv", "pdf"]:
        return jsonify({
            "message": "Invalid export format. Use csv or pdf."
        }), 400

    rows = get_active_employee_task_data()

    # =====================================================
    # CSV
    # =====================================================

    if export_format == "csv":

        output = StringIO()

        writer = csv.writer(output)

        writer.writerow([
            "Employee ID",
            "Name",
            "Email",
            "Designation",
            "Department",
            "Task",
            "Assigned By",
            "Due Date"
        ])

        for row in rows:
            writer.writerow([
                row["id"],
                row["name"],
                row["email"],
                row["designation"],
                row["department"],
                row["task"],
                row["assigned_by"],
                row["due_date"]
            ])

        csv_data = output.getvalue()

        memory_file = BytesIO(
            csv_data.encode("utf-8-sig")
        )

        memory_file.seek(0)

        return send_file(
            memory_file,
            mimetype="text/csv",
            as_attachment=True,
            download_name="active_employee_tasks.csv"
        )

    # =====================================================
    # PDF
    # =====================================================

    pdf_buffer = BytesIO()

    document = SimpleDocTemplate(
        pdf_buffer,
        pagesize=landscape(A4),
        rightMargin=25,
        leftMargin=25,
        topMargin=25,
        bottomMargin=25
    )

    styles = getSampleStyleSheet()

    elements = []

    title = Paragraph(
        "Active Employee Task Report",
        styles["Title"]
    )

    elements.append(title)

    elements.append(
        Spacer(1, 12)
    )

    elements.append(
        Paragraph(
            "Active employees with active tasks "
            "(TODO / IN_PROGRESS)",
            styles["Normal"]
        )
    )

    elements.append(
        Spacer(1, 15)
    )

    table_data = [[
        "Employee ID",
        "Name",
        "Email",
        "Designation",
        "Department",
        "Task",
        "Assigned By",
        "Due Date"
    ]]

    for row in rows:
        table_data.append([
            row["id"],
            row["name"],
            row["email"],
            row["designation"],
            row["department"],
            row["task"],
            row["assigned_by"],
            row["due_date"]
        ])

    if len(table_data) == 1:
        table_data.append([
            "No active employee tasks found",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ])

    table = Table(
        table_data,
        repeatRows=1,
        colWidths=[
            65,
            90,
            125,
            105,
            90,
            160,
            80,
            70
        ]
    )

    table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#222222")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "ROWBACKGROUNDS",
                (0, 1),
                (-1, -1),
                [
                    colors.white,
                    colors.HexColor("#f5f5f5")
                ]
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                5
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                5
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                5
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5
            )
        ])
    )

    elements.append(table)

    document.build(elements)

    pdf_buffer.seek(0)

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="active_employee_tasks.pdf"
    )