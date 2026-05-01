import axios from "axios";
import { useEffect, useState } from "react";
import socket from "../socket";

// -------- Cart Row Component --------
function CartRow({ item, onChange, onRemove }) {
  return (
    <tr>
      <td className="fw-semibold">{item.name}</td>
      <td style={{ width: "80px" }}>
        <input
          type="number"
          className="form-control form-control-sm text-center"
          value={item.qty}
          min="1"
          onChange={(e) => onChange(item.productId, Number(e.target.value))}
        />
      </td>
      <td>₹ {item.unitPrice.toFixed(2)}</td>
      <td className="fw-semibold">
        ₹ {(item.unitPrice * item.qty).toFixed(2)}
      </td>
      <td>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => onRemove(item.productId)}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// -------- Main Billing Component --------
export default function Billing() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const loadProducts = async () => {
    const { data } = await axios.get("/api/products");
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
    socket.on("inventory:update", ({ productId, qty }) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, qty } : p))
      );
      setCart((prev) =>
        prev.map((it) =>
          it.productId === productId
            ? { ...it, qty: Math.min(it.qty, qty) }
            : it
        )
      );
    });
    socket.on("product:updated", loadProducts);
    socket.on("product:created", loadProducts);
    return () => {
      socket.off("inventory:update");
      socket.off("product:updated", loadProducts);
      socket.off("product:created", loadProducts);
    };
  }, []);

  // -------- Cart Logic --------
  const addToCart = (prod) => {
    const exists = cart.find((c) => c.productId === prod._id);
    if (exists)
      setCart(
        cart.map((c) =>
          c.productId === prod._id
            ? { ...c, qty: Math.min(c.qty + 1, prod.qty) }
            : c
        )
      );
    else
      setCart([
        ...cart,
        { productId: prod._id, name: prod.name, qty: 1, unitPrice: prod.price },
      ]);
  };
  const onQtyChange = (productId, qty) =>
    setCart(cart.map((c) => (c.productId === productId ? { ...c, qty } : c)));
  const removeItem = (productId) =>
    setCart(cart.filter((c) => c.productId !== productId));

  const subtotal = cart.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  // -------- Checkout --------
  const checkout = async () => {
    if (!cart.length) return alert("Cart is empty!");
    try {
      const items = cart.map((c) => ({ productId: c.productId, qty: c.qty }));
      const res = await axios.post("/api/cart/checkout", { items, customer });
      const { invoiceId, invoiceNo } = res.data;

      // Download invoice PDF
      const pdfResp = await axios.get(`/api/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([pdfResp.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setCart([]);
      setCustomer({ name: "", phone: "", address: "" });
      alert("✅ Checkout successful! Invoice downloaded.");
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Checkout failed");
    }
  };

  // -------- Filter Products --------
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(query.toLowerCase())
  );

  // -------- UI --------
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">🧾 Billing & POS</h2>
        <small className="text-muted"></small>
      </div>

      <div className="row g-4">
        {/* Product Search & List */}
        <div className="col-md-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-primary text-white fw-semibold">
              Product Catalog
            </div>
            <div className="card-body">
              <input
                className="form-control mb-3"
                placeholder="🔍 Search product name or SKU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {filtered.map((p) => (
                  <div
                    key={p._id}
                    className="d-flex justify-content-between align-items-center border-bottom py-2 px-1 hover-row"
                  >
                    <div>
                      <div className="fw-semibold">{p.name}</div>
                      <div className="small text-muted">
                        ₹ {p.price.toFixed(2)} • {p.qty} in stock
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={p.qty <= 0}
                      onClick={() => addToCart(p)}
                    >
                      Add
                    </button>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center text-muted py-3">
                    No matching products
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="col-md-5">
          <div className="card shadow-sm border-0 rounded-4 mb-3">
            <div className="card-header bg-secondary text-white fw-semibold">
              Customer Details
            </div>
            <div className="card-body">
              <input
                className="form-control mb-2"
                placeholder="Name"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Address"
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
              />
            </div>
          </div>

          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-success text-white fw-semibold">
              Shopping Cart
            </div>
            <div className="card-body">
              <div style={{ maxHeight: "35vh", overflowY: "auto" }}>
                <table className="table table-sm align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((it) => (
                      <CartRow
                        key={it.productId}
                        item={it}
                        onChange={onQtyChange}
                        onRemove={removeItem}
                      />
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">
                          Cart is empty
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 border-top pt-2">
                <div className="d-flex justify-content-between">
                  <div>Subtotal</div>
                  <div>₹ {subtotal.toFixed(2)}</div>
                </div>
                <div className="d-flex justify-content-between">
                  <div>Tax (5%)</div>
                  <div>₹ {tax.toFixed(2)}</div>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5">
                  <div>Total</div>
                  <div>₹ {total.toFixed(2)}</div>
                </div>
                <button
                  className="btn btn-success w-100 mt-3 py-2 shadow-sm"
                  onClick={checkout}
                >
                  💰 Checkout & Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Page Style Overrides --- */}
      <style>
        {`
          .hover-row:hover {
            background-color: #f5f1ffff;
            transition: 0.2s ease-in-out;
          }
          .table-sm th, .table-sm td {
            padding: 0.5rem 0.6rem;
          }
          .card-header {
            border-bottom: none;
          }
        `}
      </style>
    </div>
  );
}
