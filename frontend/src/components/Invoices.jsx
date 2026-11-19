import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const [customerId, setCustomerId] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [status, setStatus] = useState("Pending");
  const [items, setItems] = useState([{ productId: "", quantity: 1 }]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", phone: "", email: "", address: "" });

  const load = async () => {
    try {
      const [inv, cust, prod] = await Promise.all([
        api("/api/invoices"),
        api("/api/customers"),
        api("/api/products"),
      ]);
      setInvoices(inv);
      setCustomers(cust);
      setProducts(prod);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setCustomerId(""); setTaxRate(0); setStatus("Pending");
    setItems([{ productId: "", quantity: 1 }]);
    setShowForm(false); setError("");
  };

  const setItem = (i, field, value) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };

  const lineTotal = (item) => {
    const p = products.find((p) => p._id === item.productId);
    return p ? p.price * Number(item.quantity) : 0;
  };

  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const taxAmount = (subtotal * Number(taxRate)) / 100;
  const grandTotal = subtotal + taxAmount;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/api/invoices", {
        method: "POST",
        body: JSON.stringify({ customerId, taxRate: Number(taxRate), status, items }),
      });
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const quickAddCustomer = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const c = await api("/api/customers", { method: "POST", body: JSON.stringify(quickForm) });
      setCustomers([...customers, c]);
      setCustomerId(c._id);
      setShowQuickAdd(false);
      setQuickForm({ name: "", phone: "", email: "", address: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleStatus = async (inv) => {
    await api(`/api/invoices/${inv._id}`, {
      method: "PUT",
      body: JSON.stringify({ status: inv.status === "Paid" ? "Pending" : "Paid" }),
    });
    load();
  };

  const customer = customers.find((c) => c._id === selected?.customerId);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Create Invoice
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} autoComplete="off" className="bg-white rounded-xl shadow p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer *</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tax Rate % (GST/tax, 0 = no tax)</label>
              <input type="number" min="0" value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2">
                <option value="Pending">Pending (udhaar)</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Product *</label>
                <select value={item.productId} onChange={(e) => setItem(i, "productId", e.target.value)} required
                  className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName} — ₹{p.price} (stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                <input type="number" min="1" value={item.quantity}
                  onChange={(e) => setItem(i, "quantity", e.target.value)} required
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">₹{lineTotal(item)}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="text-red-600 text-sm">Remove</button>
                )}
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setItems([...items, { productId: "", quantity: 1 }])}
            className="text-blue-600 text-sm">+ Add Item</button>

          <div className="border-t pt-3 text-sm space-y-1">
            <p>Subtotal: ₹{subtotal}</p>
            <p>Tax ({taxRate}%): ₹{taxAmount.toFixed(2)}</p>
            <p className="font-bold text-base">Grand Total: ₹{grandTotal.toFixed(2)}</p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Save Invoice</button>
            <button type="button" onClick={reset} className="bg-gray-200 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Customer</th><th className="p-3">Items</th>
              <th className="p-3">Total</th><th className="p-3">Status</th>
              <th className="p-3">Date</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-t">
                <td className="p-3 font-medium">{inv.customerName}</td>
                <td className="p-3">{inv.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}</td>
                <td className="p-3 font-medium">₹{inv.grandTotal}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${inv.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="p-3 space-x-3">
                  <button onClick={() => setSelected(inv)} className="text-blue-600 hover:underline text-sm">View</button>
                  <button onClick={() => toggleStatus(inv)} className="text-blue-600 hover:underline text-sm">
                    {inv.status === "Paid" ? "Pending" : "Paid"}
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">No invoices yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div id="invoice-print" className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{user?.businessName || "Mini CRM"}</h3>
                {user?.address && <p className="text-xs text-gray-600">{user.address}</p>}
                <p className="text-xs text-gray-500">{user?.name} • {user?.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="flex justify-between text-sm border-b pb-2 mb-3">
              <div>
                <p className="font-semibold">Bill To: {selected.customerName}</p>
                {customer && <p className="text-gray-500">{customer.phone} {customer.address && `• ${customer.address}`}</p>}
              </div>
              <div className="text-right">
                <p>Invoice: #{selected._id.slice(-6).toUpperCase()}</p>
                <p className="text-gray-500">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Item</th><th className="py-2">Qty</th>
                  <th className="py-2">Price</th><th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((i, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{i.productName}</td>
                    <td className="py-2">{i.quantity}</td>
                    <td className="py-2">₹{i.unitPrice}</td>
                    <td className="py-2 text-right">₹{i.quantity * i.unitPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-sm space-y-1 mb-4">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{selected.subtotal}</span></div>
              <div className="flex justify-between"><span>Tax ({selected.taxRate}%)</span><span>₹{selected.taxAmount}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Grand Total</span><span>₹{selected.grandTotal}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded text-sm font-medium ${selected.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {selected.status}
              </span>
              <button onClick={() => window.print()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
