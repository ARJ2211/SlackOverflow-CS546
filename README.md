# SlackOverflow - Course Q&A Board

A centralized AI assisted Q&A board for university courses.  
Professors, TAs and students share one clean space for all course questions with labels, search and vector based duplicate detection.

## Team

Aayush Rajesh Jadhav : ARJ2211  
Swapnil Jadhav : Tolaj
Vinci Li : Vicniz  
Lijing Li : Slowdiiive

## Tech Stack

Node.js and Express  
MongoDB Atlas for data and vector search  
Handlebars templates with Tailwind styled UI  
Vector embeddings model for semantic duplicate detection

## Getting Started

### Prerequisites

Node.js version 18 or newer  
npm  
MongoDB Atlas access  
Hugging Face CLI only needed if the model directory is missing

If environment variables are needed, copy `.env.example` to `.env` and set the MongoDB URI and the HF token if required.
The hugging face token will need to be exported as `export HF_TOKEN=hf_asdasd....`

## Installation and Setup

From the project root run:

```
npm install
```

After installation choose one of the paths below based on the files included in the submitted zip.

### If the `models` directory is already present (you need not worry about the hugging face token and all)

```
npm run seed
```

The seed script asks for a few inputs so follow the prompts.

### If the `models` directory is not present (you will have to export your HF_TOKEN and download the model into the project)

You need to download the model and set up the vector index.

```
npm run tasks
```

This installs Hugging Face CLI if needed downloads the model and creates the vector index before running the seed script.

### Start the server

```
npm start
```

## Important Information About Data Consistency

SlackOverflow uses MongoDB Atlas.  
Everyone using the same connection string will see the same data even when running the app on localhost.  
All courses professors questions answers and analytics are shared unless the connection string is changed.
