import React, { useState } from "react";
import "./RealtorRewards.css";
import { FaStar, FaHistory, FaTrophy } from "react-icons/fa";

/**
 * realtor = {
 *   points: Number,
 *   pointsHistory: [
 *     { points: Number, reason: String, date: Date },
 *     ...
 *   ]
 * }
 */

const RealtorRewards = ({ realtor, invitedRealtors, getInitials }) => {
  const [showForm, setShowForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [formData, setFormData] = useState({
    referenceName: "",
    email: "",
    phone: "",
  });

  const handleInviteRealtor = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback({ message: "", type: "" });

    try {
      const payload = {
        referenceName: formData.referenceName,
        phone: isEmail ? "" : formData.phone,
        email: isEmail ? formData.email : "",
        type: "Realtor",
      };

      const response = await fetch(
        `http://localhost:5000/realtor/${realtor._id}/invite-realtor`,
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
          message: "Realtor invited successfully!",
          type: "success",
        });
        setTimeout(() => {
          setShowForm(false);
          setFormData({ referenceName: "", phone: "", email: "" });
          setFeedback({ message: "", type: "" });
        }, 2000);
      } else {
        setFeedback({
          message: "Failed to invite Realtor. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error inviting realtor:", error);
      setFeedback({
        message: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalPoints = realtor?.points || 0;
  // Example progress: how close the user is to next reward
  const rewardProgress = 70; // e.g., 70%
  const rewardAmount = 100; // e.g., $100 reward

  return (
    <div className="rewards-wrapper">
      <div className="rewards-card">
        {/* TOP: Big Points Number + Subtitle */}

        <div className="rewards-title">
          <FaTrophy className="header-icon" />
          <h2>Reward Points</h2>
        </div>
        <div className="points-badge">
          <FaStar className="star-icon" />
          <span className="points-total">{realtor.points || 0}</span>
          <span className="points-label">Points</span>
        </div>

        <h1 className="points-title">{totalPoints} points</h1>
        <p className="points-subtitle">Let’s build great things together!</p>
        <p className="points-description">
          Collect points and trade them in from vacations to cash
        </p>
        {/* Points Explanation (Card) */}
        <div className="points-explanation">
          <ul>
            <li>
              <strong>1 PT</strong> for every client invited
            </li>
            <li>
              <strong>10 PT</strong> for every fellow realtor invited
            </li>
            <li className="bonus-title">BONUS</li>
            <p className="bonus-text">
              Earn an additional 10% from your referred realtor’s activities.
              <br />
              <em>
                E.g., if a referred Realtor’s client uses the preferred mortgage
                partner, you get an extra 30 pts.
              </em>
            </p>
            <button className="invite-btn" onClick={() => setShowForm(true)}>
              Invite Realtors
            </button>
            <li>
              <strong>300 PT</strong> your client uses a preferred mortgage
              partner
            </li>
          </ul>
        </div>
        {showForm && (
          <div className="invite-form-overlay">
            <form className="invite-form" onSubmit={handleInviteRealtor}>
              <h3>Invite New Realtor</h3>
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
        {/* REWARDS Section
        <div className="rewards-progress-section">
          <h2 className="section-heading">Rewards</h2>
          <div className="progress-info">
            <span className="progress-text">
              {rewardProgress}% – ${rewardAmount}
            </span>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${rewardProgress}%` }}
              />
            </div>
          </div>
        </div> */}

        {/* PREVIOUS REWARDS (Static Example)
        <div className="previous-rewards-section">
          <h3 className="section-subheading">Previous Rewards</h3>
          <div className="previous-reward-item">
            <span className="prev-reward-date">Sept 10 2023</span>
            <span className="prev-reward-desc">$200 Cash – 220 Points</span>
          </div>
          <div className="previous-reward-item">
            <span className="prev-reward-date">Aug 25 2023</span>
            <span className="prev-reward-desc">
              $100 Visa Card – 110 Points
            </span>
          </div>
        </div> */}

        {/* POINTS HISTORY */}
        <div className="points-history">
          <div className="history-header">
            <FaHistory className="history-icon" />
            <h3>Points History</h3>
          </div>
          <div className="history-list">
            {(realtor.pointsHistory || []).map((entry, idx) => (
              <div key={idx} className="history-item">
                <div className="history-points">
                  <FaStar className="points-icon" />+{entry.points}
                </div>
                <div className="history-details">
                  <span className="history-reason">{entry.reason}</span>
                  <span className="history-date">{formatDate(entry.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/**show invited realtors */}
        <div className="invited-clients">
          <h2>Invited Realtors</h2>
          {invitedRealtors.map((client) => (
            <div key={client._id} className="client-card">
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
                    : client.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealtorRewards;
