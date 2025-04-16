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
  const [activeTab, setActiveTab] = useState("Claimed");
  const [rewards, setRewards] = useState({});
  const [claimed, setClaimed] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [formData, setFormData] = useState({
    rewardName: "",
    rewardAmount: "",
    rewardFor: "Clients",
    image: null,
  });
  const [addressFields, setAddressFields] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [trackingId, setTrackingId] = useState("");

  useEffect(() => {
    fetchRewards();
    fetchClaimedRewards();
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

  const fetchClaimedRewards = () => {
    axios
      .get("http://localhost:5000/admin/rewards/claimed")
      .then((res) => setClaimed(res.data))
      .catch((err) => console.error("Error fetching claimed rewards:", err));
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

  const handleStatusClick = (claim) => {
    setSelectedClaim(claim);
    setAddressFields({
      street: claim.toAddress?.street || "",
      city: claim.toAddress?.city || "",
      state: claim.toAddress?.state || "",
      zipCode: claim.toAddress?.zipCode || "",
    });
    setTrackingId(claim.trackingId || "");
    setShowStatusModal(true);
  };

  const handleStatusUpdate = (newStatus) => {
    const payload = { status: newStatus };

    if (newStatus === "PROCESSING") {
      payload.address = addressFields;
    } else if (newStatus === "SENT") {
      payload.trackingId = trackingId;
    }

    axios
      .patch(
        `http://localhost:5000/admin/rewards/claimed/${selectedClaim._id}`,
        payload
      )
      .then(() => {
        fetchClaimedRewards();
        setShowStatusModal(false);
        setSelectedClaim(null);
        setAddressFields({ street: "", city: "", state: "", zipCode: "" });
        setTrackingId("");
      })
      .catch((err) => console.error("Error updating status:", err));
  };

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

      {activeTab === "Claimed" && (
        <div className="claimed-table">
          <table>
            <thead>
              <tr>
                <th>REALTORS NAME</th>
                <th>DATE ORDERED</th>
                <th>ITEM</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {claimed.map((claim) => (
                <tr key={claim._id}>
                  <td>{claim.realtorName}</td>
                  <td>{new Date(claim.claimedAt).toLocaleDateString()}</td>
                  <td>{claim.rewardName}</td>
                  <td>
                    <span
                      className={`status-badge ${claim.status.toLowerCase()}`}
                      onClick={() => handleStatusClick(claim)}
                      style={{ cursor: "pointer" }}
                    >
                      {claim.status.charAt(0) +
                        claim.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Status</h3>
            <div className="status-modal">
              <select
                value={selectedClaim.status}
                onChange={(e) =>
                  setSelectedClaim({
                    ...selectedClaim,
                    status: e.target.value,
                  })
                }
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SENT">Sent</option>
              </select>

              {selectedClaim.status === "PROCESSING" && (
                <div className="address-fields">
                  {selectedClaim.to === "Client" && (
                    <div className="send-to-client">
                      <h4>Send to Client</h4>
                      <p>Client Name: {selectedClaim.clientName}</p>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={addressFields.street}
                    onChange={(e) =>
                      setAddressFields({
                        ...addressFields,
                        street: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={addressFields.city}
                    onChange={(e) =>
                      setAddressFields({
                        ...addressFields,
                        city: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addressFields.state}
                    onChange={(e) =>
                      setAddressFields({
                        ...addressFields,
                        state: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={addressFields.zipCode}
                    onChange={(e) =>
                      setAddressFields({
                        ...addressFields,
                        zipCode: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {selectedClaim.status === "SENT" && (
                <div className="sent-details">
                  <div className="details-group">
                    <h4>Order Details</h4>
                    <p>
                      <strong>Realtor:</strong> {selectedClaim.realtorName}
                    </p>
                    {selectedClaim.to === "Client" && (
                      <p>
                        <strong>Client:</strong> {selectedClaim.clientName}
                      </p>
                    )}
                    <p>
                      <strong>Item:</strong> {selectedClaim.rewardName}
                    </p>
                  </div>

                  <div className="details-group">
                    <h4>Shipping Details</h4>
                    <p>
                      <strong>Address:</strong>
                    </p>
                    <p>{addressFields.street}</p>
                    <p>
                      {addressFields.city}, {addressFields.state}{" "}
                      {addressFields.zipCode}
                    </p>
                  </div>

                  <div className="tracking-field">
                    <input
                      type="text"
                      placeholder="Tracking ID"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedClaim.status)}
                  className="save-btn"
                >
                  {selectedClaim.status === "PROCESSING"
                    ? "Mark as Processing"
                    : selectedClaim.status === "SENT"
                    ? "Mark as Sent"
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
