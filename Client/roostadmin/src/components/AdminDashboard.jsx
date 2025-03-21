import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/admin/documents/pending"
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPendingDocs(data.pending);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      setLoading(false);
    }
  };

  const handleReview = async (clientId, docId, newStatus) => {
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

      setPendingDocs((prevDocs) =>
        prevDocs.filter((doc) => doc.docId !== docId)
      );

      toast.success(`Document ${newStatus}`, { position: "top-right" });
    } catch (error) {
      console.error("Error updating document status:", error);
      toast.error("Failed to update document status", {
        position: "top-right",
      });
    }
  };

  // Function to open the document in a new tab
  const handleView = (clientId, docId) => {
    const docUrl = `http://localhost:5000/documents/${clientId}/documents/${docId}`;
    window.open(docUrl, "_blank"); // Opens the document in a new tab
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Panel</h1>
      <h2>Pending Documents</h2>

      {loading ? (
        <p>Loading documents...</p>
      ) : pendingDocs.length === 0 ? (
        <p>No pending documents.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Document Type</th>
              <th>File Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingDocs.map((doc) => (
              <tr key={doc.docId}>
                <td>{doc.clientName}</td>
                <td>{doc.docType}</td>
                <td>{doc.fileName}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => handleView(doc.clientId, doc.docId)}
                  >
                    View
                  </button>
                  <button
                    className="approve-btn"
                    onClick={() =>
                      handleReview(doc.clientId, doc.docId, "Approved")
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() =>
                      handleReview(doc.clientId, doc.docId, "Rejected")
                    }
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
