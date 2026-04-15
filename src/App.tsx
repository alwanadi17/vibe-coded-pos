/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManageProducts from './pages/ManageProducts';
import Cashier from './pages/Cashier';
import TransactionHistory from './pages/TransactionHistory';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="cashier" element={<Cashier />} />
          <Route path="history" element={<TransactionHistory />} />
        </Route>
      </Routes>
    </Router>
  );
}
