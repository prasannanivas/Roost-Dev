import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRealtor } from "../context/RealtorContext";
import { useNavigate } from "react-router-dom";
import "./RealtorHome.css";
import RealtorProfile from "./RealtorProfile";
import RealtorRewards from "./RealtorRewards";
import { FaGift, FaTimes } from "react-icons/fa";
import CSVUploadForm from "./CSVuploadForm"; // Import the CSV upload component

const RealtorHome = () => {
  const { auth } = useAuth();
  const { realtor } = auth;
  const realtorFromContext = useRealtor();
  const invited = realtorFromContext?.invitedClients || [];
  const [showForm, setShowForm] = useState(false);
  const [showCSVUploadForm, setShowCSVUploadForm] = useState(false); // New state for CSV upload
  const [isEmail, setIsEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [formData, setFormData] = useState({
    referenceName: "",
    phone: "",
    email: "",
  });

  const [showRewards, setShowRewards] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleInviteClient = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback({ message: "", type: "" });

    try {
      const payload = {
        referenceName: formData.referenceName,
        phone: isEmail ? "" : formData.phone,
        email: isEmail ? formData.email : "",
        type: "Client",
      };

      const response = await fetch(
        `http://54.89.183.155:5000/realtor/${realtor.id}/invite-client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setFeedback({
          message: "Client invited successfully!",
          type: "success",
        });
        setTimeout(() => {
          setShowForm(false);
          setFormData({ referenceName: "", phone: "", email: "" });
          setFeedback({ message: "", type: "" });
        }, 2000);
      } else {
        setFeedback({
          message: "Failed to invite client. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error inviting client:", error);
      setFeedback({
        message: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentCounts = (documents) => {
    const approved = documents.filter(
      (doc) => doc.status === "Approved"
    ).length;
    const pending = documents.filter(
      (doc) => doc.status === "Submitted"
    ).length;
    return { approved, pending };
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleClientClick = (clientId) => {
    if (clientId) {
      navigate(`/client/${clientId}`);
    }
  };

  return (
    <div className="realtor-home">
      <div className={`sidebar left ${showProfile ? "open" : ""}`}>
        <button className="close-button" onClick={() => setShowProfile(false)}>
          <FaTimes />
        </button>
        <RealtorProfile
          realtor={realtorFromContext.realtorInfo || {}}
          onClose={() => setShowProfile(false)}
        />
      </div>

      <div className={`sidebar right ${showRewards ? "open" : ""}`}>
        <button className="close-button" onClick={() => setShowRewards(false)}>
          <FaTimes />
        </button>
        <RealtorRewards
          realtor={realtorFromContext.realtorInfo || {}}
          invitedRealtors={realtorFromContext.invitedRealtors || []}
          getInitials={getInitials}
          onClose={() => setShowRewards(false)}
        />
      </div>

      <div className="main-content">
        <div className="welcome-header">
          <h1>
            Welcome,{" "}
            <span
              onClick={() => setShowProfile(true)}
              className="clickable-name"
            >
              {realtor.name}
            </span>
          </h1>
          <FaGift className="gift-icon" onClick={() => setShowRewards(true)} />
        </div>

        <div className="realtor-dashboard">
          <div className="dashboard-header">
            <h2>Invited Clients</h2>
            <div className="button-group">
              <button
                className="invite-button"
                onClick={() => setShowForm(true)}
              >
                Invite Client
              </button>
              <button
                className="invite-button"
                onClick={() => setShowCSVUploadForm(true)}
              >
                Bulk Invite via CSV
              </button>
            </div>
          </div>

          {/* Single Invite Form */}
          {showForm && (
            <div className="invite-form-overlay">
              <form className="invite-form" onSubmit={handleInviteClient}>
                <h3>Invite New Client</h3>
                {feedback.message && (
                  <div className={`feedback-message ${feedback.type}`}>
                    {feedback.message}
                  </div>
                )}
                <div className="form-control">
                  <label>Nickname:</label>
                  <input
                    type="text"
                    value={formData.referenceName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referenceName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-control">
                  <label>Contact via:</label>
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={isEmail ? "active" : ""}
                      onClick={() => setIsEmail(true)}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      className={!isEmail ? "active" : ""}
                      onClick={() => setIsEmail(false)}
                    >
                      Phone
                    </button>
                  </div>
                </div>
                <div className="form-control">
                  <label>{isEmail ? "Email:" : "Phone:"}</label>
                  <input
                    type={isEmail ? "email" : "tel"}
                    value={isEmail ? formData.email : formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [isEmail ? "email" : "phone"]: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className={isLoading ? "loading" : ""}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Invite"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bulk CSV Upload Form */}
          {showCSVUploadForm && (
            <CSVUploadForm
              realtorId={realtor.id}
              setShowCSVUploadForm={setShowCSVUploadForm}
            />
          )}

          <div className="invited-clients">
            {invited.map((client) => (
              <div
                key={client._id}
                className="client-card"
                onClick={() => handleClientClick(client.inviteeId)}
                style={{ cursor: "pointer" }}
              >
                <div className="initials-circle">
                  {getInitials(client.referenceName)}
                </div>
                <div className="client-info">
                  <h3>{client.referenceName}</h3>
                  <p>
                    Status:{" "}
                    {client.status === "PENDING"
                      ? "Invited"
                      : client.status === "ACCEPTED" &&
                        (!client.documents || client.documents.length === 0)
                      ? "Signed Up"
                      : client.status === "ACCEPTED" &&
                        client.documents.length > 0
                      ? `${getDocumentCounts(client.documents).approved}/${
                          client.documents.length
                        } Completed`
                      : client.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtorHome;
