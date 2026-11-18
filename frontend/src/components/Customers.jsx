import { useEffect, useState } from "react";
import { api } from "../api";

const empty = { name: "", phone: "", email: "", address: "", currentBalance: 0 };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setCustomers(await api("/api/customers"));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(empty); setEditingId(null); setShowForm(false); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api(`/api/customers/${editingId}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await api("/api/customers", { method: "POST", body: JSON.stringify(form) });
      }
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (c) => {
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, currentBalance: c.currentBalance });
    setEditingId(c._id);
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!confirm("Delete this customer?")) return;
    await api(`/api/customers/${id}`, { method: "DELETE" });
    load();
  };

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Customers</h2>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Add Customer
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="name" placeholder="Name *" value={form.name} onChange={set} required className="border rounded-lg px-3 py-2" />
          <input name="phone" placeholder="Phone *" value={form.phone} onChange={set} required className="border rounded-lg px-3 py-2" />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={set} className="border rounded-lg px-3 py-2" />
          <input name="address" placeholder="Address" value={form.address} onChange={set} className="border rounded-lg px-3 py-2" />
          <input name="currentBalance" type="number" placeholder="Current Balance" value={form.currentBalance} onChange={set} className="border rounded-lg px-3 py-2" />
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">{editingId ? "Update" : "Save"}</button>
            <button type="button" onClick={reset} className="bg-gray-200 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
          {error && <p className="text-red-600 text-sm md:col-span-3">{error}</p>}
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Email</th>
              <th className="p-3">Address</th><th className="p-3">Balance</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.address}</td>
                <td className="p-3">₹{c.currentBalance}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => edit(c)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(c._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
