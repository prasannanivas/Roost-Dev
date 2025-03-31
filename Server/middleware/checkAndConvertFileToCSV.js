const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

const sampleCSV = `# Client Invite Template
# Instructions:
# 1. Do not modify the header row.
# 2. Each row must include a "Full Name" and at least one contact method: either "email" or "phone".
# 3. Save the file in CSV format.
Full Name,email,phone
John Doe,client1@example.com,1234567890
Jane Smith,client2@example.com,
Alex Johnson,,0987654321`;

// Middleware to check file format and convert Excel to CSV if needed,
// then validate the CSV content for blank rows, missing headers, and required fields.
const checkAndConvertFileFormat = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required", sampleCSV });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext === ".csv") {
    // File is already CSV; validate the CSV content
    try {
      validateCSV(req.file.path);
      return next();
    } catch (err) {
      return res.status(400).json({ error: err.message, sampleCSV });
    }
  } else if (ext === ".xls" || ext === ".xlsx") {
    try {
      // Read the Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert the first sheet to CSV format
      const csvData = xlsx.utils.sheet_to_csv(sheet);

      // Save the CSV data to a new file
      const newPath = req.file.path + ".csv";
      fs.writeFileSync(newPath, csvData);

      // Update req.file details so that inviteBulkClient processes the CSV file
      req.file.path = newPath;
      req.file.originalname = req.file.originalname.replace(ext, ".csv");
      req.file.mimetype = "text/csv";

      // Validate CSV content
      validateCSV(req.file.path);

      return next();
    } catch (error) {
      console.error("Error converting Excel file to CSV:", error);
      return res
        .status(500)
        .json({ error: "Error converting Excel file to CSV" });
    }
  } else {
    return res.status(400).json({
      error: "Invalid file format. Only CSV or Excel files are allowed.",
      sampleCSV,
    });
  }
};

function validateCSV(filePath) {
  // Read the CSV file content
  const fileContent = fs.readFileSync(filePath, "utf8");
  // Split content into lines (handles both Unix and Windows line endings)
  const lines = fileContent.split(/\r?\n/);
  // Filter out empty lines
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");
  // Filter out comment lines (those starting with '#')
  const dataLines = nonEmptyLines.filter(
    (line) => !line.trim().startsWith("#")
  );

  if (dataLines.length === 0) {
    throw new Error("CSV file is empty or only contains comments.");
  }

  // Validate header row: should be the first non-comment line
  const headerLine = dataLines[0];
  const headers = headerLine.split(",").map((h) => h.trim());
  const requiredHeaders = ["Full Name", "email", "phone"];

  if (headers.length < requiredHeaders.length) {
    throw new Error("Missing headers in CSV file.");
  }
  // Ensure the headers are exactly as expected in order
  for (let i = 0; i < requiredHeaders.length; i++) {
    if (headers[i] !== requiredHeaders[i]) {
      throw new Error(
        `Invalid header format. Expected "${requiredHeaders[i]}" at position ${
          i + 1
        }.`
      );
    }
  }

  // Validate each data row
  for (let i = 1; i < dataLines.length; i++) {
    const row = dataLines[i];
    const values = row.split(",").map((v) => v.trim());

    // Check for Full Name (first column)
    if (!values[0]) {
      throw new Error(`Row ${i + 1} is missing "Full Name".`);
    }

    // At least one contact method (email or phone) must be provided
    if (!values[1] && !values[2]) {
      throw new Error(`Row ${i + 1} must have either an "email" or "phone".`);
    }
  }
}

module.exports = checkAndConvertFileFormat;
