import { useEffect, useState } from "react";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentAssignee, setCurrentAssignee] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    assigned_to: "",
    due_date: "",
  });

  const token = localStorage.getItem("access_token");

  const showToast = (text) => {
    setToast(text);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/tasks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load tasks");
        return;
      }

      setTasks(data);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load employees");
        return;
      }

      setEmployees(
        data.filter((employee) => employee.status === "ACTIVE")
      );
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isEditing = editingId !== null;

    setMessage(
      isEditing ? "Updating task..." : "Creating task..."
    );

    try {
      const url = isEditing
        ? `http://127.0.0.1:5000/api/tasks/${editingId}`
        : "http://127.0.0.1:5000/api/tasks";

      const method = isEditing ? "PUT" : "POST";

      const assignedTo = formData.assigned_to
        ? Number(formData.assigned_to)
        : currentAssignee;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          assigned_to: assignedTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            (isEditing
              ? "Failed to update task"
              : "Failed to create task")
        );
        return;
      }

      showToast(
        isEditing
          ? "Task updated successfully!"
          : "Task added successfully!"
      );

      resetForm();
      fetchTasks();
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setCurrentAssignee(task.assigned_to);

    setFormData({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "MEDIUM",
      status: task.status || "TODO",
      assigned_to: "",
      due_date: task.due_date || "",
    });

    setShowForm(true);
    setMessage("");
  };

  const handleDelete = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to delete task");
        return;
      }

      showToast("Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "TODO",
      assigned_to: "",
      due_date: "",
    });

    setEditingId(null);
    setCurrentAssignee(null);
    setShowForm(false);
  };

  const availableEmployees = employees.filter(
    (employee) => employee.id !== currentAssignee
  );

  return (
    <div className="tasks-page">

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

      {/* PAGE HEADER */}

      <div className="page-header">

        <div>
          <button
            className="back-button"
            onClick={() => {
              window.location.href = "/";
            }}
          >
          ← Dashboard
          </button>

          <h1>Tasks</h1>
        </div>

        <button
          className="button-primary"
          onClick={() => {
            if (showForm) {
              resetForm();
              setMessage("");
            } else {
              setEditingId(null);
              setCurrentAssignee(null);

              setFormData({
                title: "",
                description: "",
                priority: "MEDIUM",
                status: "TODO",
                assigned_to: "",
                due_date: "",
              });

              setShowForm(true);
              setMessage("");
            }
          }}
        >
          {showForm ? "Cancel" : "+ Create Task"}
        </button>

      </div>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      {/* CREATE / EDIT FORM */}

      {showForm && (
        <section className="form-card">

          <div className="form-card-header">

            <div>
              <p className="eyebrow">
                {editingId
                  ? "TASK DETAILS"
                  : "NEW TASK"}
              </p>

              <h2>
                {editingId
                  ? "Edit Task"
                  : "Create Task"}
              </h2>

              <p>
                {editingId
                  ? "Update the task information below."
                  : "Enter the task information and assign it to an employee."}
              </p>
            </div>

          </div>

          <form
            className="task-form"
            onSubmit={handleSubmit}
          >

            {/* TITLE */}

            <div className="form-field task-title-field">
              <label>
                Task Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Complete API Development"
                required
              />

              <small>
                Enter a short and descriptive task title.
              </small>
            </div>

            {/* DESCRIPTION */}

            <div className="form-field task-description-field">
              <label>
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what needs to be completed..."
                rows="5"
              />

              <small>
                Add any details or instructions for the employee.
              </small>
            </div>

            {/* PRIORITY */}

            <div className="form-field">
              <label>
                Priority
              </label>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="LOW">
                  LOW
                </option>

                <option value="MEDIUM">
                  MEDIUM
                </option>

                <option value="HIGH">
                  HIGH
                </option>
              </select>
            </div>

            {/* STATUS */}

            <div className="form-field">
              <label>
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="TODO">
                  TODO
                </option>

                <option value="IN_PROGRESS">
                  IN PROGRESS
                </option>

                <option value="COMPLETED">
                  COMPLETED
                </option>
              </select>
            </div>

            {/* ASSIGN TO */}

            <div className="form-field">
              <label>
                Assign To
              </label>

              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                required={!editingId}
              >
                {editingId ? (
                  <>
                    <option value="">
                      Keep current employee
                    </option>

                    {availableEmployees.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.employee_code} -{" "}
                        {employee.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="">
                      Select employee
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.employee_code} -{" "}
                        {employee.name}
                      </option>
                    ))}
                  </>
                )}
              </select>

              <small>
                {editingId
                  ? "Choose another active employee to reassign this task."
                  : "Only active employees can be assigned tasks."}
              </small>
            </div>

            {/* DUE DATE */}

            <div className="form-field">
              <label>
                Due Date
              </label>

              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
              />

              <small>
                Set the date by which the task should be completed.
              </small>
            </div>

            {/* ACTIONS */}

            <div className="form-actions">

              <button
                type="button"
                className="button-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="button-primary"
              >
                {editingId
                  ? "Update Task"
                  : "Save Task"}
              </button>

            </div>

          </form>

        </section>
      )}

      {/* TASK LIST */}

      <section className="task-list-card">

        <div className="list-header">

          <div>
            <h2>
              Task List
            </h2>

            <p>
              Total tasks: {tasks.length}
            </p>
          </div>

        </div>

        <div className="table-wrapper">

          <table
            className="data-table"
          >

            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Employee</th>
                <th>Assigned By</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {tasks.map((task) => {

                const assignedEmployee = employees.find(
                  (employee) =>
                    employee.id === task.assigned_to
                );

                return (
                  <tr key={task.id}>

                    <td>
                      {task.id}
                    </td>

                    <td>
                      <strong>
                        {task.title}
                      </strong>
                    </td>

                    <td>
                      {task.description || "—"}
                    </td>

                    <td>
                      {task.priority}
                    </td>

                    <td>
                      {task.status}
                    </td>

                    <td>
                      {assignedEmployee
                        ? `${assignedEmployee.employee_code} - ${assignedEmployee.name}`
                        : `Employee ID: ${task.assigned_to}`}
                    </td>

                    <td>
                      {task.assigned_by_username ||
                        `User ID: ${task.assigned_by}`}
                    </td>

                    <td>
                      {task.due_date || "—"}
                    </td>

                    <td>

                      <button
                        className="table-action-button"
                        onClick={() =>
                          handleEdit(task)
                        }
                      >
                        Edit
                      </button>{" "}

                      <button
                        className="table-delete-button"
                        onClick={() =>
                          handleDelete(task.id)
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Tasks;

