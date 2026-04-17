/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, ShoppingBag, Package, DollarSign, 
  ArrowUpRight, ArrowDownRight, AlertTriangle, 
  Trophy, Calendar, ChevronRight 
} from 'lucide-react';
import { getAllProducts, getAllTransactions, addProduct, getSettings } from '../lib/db';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { Transaction, Product, GlobalSettings } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);

  async function loadData() {
    setLoading(true);
    const [p, t, s] = await Promise.all([
      getAllProducts(),
      getAllTransactions(),
      getSettings(),
    ]);
    setProducts(p);
    setTransactions(t);
    setSettings(s);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const analytics = useMemo(() => {
    if (!settings) return null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];

    // Revenue Calculations
    let todayRevenue = 0;
    let yesterdayRevenue = 0;
    let lastWeekRevenue = 0;
    let lastMonthRevenue = 0;
    
    transactions.forEach(tx => {
      const txDate = tx.tanggal.split('T')[0];
      if (txDate === todayStr) todayRevenue += tx.totalHarga;
      if (txDate === yesterdayStr) yesterdayRevenue += tx.totalHarga;
      if (txDate === lastWeekStr) lastWeekRevenue += tx.totalHarga;
      if (txDate === lastMonthStr) lastMonthRevenue += tx.totalHarga;
    });

    const calcPercent = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const vsYesterday = calcPercent(todayRevenue, yesterdayRevenue);
    const vsLastWeek = calcPercent(todayRevenue, lastWeekRevenue);
    const vsLastMonth = calcPercent(todayRevenue, lastMonthRevenue);

    // 2. Top Selling Items
    const salesMap: Record<string, { nama: string, count: number }> = {};
    transactions.forEach(tx => {
      tx.itemDibeli.forEach(item => {
        if (!salesMap[item.productId]) {
          salesMap[item.productId] = { nama: item.nama, count: 0 };
        }
        salesMap[item.productId].count += item.kuantitas;
      });
    });

    const topSelling = Object.values(salesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 3. Stock Warnings based on Global Settings
    const stockWarnings = products.filter(p => p.stok <= settings.lowStockThreshold);

    // 4. Chart Data (Last 7 Days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const revenue = transactions
        .filter(tx => tx.tanggal.split('T')[0] === dateStr)
        .reduce((acc, curr) => acc + curr.totalHarga, 0);
      return { name: dayName, revenue, date: dateStr };
    });

    return {
      todayRevenue,
      vsYesterday,
      vsLastWeek,
      vsLastMonth,
      topSelling,
      stockWarnings,
      last7Days,
      totalTransactions: transactions.length,
      activeProducts: products.length
    };
  }, [products, transactions]);

  const handleSeedData = async () => {
    const sampleProducts = [
      { id: crypto.randomUUID(), nama: 'Kopi Susu Gula Aren', harga: 18000, stok: 50, kategori: 'Minuman', urlGambar: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Roti Bakar Cokelat', harga: 15000, stok: 30, kategori: 'Makanan', urlGambar: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Kentang Goreng', harga: 12000, stok: 4, kategori: 'Snack', urlGambar: 'https://images.unsplash.com/photo-1630384066252-11e1edca55a4?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Teh Tarik', harga: 10000, stok: 60, kategori: 'Minuman', urlGambar: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?q=80&w=400&auto=format&fit=crop' },
    ];

    for (const p of sampleProducts) {
      await addProduct(p);
    }
    loadData();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  if (!analytics) return <div className="p-8 text-center text-gray-500">Menyiapkan konfigurasi...</div>;

  const statCards = [
    {
      label: 'Pendapatan Hari Ini',
      value: formatCurrency(analytics.todayRevenue),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Total Transaksi',
      value: analytics.totalTransactions.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Produk Aktif',
      value: analytics.activeProducts.toString(),
      icon: Package,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Intelligence</h1>
          <p className="text-gray-500">Analisis performa bisnis UMKM Anda secara real-time.</p>
        </div>
        {analytics.activeProducts === 0 && (
          <button
            onClick={handleSeedData}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            Gunakan Data Contoh
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn('p-3 rounded-xl', stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-bold text-gray-900">Tren Pendapatan</h3>
              <p className="text-xs text-gray-500">Performa 7 hari terakhir</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Vs Kemarin</span>
                <span className={cn("text-xs font-black", analytics.vsYesterday >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {analytics.vsYesterday >= 0 ? '+' : ''}{analytics.vsYesterday.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Vs Minggu Lalu</span>
                <span className={cn("text-xs font-black", analytics.vsLastWeek >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {analytics.vsLastWeek >= 0 ? '+' : ''}{analytics.vsLastWeek.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Vs Bulan Lalu</span>
                <span className={cn("text-xs font-black", analytics.vsLastMonth >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {analytics.vsLastMonth >= 0 ? '+' : ''}{analytics.vsLastMonth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.last7Days}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900">Produk Terlaris</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.topSelling.length > 0 ? (
              analytics.topSelling.map((item, idx) => (
                <div key={item.nama} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                    idx === 0 ? "bg-amber-100 text-amber-700" : 
                    idx === 1 ? "bg-slate-100 text-slate-700" : 
                    "bg-orange-100 text-orange-700"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.nama}</p>
                    <p className="text-xs text-gray-500">{item.count} Terjual</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">Belum ada data penjualan</p>
              </div>
            )}
          </div>

          {/* Stock Warnings */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Peringatan Stok</h4>
            </div>
            <div className="space-y-2">
              {analytics.stockWarnings.length > 0 ? (
                analytics.stockWarnings.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-xs font-medium text-red-700 truncate max-w-[120px]">{p.nama}</span>
                    <span className="text-xs font-black text-red-600">Sisa {p.stok}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">Semua stok aman</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Support Section */}
      <div className="bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/30 px-3 py-1 rounded-full mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Business Insights</span>
            </div>
            <h2 className="text-3xl font-black mb-4 leading-tight">
              {analytics.vsYesterday > 0 
                ? 'Bisnis Anda Sedang Bertumbuh!' 
                : 'Waktunya Evaluasi Strategi?'}
            </h2>
            <p className="text-indigo-100 mb-6 text-lg">
              {analytics.vsYesterday > 0 
                ? `Pendapatan hari ini naik ${analytics.vsYesterday.toFixed(1)}% dibanding kemarin. Pertahankan momentum dengan promo paket bundling!`
                : 'Pendapatan hari ini cenderung stabil. Coba tambahkan produk baru atau berikan diskon khusus jam makan siang.'}
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all">
                Lihat Laporan Detail
              </button>
              <button className="bg-indigo-500/30 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500/50 transition-all">
                Atur Target Baru
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <h4 className="text-sm font-bold mb-4">Efisiensi Operasional</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Perputaran Stok</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[85%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Kepuasan Pelanggan</span>
                    <span>92%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 w-[92%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
