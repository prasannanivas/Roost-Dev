import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ClientQuestionaire.css";
import { useAuth } from "../context/AuthContext";

function ClientQuestionaire() {
  const { auth } = useAuth();
  const clientId = auth.client.id;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    applyingbehalf: "",
    employmentStatus: "",
    ownAnotherProperty: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.put(
        `http://localhost:5000/client/questionaire/${clientId}`,
        formData
      );
      window.location.reload();
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleButtonSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="client-questionnaire-section">
            <h3 className="client-questionnaire-section-title">
              Application Details
            </h3>
            <label className="client-questionnaire-label">
              Who is applying for this property?
            </label>
            <div className="client-questionnaire-button-group">
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.applyingbehalf === "self"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() => handleButtonSelect("applyingbehalf", "self")}
              >
                Just me
              </button>
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.applyingbehalf === "other"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() => handleButtonSelect("applyingbehalf", "other")}
              >
                Me and someone else
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="client-questionnaire-section">
            <h3 className="client-questionnaire-section-title">
              Employment Information
            </h3>
            <label className="client-questionnaire-label">
              What is your employment status?
            </label>
            <div className="client-questionnaire-button-group">
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.employmentStatus === "Employed"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() =>
                  handleButtonSelect("employmentStatus", "Employed")
                }
              >
                Employed at a company
              </button>
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.employmentStatus === "Selfemployed"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() =>
                  handleButtonSelect("employmentStatus", "Selfemployed")
                }
              >
                Self employed
              </button>
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.employmentStatus === "Unemployed"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() =>
                  handleButtonSelect("employmentStatus", "Unemployed")
                }
              >
                Unemployed
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="client-questionnaire-section">
            <h3 className="client-questionnaire-section-title">
              Property Ownership
            </h3>
            <label className="client-questionnaire-label">
              Do you own another property?
            </label>
            <div className="client-questionnaire-button-group">
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.ownAnotherProperty === "Yes - with a mortgage"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() =>
                  handleButtonSelect(
                    "ownAnotherProperty",
                    "Yes - with a mortgage"
                  )
                }
              >
                Yes - with a mortgage
              </button>
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.ownAnotherProperty === "Yes - All paid off"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() =>
                  handleButtonSelect("ownAnotherProperty", "Yes - All paid off")
                }
              >
                Yes - All paid off
              </button>
              <button
                type="button"
                className={`client-questionnaire-option-btn ${
                  formData.ownAnotherProperty === "No"
                    ? "client-questionnaire-selected"
                    : ""
                }`}
                onClick={() => handleButtonSelect("ownAnotherProperty", "No")}
              >
                No
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="client-questionnaire-container">
      <h2 className="client-questionnaire-title">
        Property Purchase Questionnaire
      </h2>
      <form onSubmit={handleSubmit} className="client-questionnaire-form">
        {renderStep()}
        <div className="client-questionnaire-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="client-questionnaire-nav-btn"
            >
              Previous
            </button>
          )}
          {currentStep < 3 && (
            <button
              type="button"
              onClick={nextStep}
              className="client-questionnaire-nav-btn"
            >
              Next
            </button>
          )}
          {currentStep === 3 && (
            <button
              type="submit"
              className="client-questionnaire-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Questionnaire"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ClientQuestionaire;
