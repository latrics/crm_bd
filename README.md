# LATRICS CRM

A comprehensive MERN stack CRM application for managing leads, deals, tenders, and documents.

## Tech Stack
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

## Prerequisites
- Node.js 18+
- MongoDB

## Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Environment Setup
Copy `.env.example` to `.env` in the server directory and fill in your `MONGO_URI` and `JWT_SECRET`.

## Running the Application
Run both the client and server concurrently during development:

```bash
# In the server directory
npm run dev

# In the client directory
npm run dev
```

## Features
- **Leads Management**: BANT scoring, pipeline tracking.
- **Deals Kanban**: Drag and drop (or visual) pipeline for deals.
- **Tenders Table**: Management of tenders with specific business logic.
- **Dashboard**: Live analytics using Chart.js.
- **Document Management**: Upload and attach documents to leads and deals.
- **Data Export**: Export records to CSV/JSON.
