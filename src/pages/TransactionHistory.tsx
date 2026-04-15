/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { History, Search, Calendar, ChevronRight, ShoppingBag, Printer, Store } from 'lucide-react';
import { getAllTransactions } from '../lib/db';
import { Transaction } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    const data = await getAllTransactions();
    // Sort by date descending
    setTransactions(data.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  }

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.itemDibeli.some(item => item.nama.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 relative">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt, #print-receipt * {
            visibility: visible;
          }
          #print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p className="text-gray-500">Pantau semua aktivitas penjualan toko Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari ID transaksi atau nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((tx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className={cn(
                    "bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group",
                    selectedTransaction?.id === tx.id 
                      ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-md" 
                      : "border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    selectedTransaction?.id === tx.id ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  )}>
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold text-gray-900">{tx.id}</p>
                      <p className="text-sm font-black text-indigo-600">{formatCurrency(tx.totalHarga)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.tanggal)}
                      </div>
                      <span>•</span>
                      <p>{tx.itemDibeli.length} Item</p>
                    </div>
                  </div>
                  
                  <ChevronRight className={cn(
                    "w-5 h-5 transition-transform",
                    selectedTransaction?.id === tx.id ? "text-indigo-600 translate-x-1" : "text-gray-300"
                  )} />
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredTransactions.length === 0 && (
              <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Belum ada riwayat transaksi.</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Detail */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl sticky top-24 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Detail Transaksi</h3>
            </div>
            
            {selectedTransaction ? (
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Transaksi</p>
                  <p className="font-mono text-sm font-bold text-gray-900">{selectedTransaction.id}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waktu Transaksi</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(selectedTransaction.tanggal)}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item Dibeli</p>
                  <div className="space-y-3">
                    {selectedTransaction.itemDibeli.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 leading-tight">{item.nama}</p>
                          <p className="text-xs text-gray-500">{item.kuantitas} x {formatCurrency(item.harga)}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.harga * item.kuantitas)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Total Belanja</span>
                    <span>{formatCurrency(selectedTransaction.totalHarga)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Tunai</span>
                    <span>{formatCurrency(selectedTransaction.tunai || selectedTransaction.totalHarga)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-emerald-600 font-bold">
                    <span>Kembalian</span>
                    <span>{formatCurrency(selectedTransaction.kembalian || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total Akhir</span>
                    <span className="text-xl font-black text-indigo-600">{formatCurrency(selectedTransaction.totalHarga)}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePrint}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Struk
                </button>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Pilih transaksi untuk melihat detail rincian.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Content */}
      {selectedTransaction && (
        <div id="print-receipt" className="hidden">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl mb-4">
              <Store className="text-white w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900">UMKM PoS</h2>
            <p className="text-xs text-gray-500 font-medium">Jl. Wirausaha No. 123, Jakarta</p>
            <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-widest">{selectedTransaction.id}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
              <span>Item</span>
              <span>Total</span>
            </div>
            {selectedTransaction.itemDibeli.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 leading-tight">{item.nama}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{item.kuantitas} x {formatCurrency(item.harga)}</p>
                </div>
                <p className="text-sm font-black text-gray-900">{formatCurrency(item.harga * item.kuantitas)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-dashed border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Total Belanja</span>
              <span className="font-black text-gray-900">{formatCurrency(selectedTransaction.totalHarga)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Bayar (Tunai)</span>
              <span className="font-black text-gray-900">{formatCurrency(selectedTransaction.tunai || selectedTransaction.totalHarga)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-indigo-600 font-black uppercase tracking-wider text-xs">Kembalian</span>
              <span className="font-black text-indigo-600">{formatCurrency(selectedTransaction.kembalian || 0)}</span>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs font-bold text-gray-900 mb-1">Terima Kasih!</p>
            <p className="text-[10px] text-gray-400 font-medium italic">Barang yang sudah dibeli tidak dapat ditukar.</p>
            <p className="text-[10px] text-gray-400 font-medium mt-4">{formatDate(selectedTransaction.tanggal)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
