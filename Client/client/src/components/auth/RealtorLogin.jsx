import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RealtorLogin.css";
import { useAuth } from "../../context/AuthContext";

const RealtorLogin = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://54.89.183.155:5000/realtor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log(data);
      if (data.realtor) {
        login(data);
        navigate("/");
      } else {
        throw new Error("Invalid login");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="realtor-login-container">
      <h2 className="realtor-login-title">Realtor Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email or Mobile Number"
          className="realtor-login-input"
          onChange={(e) =>
            setFormData({ ...formData, identifier: e.target.value })
          }
        />
        <input
          type="password"
          placeholder="Password"
          className="realtor-login-input"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        <button type="submit" className="realtor-login-button">
          Login
        </button>
      </form>
      <p className="realtor-login-footer">
        Don't have an account?{" "}
        <Link to="/realtor/register" className="realtor-login-link">
          Register
        </Link>
      </p>
    </div>
  );
};

export default RealtorLogin;
