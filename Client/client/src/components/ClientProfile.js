import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClient } from "../context/ClientContext";
import axios from "axios";

import "./ClientProfile.css";

function ClientProfile() {
  const { user } = useAuth();
  const { clientInfo, updateClient } = useClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    address: {
      address: "",
      city: "",
      postalCode: "",
    },
  });

  useEffect(() => {
    if (clientInfo) {
      setFormData({
        name: clientInfo.name || "",
        email: clientInfo.email || "",
        phone: clientInfo.phone || "",
        location: clientInfo.location || "",
        address: {
          address: clientInfo.address?.address || "",
          city: clientInfo.address?.city || "",
          postalCode: clientInfo.address?.postalCode || "",
        },
      });
    }
  }, [clientInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://54.89.183.155:5000/client/${clientInfo.id}`,
        formData
      );
      if (response.status === 200) {
        alert("Profile updated successfully!");
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error updating profile");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const response = await axios.post(
        `http://54.89.183.155:5000/client/${clientInfo.id}/updatepassword`,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }
      );

      if (response.data) {
        alert("Password updated successfully!");
        setShowPasswordModal(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      setError(error.response?.data?.error || "Error updating password");
    }
  };

  return (
    <div className="client-profile">
      <div className="profile-header">
        <h2>Profile</h2>
        <p>Keep your personal information up to date</p>
      </div>

      <form className="client-profile-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Address Information</h3>
          <div className="form-group">
            <label>Street Address:</label>
            <input
              type="text"
              name="address.address"
              value={formData.address.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>City:</label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Postal Code:</label>
            <input
              type="text"
              name="address.postalCode"
              value={formData.address.postalCode}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="button-container">
          <button type="submit" className="update-button">
            Update Profile
          </button>
          <button
            type="button"
            className="change-password-button"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
        </div>
      </form>

      {showPasswordModal && (
        <div className="password-modal">
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <h3>Change Password</h3>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label>Current Password:</label>
              <input
                type="password"
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                required
              />
            </div>
            <div className="button-container">
              <button type="submit">Update Password</button>
              <button type="button" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ClientProfile;
