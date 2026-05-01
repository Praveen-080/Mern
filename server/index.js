require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");

// Import routes
const productRoutes = require("./routes/products");
const checkoutRoutes = require("./routes/checkout");
const invoicesRoutes = require("./routes/invoices");
const dashboardRoutes = require("./routes/dashboard");
const reportsRoutes = require("./routes/reports");
const salesRoutes = require("./routes/sales"); // ✅ NEW: Sales history route

// App setup
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/products", productRoutes);
app.use("/api/cart", checkoutRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/sales", salesRoutes); // ✅ NEW

// Serve frontend (production)
app.use(express.static(path.join(__dirname, "../client/dist")));

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

// MongoDB connection
const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/grocery-ims";
mongoose
  .connect(MONGO)
  .then(() => console.log("✅ Mongo connected"))
  .catch((err) => console.error("❌ Mongo connection error:", err));

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
