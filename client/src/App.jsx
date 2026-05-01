import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import LowStockToast from "./components/LowStockToast";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import SalesHistory from "./pages/SalesHistory"; // ✅ new import

export default function App() {
  return (
    <BrowserRouter>
      {/* ✅ Global realtime low-stock toast */}
      <LowStockToast />

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            RAVI MALIGAI
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/products">
                  Products
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/billing">
                  Billing
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/reports">
                  Reports
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/sales-history">
                  Sales History
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container my-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/sales-history" element={<SalesHistory />} />{" "}
          {/* ✅ added */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}
