import { useEffect, useState } from "react";
import { PackageOpen, Plus, X } from "lucide-react";
import { supabase } from "../services/supabase";

export default function Shipments() {
  const [showForm, setShowForm] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    arrivalDate: "",
    shippingCost: "",
    otherCost: "",
    notes: "",
  });

  useEffect(() => {
    loadShipments();
  }, []);

  async function loadShipments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("shipments")
      .select(`
        *,
        items (
          id,
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load shipments:", error);
      setShipments([]);
    } else {
      setShipments(data || []);
    }

    setLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("shipments")
      .insert([
        {
          name: form.name,
          arrival_date: form.arrivalDate || null,
          shipping_cost: Number(form.shippingCost || 0),
          other_cost: Number(form.otherCost || 0),
          notes: form.notes || null,
        },
      ]);

    if (error) {
      console.error("Failed to create shipment:", error);
      alert("Failed to create shipment.");
      return;
    }

    setForm({
      name: "",
      arrivalDate: "",
      shippingCost: "",
      otherCost: "",
      notes: "",
    });

    setShowForm(false);
    loadShipments();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-label">STOCK MANAGEMENT</p>
          <h1>Shipments</h1>
          <p className="page-description">
            Create and manage clothing shipments.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />
          Add Shipment
        </button>
      </div>

      {loading ? (
        <div className="empty-page-card">
          <p>Loading shipments...</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="empty-page-card">
          <PackageOpen size={40} />
          <h3>No shipments yet</h3>
          <p>Create your first shipment before adding clothes.</p>

          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add Shipment
          </button>
        </div>
      ) : (
        <div className="shipment-grid">
          {shipments.map((shipment) => {
            const totalItems = shipment.items?.length || 0;

            const soldItems =
              shipment.items?.filter(
                (item) => item.status === "SOLD"
              ).length || 0;

            const availableItems =
              shipment.items?.filter(
                (item) => item.status === "AVAILABLE"
              ).length || 0;

            const totalExpenses =
              Number(shipment.shipping_cost || 0) +
              Number(shipment.other_cost || 0);

            return (
              <div
                className="shipment-card"
                key={shipment.id}
              >
                <div className="shipment-card-top">
                  <div className="shipment-icon">
                    <PackageOpen size={22} />
                  </div>

                  <span>Shipment</span>
                </div>

                <h3>{shipment.name}</h3>

                <p>
                  Arrival:{" "}
                  {shipment.arrival_date || "Not specified"}
                </p>

                <div className="shipment-stats">
                  <div>
                    <span>Items</span>
                    <strong>{totalItems}</strong>
                  </div>

                  <div>
                    <span>Available</span>
                    <strong>{availableItems}</strong>
                  </div>

                  <div>
                    <span>Sold</span>
                    <strong>{soldItems}</strong>
                  </div>
                </div>

                <div className="shipment-cost">
                  <span>Total Expenses</span>
                  <strong>
                    Rs. {totalExpenses.toLocaleString()}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="page-label">NEW SHIPMENT</p>
                <h2>Add Shipment</h2>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Shipment Name</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. September Shipment"
                  required
                />
              </div>

              <div className="form-group">
                <label>Arrival Date</label>

                <input
                  type="date"
                  name="arrivalDate"
                  value={form.arrivalDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Shipping Cost (Rs.)</label>

                  <input
                    type="number"
                    name="shippingCost"
                    value={form.shippingCost}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Other Cost (Rs.)</label>

                  <input
                    type="number"
                    name="otherCost"
                    value={form.otherCost}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Optional notes"
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}