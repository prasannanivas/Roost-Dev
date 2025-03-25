import React, { useState } from "react";
import "./RequestDocumentModal.css";

const RequestDocumentModal = ({ isOpen, onClose, onSubmit }) => {
  const [docType, setDocType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ docType, description });
    setDocType("");
    setDescription("");
  };

  if (!isOpen) return null;

  return (
    <div className="request-document-overlay">
      <div className="request-document-content">
        <h2 className="request-document-title">Request Document</h2>
        <form onSubmit={handleSubmit} className="request-document-form">
          <div className="request-document-field">
            <label>Document Type:</label>
            <input
              type="text"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="request-document-input"
              placeholder="Enter document type"
              required
            />
          </div>
          <div className="request-document-field">
            <label>Description (optional):</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="request-document-textarea"
              placeholder="Add additional details..."
              rows="3"
            />
          </div>
          <div className="request-document-actions">
            <button
              type="button"
              onClick={onClose}
              className="request-document-button cancel"
            >
              Cancel
            </button>
            <button type="submit" className="request-document-button submit">
              Request Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestDocumentModal;
