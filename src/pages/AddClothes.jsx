import { useEffect, useState } from "react";
import { PlusCircle, Shirt, ImagePlus } from "lucide-react";
import { supabase } from "../services/supabase";

export default function AddClothes() {
  const [shipments, setShipments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    shipmentId: "",
    category: "",
    brand: "",
    size: "",
    color: "",
    condition: "",
    costPrice: "",
    sellingPrice: "",
  });

  useEffect(() => {
    loadShipments();
  }, []);

  async function loadShipments() {
    const { data, error } = await supabase
      .from("shipments")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setShipments(data || []);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function generateItemCode() {
    const { count, error } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    const nextNumber = (count || 0) + 1;

    return `SSL-${String(nextNumber).padStart(4, "0")}`;
  }

  async function uploadPhoto(itemCode) {
    if (!photo) return null;

    const extension = photo.name.split(".").pop();
    const fileName = `${itemCode}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("clothes")
      .upload(fileName, photo);

    if (error) throw error;

    const { data } = supabase.storage
      .from("clothes")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.shipmentId) {
      alert("Please select a shipment.");
      return;
    }

    setSaving(true);

    try {
      const itemCode = await generateItemCode();
      const imageUrl = await uploadPhoto(itemCode);

      const { error } = await supabase
        .from("items")
        .insert([
          {
            item_code: itemCode,
            shipment_id: Number(form.shipmentId),
            category: form.category || null,
            brand: form.brand || null,
            size: form.size || null,
            color: form.color || null,
            condition: form.condition || null,
            cost_price: Number(form.costPrice || 0),
            selling_price: Number(form.sellingPrice || 0),
            image_url: imageUrl,
            status: "AVAILABLE",
          },
        ]);

      if (error) throw error;

      alert(`Item added successfully: ${itemCode}`);

      setForm({
        shipmentId: form.shipmentId,
        category: "",
        brand: "",
        size: "",
        color: "",
        condition: "",
        costPrice: "",
        sellingPrice: "",
      });

      setPhoto(null);
      setPreview("");
    } catch (error) {
      console.error(error);
      alert("Failed to add item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-label">INVENTORY</p>
          <h1>Add Clothes</h1>
          <p className="page-description">
            Add new clothes to a shipment.
          </p>
        </div>
      </div>

      <div className="add-clothes-layout">
        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="section-label">NEW ITEM</p>
              <h3>Clothing Details</h3>
            </div>

            <Shirt size={22} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Photo</label>

              <label className="photo-upload-box">
                {preview ? (
                  <img
                    src={preview}
                    alt="Selected clothing"
                    className="photo-preview"
                  />
                ) : (
                  <div className="photo-upload-placeholder">
                    <ImagePlus size={28} />
                    <span>Add clothing photo</span>
                    <small>JPG, PNG or WEBP</small>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  hidden
                />
              </label>
            </div>

            <div className="form-group">
              <label>Shipment</label>

              <select
                name="shipmentId"
                value={form.shipmentId}
                onChange={handleChange}
                required
              >
                <option value="">Select shipment</option>

                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="T-Shirt"
                />
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Nike"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Size</label>
                <input
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  placeholder="M"
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="Black"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Condition</label>

              <select
                name="condition"
                value={form.condition}
                onChange={handleChange}
              >
                <option value="">Select condition</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cost Price (Rs.)</label>
                <input
                  type="number"
                  name="costPrice"
                  value={form.costPrice}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Selling Price (Rs.)</label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={form.sellingPrice}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              <PlusCircle size={18} />
              {saving ? "Saving..." : "Add Clothing Item"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}