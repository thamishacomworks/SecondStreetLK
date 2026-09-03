import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { supabase } from "../services/supabase";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    setLoading(true);

    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        items (
          image_url,
          category,
          brand,
          size,
          color
        ),
        shipments (
          id,
          name
        )
      `)
      .order("sold_at", { ascending: false });

    if (error) {
      console.error("Failed to load sales:", error);
      setSales([]);
    } else {
      setSales(data || []);
    }

    setLoading(false);
  }

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !keyword ||
        sale.item_code?.toLowerCase().includes(keyword) ||
        sale.items?.brand?.toLowerCase().includes(keyword) ||
        sale.items?.category?.toLowerCase().includes(keyword) ||
        sale.shipments?.name?.toLowerCase().includes(keyword);

      const matchesPayment =
        !paymentFilter ||
        sale.payment_method === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [sales, search, paymentFilter]);

  const totalSales = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.selling_price || 0),
    0
  );

  const totalProfit = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.profit || 0),
    0
  );

  function formatDate(dateValue) {
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleString();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-label">SALES HISTORY</p>
          <h1>Sales</h1>
          <p className="page-description">
            View all completed clothing sales.
          </p>
        </div>
      </div>

      <div className="sales-summary-grid">
        <div className="stat-card">
          <div>
            <p>Sold Items</p>
            <h2>{filteredSales.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <p>Total Sales</p>
            <h2>
              Rs. {totalSales.toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <p>Total Profit</p>
            <h2>
              Rs. {totalProfit.toLocaleString()}
            </h2>
          </div>
        </div>
      </div>

      <div className="inventory-toolbar sales-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search item code, brand, shipment..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) =>
            setPaymentFilter(e.target.value)
          }
        >
          <option value="">
            All Payment Methods
          </option>
          <option value="Cash">
            Cash
          </option>
          <option value="Card">
            Card
          </option>
          <option value="Bank Transfer">
            Bank Transfer
          </option>
        </select>
      </div>

      {loading ? (
        <div className="empty-page-card">
          <p>Loading sales...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="empty-page-card">
          <ShoppingBag size={42} />
          <h3>No sales yet</h3>
          <p>
            Completed sales will appear here.
          </p>
        </div>
      ) : (
        <div className="sales-history-list">
          {filteredSales.map((sale) => (
            <article
              className="sale-history-card"
              key={sale.id}
            >
              <div className="sale-history-image">
                {sale.items?.image_url ? (
                  <img
                    src={sale.items.image_url}
                    alt={sale.item_code}
                  />
                ) : (
                  <div className="inventory-no-image">
                    <ShoppingBag size={30} />
                    <span>No photo</span>
                  </div>
                )}
              </div>

              <div className="sale-history-main">
                <div>
                  <p className="section-label">
                    SOLD
                  </p>

                  <h3>
                    {sale.items?.brand ||
                      sale.items?.category ||
                      "Clothing Item"}
                  </h3>

                  <p className="sale-item-code">
                    {sale.item_code}
                  </p>
                </div>

                <div className="sale-history-details">
                  <div>
                    <span>Shipment</span>
                    <strong>
                      {sale.shipments?.name || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Payment</span>
                    <strong>
                      {sale.payment_method || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Sold At</span>
                    <strong>
                      {formatDate(sale.sold_at)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="sale-history-money">
                <div>
                  <span>Selling Price</span>
                  <strong>
                    Rs.{" "}
                    {Number(
                      sale.selling_price || 0
                    ).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Cost Price</span>
                  <strong>
                    Rs.{" "}
                    {Number(
                      sale.cost_price || 0
                    ).toLocaleString()}
                  </strong>
                </div>

                <div className="sale-profit">
                  <span>Profit</span>
                  <strong>
                    Rs.{" "}
                    {Number(
                      sale.profit || 0
                    ).toLocaleString()}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}