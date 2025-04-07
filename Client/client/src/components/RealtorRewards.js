import React, { useState, useEffect } from "react";
import "./RealtorRewards.css";
import { FaStar, FaHistory, FaTrophy, FaTimes } from "react-icons/fa";

/**
 * realtor = {
 *   points: Number,
 *   pointsHistory: [
 *     { points: Number, reason: String, date: Date },
 *     ...
 *   ]
 */

const RealtorRewards = ({
  realtor,
  invitedRealtors,
  getInitials,
  invitedClients,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [formData, setFormData] = useState({
    referenceName: "",
    email: "",
    phone: "",
  });
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  const POINTS_TO_DOLLARS = 3.14;
  const currentPoints = realtor?.points || 0;

  const getRewardProgress = (rewardAmount) => {
    const pointsNeeded = Math.ceil(rewardAmount / POINTS_TO_DOLLARS);
    const progress = Math.min((currentPoints / pointsNeeded) * 100, 100);
    return {
      progress,
      pointsNeeded,
      isEligible: currentPoints >= pointsNeeded,
    };
  };

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch("http://localhost:5000/admin/rewards");
        const data = await response.json();
        setRewards(data);
      } catch (error) {
        console.error("Error fetching rewards:", error);
      }
    };
    fetchRewards();
  }, []);

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

  const handleRewardClick = (reward) => {
    setSelectedReward(reward);
    setShowModal(true);
    setSelectedClient("");
  };

  const handleClaimReward = async () => {
    setClaimLoading(true);
    try {
      const payload = {
        rewardId: selectedReward._id,
        clientId: selectedClient || undefined,
      };

      const response = await fetch(
        `http://localhost:5000/realtor/${realtor._id}/claim-reward`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        // Refresh rewards and points
        const fetchRewards = async () => {
          try {
            const response = await fetch("http://localhost:5000/admin/rewards");
            const data = await response.json();
            setRewards(data);
          } catch (error) {
            console.error("Error fetching rewards:", error);
          }
        };
        fetchRewards();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
    }
    setClaimLoading(false);
  };

  const renderRewardCard = (reward) => (
    <div
      key={reward._id}
      className="reward-card"
      onClick={() => handleRewardClick(reward)}
    >
      {reward.imageUrl ? (
        <img
          src={`http://localhost:5000${reward.imageUrl}`}
          alt={reward.rewardName}
          className="reward-image"
        />
      ) : (
        <div className="reward-initials">{getInitials(reward.rewardName)}</div>
      )}
      <h4>{reward.rewardName}</h4>
      <p className="reward-amount">${reward.rewardAmount}</p>
      {(() => {
        const { progress, pointsNeeded, isEligible } = getRewardProgress(
          reward.rewardAmount
        );
        return (
          <div className="reward-progress">
            <div className="progress-bar">
              <div
                className={`progress-bar-fill ${isEligible ? "eligible" : ""}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="points-needed">
              <span>
                {currentPoints}/{pointsNeeded} points
              </span>
              {isEligible && <span className="eligible-tag">Eligible!</span>}
            </div>
          </div>
        );
      })()}
    </div>
  );

  const totalPoints = realtor?.points || 0;

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

        {/* Available Rewards Section */}
        <div className="available-rewards-section">
          <h2>Available Rewards</h2>

          <div className="rewards-category">
            <h3>Rewards for You</h3>
            <div className="rewards-grid">
              {rewards
                .filter(
                  (reward) =>
                    reward.rewardFor === "Realtors" && reward.isVisible
                )
                .map((reward) => renderRewardCard(reward))}
            </div>
          </div>

          <div className="rewards-category">
            <h3>Rewards for Clients</h3>
            <div className="rewards-grid">
              {rewards
                .filter(
                  (reward) => reward.rewardFor === "Clients" && reward.isVisible
                )
                .map((reward) => renderRewardCard(reward))}
            </div>
          </div>
        </div>

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

      {/* Reward Claim Modal */}
      {showModal && selectedReward && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <FaTimes />
            </button>
            <h2>{selectedReward.rewardName}</h2>
            <div className="modal-reward-details">
              <img
                src={
                  selectedReward.imageUrl
                    ? `http://localhost:5000${selectedReward.imageUrl}`
                    : null
                }
                alt={selectedReward.rewardName}
                className="modal-reward-image"
              />
              <p className="modal-reward-amount">
                ${selectedReward.rewardAmount}
              </p>

              <div className="points-verification">
                <p>
                  Required Points:{" "}
                  {Math.ceil(selectedReward.rewardAmount / POINTS_TO_DOLLARS)}
                </p>
                <p>Your Points: {currentPoints}</p>
              </div>

              {selectedReward.rewardFor === "Clients" ? (
                <div className="client-selection">
                  <label>Select Client:</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    required
                  >
                    <option value="">Choose a client</option>
                    {invitedClients
                      .filter((client) => client.status === "ACCEPTED")
                      .map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.referenceName}
                        </option>
                      ))}
                  </select>
                </div>
              ) : selectedReward.rewardFor === "Realtors" ? (
                <div className="client-selection">Claim</div>
              ) : (
                ""
              )}

              <button
                className={`claim-button ${
                  (selectedReward.rewardFor === "Clients" && !selectedClient) ||
                  currentPoints * POINTS_TO_DOLLARS <
                    selectedReward.rewardAmount
                    ? "disabled"
                    : ""
                }`}
                onClick={handleClaimReward}
                disabled={
                  claimLoading ||
                  (selectedReward.rewardFor === "Clients" && !selectedClient) ||
                  currentPoints * POINTS_TO_DOLLARS <
                    selectedReward.rewardAmount
                }
              >
                {claimLoading
                  ? "Claiming..."
                  : currentPoints * POINTS_TO_DOLLARS <
                    selectedReward.rewardAmount
                  ? "Insufficient Points"
                  : "Claim Reward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtorRewards;
