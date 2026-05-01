import axios from "axios";
import { useEffect, useState } from "react";
import socket from "../socket";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStock: 0,
    totalSales: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await axios.get("/api/dashboard/stats");
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refresh = () => load();

    socket.on("inventory:update", refresh);
    socket.on("invoice:created", refresh);
    socket.on("product:created", refresh);
    socket.on("product:updated", refresh);
    socket.on("product:deleted", refresh);

    return () => {
      socket.off("inventory:update", refresh);
      socket.off("invoice:created", refresh);
      socket.off("product:created", refresh);
      socket.off("product:updated", refresh);
      socket.off("product:deleted", refresh);
    };
  }, []);

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="fw-bold mb-0 text-primary">📊 RAVI STORES</h2>
        <span className="text-muted small"></span>
      </div>

      <div className="row g-4">
        <div className="col-md-4 col-sm-6">
          <div className="card border-0 shadow-lg rounded-4 text-center p-3 bg-light-subtle hover-card">
            <div className="card-body">
              <h6 className="text-secondary fw-semibold mb-2">Total Stock</h6>
              <h2 className="fw-bold text-dark">{stats.totalStock}</h2>
              <p className="text-muted small mb-0">Available inventory units</p>
            </div>
          </div>
        </div>

        <div className="col-md-4 col-sm-6">
          <div className="card border-0 shadow-lg rounded-4 text-center p-3 bg-success-subtle hover-card">
            <div className="card-body">
              <h6 className="text-success fw-semibold mb-2">Total Sales</h6>
              <h2 className="fw-bold text-success">
                ₹ {stats.totalSales.toLocaleString()}
              </h2>
              <p className="text-muted small mb-0">Revenue generated so far</p>
            </div>
          </div>
        </div>

        <div className="col-md-4 col-sm-6">
          <div className="card border-0 shadow-lg rounded-4 text-center p-3 bg-info-subtle hover-card">
            <div className="card-body">
              <h6 className="text-info fw-semibold mb-2">Total Profit</h6>
              <h2 className="fw-bold text-info">
                ₹ {stats.totalProfit.toLocaleString()}
              </h2>
              <p className="text-muted small mb-0">Net profit from sales</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-semibold text-primary mb-3">
              🔔 Inventory Alerts
            </h5>
            <p className="text-muted mb-0">
              Low stock notifications
            </p>
          </div>
        </div>
      </div>

      <style>
        {`
          .hover-card {
            transition: all 0.25s ease-in-out;
          }
          .hover-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          }
          .bg-light-subtle {
            background-color: #f8f9fa;
          }
          .bg-success-subtle {
            background-color: #e8f9ee;
          }
          .bg-info-subtle {
            background-color: #e7f3ff;
          }
        `}
      </style>
    </div>
  );
}
