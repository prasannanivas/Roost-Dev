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
    otherDetails: {
      name: "",
      email: "",
      phone: "",
      relationship: "",
      employmentStatus: "",
      ownAnotherProperty: "",
    },
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

  const handleOtherDetailsChange = (e) => {
    setFormData({
      ...formData,
      otherDetails: {
        ...formData.otherDetails,
        [e.target.name]: e.target.value,
      },
    });
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
        return formData.applyingbehalf === "other" ? (
          <div className="client-questionnaire-section">
            <h3 className="client-questionnaire-section-title">
              Other Person's Details
            </h3>
            <div className="client-questionnaire-input-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.otherDetails.name}
                onChange={handleOtherDetailsChange}
                className="client-questionnaire-input"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.otherDetails.email}
                onChange={handleOtherDetailsChange}
                className="client-questionnaire-input"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.otherDetails.phone}
                onChange={handleOtherDetailsChange}
                className="client-questionnaire-input"
                required
              />
              <input
                type="text"
                name="relationship"
                placeholder="Relationship"
                value={formData.otherDetails.relationship}
                onChange={handleOtherDetailsChange}
                className="client-questionnaire-input"
                required
              />
            </div>
          </div>
        ) : (
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
              Employment Information
            </h3>
            <div className="client-questionnaire-subsection">
              <label>Your Employment Status</label>
              <div className="client-questionnaire-button-group">
                {["Employed", "Selfemployed", "Unemployed"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`client-questionnaire-option-btn ${
                      formData.employmentStatus === status
                        ? "client-questionnaire-selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleButtonSelect("employmentStatus", status)
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            {formData.applyingbehalf === "other" && (
              <div className="client-questionnaire-subsection">
                <label>{formData.otherDetails.name}'s Employment Status</label>
                <div className="client-questionnaire-button-group">
                  {["Employed", "Selfemployed", "Unemployed"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`client-questionnaire-option-btn ${
                        formData.otherDetails.employmentStatus === status
                          ? "client-questionnaire-selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleOtherDetailsChange({
                          target: { name: "employmentStatus", value: status },
                        })
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="client-questionnaire-section">
            <h3 className="client-questionnaire-section-title">
              Property Ownership
            </h3>
            <div className="client-questionnaire-subsection">
              <label>Do you own another property?</label>
              <div className="client-questionnaire-button-group">
                {["Yes - with a mortgage", "Yes - All paid off", "No"].map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      className={`client-questionnaire-option-btn ${
                        formData.ownAnotherProperty === status
                          ? "client-questionnaire-selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleButtonSelect("ownAnotherProperty", status)
                      }
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>
            {formData.applyingbehalf === "other" && (
              <div className="client-questionnaire-subsection">
                <label>
                  Does {formData.otherDetails.name} own another property?
                </label>
                <div className="client-questionnaire-button-group">
                  {["Yes - with a mortgage", "Yes - All paid off", "No"].map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        className={`client-questionnaire-option-btn ${
                          formData.otherDetails.ownAnotherProperty === status
                            ? "client-questionnaire-selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleOtherDetailsChange({
                            target: {
                              name: "ownAnotherProperty",
                              value: status,
                            },
                          })
                        }
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
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
          {currentStep < 4 && (
            <button
              type="button"
              onClick={nextStep}
              className="client-questionnaire-nav-btn"
            >
              Next
            </button>
          )}
          {currentStep === 4 && (
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
