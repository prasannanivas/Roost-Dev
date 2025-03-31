import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./RealtorProfile.css";
import { useRealtor } from "../context/RealtorContext";

const RealtorProfile = () => {
  const { realtorInfo } = useRealtor();
  const realtor = realtorInfo;
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  console.log("Realtor profile", realtor);

  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    brokerageName: "",
    brokerageAddress: "",
    brokerageCity: "",
    brokeragePostalCode: "",
    brokeragePhone: "",
    brokerageEmail: "",
    licenseNumber: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (realtor) {
      setFormData({
        name: realtor.name || "",
        phone: realtor.phone || "",
        email: realtor.email || "",
        location: realtor.location || "",
        brokerageName: realtor.brokerageInfo?.brokerageName || "",
        brokerageAddress: realtor.brokerageInfo?.brokerageAddress || "",
        brokerageCity: realtor.brokerageInfo?.brokerageCity || "",
        brokeragePostalCode: realtor.brokerageInfo?.brokeragePostalCode || "",
        brokeragePhone: realtor.brokerageInfo?.brokeragePhone || "",
        brokerageEmail: realtor.brokerageInfo?.brokerageEmail || "",
        licenseNumber: realtor.brokerageInfo?.licenseNumber || "",
      });
    }
  }, [realtor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://54.89.183.155:5000/realtor/${realtor._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brokerageInfo: {
              brokerageName: formData.brokerageName,
              brokerageAddress: formData.brokerageAddress,
              brokerageCity: formData.brokerageCity,
              brokeragePostalCode: formData.brokeragePostalCode,
              brokeragePhone: formData.brokeragePhone,
              brokerageEmail: formData.brokerageEmail,
              licenseNumber: formData.licenseNumber,
            },
          }),
        }
      );

      if (response.ok) {
        setFeedback({
          message: "Profile updated successfully!",
          type: "success",
        });
      } else {
        setFeedback({ message: "Failed to update profile", type: "error" });
      }
    } catch (error) {
      setFeedback({ message: "Error updating profile", type: "error" });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `http://54.89.183.155:5000/realtor/${realtor._id}/updatepassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      if (response.ok) {
        setFeedback({
          message: "Password updated successfully!",
          type: "success",
        });
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsPasswordModalOpen(false);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update password");
      }
    } catch (error) {
      setError("Error updating password");
    }
  };

  if (!realtor) {
    return <div>Loading...</div>;
  }

  return (
    <div className="realtor-profile-container">
      <h2 className="realtor-profile-title">Profile Information</h2>
      <form className="realtor-profile-form" onSubmit={handleSubmit}>
        {feedback.message && (
          <div
            className={`realtor-profile-feedback realtor-profile-${feedback.type}`}
          >
            {feedback.message}
          </div>
        )}

        {/* Realtor Personal Information */}
        <div className="realtor-profile-form-group">
          <label>Name:</label>
          <input type="text" value={formData.name} disabled />
        </div>

        <div className="realtor-profile-form-group">
          <label>Email:</label>
          <input type="email" value={formData.email} disabled />
        </div>

        <div className="realtor-profile-form-group">
          <label>Phone:</label>
          <input type="tel" value={formData.phone} disabled />
        </div>

        <div className="realtor-profile-form-group">
          <label>Location:</label>
          <input type="text" value={formData.location} disabled />
        </div>

        {/* Brokerage Information */}
        <h3 className="realtor-profile-subtitle">Brokerage Information</h3>
        <div className="realtor-profile-form-group">
          <label>Brokerage Name:</label>
          <input
            type="text"
            value={formData.brokerageName}
            onChange={(e) =>
              setFormData({ ...formData, brokerageName: e.target.value })
            }
          />
        </div>

        <div className="realtor-profile-form-group">
          <label>Brokerage Address:</label>
          <input
            type="text"
            value={formData.brokerageAddress}
            onChange={(e) =>
              setFormData({ ...formData, brokerageAddress: e.target.value })
            }
          />
        </div>

        <div className="realtor-profile-form-group">
          <label>Brokerage City:</label>
          <input
            type="text"
            value={formData.brokerageCity}
            onChange={(e) =>
              setFormData({ ...formData, brokerageCity: e.target.value })
            }
          />
        </div>

        <div className="realtor-profile-form-group">
          <label>Brokerage Postal Code:</label>
          <input
            type="text"
            value={formData.brokeragePostalCode}
            onChange={(e) =>
              setFormData({ ...formData, brokeragePostalCode: e.target.value })
            }
          />
        </div>

        <div className="realtor-profile-form-group">
          <label>Brokerage Phone:</label>
          <input
            type="text"
            value={formData.brokeragePhone}
            onChange={(e) =>
              setFormData({ ...formData, brokeragePhone: e.target.value })
            }
          />
        </div>

        <div className="realtor-profile-form-group">
          <label>Brokerage Email:</label>
          <input
            type="email"
            value={formData.brokerageEmail}
            onChange={(e) =>
              setFormData({ ...formData, brokerageEmail: e.target.value })
            }
          />
        </div>

        <div className="realtor-profile-form-group">
          <label>License Number:</label>
          <input
            type="text"
            value={formData.licenseNumber}
            onChange={(e) =>
              setFormData({ ...formData, licenseNumber: e.target.value })
            }
          />
        </div>

        <div className="realtor-profile-button-group">
          <button type="submit" className="realtor-profile-submit-btn">
            Save Changes
          </button>
        </div>
      </form>

      <div className="realtor-profile-password-section">
        <h3 className="realtor-profile-subtitle">Password Management</h3>
        <button
          type="button"
          className="realtor-profile-change-password-btn"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          Change Password
        </button>
      </div>

      {isPasswordModalOpen && (
        <div className="realtor-profile-modal-overlay">
          <div className="realtor-profile-modal-content">
            <h3 className="realtor-profile-modal-title">Change Password</h3>
            {error && <div className="realtor-profile-error">{error}</div>}
            <form
              className="realtor-profile-password-form"
              onSubmit={handlePasswordChange}
            >
              <div className="realtor-profile-form-group">
                <label>Current Password:</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="realtor-profile-form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="realtor-profile-form-group">
                <label>Confirm New Password:</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="realtor-profile-button-group">
                <button type="submit" className="realtor-profile-submit-btn">
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setError("");
                    setPasswordForm({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="realtor-profile-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtorProfile;
