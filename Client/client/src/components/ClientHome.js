import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./ClientHome.css"; // Our CSS
import { useClient } from "../context/ClientContext";
import ClientProfile from "./ClientProfile";

const REQUIRED_DOC_TYPES = [
  { label: "Letter of Employment", value: "letterOfEmployment" },
  { label: "2023 T4", value: "T4_2023" },
  { label: "2024 T4", value: "T4_2024" },
  { label: "Most Recent Paystub", value: "paystub" },
  { label: "2022 T1 General", value: "T1_2022" },
  { label: "2023 T1 General", value: "T1_2023" },
  { label: "Notice of Assessment", value: "noticeOfAssessment" },
  { label: "Mortgage Statement", value: "mortgageStatement" },
];

const ClientHome = () => {
  const { auth } = useAuth();
  const documentFromClientContext = useClient();
  const [showProfile, setShowProfile] = useState(false);

  //console.log(documentFromClientContext);

  const clientFromContext = auth.client;
  const [documents, setDocuments] = useState(
    documentFromClientContext.documents || []
  );

  useEffect(() => {
    setDocuments(documentFromClientContext.documents || []);
  }, [documentFromClientContext.documents]);

  // State for controlling the modal
  const [showModal, setShowModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  console.log(documents);
  const clientId = clientFromContext.id;

  // Finds an existing doc by docType
  const getDocByType = (docType) =>
    documents.find((doc) => doc.docType === docType);

  // When user clicks "Add," we store which docType we want to upload
  const handleAdd = (docType) => {
    setSelectedDocType(docType);
    setSelectedFile(null);
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedDocType(null);
    setSelectedFile(null);
  };

  // Actually upload the selected file for the selected doc type
  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      alert("No file or docType selected");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("docType", selectedDocType);
      formData.append("pdfFile", selectedFile);

      // Example endpoint; adjust to your actual route
      const response = await fetch(
        `http://54.89.183.155:5000/documents/${clientId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        alert("Upload failed: " + (errData.error || "Unknown error"));
        return;
      }

      const data = await response.json();
      // data.document => { docType, fileName, status, fileId }

      // Update local docs array
      setDocuments((prevDocs) => {
        const existingIndex = prevDocs.findIndex(
          (d) => d.docType === selectedDocType
        );
        if (existingIndex === -1) {
          return [...prevDocs, data.document];
        } else {
          const updated = [...prevDocs];
          updated[existingIndex] = data.document;
          return updated;
        }
      });

      alert("Document uploaded successfully!");
      closeModal(); // Hide modal
    } catch (err) {
      console.error("Upload error:", err);
      alert("Something went wrong uploading the document.");
    }
  };

  return (
    <div className="client-home-container">
      <h1 className="client-home-title">
        Welcome,
        <span className="client-name-link" onClick={() => setShowProfile(true)}>
          {clientFromContext.name}
        </span>
      </h1>

      {/* Sliding Profile Panel */}
      <div className={`profile-panel ${showProfile ? "open" : ""}`}>
        <button className="close-profile" onClick={() => setShowProfile(false)}>
          ×
        </button>
        <ClientProfile />
      </div>

      <h2 className="required-docs-title">Required Documents</h2>
      {documentFromClientContext.loadingClient ? (
        <>
          <h1>Loading... please wait.</h1>
        </>
      ) : (
        <>
          {" "}
          <table className="docs-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {REQUIRED_DOC_TYPES.map((docDef) => {
                const existingDoc = getDocByType(docDef.value);
                const status = existingDoc
                  ? existingDoc.status
                  : "Not Submitted";

                return (
                  <tr key={docDef.value} className="doc-row">
                    <td className="doc-label">{docDef.label}</td>
                    <td className="doc-status">{status}</td>
                    <td className="doc-action">
                      {(status === "Not Submitted" ||
                        status === "Rejected") && (
                        <button
                          className="add-btn"
                          onClick={() => handleAdd(docDef.value)}
                        >
                          Add
                        </button>
                      )}
                      {status === "Submitted" && (
                        <span className="doc-submitted-status">Submitted</span>
                      )}
                      {status === "Approved" && (
                        <span className="doc-completed-status">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* MODAL OVERLAY */}
          {showModal && (
            <div className="modal-overlay" onClick={closeModal}>
              {/* Stop clicks from closing if they happen inside modal content */}
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Upload Document</h2>
                <p>
                  You are uploading for: <strong>{selectedDocType}</strong>
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />

                <div className="modal-actions">
                  <button className="modal-btn upload" onClick={handleUpload}>
                    Upload
                  </button>
                  <button className="modal-btn cancel" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}{" "}
        </>
      )}
    </div>
  );
};

export default ClientHome;
