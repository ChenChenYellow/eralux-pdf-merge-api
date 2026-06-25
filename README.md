# ERALUX PDF Merge API

This API merges multiple PDF files into one PDF.

## Health Check

GET /health

## Merge PDFs

POST /api/pdf/merge

Headers:

x-api-key: your-api-key

Body:

```json
{
  "files": [
    {
      "fileName": "label1.pdf",
      "contentBase64": "JVBERi0x..."
    },
    {
      "fileName": "label2.pdf",
      "contentBase64": "JVBERi0x..."
    }
  ]
}