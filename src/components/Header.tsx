/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, User, ArrowLeft } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/admin/dashboard': return 'Dashboard';
      case '/admin/products': return 'Kelola Produk';
      case '/admin/cashier': return 'Kasir (PoS)';
      case '/admin/history': return 'Riwayat Transaksi';
      default: return 'UMKM PoS';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Webstore
        </Link>
        <div className="h-6 w-[1px] bg-gray-200 hidden sm:block" />
        <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{getTitle()}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari fitur..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
          />
        </div>
        
        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-[1px] bg-gray-200 mx-2" />
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">Admin UMKM</p>
            <p className="text-xs text-gray-500">Pemilik Toko</p>
          </div>
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
