import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const CSVUploadForm = ({ realtorId, setShowCSVUploadForm }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setFeedback({ message: "", type: "" });
  };

  // Validate CSV file content using PapaParse
  const validateCSVContent = (csvText) => {
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    // Validate header row
    const requiredHeaders = ["Full Name", "email", "phone"];
    if (!results.meta.fields) {
      throw new Error("CSV file is invalid. Missing header row.");
    }
    for (let i = 0; i < requiredHeaders.length; i++) {
      if (results.meta.fields[i] !== requiredHeaders[i]) {
        throw new Error(
          `Invalid header. Expected "${requiredHeaders[i]}" at position ${
            i + 1
          } but got "${results.meta.fields[i]}".`
        );
      }
    }

    // Validate each data row (data rows start from row 2)
    results.data.forEach((row, index) => {
      const rowNumber = index + 2; // header is row 1
      const fullName = row["Full Name"] ? row["Full Name"].trim() : "";
      const email = row["email"] ? row["email"].trim() : "";
      const phone = row["phone"] ? row["phone"].trim() : "";
      if (!fullName) {
        throw new Error(`Row ${rowNumber}: "Full Name" is required.`);
      }
      if (!email && !phone) {
        throw new Error(
          `Row ${rowNumber}: Either "email" or "phone" must be provided.`
        );
      }
    });
  };

  // Validate XLSX file content using xlsx library
  const validateXLSXContent = (rows) => {
    if (rows.length === 0) {
      throw new Error("The file is empty.");
    }
    // The first row should be the header
    const headerRow = rows[0].map((cell) => String(cell).trim());
    const requiredHeaders = ["Full Name", "email", "phone"];
    for (let i = 0; i < requiredHeaders.length; i++) {
      if (headerRow[i] !== requiredHeaders[i]) {
        throw new Error(
          `Invalid header. Expected "${requiredHeaders[i]}" at column ${
            i + 1
          } but got "${headerRow[i]}".`
        );
      }
    }
    // Validate each data row (starting at index 1, which corresponds to row 2)
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      // If the row is completely empty, ignore it.
      const allEmpty = row.every((cell) => String(cell).trim() === "");
      if (allEmpty) return;

      const fullName = row[0] ? String(row[0]).trim() : "";
      const email = row[1] ? String(row[1]).trim() : "";
      const phone = row[2] ? String(row[2]).trim() : "";
      if (!fullName) {
        throw new Error(`Row ${index + 1}: "Full Name" is required.`);
      }
      if (!email && !phone) {
        throw new Error(
          `Row ${index + 1}: Either "email" or "phone" must be provided.`
        );
      }
    });
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({
        message: "Please select a file to upload.",
        type: "error",
      });
      return;
    }

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    // We'll support both csv and xlsx/xls files
    if (
      fileExtension !== "csv" &&
      fileExtension !== "xlsx" &&
      fileExtension !== "xls"
    ) {
      setFeedback({
        message: "Please upload a CSV or Excel file.",
        type: "error",
      });
      return;
    }

    // Create a FileReader instance
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        if (fileExtension === "csv") {
          const csvText = event.target.result;
          // Validate CSV content
          validateCSVContent(csvText);
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
          // For Excel files, read as an arraybuffer then process
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          // Convert the sheet to an array of arrays
          const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });
          validateXLSXContent(rows);
        }
      } catch (error) {
        setFeedback({ message: error.message, type: "error" });
        return; // Abort upload if validation fails
      }

      // If validation passes, proceed with file upload
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const res = await axios.post(
          `http://localhost:5000/realtor/${realtorId}/invite-client-csv`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setFeedback({
          message: "File uploaded successfully!",
          type: "success",
        });
        console.log(res.data);
      } catch (err) {
        console.error(err);
        setFeedback({
          message: err.response?.data?.error || "Error uploading file.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setFeedback({ message: "Error reading the file.", type: "error" });
    };

    // For CSV, read as text; for Excel, read as arraybuffer
    if (fileExtension === "csv") {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  return (
    <div className="csv-upload-overlay">
      <form className="csv-upload-form" onSubmit={handleCSVUpload}>
        <h3>Bulk Invite Clients via CSV/Excel</h3>
        {feedback.message && (
          <div className={`feedback-message ${feedback.type}`}>
            {feedback.message}
          </div>
        )}
        <div className="form-control">
          <label htmlFor="csvFile">Select CSV or Excel file</label>
          <input
            type="file"
            id="csvFile"
            name="csvFile"
            accept=".csv, .xls, .xlsx"
            onChange={handleFileChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload File"}
          </button>
          <button
            type="button"
            onClick={() => setShowCSVUploadForm(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
        <div className="download-template">
          <p>
            Don't have a CSV template?{" "}
            <a
              href="http://localhost:5000/download-template-client"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Template
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default CSVUploadForm;
