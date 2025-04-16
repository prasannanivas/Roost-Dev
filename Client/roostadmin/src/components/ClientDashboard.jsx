import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ClientsDashboard.css";

const ClientsDashboard = () => {
  const [clients, setClients] = useState([]);
  const [neededDocsMap, setNeededDocsMap] = useState({});
  const [selectedClient, setSelectedClient] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [docFilter, setDocFilter] = useState("Active");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasInternet, setHasInternet] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isMainApplicant, setIsMainApplicant] = useState(true);

  const checkInternetConnectivity = async () => {
    try {
      await axios.get("http://localhost:5000/ping", { timeout: 3000 });
      setHasInternet(true);
    } catch (error) {
      setHasInternet(false);
    }
  };

  useEffect(() => {
    checkInternetConnectivity();
    const intervalId = setInterval(checkInternetConnectivity, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!hasInternet) return;
    axios
      .get("http://localhost:5000/admin/clients")
      .then(async (response) => {
        const clientsData = response.data.clients;

        const promises = clientsData.map((client) =>
          axios
            .get(`http://localhost:5000/client/neededdocument/${client._id}`)
            .then((res) => ({
              clientId: client._id,
              neededDocs: res.data.documents_needed,
            }))
            .catch(() => ({ clientId: client._id, neededDocs: [] }))
        );

        const results = await Promise.all(promises);
        const map = {};
        results.forEach(({ clientId, neededDocs }) => {
          map[clientId] = neededDocs;
        });

        setClients(clientsData);
        setNeededDocsMap(map);
      })
      .catch((error) => console.error("Error fetching clients:", error));
  }, [hasInternet]);

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "status-approved";
      case "Submitted":
        return "status-submitted";
      case "Rejected":
        return "status-rejected";
      default:
        return "status-missing";
    }
  };

  const handleChangeStatusClick = (doc) => {
    setSelectedDoc(doc);
    setShowStatusModal(true);
    setNewStatus("");
    setStatusMessage("");
  };

  const handleSubmitStatus = () => {
    if (!selectedClient || !selectedDoc) return;
    axios
      .patch(
        `http://localhost:5000/admin/documents/${selectedClient._id}/${selectedDoc._id}/review`,
        {
          newStatus: newStatus === "Valid" ? "Approved" : "Rejected",
          message: statusMessage,
        }
      )
      .then(() => axios.get("http://localhost:5000/admin/clients"))
      .then((response) => {
        setClients(response.data.clients);
        const updatedClient = response.data.clients.find(
          (c) => c._id === selectedClient._id
        );
        setSelectedClient(updatedClient);
        setShowStatusModal(false);
      })
      .catch((err) => console.error("Error updating status:", err));
  };

  const handleRequestDocument = (isMain) => {
    setIsMainApplicant(isMain);
    setNewDocName("");
    setNewDisplayName("");
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedClient || !hasInternet || !newDocName || !newDisplayName) {
      return;
    }

    try {
      await axios.post("http://localhost:5000/admin/requestdocument", {
        docType: newDocName,
        clientId: selectedClient._id,
        type: isMainApplicant ? "Needed" : "Needed-other",
        displayName: newDisplayName,
      });

      const response = await axios.get("http://localhost:5000/admin/clients");
      setClients(response.data.clients);
      setShowRequestModal(false);
    } catch (error) {
      console.error("Error requesting document:", error);
    }
  };

  const getStatusText = (documents, neededDocuments) => {
    if (!neededDocuments || neededDocuments.length === 0) return "SIGNED UP";
    const neededTypes = neededDocuments.map((d) => d.docType.toLowerCase());
    const submitted = documents.filter(
      (doc) =>
        neededTypes.includes(doc.docType.toLowerCase()) &&
        ["submitted", "approved"].includes(doc.status.toLowerCase())
    );
    return `${submitted.length} / ${neededDocuments.length} SUBMITTED`;
  };

  const renderDocumentSection = (docs, person = "main") => {
    return docs.map((needed) => {
      const existing = selectedClient.documents.find(
        (d) => d.docType.toLowerCase() === needed.docType.toLowerCase()
      );

      return (
        <div key={needed.docType} className="document-item">
          <div className="document-info">
            <div className="document-name">
              {needed.displayName || needed.docType}
            </div>
            <div
              className={`document-status ${
                existing
                  ? getDocumentStatusColor(existing.status)
                  : "status-missing"
              }`}
            >
              {existing ? existing.status : "Unsubmitted"}
            </div>
          </div>
          <div className="document-actions">
            {existing ? (
              <>
                <a
                  href={`http://localhost:5000/documents/${selectedClient._id}/document/${existing._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-button"
                  onClick={(e) => {
                    if (!hasInternet) {
                      e.preventDefault();
                      alert(
                        "No internet connection. Please try again when connected."
                      );
                    }
                  }}
                >
                  View
                </a>
                <button
                  className="status-button"
                  onClick={() => {
                    if (!hasInternet) {
                      alert(
                        "No internet connection. Please try again when connected."
                      );
                      return;
                    }
                    handleChangeStatusClick(existing);
                  }}
                >
                  Change Status
                </button>
              </>
            ) : (
              <button
                className="status-button"
                onClick={() => {
                  if (!hasInternet) {
                    alert(
                      "No internet connection. Please try again when connected."
                    );
                    return;
                  }
                  alert(`Reminder sent for ${needed.docType}!`);
                }}
              >
                Remind
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <div className="main-content">
        {!hasInternet && (
          <div
            style={{
              backgroundColor: "#ff4444",
              color: "white",
              padding: "10px",
              textAlign: "center",
            }}
          >
            No internet connection. Please check your connection and try again.
          </div>
        )}
        {isOffline && (
          <div
            style={{
              backgroundColor: "#ff9800",
              color: "white",
              padding: "10px",
              textAlign: "center",
            }}
          >
            You are currently offline. Some features may be unavailable.
          </div>
        )}
        <div className="content-wrapper">
          <div className="client-list">
            <h2 className="section-title">Clients</h2>
            {clients.map((client) => (
              <div
                key={client._id}
                onClick={() => setSelectedClient(client)}
                className="client-item"
              >
                <div className="client-initials">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="client-details">
                  <div className="client-name">{client.name}</div>
                  <div className="client-status">
                    {getStatusText(client.documents, neededDocsMap[client._id])}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="client-details-panel">
            {selectedClient ? (
              <>
                <div className="client-header">
                  <div className="client-header-name">
                    {selectedClient.name}
                  </div>
                  <select
                    className="client-header-filter"
                    value={docFilter}
                    onChange={(e) => setDocFilter(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="All">All</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="client-meta">
                  <div>
                    Started:{" "}
                    {new Date(selectedClient.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    Updated:{" "}
                    {new Date(selectedClient.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="document-section">
                  {selectedClient.documents ||
                  neededDocsMap[selectedClient._id] ? (
                    <>
                      <div className="applicant-section">
                        <h3>Main Applicant Documents</h3>
                        <button
                          className="request-doc-button"
                          onClick={() => handleRequestDocument(true)}
                        >
                          Request Document
                        </button>
                        {renderDocumentSection(
                          neededDocsMap[selectedClient._id]?.filter(
                            (doc) =>
                              doc.type !== "Needed-other" &&
                              (docFilter === "All" ||
                                (docFilter === "Active" &&
                                  ["Pending", "Submitted"].includes(
                                    doc.status
                                  )) ||
                                (docFilter === "Completed" &&
                                  doc.status === "Approved") ||
                                (docFilter === "Rejected" &&
                                  doc.status === "Rejected"))
                          ) || []
                        )}
                      </div>

                      {selectedClient.applyingbehalf === "other" && (
                        <div className="other-applicant-section">
                          <h3>
                            {selectedClient.otherDetails?.name ||
                              "Other Applicant"}
                            's Documents
                          </h3>
                          <button
                            className="request-doc-button"
                            onClick={() => handleRequestDocument(false)}
                          >
                            Request Document
                          </button>
                          {renderDocumentSection(
                            neededDocsMap[selectedClient._id]?.filter(
                              (doc) =>
                                doc.type === "Needed-other" &&
                                (docFilter === "All" ||
                                  (docFilter === "Active" &&
                                    ["Pending", "Submitted"].includes(
                                      doc.status
                                    )) ||
                                  (docFilter === "Completed" &&
                                    doc.status === "Approved") ||
                                  (docFilter === "Rejected" &&
                                    doc.status === "Rejected"))
                            ) || []
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p>No documents found.</p>
                  )}
                </div>
              </>
            ) : (
              <p>Select a client to view details</p>
            )}
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setShowStatusModal(false)}
            >
              ×
            </button>
            <h3 className="modal-title">Change Status</h3>
            <p className="modal-info">
              You have already submitted this document and accepted as valid.
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Valid">Valid</option>
              <option value="Invalid">Invalid</option>
            </select>
            <textarea
              placeholder="Include any additional details to share with the client"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button className="save-button" onClick={handleSubmitStatus}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setShowRequestModal(false)}
            >
              ×
            </button>
            <h3 className="modal-title">Request New Document</h3>
            <div className="modal-content">
              <input
                type="text"
                placeholder="Document Name"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="modal-input"
              />
              <input
                type="text"
                placeholder="Display Name"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </button>
              <button
                className="save-button"
                onClick={handleSubmitRequest}
                disabled={!newDocName || !newDisplayName}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientsDashboard;
