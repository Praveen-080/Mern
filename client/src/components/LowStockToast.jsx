// client/src/components/LowStockToast.jsx
import { useEffect, useState } from "react";
import socket from "../socket";

export default function LowStockToast() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const onLow = (payload) => {
      setAlerts((prev) => {
        const others = prev.filter(
          (a) => String(a.productId) !== String(payload.productId)
        );
        const newAlert = { ...payload, id: Date.now() };
        // optional: play sound
        // const audio = new Audio('/ding.mp3'); audio.play().catch(()=>{});
        // desktop notification
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("Low stock", {
              body: `${payload.name}: ${payload.qty} left`,
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((p) => {
              if (p === "granted")
                new Notification("Low stock", {
                  body: `${payload.name}: ${payload.qty} left`,
                });
            });
          }
        }
        return [newAlert, ...others].slice(0, 6);
      });
    };

    socket.on("low-stock", onLow);
    return () => socket.off("low-stock", onLow);
  }, []);

  const dismiss = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));
  if (!alerts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        top: 80,
        zIndex: 1200,
        width: 340,
      }}
    >
      {alerts.map((a) => (
        <div
          key={a.id}
          className="toast show mb-2 shadow"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto text-danger">Low Stock</strong>
            <small className="text-muted">now</small>
            <button
              type="button"
              className="btn-close ms-2 mb-1"
              aria-label="Close"
              onClick={() => dismiss(a.id)}
            ></button>
          </div>
          <div className="toast-body">
            <div className="fw-bold">
              {a.name} {a.sku ? `(${a.sku})` : ""}
            </div>
            <div className="small text-muted">
              Qty: {a.qty} — Reorder: {a.reorderLevel}
            </div>
            <div className="mt-2">
              <a
                className="btn btn-sm btn-outline-primary"
                href="/products"
                onClick={() => dismiss(a.id)}
              >
                View
              </a>
              <button
                className="btn btn-sm btn-danger ms-2"
                onClick={() => dismiss(a.id)}
              >
                Reorder
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
