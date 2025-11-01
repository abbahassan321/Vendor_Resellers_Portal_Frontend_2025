'use client';
import { useState } from 'react';

export default function BulkRecharge() {
  const [form, setForm] = useState({
    aggregatorId: '',
    fileName: '',
    totalAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // ✅ Build the same structure expected by your controller
    const payload = {
      aggregator: { id: Number(form.aggregatorId) },
      fileName: form.fileName,
      totalAmount: Number(form.totalAmount),
    };

    try {
      const res = await fetch('http://localhost:8080/api/bulk_recharges/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessage(`✅ Bulk recharge created successfully (ID: ${data.id})`);
      setForm({ aggregatorId: '', fileName: '', totalAmount: '' });
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-600 text-center mb-4">
          Aggregator Bulk Recharge
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Submit a bulk recharge request to add funds to your aggregator account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Aggregator ID</label>
            <input
              type="number"
              name="aggregatorId"
              value={form.aggregatorId}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">File / Reference Name</label>
            <input
              type="text"
              name="fileName"
              value={form.fileName}
              onChange={handleChange}
              required
              placeholder="e.g. Recharge_Batch_October"
              className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Total Amount (₦)</label>
            <input
              type="number"
              name="totalAmount"
              step="0.01"
              value={form.totalAmount}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? 'Processing...' : 'Submit Recharge Request'}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
