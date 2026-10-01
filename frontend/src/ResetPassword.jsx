import { useState } from "react";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!token) {
      setMessage("Invalid or missing password reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Password reset failed."
        );
        return;
      }

      setSuccess(true);
      setMessage(
        data.message ||
          "Password reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-icons" aria-hidden="true">
        <span className="bg-icon icon-1">🔐</span>
        <span className="bg-icon icon-2">✓</span>
        <span className="bg-icon icon-3">🔑</span>
        <span className="bg-icon icon-4">🛡️</span>
        <span className="bg-icon icon-5">✓</span>
        <span className="bg-icon icon-6">🔐</span>
      </div>

      <div className="login-card">
        <h1 className="login-title">
          Reset Password
        </h1>

        {!success ? (
          <>
            <p>
              Enter a new password for your employee
              account.
            </p>

            <hr />

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Password</label>

                <input
                  type="password"
                  value={newPassword}
                  placeholder="Enter new password"
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>

                <input
                  type="password"
                  value={confirmPassword}
                  placeholder="Confirm new password"
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Resetting Password..."
                  : "Reset Password"}
              </button>
            </form>

            {message && (
              <p className="login-message">
                {message}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="login-message">
              {message}
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {!success && (
          <button
            type="button"
            className="button-secondary"
            style={{ marginTop: "12px" }}
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;