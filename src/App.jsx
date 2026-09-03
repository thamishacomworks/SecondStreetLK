import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import AddClothes from "./pages/AddClothes";
import Inventory from "./pages/Inventory";
import Sell from "./pages/Sell";
import Sales from "./pages/Sales";
import Profit from "./pages/Profit";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

import { supabase } from "./services/supabase";

import "./App.css";

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="auth-loading">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/shipments"
              element={<Shipments />}
            />

            <Route
              path="/add-clothes"
              element={<AddClothes />}
            />

            <Route
              path="/inventory"
              element={<Inventory />}
            />

            <Route
              path="/sell"
              element={<Sell />}
            />

            <Route
              path="/sales"
              element={<Sales />}
            />

            <Route
              path="/profit"
              element={<Profit />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}