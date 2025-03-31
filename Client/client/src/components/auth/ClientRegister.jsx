import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ClientRegister.css";
import { useAuth } from "../../context/AuthContext";

const ClientRegister = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("http://54.89.183.155:5000/client/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      login(data);
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="client-register-container">
      <h2 className="client-register-title">Client Registration</h2>
      <form onSubmit={handleSubmit} className="client-register-form">
        <input
          type="text"
          placeholder="Full Name"
          className="client-register-input"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          className="client-register-input"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="client-register-input"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="text"
          placeholder="Location"
          className="client-register-input"
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="client-register-input"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="client-register-input"
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
        />
        <button type="submit" className="client-register-button">
          Register
        </button>
      </form>
      <p className="client-register-login-link">
        Already have an account?{" "}
        <Link to="/client/login" className="client-register-link">
          Login
        </Link>
      </p>
    </div>
  );
};

export default ClientRegister;
