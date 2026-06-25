const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PDFDocument } = require("pdf-lib");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

function validateApiKey(req, res, next) {
  if (!API_KEY) {
    return next();
  }

  const incomingKey = req.header("x-api-key");

  if (!incomingKey || incomingKey !== API_KEY) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.json({
    service: "ERALUX PDF Merge API",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.post("/api/pdf/merge", validateApiKey, async (req, res) => {
  try {
    let inputFiles = [];

    // Format 1: Business Central current format
    // {
    //   "labels": ["base64_1", "base64_2"]
    // }
    if (Array.isArray(req.body.labels)) {
      inputFiles = req.body.labels.map((base64, index) => ({
        fileName: `label${index + 1}.pdf`,
        contentBase64: base64
      }));
    }

    // Format 2: Generic format
    // {
    //   "files": [
    //     { "fileName": "a.pdf", "contentBase64": "base64_1" }
    //   ]
    // }
    if (Array.isArray(req.body.files)) {
      inputFiles = req.body.files;
    }

    if (!Array.isArray(inputFiles) || inputFiles.length === 0) {
      return res.status(400).json({
        error: "labels or files is required and must be a non-empty array"
      });
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of inputFiles) {
      if (!file.contentBase64) {
        return res.status(400).json({
          error: "Each file must contain contentBase64",
          fileName: file.fileName || null
        });
      }

      const cleanBase64 = file.contentBase64.includes(",")
        ? file.contentBase64.split(",").pop()
        : file.contentBase64;

      const pdfBytes = Buffer.from(cleanBase64, "base64");

      let pdf;
      try {
        pdf = await PDFDocument.load(pdfBytes);
      } catch (error) {
        return res.status(400).json({
          error: "Invalid PDF file",
          fileName: file.fileName || null,
          detail: error.message
        });
      }

      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    const mergedBytes = await mergedPdf.save();
    const mergedBase64 = Buffer.from(mergedBytes).toString("base64");

    res.json({
      fileName: "merged.pdf",

      // For your current BC code
      mergedPdfBase64: mergedBase64,

      // For generic API usage
      contentBase64: mergedBase64
    });
  } catch (error) {
    console.error("PDF merge failed:", error);

    res.status(500).json({
      error: "Failed to merge PDFs",
      detail: error.message
    });
  }
});
app.listen(PORT, () => {
  console.log(`PDF Merge API running on port ${PORT}`);
});