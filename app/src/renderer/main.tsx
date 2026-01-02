import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Dashboard } from './screens/Dashboard';
import { ScanAndSell } from './screens/ScanAndSell';
import { Inventory } from './screens/Inventory';
import { Products } from './screens/Products';
import { Reports } from './screens/Reports';
import { Settings } from './screens/Settings';
import './styles.css';

function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">Disco Wine</div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/scan">Scan &amp; Sell</NavLink>
          <NavLink to="/inventory">Inventory</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<ScanAndSell />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </React.StrictMode>
);

