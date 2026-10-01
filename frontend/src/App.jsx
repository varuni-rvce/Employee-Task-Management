import { useEffect, useState } from "react";
import "./App.css";
import Employees from "./Employees";
import Tasks from "./tasks";
import MyTasks from "./MyTasks";
import ChangePassword from "./ChangePassword";
import ResetPassword from "./ResetPassword";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const token = localStorage.getItem("access_token");
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const handleForgotPassword = async (event) => {
    event.preventDefault();
  
    setForgotMessage("");
    setForgotLoading(true);
  
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: forgotEmail.trim(),
          }),
        }
      );
  
      const data = await response.json();
  
      setForgotMessage(
        data.message ||
          "If an employee account exists for this email, a password reset link has been sent."
      );
  
      if (response.ok) {
        setForgotEmail("");
      }
    } catch (error) {
      console.error(error);
      setForgotMessage("Cannot connect to backend.");
    } finally {
      setForgotLoading(false);
    }
  };
  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("Logging in...");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "ADMIN") {
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const employeeResponse = await fetch(
          "http://127.0.0.1:5000/api/employees",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const employeeData = await employeeResponse.json();

        if (employeeResponse.ok) {
          setEmployees(employeeData);
        }

        const taskResponse = await fetch(
          "http://127.0.0.1:5000/api/tasks",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const taskData = await taskResponse.json();

        if (taskResponse.ok) {
          setTasks(taskData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [token, user?.role]);

  /* =========================
     EMPLOYEE VIEW TASKS
  ========================= */

  if (
    window.location.pathname === "/reset-password" &&
    !token
  ) {
    return <ResetPassword />;
  }

  if (
    window.location.pathname === "/my-tasks" &&
    token &&
    user &&
    user.role === "EMPLOYEE"
  ) {
    return <MyTasks />;
  }

  if (
    window.location.pathname === "/change-password" &&
    token &&
    user &&
    user.role === "EMPLOYEE"
  ) {
    return <ChangePassword />;
  }

  /* =========================
     ADMIN EMPLOYEES
  ========================= */

  if (
    window.location.pathname === "/employees" &&
    token &&
    user &&
    user.role === "ADMIN"
  ) {
    return <Employees />;
  }

  /* =========================
     ADMIN TASKS
  ========================= */

  if (
    window.location.pathname === "/tasks" &&
    token &&
    user &&
    user.role === "ADMIN"
  ) {
    return <Tasks />;
  }

  /* =========================
     LOGGED-IN DASHBOARD
  ========================= */

  if (token && user) {
    return (
      <div className="container">

<div className="page-header">
  <div>
    <h1>Employee Task Management</h1>
    <p>
      Welcome back,{" "}
      <strong>{user.username}</strong>
    </p>
  </div>

  <div className="dashboard-header-actions">

    {user.role === "EMPLOYEE" && (
      <button
        className="button-secondary"
        onClick={() => {
          window.location.href = "/change-password";
        }}
      >
        Change Password
      </button>
    )}

    <button
      className="button-secondary"
      onClick={() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.reload();
      }}
    >
      Logout
    </button>

  </div>
</div>

        <div className="card">

          <h2>Dashboard</h2>

          <p>
            Role:{" "}
            <strong>{user.role}</strong>
          </p>

          {/* ADMIN DASHBOARD */}

          {user.role === "ADMIN" && (
            <>
              <div className="stat-grid">

                <div className="stat-card">
                  <h3>Total Employees</h3>

                  <div className="stat-number">
                    {employees.length}
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Total Tasks</h3>

                  <div className="stat-number">
                    {tasks.length}
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Active Employees</h3>

                  <div className="stat-number">
                    {
                      employees.filter(
                        (employee) =>
                          employee.status === "ACTIVE"
                      ).length
                    }
                  </div>
                </div>

              </div>

              <hr />

              <h3>Quick Actions</h3>

              <button
                onClick={() => {
                  window.location.href = "/employees";
                }}
              >
                Manage Employees
              </button>

              {" "}

              <button
                onClick={() => {
                  window.location.href = "/tasks";
                }}
              >
                Manage Tasks
              </button>
            </>
          )}

          {/* EMPLOYEE DASHBOARD */}

          {user.role === "EMPLOYEE" && (
            <div className="employee-dashboard">

              <div className="stat-grid">

                <div className="stat-card">
                  
                  <button
                    onClick={() => {
                      window.location.href = "/my-tasks";
                    }}
                  >
                    View Tasks

                  </button>
                  <p>
                    View and update your assigned tasks
                  </p>

                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    );
  }

  /* =========================
     LOGIN PAGE
  ========================= */

  return (
    <div className="login-container">

      <div
        className="login-bg-icons"
        aria-hidden="true"
      >
        <span className="bg-icon icon-1">👤</span>
        <span className="bg-icon icon-2">✓</span>
        <span className="bg-icon icon-3">📋</span>
        <span className="bg-icon icon-4">👥</span>
        <span className="bg-icon icon-5">✓</span>
        <span className="bg-icon icon-6">📝</span>
        <span className="bg-icon icon-7">👤</span>
        <span className="bg-icon icon-8">☑</span>
      </div>

      <div className="login-card">

        <h1 className="login-title">
          Employee Task Management
        </h1>

        <p>
          Sign in to access your dashboard
        </p>

        <hr />


        <form onSubmit={handleLogin}>

          <div className="form-group">

            <label>
              Username
            </label>

            <input
              type="text"
              value={username}
              placeholder="Enter username"
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

          </div>

          <button type="submit">
            Login
          </button>

          <button
        type="button"
        className="forgot-password-link"
        onClick={() => {
          setShowForgotPassword(true);
          setForgotMessage("");
        }}
      >
        Forgot Password?
      </button>

        </form>

        {message && (
          <p>
            {message}
          </p>
        )}

      </div>
      {showForgotPassword && (
  <div className="forgot-password-overlay">
    <div className="forgot-password-modal">

      <button
        type="button"
        className="forgot-password-close"
        onClick={() => {
          setShowForgotPassword(false);
          setForgotEmail("");
          setForgotMessage("");
        }}
      >
        ×
      </button>

      <div className="forgot-password-icon">
        🔐
      </div>

      <h2>Forgot Password?</h2>

      <p>
        Enter your registered employee email ID.
        We'll send you a password reset link.
      </p>

      <form onSubmit={handleForgotPassword}>

        <div className="form-group">
          <label>Email ID</label>

          <input
            type="email"
            value={forgotEmail}
            placeholder="Enter your employee email"
            onChange={(event) =>
              setForgotEmail(event.target.value)
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={forgotLoading}
        >
          {forgotLoading
            ? "Sending..."
            : "Send Reset Link"}
        </button>

      </form>

      {forgotMessage && (
        <p className="forgot-password-message">
          {forgotMessage}
        </p>
      )}

      <p className="forgot-password-expiry">
        🔒 Reset link expires in 5 minutes.
      </p>

      <button
        type="button"
        className="forgot-password-cancel"
        onClick={() => {
          setShowForgotPassword(false);
          setForgotEmail("");
          setForgotMessage("");
        }}
      >
        Cancel
      </button>

    </div>
  </div>
)}

    </div>
  );
}

export default App;
