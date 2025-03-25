import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./ClientHome.css"; // Our CSS
import { useClient } from "../context/ClientContext";
import ClientProfile from "./ClientProfile";

const ClientHome = () => {
  const { auth } = useAuth();
  const documentFromClientContext = useClient();
  const [showProfile, setShowProfile] = useState(false);

  // Assuming client is stored in auth.client
  const clientFromContext = auth.client;
  const clientId = clientFromContext.id;

  // State for documents fetched from the API endpoint (what's needed/requested)
  const [documentsFromApi, setDocumentsFromApi] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // State for client's uploaded documents (from context)
  const [clientDocs, setClientDocs] = useState(
    documentFromClientContext.documents || []
  );

  useEffect(() => {
    setClientDocs(documentFromClientContext.documents || []);
  }, [documentFromClientContext.documents]);

  // Fetch the needed documents for the client from the API
  useEffect(() => {
    if (clientId) {
      setLoadingDocuments(true);
      fetch(`http://localhost:5000/client/neededdocument/${clientId}`)
        .then((response) => response.json())
        .then((data) => {
          // Expecting data.documents_needed to be an array of document objects
          setDocumentsFromApi(data.documents_needed || []);
          setLoadingDocuments(false);
        })
        .catch((err) => {
          console.error("Error fetching needed documents:", err);
          setLoadingDocuments(false);
        });
    }
  }, [clientId]);

  // Merge the API document list with the client's uploaded documents.
  // For each API document, if a matching document exists in clientDocs,
  // update its status (and possibly fileName or fileId) using lowercase for comparison.
  const getMergedDocuments = () => {
    return documentsFromApi.map((apiDoc) => {
      // Use .toLowerCase() to compare document types
      const clientDoc = clientDocs.find(
        (doc) => doc.docType?.toLowerCase() === apiDoc.docType?.toLowerCase()
      );
      return clientDoc ? { ...apiDoc, ...clientDoc } : apiDoc;
    });
  };

  const mergedDocuments = getMergedDocuments();

  // Now split into two groups based on the "type" property from the API.
  const docsNeeded = mergedDocuments.filter((doc) => doc.type === "Needed");
  const docsRequested = mergedDocuments.filter(
    (doc) => doc.type === "Requested"
  );

  // Modal state for file upload
  const [showModal, setShowModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // When user clicks "Add," store which docType we want to upload
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

      // Example endpoint; adjust to your actual route if needed
      const response = await fetch(
        `http://localhost:5000/documents/${clientId}/documents`,
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
      // data.document => { docType, fileName, status, fileId } or similar

      // Update the clientDocs state with the newly uploaded document.
      // Use lowercase for the comparison.
      setClientDocs((prevDocs) => {
        const existingIndex = prevDocs.findIndex(
          (d) => d.docType.toLowerCase() === selectedDocType.toLowerCase()
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

      {loadingDocuments ? (
        <h1>Loading... please wait.</h1>
      ) : (
        <>
          {/* Section for "What is needed" */}
          <h2>What is needed</h2>
          {docsNeeded.length > 0 ? (
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {docsNeeded.map((doc) => (
                  <tr key={doc.docType} className="doc-row">
                    <td className="doc-label">{doc.docType}</td>
                    <td className="doc-status">{doc.status}</td>
                    <td className="doc-action">
                      {(doc.status === "Pending" ||
                        doc.status === "Rejected") && (
                        <button
                          className="add-btn"
                          onClick={() => handleAdd(doc.docType)}
                        >
                          Add
                        </button>
                      )}
                      {doc.status === "Submitted" && (
                        <span className="doc-submitted-status">Submitted</span>
                      )}
                      {doc.status === "Approved" && (
                        <span className="doc-completed-status">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No documents needed.</p>
          )}

          {/* Section for "What Realtor Needs" */}
          <h2>What Realtor Needs</h2>
          {docsRequested.length > 0 ? (
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {docsRequested.map((doc) => (
                  <tr key={doc.docType} className="doc-row">
                    <td className="doc-label">{doc.docType}</td>
                    <td className="doc-status">{doc.status}</td>
                    <td className="doc-action">
                      {doc.status?.toLowerCase() === "pending" && (
                        <button
                          className="add-btn"
                          onClick={() => handleAdd(doc.docType)}
                        >
                          Add
                        </button>
                      )}
                      {doc.status?.toLowerCase() === "submitted" && (
                        <span className="doc-submitted-status">Submitted</span> // Add a class for styling
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No documents requested.</p>
          )}
        </>
      )}

      {/* Modal Overlay for Upload */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          {/* Stop clicks from closing if they happen inside modal content */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
      )}
    </div>
  );
};

export default ClientHome;
