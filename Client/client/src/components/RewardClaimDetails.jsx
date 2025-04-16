import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";

const RewardClaimDetails = () => {
  const { rewardId } = useParams();
  const location = useLocation();
  const [claimDetails, setClaimDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const clientId = location.state?.clientId;

  useEffect(() => {
    const fetchClaimDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/admin/rewards/claimed/${rewardId}`
        );
        setClaimDetails(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching claim details:", error);
        setLoading(false);
      }
    };

    fetchClaimDetails();
  }, [rewardId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!claimDetails) {
    return <div>Reward claim not found</div>;
  }

  return (
    <div className="reward-claim-details">
      <h2>Reward Claim Details</h2>
      <div className="claim-info">
        <p>
          <strong>Reward Name:</strong> {claimDetails.rewardName}
        </p>
        <p>
          <strong>Claimed By:</strong> {claimDetails.realtorName}
        </p>
        <p>
          <strong>Claimed For:</strong> {claimDetails.clientName}
        </p>
        <p>
          <strong>Status:</strong> {claimDetails.status}
        </p>
        <p>
          <strong>Date Claimed:</strong>{" "}
          {new Date(claimDetails.claimedAt).toLocaleDateString()}
        </p>

        {claimDetails.status === "SENT" && (
          <div className="shipping-info">
            <h3>Shipping Information</h3>
            <p>
              <strong>Tracking ID:</strong> {claimDetails.trackingId}
            </p>
            {claimDetails.toAddress && (
              <div className="address">
                <p>
                  <strong>Shipping Address:</strong>
                </p>
                <p>{claimDetails.toAddress.street}</p>
                <p>
                  {claimDetails.toAddress.city}, {claimDetails.toAddress.state}{" "}
                  {claimDetails.toAddress.zipCode}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardClaimDetails;
