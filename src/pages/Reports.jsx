import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../services/supabase";

export default function Reports() {
  const [month, setMonth] = useState("");
  const [sales, setSales] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);

  useEffect(() => {
    const now = new Date();

    const defaultMonth =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

    setMonth(defaultMonth);
  }, []);

  useEffect(() => {
    if (month) {
      loadReport();
    }
  }, [month]);

  function getMonthRange() {
    const [year, monthNumber] = month.split("-").map(Number);

    const start = new Date(
      year,
      monthNumber - 1,
      1,
      0,
      0,
      0
    );

    const end = new Date(
      year,
      monthNumber,
      1,
      0,
      0,
      0
    );

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  async function loadReport() {
    if (!month) return;

    setLoading(true);
    setReportDownloaded(false);

    const { start, end } = getMonthRange();

    const [
      { data: salesData, error: salesError },
      { data: shipmentData, error: shipmentError },
    ] = await Promise.all([
      supabase
        .from("sales")
        .select(`
          *,
          items (
            id,
            image_url,
            category,
            brand,
            size,
            color,
            condition
          ),
          shipments (
            id,
            name
          )
        `)
        .gte("sold_at", start)
        .lt("sold_at", end)
        .order("sold_at", { ascending: true }),

      supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (salesError) {
      console.error("Failed to load monthly sales:", salesError);
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

  const reportData = useMemo(() => {
    const totalSales = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.selling_price || 0),
      0
    );

    const totalItemCost = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.cost_price || 0),
      0
    );

    const grossProfit =
      totalSales - totalItemCost;

    const usedShipmentIds = [
      ...new Set(
        sales
          .map((sale) => sale.shipment_id)
          .filter(Boolean)
      ),
    ];

    const relatedShipments = shipments.filter(
      (shipment) =>
        usedShipmentIds.includes(shipment.id)
    );

    const shippingCost =
      relatedShipments.reduce(
        (sum, shipment) =>
          sum +
          Number(shipment.shipping_cost || 0),
        0
      );

    const otherCost =
      relatedShipments.reduce(
        (sum, shipment) =>
          sum +
          Number(shipment.other_cost || 0),
        0
      );

    const netProfit =
      grossProfit -
      shippingCost -
      otherCost;

    return {
      totalSales,
      totalItemCost,
      grossProfit,
      shippingCost,
      otherCost,
      netProfit,
      soldItems: sales.length,
    };
  }, [sales, shipments]);

  function escapeCsv(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const text = String(value).replace(
      /"/g,
      '""'
    );

    return `"${text}"`;
  }

  function downloadReport() {
    if (sales.length === 0) {
      alert("No sales found for this month.");
      return;
    }

    const rows = [];

    rows.push([
      "Second Street LK Monthly Report",
    ]);

    rows.push(["Month", month]);
    rows.push([]);

    rows.push([
      "Summary",
      "Amount",
    ]);

    rows.push([
      "Sold Items",
      reportData.soldItems,
    ]);

    rows.push([
      "Total Sales",
      reportData.totalSales,
    ]);

    rows.push([
      "Total Item Cost",
      reportData.totalItemCost,
    ]);

    rows.push([
      "Gross Profit",
      reportData.grossProfit,
    ]);

    rows.push([
      "Shipping Cost",
      reportData.shippingCost,
    ]);

    rows.push([
      "Other Cost",
      reportData.otherCost,
    ]);

    rows.push([
      "Net Profit",
      reportData.netProfit,
    ]);

    rows.push([]);

    rows.push([
      "Item Code",
      "Brand",
      "Category",
      "Size",
      "Color",
      "Condition",
      "Shipment",
      "Cost Price",
      "Selling Price",
      "Profit",
      "Payment",
      "Sold At",
    ]);

    sales.forEach((sale) => {
      rows.push([
        sale.item_code,
        sale.items?.brand || "",
        sale.items?.category || "",
        sale.items?.size || "",
        sale.items?.color || "",
        sale.items?.condition || "",
        sale.shipments?.name || "",
        sale.cost_price,
        sale.selling_price,
        sale.profit,
        sale.payment_method || "",
        sale.sold_at
          ? new Date(
              sale.sold_at
            ).toLocaleString()
          : "",
      ]);
    });

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            escapeCsv(value)
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `second-street-lk-${month}-report.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setReportDownloaded(true);
  }

  function getStoragePath(imageUrl) {
    if (!imageUrl) return null;

    const marker =
      "/storage/v1/object/public/clothes/";

    const index =
      imageUrl.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      imageUrl.substring(
        index + marker.length
      )
    );
  }

  async function closeMonth() {
    if (!reportDownloaded) {
      alert(
        "Please download the monthly report first."
      );
      return;
    }

    if (sales.length === 0) {
      alert(
        "There are no sales to clean."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `${month} report has been downloaded.\n\n` +
          `This will permanently delete:\n` +
          `• ${sales.length} sales records\n` +
          `• Sold item records\n` +
          `• Sold item photos\n\n` +
          `AVAILABLE clothes will NOT be deleted.\n\n` +
          `Continue?`
      );

    if (!confirmed) return;

    const secondConfirmation =
      window.confirm(
        "This action cannot be undone. Are you sure?"
      );

    if (!secondConfirmation) return;

    setClosing(true);

    try {
      const itemIds = [
        ...new Set(
          sales
            .map((sale) => sale.item_id)
            .filter(Boolean)
        ),
      ];

      const imagePaths = [
        ...new Set(
          sales
            .map((sale) =>
              getStoragePath(
                sale.items?.image_url
              )
            )
            .filter(Boolean)
        ),
      ];

      if (imagePaths.length > 0) {
        const { error: storageError } =
          await supabase.storage
            .from("clothes")
            .remove(imagePaths);

        if (storageError) {
          throw storageError;
        }
      }

      const saleIds =
        sales.map((sale) => sale.id);

      if (saleIds.length > 0) {
        const { error: salesDeleteError } =
          await supabase
            .from("sales")
            .delete()
            .in("id", saleIds);

        if (salesDeleteError) {
          throw salesDeleteError;
        }
      }

      if (itemIds.length > 0) {
        const { error: itemDeleteError } =
          await supabase
            .from("items")
            .delete()
            .in("id", itemIds)
            .eq("status", "SOLD");

        if (itemDeleteError) {
          throw itemDeleteError;
        }
      }

      alert(
        `${month} has been closed successfully.`
      );

      setReportDownloaded(false);

      await loadReport();
    } catch (error) {
      console.error(
        "Failed to close month:",
        error
      );

      alert(
        "Failed to close the month. Some cleanup may not have completed."
      );
    } finally {
      setClosing(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-label">
            BUSINESS REPORTS
          </p>

          <h1>Monthly Reports</h1>

          <p className="page-description">
            Download monthly sales reports and clean old sold records.
          </p>
        </div>

        <input
          className="report-month-input"
          type="month"
          value={month}
          onChange={(e) =>
            setMonth(e.target.value)
          }
        />
      </div>

      {loading ? (
        <div className="empty-page-card">
          Loading report...
        </div>
      ) : (
        <>
          <div className="profit-stats-grid">
            <div className="stat-card">
              <div>
                <p>Sold Items</p>
                <h2>
                  {reportData.soldItems}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <p>Total Sales</p>
                <h2>
                  Rs.{" "}
                  {reportData.totalSales.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <p>Gross Profit</p>
                <h2>
                  Rs.{" "}
                  {reportData.grossProfit.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <p>Shipping Cost</p>
                <h2>
                  Rs.{" "}
                  {reportData.shippingCost.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <p>Other Cost</p>
                <h2>
                  Rs.{" "}
                  {reportData.otherCost.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="stat-card profit-main-card">
              <div>
                <p>Net Profit</p>
                <h2>
                  Rs.{" "}
                  {reportData.netProfit.toLocaleString()}
                </h2>
              </div>
            </div>
          </div>

          <section className="dashboard-card">
            <div className="card-heading">
              <div>
                <p className="section-label">
                  MONTH END
                </p>

                <h3>
                  {month || "Select Month"}
                </h3>
              </div>

              <FileSpreadsheet
                size={24}
              />
            </div>

            {sales.length === 0 ? (
              <div className="empty-state">
                <FileSpreadsheet
                  size={32}
                />

                <h4>
                  No sales for this month
                </h4>
              </div>
            ) : (
              <>
                <div className="report-actions">
                  <button
                    className="primary-button"
                    onClick={downloadReport}
                  >
                    <Download size={18} />
                    Download Report
                  </button>

                  <button
                    className="danger-button"
                    onClick={closeMonth}
                    disabled={
                      !reportDownloaded ||
                      closing
                    }
                  >
                    <Trash2 size={18} />

                    {closing
                      ? "Closing Month..."
                      : "Close Month & Clean Data"}
                  </button>
                </div>

                {!reportDownloaded && (
                  <div className="report-warning">
                    <AlertTriangle
                      size={18}
                    />

                    <span>
                      Download the report before closing the month.
                    </span>
                  </div>
                )}

                {reportDownloaded && (
                  <div className="report-ready">
                    Report downloaded. You can now close this month.
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}