import axios from "axios";
import { useEffect, useState } from "react";
import socket from "../socket";

// ---------- Product Form ----------
function ProductForm({ onSaved, edit }) {
  const [form, setForm] = useState(
    edit || {
      name: "",
      sku: "",
      category: "",
      price: 0,
      cost: 0,
      qty: 0,
      reorderLevel: 5,
    }
  );

  useEffect(
    () =>
      setForm(
        edit || {
          name: "",
          sku: "",
          category: "",
          price: 0,
          cost: 0,
          qty: 0,
          reorderLevel: 5,
        }
      ),
    [edit]
  );

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (edit && edit._id) await axios.put(`/api/products/${edit._id}`, form);
      else await axios.post("/api/products", form);
      onSaved();
      setForm({
        name: "",
        sku: "",
        category: "",
        price: 0,
        cost: 0,
        qty: 0,
        reorderLevel: 5,
      });
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <form onSubmit={submit} className="row g-3 align-items-end">
      <h5 className="fw-bold text-primary mb-0">
        {edit ? "✏️ Edit Product" : "➕ Add New Product"}
      </h5>
      <div className="col-md-3">
        <label className="form-label">Name</label>
        <input
          className="form-control"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="col-md-2">
        <label className="form-label">SKU</label>
        <input
          className="form-control"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
      </div>
      <div className="col-md-2">
        <label className="form-label">Category</label>
        <input
          className="form-control"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </div>
      <div className="col-md-1">
        <label className="form-label">Qty</label>
        <input
          type="number"
          className="form-control"
          value={form.qty}
          onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
        />
      </div>
      <div className="col-md-1">
        <label className="form-label">Price</label>
        <input
          type="number"
          step="0.01"
          className="form-control"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
      </div>
      <div className="col-md-1">
        <label className="form-label">Cost</label>
        <input
          type="number"
          step="0.01"
          className="form-control"
          value={form.cost}
          onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
        />
      </div>
      <div className="col-md-1">
        <label className="form-label">Reorder</label>
        <input
          type="number"
          className="form-control"
          value={form.reorderLevel}
          onChange={(e) =>
            setForm({ ...form, reorderLevel: Number(e.target.value) })
          }
        />
      </div>
      <div className="col-md-12 text-end">
        <button className="btn btn-success px-4 shadow-sm" type="submit">
          {edit ? "Update Product" : "Add Product"}
        </button>
      </div>
    </form>
  );
}

// ---------- Main Component ----------
export default function Products() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const { data } = await axios.get("/api/products");
    setProducts(data);
  };

  useEffect(() => {
    load();
    socket.on("product:created", load);
    socket.on("product:updated", load);
    socket.on("product:deleted", load);
    socket.on("inventory:update", ({ productId, qty }) =>
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, qty } : p))
      )
    );
    return () => {
      socket.off("product:created", load);
      socket.off("product:updated", load);
      socket.off("product:deleted", load);
      socket.off("inventory:update");
    };
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete product?")) return;
    await axios.delete(`/api/products/${id}`);
    load();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold text-primary mb-0">📦 Products</h2>
        <small className="text-muted"></small>
      </div>

      <div className="card mb-4 p-3 shadow-sm border-0 rounded-4 bg-light-subtle">
        <ProductForm
          onSaved={() => {
            setEditing(null);
            load();
          }}
          edit={editing}
        />
      </div>

      <div className="table-responsive shadow-sm rounded-4">
        <table className="table align-middle table-hover mb-0">
          <thead className="table-primary">
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th className="text-center">Qty</th>
              <th>Price</th>
              <th>Cost</th>
              <th>Reorder</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-3 text-muted">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLow = p.qty <= p.reorderLevel;
                return (
                  <tr
                    key={p._id}
                    className={isLow ? "table-warning" : ""}
                    style={{ verticalAlign: "middle" }}
                  >
                    <td className="fw-semibold">{p.name}</td>
                    <td>{p.sku}</td>
                    <td>{p.category}</td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          isLow ? "bg-danger" : "bg-success"
                        }`}
                      >
                        {p.qty}
                      </span>
                    </td>
                    <td>₹ {p.price.toFixed(2)}</td>
                    <td>₹ {p.cost.toFixed(2)}</td>
                    <td>{p.reorderLevel}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => setEditing(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(p._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>
        {`
          .bg-light-subtle {
            background-color: #f8f9fa;
          }
          .table-hover tbody tr:hover {
            background-color: #f5f8ff;
            transition: 0.2s ease-in-out;
          }
          .table-warning {
            background-color: #fff8e1 !important;
          }
          .btn {
            transition: all 0.15s ease;
          }
          .btn:hover {
            transform: scale(1.05);
          }
        `}
      </style>
    </div>
  );
}
