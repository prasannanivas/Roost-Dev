import React, { useState, useEffect, useCallback, memo } from "react";
import axios from "axios";
import "./RewardsPage.css";

const RewardForm = memo(
  ({ formData, onSubmit, submitLabel, handleInputChange, onCancel }) => (
    <form onSubmit={onSubmit} className="reward-form">
      <input
        type="text"
        name="rewardName"
        placeholder="Reward Name"
        value={formData.rewardName}
        onChange={handleInputChange}
        required
      />
      <input
        type="number"
        name="rewardAmount"
        placeholder="Reward Amount"
        value={formData.rewardAmount}
        onChange={handleInputChange}
        required
      />
      <select
        name="rewardFor"
        value={formData.rewardFor}
        onChange={handleInputChange}
      >
        <option value="Clients">Clients</option>
        <option value="Realtors">Realtors</option>
        <option value="Charity">Charity</option>
      </select>
      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleInputChange}
      />
      <div className="modal-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
);

const RewardsPage = () => {
  const [activeTab, setActiveTab] = useState("Rewards");
  const [rewards, setRewards] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [formData, setFormData] = useState({
    rewardName: "",
    rewardAmount: "",
    rewardFor: "Clients",
    image: null,
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = () => {
    axios
      .get("http://localhost:5000/admin/rewards")
      .then((res) => {
        const grouped = res.data.reduce((acc, reward) => {
          const group = reward.rewardFor || "Other";
          if (!acc[group]) acc[group] = [];
          acc[group].push(reward);
          return acc;
        }, {});
        setRewards(grouped);
      })
      .catch((err) => console.error("Error fetching rewards:", err));
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      if (files.length === 0) return;
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleAddReward = (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("rewardName", formData.rewardName);
    payload.append("rewardAmount", formData.rewardAmount);
    payload.append("rewardFor", formData.rewardFor);
    if (formData.image) payload.append("image", formData.image);

    axios
      .post("http://localhost:5000/admin/rewards", payload)
      .then(() => {
        fetchRewards();
        setShowAddModal(false);
        resetForm();
      })
      .catch((err) => console.error("Error adding reward:", err));
  };

  const handleEditReward = (reward) => {
    setEditingRewardId(reward._id);
    setFormData({
      rewardName: reward.rewardName,
      rewardAmount: reward.rewardAmount,
      rewardFor: reward.rewardFor,
      image: null,
    });
    setShowEditModal(true);
  };

  const handleUpdateReward = (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("rewardName", formData.rewardName);
    payload.append("rewardAmount", formData.rewardAmount);
    payload.append("rewardFor", formData.rewardFor);
    if (formData.image) payload.append("image", formData.image);

    axios
      .patch(`http://localhost:5000/admin/rewards/${editingRewardId}`, payload)
      .then(() => {
        fetchRewards();
        setShowEditModal(false);
        resetForm();
      })
      .catch((err) => console.error("Error updating reward:", err));
  };

  const resetForm = () => {
    setFormData({
      rewardName: "",
      rewardAmount: "",
      rewardFor: "Clients",
      image: null,
    });
    setEditingRewardId(null);
  };

  const handleDeleteReward = (id) => {
    if (window.confirm("Are you sure you want to delete this reward?")) {
      axios
        .delete(`http://localhost:5000/admin/rewards/${id}`)
        .then(fetchRewards)
        .catch((err) => console.error("Error deleting reward:", err));
    }
  };

  const handleToggleVisibility = (id) => {
    axios
      .patch(`http://localhost:5000/admin/rewards/${id}/toggle`)
      .then(fetchRewards)
      .catch((err) => console.error("Error toggling visibility:", err));
  };

  const handleCancel = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  }, []);

  return (
    <div className="rewards-container">
      <div className="rewards-header">
        <div className="tabs">
          <button
            className={activeTab === "Claimed" ? "tab active" : "tab"}
            onClick={() => setActiveTab("Claimed")}
          >
            Claimed
          </button>
          <button
            className={activeTab === "Rewards" ? "tab active" : "tab"}
            onClick={() => setActiveTab("Rewards")}
          >
            Rewards
          </button>
        </div>
        {activeTab === "Rewards" && (
          <div className="actions">
            <button
              className="add-reward"
              onClick={() => {
                setFormData({
                  rewardName: "",
                  rewardAmount: "",
                  rewardFor: "Clients",
                  image: null,
                });

                setShowAddModal(true);
              }}
            >
              Add new reward
            </button>
          </div>
        )}
      </div>

      {activeTab === "Rewards" && (
        <>
          {["Clients", "Realtors", "Charity"].map((category) => (
            <div key={category} className="reward-category">
              <h3>For {category}</h3>
              <div className="reward-grid">
                {(rewards[category] || []).map((reward) => (
                  <div className="reward-card" key={reward._id}>
                    <img
                      src={
                        reward.imageUrl
                          ? `http://localhost:5000${reward.imageUrl}`
                          : "https://via.placeholder.com/150x90"
                      }
                      alt="reward"
                    />
                    <div className="reward-info">
                      <div className="reward-title">{reward.rewardName}</div>
                      <div className="reward-amount">
                        ${reward.rewardAmount}
                      </div>
                      <div className="reward-claimed">
                        {reward.rewardClaimed} Claimed
                      </div>
                      <div className="reward-controls">
                        <button onClick={() => handleEditReward(reward)}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDeleteReward(reward._id)}>
                          🗑 Delete
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(reward._id)}
                        >
                          {reward.isVisible ? "👁 Hide" : "🙈 Show"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{showEditModal ? "Edit Reward" : "Add New Reward"}</h3>
            <RewardForm
              formData={formData}
              onSubmit={showEditModal ? handleUpdateReward : handleAddReward}
              submitLabel={showEditModal ? "Update" : "Add"}
              handleInputChange={handleInputChange}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
