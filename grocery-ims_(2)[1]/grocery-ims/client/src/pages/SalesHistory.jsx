import dayjs from "dayjs";
import { useEffect, useState } from "react";
import socket from "../socket";
import api from "../api";

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/sales/history", {
        params: { q: query, from, to },
      });
      setSales(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    const onInvoice = () => loadSales(); // realtime update on new sale
    socket.on("invoice:created", onInvoice);
    return () => socket.off("invoice:created", onInvoice);
  }, []);

  return (
    <div>
      
      <h2 className="mb-4">📊Sales History</h2>

      <div className="card p-3 mb-3 shadow-sm">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Invoice / Customer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">From</label>
            <input
              type="date"
              className="form-control"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-control"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              onClick={loadSales}
              disabled={loading}
            >
              {loading ? "Loading..." : "Filter"}
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive card shadow-sm">
        <table className="table table-striped table-hover mb-0">
          <thead className="table-primary">
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-3">
                  No sales found
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s._id}>
                  <td>{s.invoiceNo}</td>
                  <td>{dayjs(s.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                  <td>{s.customer?.name || "-"}</td>
                  <td>{s.itemCount}</td>
                  <td>₹ {s.total?.toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setSelected(s)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="modal show fade"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Invoice {selected.invoiceNo}</h5>
                <button
                  className="btn-close"
                  onClick={() => setSelected(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Date:</strong>{" "}
                  {dayjs(selected.createdAt).format("YYYY-MM-DD HH:mm")}
                </p>
                <p>
                  <strong>Customer:</strong> {selected.customer?.name || "-"}
                </p>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((it, i) => (
                      <tr key={i}>
                        <td>{it.name}</td>
                        <td>{it.qty}</td>
                        <td>₹ {it.unitPrice}</td>
                        <td>₹ {it.lineTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-end">
                  <h5>Subtotal: ₹ {selected.subtotal}</h5>
                  <h6>Tax: ₹ {selected.tax}</h6>
                  <h5>Total: ₹ {selected.total}</h5>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
