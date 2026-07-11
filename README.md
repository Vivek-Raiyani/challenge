# GrowEasy AI-Powered CSV Lead Importer

An intelligent CSV importer that uses AI to extract and normalize CRM lead data from **any** CSV format — regardless of column names, layouts, or data structures. Built as part of the GrowEasy Software Developer Assignment.

---

## ✨ Features

- 📁 **Drag & Drop or File Picker** CSV upload
- 👀 **Live CSV Preview** — scrollable, sticky-header table before any processing
- 🤖 **AI-powered field extraction** via OpenAI (GPT-4o-mini) — maps arbitrary columns to CRM fields
- ⚡ **Parallel batch processing** for fast imports on large files
- ✅ **Parsed results table** — shows imported records, skipped rows, and summary stats
- 🔁 **Retry mechanism** for failed AI batches
- 🌙 **Dark mode** UI
- 📱 **Responsive layout** — works on all screen sizes

---

## 🗂️ Project Structure

```
challenge/
├── backend/                  # Node.js + Express API
│   ├── config/               # CORS and app config
│   ├── middleware/           # Request logger
│   ├── prompts/              # AI system/user prompts
│   ├── routes/               # Express route handlers
│   ├── scripts/              # Smoke test script
│   ├── services/
│   │   ├── aiExtractor.ts    # OpenAI API integration
│   │   ├── batchProcessor.ts # Parallel batch processing
│   │   └── csvParser.ts      # CSV → records parser
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Helper utilities
│   ├── index.ts              # App entry point
│   ├── .env.example          # Environment variable template
│   └── package.json
│
├── frontend/                 # Next.js 16 + Tailwind CSS
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # API client & utilities
│   │   └── types/            # Shared TypeScript types
│   ├── .env.local.example    # Environment variable template
│   └── package.json
│
├── groweasy-imported-leads.csv   # Sample CRM-format CSV
├── edge_case_test_leads.csv      # Edge-case test data
└── README.md
```

---

## 🛠️ Tech Stack

| Layer    | Technology                           |
|----------|--------------------------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend  | Node.js ≥ 20, Express 5, TypeScript  |
| AI       | OpenAI API (GPT-4o-mini)             |
| Parsing  | csv-parse, PapaParse (client-side)   |

---

## ⚙️ Prerequisites

- **Node.js** `v20` or higher → [Download](https://nodejs.org/)
- **npm** `v9` or higher (bundled with Node.js)
- An **OpenAI API Key** → [Get one here](https://platform.openai.com/api-keys)

---

## 🚀 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Vivek-Raiyani/challenge.git
cd challenge
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

**Create the environment file:**

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Open `backend/.env` and fill in your values:

```env
PORT=4000
OPENAI_API_KEY=sk-...               # Your OpenAI API key (required)
OPENAI_MODEL=gpt-4o-mini            # Model to use
FRONTEND_URL=http://localhost:3000  # Comma-separated allowed origins
BATCH_SIZE=15                       # Records per AI batch
PARALLEL_BATCHES=3                  # Concurrent AI requests
```

> **Note:** `OPENAI_API_KEY` is the only required field. All other fields have sensible defaults.

**Start the backend dev server:**

```bash
npm run dev
```

The API will be available at **http://localhost:4000**

---

### 3. Frontend Setup

Open a **new terminal**, then:

```bash
cd frontend
npm install
```

**Create the environment file:**

```bash
# macOS / Linux
cp .env.local.example .env.local

# Windows (PowerShell)
Copy-Item .env.local.example .env.local
```

Open `frontend/.env.local` and confirm:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Start the frontend dev server:**

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 🧪 Testing the API

A smoke test script is included to verify the backend is working correctly:

```bash
cd backend
npm run smoke-test
```

You can also hit the health check endpoint directly:

```bash
curl http://localhost:4000/health
# → {"status":"ok"}
```

---

## 📋 API Reference

### `POST /api/import`

Accepts a multipart form upload and returns AI-extracted CRM records.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` — a `.csv` file (max **5 MB**)

**Response:**

```json
{
  "imported": [
    {
      "created_at": "2026-05-13 14:20:48",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": "GrowEasy",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "lead_owner": "test@gmail.com",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [],
  "totalImported": 1,
  "totalSkipped": 0
}
```

---

## 🤖 AI Field Mapping

The AI maps **any** CSV column headers to these GrowEasy CRM fields:

| CRM Field                         | Description                          |
|-----------------------------------|--------------------------------------|
| `created_at`                      | Lead creation date/time              |
| `name`                            | Full name of the lead                |
| `email`                           | Primary email address                |
| `country_code`                    | Phone country code (e.g., `+91`)     |
| `mobile_without_country_code`     | Mobile number (without country code) |
| `company`                         | Company or organization name         |
| `city`                            | City                                 |
| `state`                           | State or province                    |
| `country`                         | Country                              |
| `lead_owner`                      | Assigned lead owner (email)          |
| `crm_status`                      | One of the allowed status values     |
| `crm_note`                        | Notes, remarks, extra contact info   |
| `data_source`                     | One of the allowed source values     |
| `possession_time`                 | Property possession time             |
| `description`                     | Additional description               |

**Allowed `crm_status` values:**
- `GOOD_LEAD_FOLLOW_UP`
- `DID_NOT_CONNECT`
- `BAD_LEAD`
- `SALE_DONE`

**Allowed `data_source` values:**
- `leads_on_demand`
- `meridian_tower`
- `eden_park`
- `varah_swamy`
- `sarjapur_plots`

> Records missing **both** an email and a mobile number are automatically skipped.

---

## 🧩 How It Works

```
User uploads CSV
       ↓
Frontend parses & previews raw CSV (client-side, no AI)
       ↓
User clicks "Confirm Import"
       ↓
Frontend POSTs file to backend /api/import
       ↓
Backend parses CSV rows into records
       ↓
Records are split into batches (default: 15 rows/batch)
       ↓
Batches are sent to OpenAI in parallel
       ↓
AI maps columns → CRM fields, skips invalid rows
       ↓
Backend returns structured JSON
       ↓
Frontend displays imported + skipped records
```

---

## 📁 Sample CSV Files

Two sample CSVs are included at the project root for testing:

| File | Description |
|------|-------------|
| `groweasy-imported-leads.csv` | Standard CRM-format leads |
| `edge_case_test_leads.csv` | 50+ edge-case rows (messy headers, missing fields, duplicates, special characters, etc.) |

---

## 🌐 Environment Variables Reference

### Backend (`backend/.env`)

| Variable           | Required | Default                  | Description                                          |
|--------------------|----------|--------------------------|------------------------------------------------------|
| `PORT`             | No       | `4000`                   | Port for the Express server                          |
| `OPENAI_API_KEY`   | **Yes**  | —                        | Your OpenAI secret key                               |
| `OPENAI_MODEL`     | No       | `gpt-4o-mini`            | OpenAI model to use                                  |
| `OPENAI_BASE_URL`  | No       | OpenAI default           | Override base URL (e.g., for Groq or Azure OpenAI)   |
| `FRONTEND_URL`     | No       | `http://localhost:3000`  | Comma-separated CORS-allowed origins                 |
| `BATCH_SIZE`       | No       | `15`                     | Rows sent per AI batch                               |
| `PARALLEL_BATCHES` | No       | `3`                      | Number of concurrent AI requests                     |

### Frontend (`frontend/.env.local`)

| Variable               | Required | Default                  | Description              |
|------------------------|----------|--------------------------|--------------------------|
| `NEXT_PUBLIC_API_URL`  | No       | `http://localhost:4000`  | Backend API base URL     |

---

## 🏗️ Production Build

### Backend

```bash
cd backend
npm run build   # Compiles TypeScript → dist/
npm start       # Runs compiled output
```

### Frontend

```bash
cd frontend
npm run build   # Creates optimized Next.js build
npm start       # Serves the production build
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **CORS errors in browser** | Ensure `FRONTEND_URL` in `backend/.env` matches your frontend origin exactly (e.g., `http://localhost:3000`) |
| **OpenAI API errors** | Verify your `OPENAI_API_KEY` is valid and has quota. Try reducing `BATCH_SIZE` if you hit rate limits |
| **File upload fails** | Ensure the file is a valid `.csv` and under **5 MB**. Check the backend is running |
| **Port already in use** | Change `PORT` in `backend/.env` and update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` accordingly |
| **`tsx` not found`** | Run `npm install` inside the `backend/` directory |

---

## 📄 License

ISC
