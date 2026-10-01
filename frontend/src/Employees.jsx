import { useEffect, useRef,useState } from "react";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    employee_code: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    joining_date: "",
    status: "ACTIVE",
  });

  const formRef = useRef(null);
  

  const token = localStorage.getItem("access_token");

  const showToast = (text) => {
    setToast(text);

    setTimeout(() => {
      setToast("");
    }, 3000);
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
        setMessage(
          data.message || "Failed to load employees"
        );
        return;
      }

      setEmployees(data);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const downloadReport = async (format) => {
    try {
      setMessage(
        `Preparing ${format.toUpperCase()} report...`
      );

      const response = await fetch(
        `http://127.0.0.1:5000/api/reports/employees?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();

        setMessage(
          data.message ||
            `Failed to download ${format.toUpperCase()} report`
        );

        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `active_employee_tasks.${format}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage("");

      showToast(
        `${format.toUpperCase()} report downloaded successfully!`
      );

      setShowExportMenu(false);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const uploadEmployees = async (event) => {
    const file = event.target.files[0];
  
    if (!file) {
      return;
    }
  
    const fileName = file.name.toLowerCase();
  
    if (
      !fileName.endsWith(".csv") &&
      !fileName.endsWith(".pdf")
    ) {
      setMessage(
        "Only CSV and PDF files are allowed."
      );
  
      event.target.value = "";
      return;
    }
  
    const formData = new FormData();
  
    formData.append("file", file);
  
    setUploading(true);
    setMessage("Uploading employee data...");
  
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/employees/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to upload employee data."
        );
  
        return;
      }
  
      showToast(
        data.message ||
          "Employees uploaded successfully!"
      );
  
      setMessage("");
  
      fetchEmployees();
  
    } catch (error) {
      console.error(error);
  
      setMessage(
        "Cannot connect to backend."
      );
    } finally {
      setUploading(false);
  
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isEditing = editingId !== null;

    setMessage(
      isEditing
        ? "Updating employee..."
        : "Adding employee..."
    );

    try {
      const url = isEditing
        ? `http://127.0.0.1:5000/api/employees/${editingId}`
        : "http://127.0.0.1:5000/api/employees";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            (isEditing
              ? "Failed to update employee"
              : "Failed to add employee")
        );

        return;
      }

      showToast(
        isEditing
          ? "Employee updated successfully!"
          : "Employee added successfully!"
      );

      resetForm();
      fetchEmployees();
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend");
    }
  };

  const scrollToEmployeeForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);

    setFormData({
      employee_code: employee.employee_code || "",
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      designation: employee.designation || "",
      joining_date: employee.joining_date || "",
      status: employee.status || "ACTIVE",
    });

    setShowForm(true);
    setMessage("");
    scrollToEmployeeForm();
  };

  const resetForm = () => {
    setFormData({
      employee_code: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      designation: "",
      joining_date: "",
      status: "ACTIVE",
    });

    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="employees-page">

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

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

          <h1>Employees</h1>

        </div>

        <div className="employee-header-actions">

          <div className="export-dropdown">

            <button
              className="button-secondary"
              onClick={() =>
                setShowExportMenu(!showExportMenu)
              }
            >
              Export Data ▾
            </button>

            {showExportMenu && (
              <div className="export-menu">

                <button
                  onClick={() =>
                    downloadReport("csv")
                  }
                >
                  Download CSV
                </button>

                <button
                  onClick={() =>
                    downloadReport("pdf")
                  }
                >
                  Download PDF
                </button>

              </div>
            )}

          </div>

          <div className="add-employee-dropdown">

  <button
    className="button-primary"
    onClick={() => {
      if (showForm) {
        resetForm();
        setMessage("");
        return;
      }

      setShowAddMenu(!showAddMenu);
    }}
  >
    {showForm ? "Cancel" : "+ Add Employee ▾"}
  </button>

  {!showForm && showAddMenu && (
    <div className="add-employee-menu">

      <button
        onClick={() => {
          setShowAddMenu(false);
          setShowForm(true);
          setMessage("");
          scrollToEmployeeForm();
        }}
      >
        Add Manually
      </button>

      <label className="upload-menu-item">

        Upload CSV / PDF

        <input
          type="file"
          accept=".csv,.pdf"
          onChange={uploadEmployees}
          disabled={uploading}
        />

      </label>

    </div>
  )}

</div>

        </div>

      </div>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      {showForm && (
        <section
          ref={formRef}
          className="form-card"
        >

          <div className="form-card-header">

            <div>
              <p className="eyebrow">
                {editingId
                  ? "EMPLOYEE DETAILS"
                  : "NEW EMPLOYEE"}
              </p>

              <h2>
                {editingId
                  ? "Edit Employee"
                  : "Add Employee"}
              </h2>

              <p>
                {editingId
                  ? "Update the employee information below."
                  : "Enter the employee information below."}
              </p>
            </div>

          </div>

          <form
            className="employee-form"
            onSubmit={handleSubmit}
          >

            <div className="form-field">
              <label>Employee ID</label>

              <input
                type="text"
                name="employee_code"
                value={formData.employee_code}
                onChange={handleChange}
                placeholder="e.g. EMP004"
                required
                disabled={editingId !== null}
              />

              <small>
                {editingId
                  ? "Employee ID cannot be changed."
                  : "Enter a unique employee ID."}
              </small>
            </div>

            <div className="form-field">
              <label>Name</label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
              />
            </div>

            <div className="form-field">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="employee@example.com"
                required
              />
            </div>

            <div className="form-field">
              <label>Phone</label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-field">
              <label>Department</label>

              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Engineering"
              />
            </div>

            <div className="form-field">
              <label>Designation</label>

              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div className="form-field">
              <label>Joining Date</label>

              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">
                  ACTIVE
                </option>

                <option value="INACTIVE">
                  INACTIVE
                </option>
              </select>
            </div>

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
                  ? "Update Employee"
                  : "Save Employee"}
              </button>

            </div>

          </form>

        </section>
      )}

      <section className="employee-list-card">

        <div className="list-header">

          <div>

            <h2>
              Employee List
            </h2>

            <p>
              Employee Count: {employees.length}
            </p>
          </div>

        </div>

        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {employees.map((employee) => (
                <tr key={employee.id}>

                  <td>
                    <span className="employee-code">
                      {employee.employee_code}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {employee.name}
                    </strong>
                  </td>

                  <td>
                    {employee.email}
                  </td>

                  <td>
                    {employee.department || "—"}
                  </td>

                  <td>
                    {employee.designation || "—"}
                  </td>

                  <td>
                    <span
                      className={
                        employee.status === "ACTIVE"
                          ? "status-badge status-active"
                          : "status-badge status-inactive"
                      }
                    >
                      {employee.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="table-action-button"
                      onClick={() =>
                        handleEdit(employee)
                      }
                    >
                      Edit
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Employees;