import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ClientDetails.css";
import { useAuth } from "../context/AuthContext";
import RequestDocumentModal from "./RequestDocumentModal";
import { toast } from "react-toastify";

const ClientDetails = () => {
  const { clientId } = useParams();
  const { auth } = useAuth();
  const { realtor } = auth;
  const realtorId = realtor.id;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchClientDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/client/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchClientDetails();
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [clientId, realtorId]);

  const handleRequestDocument = async ({ docType, description }) => {
    try {
      const response = await fetch(
        `http://localhost:5000/realtor/requestdocument/${realtorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            docType,
            description,
            clientId,
          }),
        }
      );

      if (response.ok) {
        // Refresh the requested documents list
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error requesting document:", error);
    }
  };

  const handleReview = async (clientId, docId, newStatus) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:5000/admin/documents/${clientId}/${docId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      // Use the new refreshData function
      await refreshData();
      toast.success(`Document ${newStatus}`, { position: "top-right" });
    } catch (error) {
      console.error("Error updating document status:", error);
      toast.error("Failed to update document status", {
        position: "top-right",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleView = (doc) => {
    console.log("viewing doc", doc);
    if (doc.fileId) {
      window.open(
        `http://localhost:5000/documents/${clientId}/documents/${doc.fileId}`,
        "_blank"
      );
    }
  };

  const handleApprove = (doc) => {
    handleReview(clientId, doc.fileId, "Approved");
  };

  const handleReject = (doc) => {
    handleReview(clientId, doc.fileId, "Rejected");
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!client) {
    return <div className="error">Client not found</div>;
  }

  // Merge the client's submitted documents with the requested documents
  // by comparing the document type in lowercase.
  const mergedDocs = [].map((reqDoc) => {
    const matchingClientDoc = client.documents.find(
      (clientDoc) =>
        clientDoc.docType.toLowerCase() === reqDoc.docType.toLowerCase()
    );
    return {
      docType: reqDoc.docType,
      requestedStatus: reqDoc.status,
      clientStatus: matchingClientDoc
        ? matchingClientDoc.status
        : "Not Submitted",
      fileId: matchingClientDoc ? matchingClientDoc._id : null,

      fileName: matchingClientDoc ? matchingClientDoc.fileName : null,
      requestId: reqDoc._id,
    };
  });

  return (
    <div className="client-details">
      <div className="client-header">
        <h1>{client.name}</h1>
        <span className="status-badge">{client.status}</span>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Request Document
        </button>
      </div>

      <RequestDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRequestDocument}
      />

      <div className="content-wrapper">
        <section className="review-section">
          <h2>Document Review</h2>
          {mergedDocs && mergedDocs.length > 0 ? (
            <div className="review-list">
              {mergedDocs.map((doc, index) => (
                <div key={index} className="review-card">
                  <div className="review-header">
                    <h3>{doc.docType}</h3>
                    <span
                      className={`status-pill ${doc.clientStatus.toLowerCase()}`}
                    >
                      {doc.clientStatus}
                    </span>
                  </div>
                  <div className="action-buttons">
                    {doc.fileId && (
                      <button
                        className="btn btn-view"
                        onClick={() => handleView(doc)}
                      >
                        View Document
                      </button>
                    )}
                    {doc.clientStatus === "Submitted" && (
                      <div className="approval-buttons">
                        <button
                          className="btn btn-approve"
                          onClick={() => handleApprove(doc)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Processing..." : "Approve"}
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => handleReject(doc)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No documents to review</div>
          )}
        </section>

        <section className="documents-section">
          <h2>Documents Submitted</h2>
          {client.documents && client.documents.length > 0 ? (
            <div className="documents-list">
              {client.documents.map((doc, index) => (
                <div key={index} className="document-card">
                  <div className="document-info">
                    <h3>{doc.docType}</h3>
                    <span className={`status-pill ${doc.status.toLowerCase()}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No documents submitted yet</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ClientDetails;
