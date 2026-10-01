import { useState } from "react";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem("access_token");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to change password");
        return;
      }

      setSuccess(true);
      setMessage(data.message);

      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  return (
    <div className="container">

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
          <h1>Change Password</h1>
        </div>
      </div>

      <div className="form-card">

        <form
          className="employee-form"
          onSubmit={handleSubmit}
        >

          <div className="form-field">
            <label>Current Password</label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="form-field">
            <label>New Password</label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Enter new password"
              minLength={8}
              required
            />

            <small>
              Password must be at least 8 characters.
            </small>
          </div>

          {message && (
            <div
              className={
                success
                  ? "success-message"
                  : "page-message"
              }
            >
              {message}
            </div>
          )}

          <div className="form-actions">

            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button-primary"
            >
              Change Password
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ChangePassword;