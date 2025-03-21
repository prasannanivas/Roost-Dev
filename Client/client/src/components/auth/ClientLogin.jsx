import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ClientLogin.css";
import { useAuth } from "../../context/AuthContext";

const ClientLogin = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      login(data);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="client-login-container">
      <h2 className="client-login-title">Client Login</h2>
      <form onSubmit={handleSubmit} className="client-login-form">
        <input
          placeholder="Email"
          className="client-login-input"
          onChange={(e) =>
            setFormData({ ...formData, identifier: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="client-login-input"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        <button type="submit" className="client-login-button">
          Login
        </button>
      </form>
      <p className="client-login-register-text">
        Don't have an account?{" "}
        <Link to="/client/register" className="client-login-link">
          Register
        </Link>
      </p>
    </div>
  );
};

export default ClientLogin;
