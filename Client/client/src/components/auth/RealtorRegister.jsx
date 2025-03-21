import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RealtorRegister.css";
import { useAuth } from "../../context/AuthContext";

const RealtorRegister = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("http://54.89.183.155:5000/realtor/register", {
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
    <div className="realtor-register-container">
      <h2 className="realtor-register-title">Realtor Registration</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          className="realtor-register-input"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          className="realtor-register-input"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="realtor-register-input"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="text"
          placeholder="Location"
          className="realtor-register-input"
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="realtor-register-input"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        <button type="submit" className="realtor-register-button">
          Register
        </button>
      </form>
      <p className="realtor-register-footer">
        Already have an account?{" "}
        <Link to="/realtor/login" className="realtor-register-link">
          Login
        </Link>
      </p>
    </div>
  );
};

export default RealtorRegister;
