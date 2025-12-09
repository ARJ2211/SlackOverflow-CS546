# SlackOverflow – Course Q&A Board

A centralized, AI-assisted Q&A board for university courses.  
Professors, TAs, and students share one clean space for all course questions, with labels, search, and vector-based duplicate detection.

---

## Team

-   Aayush Rajesh Jadhav : ARJ2211
-   Vinci Li : Vicniz
-   Lijing Li : Slowdiiive
-   Swapnil Jadhav : Tolaj

---

## Tech Stack

-   Node.js + Express
-   MongoDB (Atlas for vector store)
-   Handlebars templates + Tailwind-styled UI
-   Vector embeddings model for semantic duplicate detection

---

## Getting Started

### 1. Prerequisites

-   Node.js (v18+ recommended)
-   npm
-   Hugging face CLI (Although a script will help you install it, but its best to have it pre-installed)
-   MongoDB instance reachable from your machine  
    (connection string is configured in the project’s Mongo config or via environment variables)

If you need a `.env`, create it based on `.env.example` and set your MongoDB URI and any Hugging Face / embedding model keys (export token to HF_TOKEN) as required by the codebase.

---

## Installation and Run Commands

From the project root:

```bash
# 1. Install node dependencies
npm install

# 2. Install huggingface-cli, set up vector index for vector store, seed database with professors list for SIT
npm run tasks

# 3. Start the server
npm start
```
