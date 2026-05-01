Grocery IMS - MERN scaffold (minimal)
Files created at: /mnt/data/grocery-ims

Backend (server):
  - server/index.js
  - server/models/*.js
  - server/routes/*.js
  - server/package.json
  - server/.env.example

Frontend (client):
  - client/package.json (Vite + React)
  - client/src/*
  - client/public/index.html

How to run (locally):
  1. Start MongoDB (recommended as a replica set for transactions; standalone works but transactions may fail).
  2. Backend:
     cd server
     npm install
     copy .env.example to .env and set MONGO_URI
     npm run start
  3. Frontend:
     cd client
     npm install
     npm run dev
  API proxy from Vite is configured to http://localhost:4000

-----------------------------
Local dev (recommended)
-----------------------------
From the project root (this folder):

  npm run install:all
  npm run dev

This starts:
  - Express API on http://localhost:4000
  - Vite client on http://localhost:3000

Env:
  - server/.env must contain MONGO_URI
  - client can optionally set VITE_API_URL=http://localhost:4000
    (not required for REST calls because Vite proxies /api; useful for production parity)

-----------------------------
Netlify deployment (frontend)
-----------------------------
Netlify hosts ONLY the Vite frontend. Deploy the Express server separately.

Netlify settings:
  - Base directory: client
  - Build command: npm run build
  - Publish directory: dist

Netlify environment variables:
  - VITE_API_URL = https://<your-backend-domain>

Notes:
  - SPA routing is handled via netlify.toml and client/public/_redirects.
  - Socket.io also uses VITE_API_URL in production.

Note: This is a scaffold with essential features: product CRUD, checkout (transactional), invoice PDF generation, dashboard stats, realtime via Socket.io.
Customize, secure, and harden before production.

