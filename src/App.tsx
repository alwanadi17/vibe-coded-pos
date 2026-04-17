/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { seedInitialPerfumes } from './lib/db';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManageProducts from './pages/ManageProducts';
import ManageSuppliers from './pages/ManageSuppliers';
import ManageCategories from './pages/ManageCategories';
import Cashier from './pages/Cashier';
import TransactionHistory from './pages/TransactionHistory';
import Webstore from './pages/Webstore';
import Settings from './pages/Settings';

export default function App() {
  useEffect(() => {
    seedInitialPerfumes().catch(console.error);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Webstore />} />
        
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="suppliers" element={<ManageSuppliers />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="settings" element={<Settings />} />
          <Route path="cashier" element={<Cashier />} />
          <Route path="history" element={<TransactionHistory />} />
        </Route>
      </Routes>
    </Router>
  );
}
