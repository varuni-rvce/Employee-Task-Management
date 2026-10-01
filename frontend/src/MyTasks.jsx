import { useEffect, useState } from "react";

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("access_token");

  const showToast = (text) => {
    setToast(text);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const fetchMyTasks = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/my/tasks",
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

  useEffect(() => {
    fetchMyTasks();
  }, [token]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/my/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to update task");
        return;
      }

      showToast("Task status updated successfully!");

      fetchMyTasks();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#198754",
            color: "white",
            padding: "12px 20px",
            borderRadius: "6px",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {toast}
        </div>
      )}

      <h1>My Tasks</h1>

      <button onClick={() => (window.location.href = "/")}>
        Back to Dashboard
      </button>

      <hr />

      {message && <p>{message}</p>}

      <h2>Assigned Tasks</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Update Status</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.title}</td>
              <td>{task.description}</td>
              <td>{task.priority}</td>
              <td>{task.status}</td>
              <td>{task.due_date}</td>

              <td>
                <select
                  value={task.status}
                  onChange={(event) =>
                    handleStatusChange(
                      task.id,
                      event.target.value
                    )
                  }
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">
                    IN_PROGRESS
                  </option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tasks.length === 0 && !message && (
        <p>No tasks are currently assigned to you.</p>
      )}
    </div>
  );
}

export default MyTasks;