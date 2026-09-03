import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  WalletCards,
  PackageOpen,
  ReceiptText,
} from "lucide-react";
import { supabase } from "../services/supabase";

export default function Profit() {
  const [sales, setSales] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shipmentFilter, setShipmentFilter] = useState("");

  useEffect(() => {
    loadProfitData();
  }, []);

  async function loadProfitData() {
    setLoading(true);

    const [
      { data: salesData, error: salesError },
      { data: shipmentData, error: shipmentError },
    ] = await Promise.all([
      supabase
        .from("sales")
        .select(`
          *,
          shipments (
            id,
            name
          )
        `)
        .order("sold_at", { ascending: false }),

      supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

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

  const filteredSales = useMemo(() => {
    if (!shipmentFilter) return sales;

    return sales.filter(
      (sale) => String(sale.shipment_id) === shipmentFilter
    );
  }, [sales, shipmentFilter]);

  const filteredShipments = useMemo(() => {
    if (!shipmentFilter) return shipments;

    return shipments.filter(
      (shipment) => String(shipment.id) === shipmentFilter
    );
  }, [shipments, shipmentFilter]);

  const totals = useMemo(() => {
    const totalSales = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.selling_price || 0),
      0
    );

    const totalItemCost = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.cost_price || 0),
      0
    );

    const grossProfit = totalSales - totalItemCost;

    const shippingCost = filteredShipments.reduce(
      (sum, shipment) =>
        sum + Number(shipment.shipping_cost || 0),
      0
    );

    const otherCost = filteredShipments.reduce(
      (sum, shipment) =>
        sum + Number(shipment.other_cost || 0),
      0
    );

    const netProfit =
      grossProfit - shippingCost - otherCost;

    return {
      totalSales,
      totalItemCost,
      grossProfit,
      shippingCost,
      otherCost,
      netProfit,
    };
  }, [filteredSales, filteredShipments]);

  const shipmentBreakdown = useMemo(() => {
    return shipments.map((shipment) => {
      const shipmentSales = sales.filter(
        (sale) => sale.shipment_id === shipment.id
      );

      const salesTotal = shipmentSales.reduce(
        (sum, sale) =>
          sum + Number(sale.selling_price || 0),
        0
      );

      const itemCost = shipmentSales.reduce(
        (sum, sale) =>
          sum + Number(sale.cost_price || 0),
        0
      );

      const grossProfit = salesTotal - itemCost;

      const expenses =
        Number(shipment.shipping_cost || 0) +
        Number(shipment.other_cost || 0);

      const netProfit = grossProfit - expenses;

      return {
        id: shipment.id,
        name: shipment.name,
        soldItems: shipmentSales.length,
        salesTotal,
        itemCost,
        grossProfit,
        expenses,
        netProfit,
      };
    });
  }, [sales, shipments]);

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-label">FINANCIAL OVERVIEW</p>
          <h1>Profit</h1>
          <p className="page-description">
            Track sales, costs, expenses and net profit.
          </p>
        </div>

        <select
          className="profit-filter"
          value={shipmentFilter}
          onChange={(e) =>
            setShipmentFilter(e.target.value)
          }
        >
          <option value="">All Shipments</option>

          {shipments.map((shipment) => (
            <option
              key={shipment.id}
              value={String(shipment.id)}
            >
              {shipment.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-page-card">
          <p>Loading profit data...</p>
        </div>
      ) : (
        <>
          <div className="profit-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <WalletCards size={22} />
              </div>

              <div>
                <p>Total Sales</p>
                <h2>
                  Rs. {totals.totalSales.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <ReceiptText size={22} />
              </div>

              <div>
                <p>Total Item Cost</p>
                <h2>
                  Rs. {totals.totalItemCost.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={22} />
              </div>

              <div>
                <p>Gross Profit</p>
                <h2>
                  Rs. {totals.grossProfit.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <PackageOpen size={22} />
              </div>

              <div>
                <p>Shipping Cost</p>
                <h2>
                  Rs. {totals.shippingCost.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <ReceiptText size={22} />
              </div>

              <div>
                <p>Other Cost</p>
                <h2>
                  Rs. {totals.otherCost.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card profit-main-card">
              <div className="stat-icon">
                <TrendingUp size={22} />
              </div>

              <div>
                <p>Net Profit</p>
                <h2>
                  Rs. {totals.netProfit.toLocaleString()}
                </h2>
              </div>
            </div>
          </div>

          <section className="dashboard-card">
            <div className="card-heading">
              <div>
                <p className="section-label">
                  SHIPMENT PERFORMANCE
                </p>
                <h3>Profit by Shipment</h3>
              </div>
            </div>

            {shipmentBreakdown.length === 0 ? (
              <div className="empty-state">
                <PackageOpen size={30} />
                <h4>No shipments yet</h4>
                <p>
                  Shipment profit will appear here.
                </p>
              </div>
            ) : (
              <div className="profit-table">
                <div className="profit-row profit-header">
                  <span>Shipment</span>
                  <span>Sold</span>
                  <span>Sales</span>
                  <span>Item Cost</span>
                  <span>Expenses</span>
                  <span>Net Profit</span>
                </div>

                {shipmentBreakdown.map((shipment) => (
                  <div
                    className="profit-row"
                    key={shipment.id}
                  >
                    <strong>{shipment.name}</strong>

                    <span>{shipment.soldItems}</span>

                    <span>
                      Rs.{" "}
                      {shipment.salesTotal.toLocaleString()}
                    </span>

                    <span>
                      Rs.{" "}
                      {shipment.itemCost.toLocaleString()}
                    </span>

                    <span>
                      Rs.{" "}
                      {shipment.expenses.toLocaleString()}
                    </span>

                    <strong>
                      Rs.{" "}
                      {shipment.netProfit.toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}