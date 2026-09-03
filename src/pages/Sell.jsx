import { useRef, useState } from "react";
import {
  Search,
  ScanBarcode,
  Shirt,
  CheckCircle,
  Camera,
  X,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "../services/supabase";

export default function Sell() {
  const [itemCode, setItemCode] = useState("");
  const [item, setItem] = useState(null);
  const [actualPrice, setActualPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [searching, setSearching] = useState(false);
  const [selling, setSelling] = useState(false);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef(null);
  const scannerControlsRef = useRef(null);

  async function findItem(code = itemCode) {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) return;

    setSearching(true);
    setItem(null);

    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        shipments (
          id,
          name
        )
      `)
      .eq("item_code", cleanCode)
      .eq("status", "AVAILABLE")
      .maybeSingle();

    setSearching(false);

    if (error) {
      console.error(error);
      alert("Failed to search item.");
      return;
    }

    if (!data) {
      alert("Available item not found.");
      return;
    }

    setItem(data);
    setItemCode(data.item_code);
    setActualPrice(String(data.selling_price || ""));
  }

  async function startScanner() {
    try {
      setScanning(true);

      setTimeout(async () => {
        const codeReader = new BrowserMultiFormatReader();

        const controls = await codeReader.decodeFromConstraints(
          {
            video: {
              facingMode: {
                ideal: "environment",
              },
            },
          },
          videoRef.current,
          async (result) => {
            if (!result) return;

            const scannedCode = result
              .getText()
              .trim()
              .toUpperCase();

            scannerControlsRef.current?.stop();
            scannerControlsRef.current = null;

            setScanning(false);
            setItemCode(scannedCode);

            await findItem(scannedCode);
          }
        );

        scannerControlsRef.current = controls;
      }, 100);
    } catch (error) {
      console.error("Scanner error:", error);
      setScanning(false);
      alert(
        "Camera could not be opened. Please allow camera permission."
      );
    }
  }

  function stopScanner() {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setScanning(false);
  }

  async function completeSale() {
    if (!item) return;

    const soldPrice = Number(actualPrice);

    if (!actualPrice || soldPrice < 0) {
      alert("Please enter a valid selling price.");
      return;
    }

    const costPrice = Number(item.cost_price || 0);
    const profit = soldPrice - costPrice;

    setSelling(true);

    try {
      const { error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            item_id: item.id,
            shipment_id: item.shipment_id,
            item_code: item.item_code,
            cost_price: costPrice,
            selling_price: soldPrice,
            profit,
            payment_method: paymentMethod,
          },
        ]);

      if (saleError) throw saleError;

      const { error: itemError } = await supabase
        .from("items")
        .update({
          status: "SOLD",
        })
        .eq("id", item.id);

      if (itemError) throw itemError;

      alert(`Sale completed: ${item.item_code}`);

      setItem(null);
      setItemCode("");
      setActualPrice("");
      setPaymentMethod("Cash");
    } catch (error) {
      console.error(error);
      alert("Failed to complete sale.");
    } finally {
      setSelling(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-label">POINT OF SALE</p>
          <h1>Sell Clothes</h1>
          <p className="page-description">
            Scan a barcode or enter an item code to complete a sale.
          </p>
        </div>
      </div>

      <div className="sell-layout">
        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="section-label">FIND ITEM</p>
              <h3>Item Code</h3>
            </div>

            <ScanBarcode size={23} />
          </div>

          <div className="sell-search">
            <div className="search-box">
              <Search size={18} />

              <input
                value={itemCode}
                onChange={(e) =>
                  setItemCode(e.target.value.toUpperCase())
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    findItem();
                  }
                }}
                placeholder="SSL-0001"
              />
            </div>

            <button
              className="primary-button"
              onClick={() => findItem()}
              disabled={searching}
            >
              {searching ? "Searching..." : "Find Item"}
            </button>

            <button
              className="secondary-button"
              onClick={startScanner}
              disabled={scanning}
            >
              <Camera size={18} />
              Scan Barcode
            </button>
          </div>
        </section>

        {scanning && (
          <div className="scanner-card">
            <div className="scanner-header">
              <div>
                <p className="section-label">CAMERA</p>
                <h3>Scan Barcode</h3>
              </div>

              <button
                className="icon-button"
                onClick={stopScanner}
              >
                <X size={20} />
              </button>
            </div>

            <div className="scanner-video-wrap">
              <video
                ref={videoRef}
                className="scanner-video"
                autoPlay
                muted
                playsInline
              />

              <div className="scanner-frame" />
            </div>

            <p className="scanner-help">
              Place the barcode inside the frame.
            </p>
          </div>
        )}

        {item && (
          <section className="sell-item-card">
            <div className="sell-item-image">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.item_code}
                />
              ) : (
                <div className="inventory-no-image">
                  <Shirt size={40} />
                  <span>No photo</span>
                </div>
              )}
            </div>

            <div className="sell-item-content">
              <p className="section-label">AVAILABLE ITEM</p>

              <h2>
                {item.brand ||
                  item.category ||
                  "Clothing Item"}
              </h2>

              <p className="sell-item-code">
                {item.item_code}
              </p>

              <div className="sell-details">
                <div>
                  <span>Category</span>
                  <strong>{item.category || "-"}</strong>
                </div>

                <div>
                  <span>Size</span>
                  <strong>{item.size || "-"}</strong>
                </div>

                <div>
                  <span>Condition</span>
                  <strong>{item.condition || "-"}</strong>
                </div>

                <div>
                  <span>Shipment</span>
                  <strong>
                    {item.shipments?.name || "-"}
                  </strong>
                </div>
              </div>

              <div className="sell-price-area">
                <div className="form-group">
                  <label>Actual Selling Price (Rs.)</label>

                  <input
                    type="number"
                    min="0"
                    value={actualPrice}
                    onChange={(e) =>
                      setActualPrice(e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>

                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>
                  </select>
                </div>
              </div>

              <button
                className="primary-button complete-sale-button"
                onClick={completeSale}
                disabled={selling}
              >
                <CheckCircle size={19} />

                {selling
                  ? "Completing..."
                  : "Complete Sale"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}