import { useEffect, useMemo, useState } from "react";
import {
  Shirt,
  ShoppingBag,
  WalletCards,
  TrendingUp,
  PackageOpen,
} from "lucide-react";
import { supabase } from "../services/supabase";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);

    const [
      { data: itemData, error: itemError },
      { data: salesData, error: salesError },
      { data: shipmentData, error: shipmentError },
    ] = await Promise.all([
      supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("sales")
        .select(`
          *,
          items (
            image_url,
            category,
            brand
          )
        `)
        .order("sold_at", { ascending: false }),

      supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (itemError) {
      console.error("Failed to load items:", itemError);
      setItems([]);
    } else {
      setItems(itemData || []);
    }

    if (salesError) {
      console.error("Failed to load sales:", salesError);
      setSales([]);
    } else {
      setSales(salesData || []);
    }

    if (shipmentError) {
      console.error("Failed to load shipments:", shipmentError);
      setShipments([]);
    } else {
      setShipments(shipmentData || []);
    }

    setLoading(false);
  }

  const availableClothes = useMemo(() => {
    return items.filter(
      (item) => item.status === "AVAILABLE"
    ).length;
  }, [items]);

  const soldClothes = useMemo(() => {
    return items.filter(
      (item) => item.status === "SOLD"
    ).length;
  }, [items]);

  const totalSales = useMemo(() => {
    return sales.reduce(
      (sum, sale) =>
        sum + Number(sale.selling_price || 0),
      0
    );
  }, [sales]);

  const grossProfit = useMemo(() => {
    return sales.reduce(
      (sum, sale) =>
        sum + Number(sale.profit || 0),
      0
    );
  }, [sales]);

  const totalShipmentExpenses = useMemo(() => {
    return shipments.reduce(
      (sum, shipment) =>
        sum +
        Number(shipment.shipping_cost || 0) +
        Number(shipment.other_cost || 0),
      0
    );
  }, [shipments]);

  const netProfit =
    grossProfit - totalShipmentExpenses;

  const currentShipment =
    shipments.length > 0
      ? shipments[0]
      : null;

  const recentSales = useMemo(() => {
    return sales.slice(0, 5);
  }, [sales]);

  const stockByCategory = useMemo(() => {
    const categoryMap = {};

    items
      .filter(
        (item) => item.status === "AVAILABLE"
      )
      .forEach((item) => {
        const category =
          item.category || "Other";

        categoryMap[category] =
          (categoryMap[category] || 0) + 1;
      });

    return Object.entries(categoryMap)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const stats = [
    {
      title: "Available Clothes",
      value: availableClothes,
      icon: Shirt,
    },
    {
      title: "Sold Clothes",
      value: soldClothes,
      icon: ShoppingBag,
    },
    {
      title: "Total Sales",
      value: `Rs. ${totalSales.toLocaleString()}`,
      icon: WalletCards,
    },
    {
      title: "Net Profit",
      value: `Rs. ${netProfit.toLocaleString()}`,
      icon: TrendingUp,
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <p className="page-label">
              OVERVIEW
            </p>
            <h1>Dashboard</h1>
          </div>
        </div>

        <div className="empty-page-card">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <p className="page-label">
            OVERVIEW
          </p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Track your stock, sales and profit in one place.
          </p>
        </div>

        <div className="current-shipment">
          <PackageOpen size={20} />

          <div>
            <span>Latest Shipment</span>

            <strong>
              {currentShipment
                ? currentShipment.name
                : "No shipments yet"}
            </strong>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="stat-card"
              key={stat.title}
            >
              <div className="stat-icon">
                <Icon size={22} />
              </div>

              <div>
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card recent-sales-card">
          <div className="card-heading">
            <div>
              <p className="section-label">
                SALES
              </p>
              <h3>Recent Sales</h3>
            </div>
          </div>

          {recentSales.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={30} />

              <h4>No sales yet</h4>

              <p>
                Sold items will appear here.
              </p>
            </div>
          ) : (
            <div className="sales-table">
              <div className="sales-row sales-header">
                <span>Item</span>
                <span>Price</span>
                <span>Profit</span>
              </div>

              {recentSales.map((sale) => (
                <div
                  className="sales-row"
                  key={sale.id}
                >
                  <div>
                    <strong>
                      {sale.items?.brand ||
                        sale.items?.category ||
                        "Clothing Item"}
                    </strong>

                    <small>
                      {sale.item_code}
                    </small>
                  </div>

                  <span>
                    Rs.{" "}
                    {Number(
                      sale.selling_price || 0
                    ).toLocaleString()}
                  </span>

                  <span>
                    Rs.{" "}
                    {Number(
                      sale.profit || 0
                    ).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-card stock-card">
          <div className="card-heading">
            <div>
              <p className="section-label">
                INVENTORY
              </p>

              <h3>Stock Overview</h3>
            </div>
          </div>

          {stockByCategory.length === 0 ? (
            <div className="empty-state">
              <Shirt size={30} />

              <h4>No stock yet</h4>

              <p>
                Add clothes to see stock here.
              </p>
            </div>
          ) : (
            <div className="stock-list">
              {stockByCategory.map(
                (category) => (
                  <div key={category.name}>
                    <span>
                      {category.name}
                    </span>

                    <strong>
                      {category.count}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}