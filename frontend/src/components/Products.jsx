import { useEffect, useState } from "react";
import { api, imageUrl } from "../api";

const empty = { productName: "", sku: "", price: "", stockQuantity: "", image: null };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  const load = async () => {
    try {
      setProducts(await api("/api/products"));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setForm(empty); setEditingId(null); setShowForm(false); setError(""); setPreview("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const fd = new FormData();
      fd.append("productName", form.productName);
      fd.append("sku", form.sku);
      fd.append("price", form.price);
      fd.append("stockQuantity", form.stockQuantity);
      if (form.image) fd.append("image", form.image);

      if (editingId) {
        await api(`/api/products/${editingId}`, { method: "PUT", body: fd });
      } else {
        await api("/api/products", { method: "POST", body: fd });
      }
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (p) => {
    setForm({ productName: p.productName, sku: p.sku, price: p.price, stockQuantity: p.stockQuantity, image: null });
    setPreview(imageUrl(p.imageUrl));
    setEditingId(p._id);
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api(`/api/products/${id}`, { method: "DELETE" });
    load();
  };

  const pickImage = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file || null });
    setPreview(file ? URL.createObjectURL(file) : preview);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Products</h2>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Add Product
        </button>
      </div>

      {showForm && (
        <form autoComplete="off" onSubmit={submit} className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input autoComplete="off" name="productName" placeholder="Product Name *" value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })} required className="border rounded-lg px-3 py-2" />
          <input autoComplete="off" name="sku" placeholder="SKU" value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border rounded-lg px-3 py-2" />
          <input autoComplete="off" name="price" type="number" min="0" placeholder="Price (₹) *" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} required className="border rounded-lg px-3 py-2" />
          <input autoComplete="off" name="stockQuantity" type="number" min="0" placeholder="Stock Quantity *" value={form.stockQuantity}
            onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required className="border rounded-lg px-3 py-2" />
          <div>
            <input autoComplete="off" type="file" accept="image/*" onChange={pickImage} className="text-sm w-full" />
            {preview && <img src={preview} alt="preview" className="mt-2 h-16 w-16 object-cover rounded border" />}
          </div>
          <div className="flex gap-2 items-start">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">{editingId ? "Update" : "Save"}</button>
            <button type="button" onClick={reset} className="bg-gray-200 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
          {error && <p className="text-red-600 text-sm md:col-span-3">{error}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p._id} className="bg-white rounded-xl shadow p-4">
            {p.imageUrl ? (
              <img src={imageUrl(p.imageUrl)} alt={p.productName} className="h-40 w-full object-cover rounded-lg mb-3" />
            ) : (
              <div className="h-40 w-full bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 text-sm">No image</div>
            )}
            <h3 className="font-semibold">{p.productName}</h3>
            <p className="text-sm text-gray-500">SKU: {p.sku || "-"}</p>
            <p className="text-sm">₹{p.price} &nbsp;|&nbsp; Stock: {p.stockQuantity}</p>
            <div className="mt-3 space-x-3">
              <button onClick={() => edit(p)} className="text-blue-600 text-sm hover:underline">Edit</button>
              <button onClick={() => remove(p._id)} className="text-red-600 text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-gray-400 col-span-full text-center py-8">No products yet</p>
        )}
      </div>
    </div>
  );
}
