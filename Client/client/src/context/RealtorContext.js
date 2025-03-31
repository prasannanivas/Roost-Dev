import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const RealtorContext = createContext(null);

export const RealtorProvider = ({ children }) => {
  const { auth } = useAuth();
  const realtor = auth.realtor;
  const [loadingRealtor, setLoadingRealtor] = useState(true);
  const [realtorInfo, setRealtorInfo] = useState(null);
  const [invited, setInvited] = useState([]);
  const [invitedClients, setInvitedClients] = useState([]);
  const [invitedRealtors, setInvitedRealtors] = useState([]);
  useEffect(() => {
    setLoadingRealtor(true);

    async function fetchRealtor(realtorID) {
      await fetch(`http://54.89.183.155:5000/realtor/${realtorID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setRealtorInfo(data);
        })
        .catch((error) => {
          console.error("Error fetching realtor:", error);
        })
        .finally(() => {
          setLoadingRealtor(false);
        });
    }

    async function getAllInvitedClients(realtorID) {
      await fetch(`http://54.89.183.155:5000/realtor/invited/${realtorID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setInvited(data);
          setInvitedClients(
            data.filter((invite) => invite.inviteType === "client")
          );
          setInvitedRealtors(
            data.filter((invite) => invite.inviteType === "realtor")
          );
        })
        .catch((error) => {
          console.error("Error fetching invited clients:", error);
        });
    }

    console.log(realtor);
    if (realtor) {
      fetchRealtor(realtor.id);
      getAllInvitedClients(realtor.id);
    }
  }, []);

  return (
    <RealtorContext.Provider
      value={{
        invited,
        invitedClients,
        invitedRealtors,
        loadingRealtor,
        realtorInfo,
      }}
    >
      {children}
    </RealtorContext.Provider>
  );
};

export const useRealtor = () => {
  const context = useContext(RealtorContext);
  if (!context) {
    throw new Error("useRealtor must be used within a RealtorProvider");
  }
  return context;
};
