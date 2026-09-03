import { useEffect, useMemo, useState } from "react";
import { Search, Shirt, Printer } from "lucide-react";
import { supabase } from "../services/supabase";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [shipmentFilter, setShipmentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [
      { data: itemData, error: itemError },
      { data: shipmentData, error: shipmentError },
    ] = await Promise.all([
      supabase
        .from("items")
        .select(`
          *,
          shipments (
            id,
            name
          )
        `)
        .eq("status", "AVAILABLE")
        .order("created_at", { ascending: false }),

      supabase
        .from("shipments")
        .select("id, name")
        .order("created_at", { ascending: false }),
    ]);

    if (itemError) {
      console.error("Failed to load inventory:", itemError);
    } else {
      setItems(itemData || []);
    }

    if (shipmentError) {
      console.error("Failed to load shipments:", shipmentError);
    } else {
      setShipments(shipmentData || []);
    }

    setLoading(false);
  }

  const categories = useMemo(() => {
    return [
      ...new Set(
        items
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.item_code?.toLowerCase().includes(keyword) ||
        item.brand?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.color?.toLowerCase().includes(keyword);

      const matchesShipment =
        !shipmentFilter ||
        String(item.shipment_id) === shipmentFilter;

      const matchesCategory =
        !categoryFilter ||
        item.category === categoryFilter;

      return matchesSearch && matchesShipment && matchesCategory;
    });
  }, [items, search, shipmentFilter, categoryFilter]);

  function printBarcode(item) {
    const printWindow = window.open(
      "",
      "_blank",
      "width=500,height=450"
    );

    if (!printWindow) {
      alert("Please allow popups.");
      return;
    }

    const itemCode = item.item_code;
    const category = item.category || "Clothing";
    const price = Number(
      item.selling_price || 0
    ).toLocaleString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${itemCode}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 25px;
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              background: white;
            }

            .label {
              width: 300px;
              padding: 15px;
              text-align: center;
              border: 1px solid #ddd;
            }

            .brand {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 4px;
            }

            .category {
              font-size: 12px;
              margin-bottom: 10px;
            }

            .barcode-container {
              width: 100%;
              overflow: hidden;
            }

            svg {
              width: 100%;
              height: auto;
            }

            .price {
              margin-top: 8px;
              font-size: 20px;
              font-weight: 700;
            }

            @media print {
              body {
                padding: 0;
              }

              .label {
                border: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="label">
            <div class="brand">
              Second Street LK
            </div>

            <div class="category">
              ${category}
            </div>

            <div class="barcode-container">
              <svg id="barcode"></svg>
            </div>

            <div class="price">
              Rs. ${price}
            </div>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>

          <script>
            window.onload = function () {
              JsBarcode(
                "#barcode",
                "${itemCode}",
                {
                  format: "CODE128",
                  displayValue: true,
                  fontSize: 16,
                  height: 55,
                  margin: 5
                }
              );

              setTimeout(function () {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-label">
            STOCK MANAGEMENT
          </p>

          <h1>Inventory</h1>

          <p className="page-description">
            View all clothes currently available for sale.
          </p>
        </div>

        <div className="inventory-count">
          <span>Available</span>
          <strong>{items.length}</strong>
        </div>
      </div>

      <div className="inventory-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search item code, brand, category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={shipmentFilter}
          onChange={(e) =>
            setShipmentFilter(e.target.value)
          }
        >
          <option value="">
            All Shipments
          </option>

          {shipments.map((shipment) => (
            <option
              key={shipment.id}
              value={String(shipment.id)}
            >
              {shipment.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value)
          }
        >
          <option value="">
            All Categories
          </option>

          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-page-card">
          <p>Loading inventory...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-page-card">
          <Shirt size={42} />

          <h3>No available clothes</h3>

          <p>
            Add clothes to a shipment and they will
            appear here.
          </p>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredItems.map((item) => (
            <article
              className="inventory-card"
              key={item.id}
            >
              <div className="inventory-image">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_code}
                    onError={(e) => {
                      console.error(
                        "Image failed:",
                        item.image_url
                      );

                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="inventory-no-image">
                    <Shirt size={34} />
                    <span>No photo</span>
                  </div>
                )}

                <span className="available-badge">
                  Available
                </span>
              </div>

              <div className="inventory-card-body">
                <div className="inventory-title-row">
                  <div>
                    <h3>
                      {item.brand ||
                        item.category ||
                        "Clothing Item"}
                    </h3>

                    <p>
                      {item.item_code}
                    </p>
                  </div>

                  <strong>
                    Rs.{" "}
                    {Number(
                      item.selling_price || 0
                    ).toLocaleString()}
                  </strong>
                </div>

                <div className="item-details">
                  <div>
                    <span>Category</span>
                    <strong>
                      {item.category || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Size</span>
                    <strong>
                      {item.size || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Color</span>
                    <strong>
                      {item.color || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Condition</span>
                    <strong>
                      {item.condition || "-"}
                    </strong>
                  </div>
                </div>

                <div className="inventory-shipment">
                  <span>Shipment</span>

                  <strong>
                    {item.shipments?.name || "-"}
                  </strong>
                </div>

                <button
                  className="secondary-button barcode-button"
                  onClick={() =>
                    printBarcode(item)
                  }
                >
                  <Printer size={16} />
                  Print Barcode
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}