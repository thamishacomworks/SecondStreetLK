import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PackageOpen,
  CirclePlus,
  Shirt,
  ScanBarcode,
  ShoppingBag,
  ChartNoAxesCombined,
  FileSpreadsheet,
  LogOut,
} from "lucide-react";
import { supabase } from "../services/supabase";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Shipments", path: "/shipments", icon: PackageOpen },
  { name: "Add Clothes", path: "/add-clothes", icon: CirclePlus },
  { name: "Inventory", path: "/inventory", icon: Shirt },
  { name: "Sell", path: "/sell", icon: ScanBarcode },
  { name: "Sales", path: "/sales", icon: ShoppingBag },
  { name: "Profit", path: "/profit", icon: ChartNoAxesCombined },
  { name: "Reports", path: "/reports", icon: FileSpreadsheet },
];

export default function Sidebar() {
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      alert("Failed to logout.");
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">S</div>

        <div>
          <h2>Second Street</h2>
          <span>LK</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <p>Second Street LK</p>
        <span>Inventory Management</span>
      </div>
    </aside>
  );
}