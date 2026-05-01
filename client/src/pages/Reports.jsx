// client/src/pages/Reports.jsx
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import socket from "../socket";

function formatDateInput(d) {
  if (!d) return "";
  try {
    return dayjs(d).format("YYYY-MM-DD");
  } catch (e) {
    return new Date(d).toISOString().slice(0, 10);
  }
}

function formatCurrency(n) {
  return (
    "₹ " +
    (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          if (
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
          ) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalOrders: 0,
    series: [],
    topProducts: [],
  });
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      params.groupBy = groupBy;
      const res = await axios.get("/api/reports/sales", { params });
      setData(res.data);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onInvoice = () => load();
    socket.on("invoice:created", onInvoice);
    socket.on("inventory:update", onInvoice);
    return () => {
      socket.off("invoice:created", onInvoice);
      socket.off("inventory:update", onInvoice);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, groupBy]);

  const exportReport = () => {
    // CSV with series then top products
    const rows = [];
    rows.push(["Sales Report"]);
    rows.push(["Generated at", new Date().toISOString()]);
    rows.push([]);
    rows.push(["Totals", "Value"]);
    rows.push(["Total Sales", data.totalSales]);
    rows.push(["Total Profit", data.totalProfit]);
    rows.push(["Total Orders", data.totalOrders]);
    rows.push([]);
    rows.push([groupBy === "month" ? "Month" : "Day", "Orders", "Sales"]);
    data.series.forEach((s) => rows.push([s.period, s.orders, s.total]));
    rows.push([]);
    rows.push(["Top Products"]);
    rows.push(["Product", "Qty Sold", "Revenue"]);
    data.topProducts.forEach((p) => rows.push([p.name, p.qtySold, p.revenue]));
    downloadCsv(`sales-report-${Date.now()}.csv`, rows);
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-0 fw-bold text-primary">Sales Reports</h2>
          <div className="text-muted small">Overview & analytics</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="text-end me-2">
            <div className="small text-muted">Last refreshed</div>
            <div className="fw-semibold small">
              {lastUpdatedAt
                ? dayjs(lastUpdatedAt).format("YYYY-MM-DD HH:mm:ss")
                : "—"}
            </div>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={load}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : null}
            Refresh
          </button>
          <button
            className="btn btn-outline-success"
            onClick={exportReport}
            disabled={
              loading || (!data.series.length && !data.topProducts.length)
            }
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="card p-3 mb-3 shadow-sm">
        <div className="row gy-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small">From</label>
            <input
              type="date"
              className="form-control"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small">To</label>
            <input
              type="date"
              className="form-control"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small">Group by</label>
            <select
              className="form-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div className="col-md-4 text-end">
            <div className="small text-muted mb-1">Quick ranges</div>
            <div className="btn-group" role="group">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setFrom(formatDateInput(dayjs().startOf("month")));
                  setTo(formatDateInput(dayjs().endOf("month")));
                }}
              >
                This month
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setFrom(formatDateInput(dayjs().subtract(7, "day")));
                  setTo(formatDateInput(dayjs()));
                }}
              >
                Last 7 days
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <small className="text-muted">Total Sales</small>
              <div className="d-flex align-items-baseline justify-content-between">
                <h4 className="fw-bold mb-0">
                  {formatCurrency(data.totalSales)}
                </h4>
                <span className="badge bg-light text-dark">
                  {data.totalOrders} orders
                </span>
              </div>
              <div className="text-muted small">
              
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <small className="text-muted">Total Profit</small>
              <h4 className="fw-bold mb-0">
                {formatCurrency(data.totalProfit)}
              </h4>
              <div className="text-muted small"></div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <small className="text-muted">Top Product (by revenue)</small>
              {data.topProducts.length ? (
                <>
                  <div className="fw-semibold">{data.topProducts[0].name}</div>
                  <div className="text-muted small">
                    ₹ {Number(data.topProducts[0].revenue).toFixed(2)} •{" "}
                    {data.topProducts[0].qtySold} sold
                  </div>
                </>
              ) : (
                <div className="text-muted small">No product data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row gy-3">
        <div className="col-lg-8">
          <div className="card shadow-sm p-3 mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="mb-0">Sales Series ({groupBy})</h5>
              <div className="small text-muted">
                {data.series.length} points
              </div>
            </div>

            <div style={{ maxHeight: 360, overflow: "auto" }}>
              <table className="table table-sm mb-0">
                <thead className="table-light sticky-top" style={{ top: 0 }}>
                  <tr>
                    <th style={{ width: 160 }}>
                      {groupBy === "month" ? "Month" : "Date"}
                    </th>
                    <th style={{ width: 120 }}>Orders</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4">
                        <div className="spinner-border text-primary"></div>
                      </td>
                    </tr>
                  ) : data.series.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        No data
                      </td>
                    </tr>
                  ) : (
                    data.series.map((s) => (
                      <tr key={s.period}>
                        <td className="fw-medium">{s.period}</td>
                        <td>{s.orders}</td>
                        <td>{formatCurrency(s.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm p-3 mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="mb-0">Top Products</h5>
              <div className="small text-muted">by revenue</div>
            </div>

            <div style={{ maxHeight: 360, overflow: "auto" }}>
              <table className="table table-sm mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4">
                        <div className="spinner-border text-primary"></div>
                      </td>
                    </tr>
                  ) : data.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        No data
                      </td>
                    </tr>
                  ) : (
                    data.topProducts.map((p) => (
                      <tr key={p.productId}>
                        <td
                          style={{ maxWidth: 160 }}
                          className="text-truncate"
                          title={p.name}
                        >
                          {p.name}
                        </td>
                        <td>{p.qtySold}</td>
                        <td>{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 d-flex justify-content-between">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  // export top products csv
                  const rows = [
                    ["Product", "Qty Sold", "Revenue"],
                    ...data.topProducts.map((p) => [
                      p.name,
                      p.qtySold,
                      p.revenue,
                    ]),
                  ];
                  downloadCsv(`top-products-${Date.now()}.csv`, rows);
                }}
              >
                Export top products
              </button>
              <div className="text-muted small align-self-center">Top 10</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fw-medium { font-weight: 600; }
        .card { border-radius: 12px; }
        .sticky-top { position: sticky; z-index: 1; }
        .table-light th { background: #fafafa; }
      `}</style>
    </div>
  );
}
