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

Note: This is a scaffold with essential features: product CRUD, checkout (transactional), invoice PDF generation, dashboard stats, realtime via Socket.io.
Customize, secure, and harden before production.

