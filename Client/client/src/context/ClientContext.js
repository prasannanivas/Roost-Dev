import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ClientContext = createContext(null);

export const ClientProvider = ({ children }) => {
  const { auth } = useAuth();
  const client = auth.client;

  const [documents, setDocuments] = useState([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [clientInfo, setClientInfo] = useState(null);
  useEffect(() => {
    setLoadingClient(true);

    async function fetchDocuments(clientID) {
      await fetch(`http://localhost:5000/documents/${clientID}/documents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setDocuments(data);
        })
        .catch((error) => {
          console.error("Error fetching documents:", error);
        })
        .finally(() => {
          setLoadingClient(false);
        });
    }

    async function fetchClient(clientID) {
      await fetch(`http://localhost:5000/client/${clientID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setClientInfo(data);
        })
        .catch((error) => {
          console.error("Error fetching client:", error);
        })
        .finally(() => {
          setLoadingClient(false);
        });
    }
    console.log(client);
    if (client) {
      fetchDocuments(client.id);
      fetchClient(client.id);
    }

    console.log(documents);
  }, []);

  return (
    <ClientContext.Provider value={{ documents, loadingClient, clientInfo }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
};
