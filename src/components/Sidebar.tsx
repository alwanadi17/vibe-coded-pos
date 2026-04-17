/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, History, Store, Truck, Tags } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/cashier', label: 'Kasir (PoS)', icon: ShoppingCart },
  { to: '/admin/products', label: 'Kelola Produk', icon: Package },
  { to: '/admin/categories', label: 'Kelola Kategori', icon: Tags },
  { to: '/admin/suppliers', label: 'Kelola Supplier', icon: Truck },
  { to: '/admin/history', label: 'Riwayat Transaksi', icon: History },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 flex items-center gap-3 border-bottom border-gray-100">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Store className="text-white w-6 h-6" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-gray-900">UMKM PoS</h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-700 font-medium">Local-First (Online)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
