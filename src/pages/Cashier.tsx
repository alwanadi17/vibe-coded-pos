/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, 
  CheckCircle2, Package, Wallet, X, Printer, 
  ArrowRight, Store 
} from 'lucide-react';
import { getAllProducts, addTransaction } from '../lib/db';
import { Product, CartItem, Transaction } from '../types';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProductImage from '../components/ProductImage';

export default function Cashier() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getAllProducts();
    setProducts(data);
  }

  const addToCart = (product: Product) => {
    if (product.stok <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.kuantitas >= product.stok) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, kuantitas: item.kuantitas + 1 } : item
        );
      }
      return [...prev, { ...product, kuantitas: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.kuantitas + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stok) return item;
        return { ...item, kuantitas: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalHarga = useMemo(() => 
    cart.reduce((acc, curr) => acc + (curr.harga * curr.kuantitas), 0)
  , [cart]);

  const changeAmount = cashReceived !== '' ? Number(cashReceived) - totalHarga : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (cashReceived !== '' && Number(cashReceived) < totalHarga) {
      alert('Uang yang diterima kurang!');
      return;
    }

    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      tanggal: new Date().toISOString(),
      totalHarga,
      tunai: Number(cashReceived),
      kembalian: changeAmount,
      itemDibeli: cart.map(item => ({
        productId: item.id,
        nama: item.nama,
        harga: item.harga,
        kuantitas: item.kuantitas,
      })),
    };

    await addTransaction(transaction);
    setLastTransaction(transaction);
    setCart([]);
    setCashReceived('');
    setIsSuccess(true);
    loadProducts();
    
    setTimeout(() => {
      setIsSuccess(false);
      setShowReceipt(true);
    }, 1500);
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kategori.toLowerCase().includes(searchQuery.toLowerCase())
    )
  , [products, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 relative">
      <style>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
            overflow: visible !important;
          }
          /* Show only the receipt and its content */
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          /* Position the receipt at the top left of the printed page */
          #receipt-content {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            padding: 0;
            margin: 0;
            background: white;
            z-index: 9999;
          }
          /* Remove shadows and borders for cleaner print */
          #receipt-content {
            box-shadow: none !important;
            border: none !important;
          }
          /* Hide the modal background and close buttons during print */
          .fixed.inset-0.z-\[110\] {
            background: transparent !important;
            backdrop-filter: none !important;
          }
          .fixed.inset-0.z-\[110\] > div:first-child {
            display: none !important;
          }
          /* Hide the action buttons in the modal footer */
          #receipt-modal-footer {
            display: none !important;
          }
        }
      `}</style>

      {/* Left Side: Product Grid */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama produk atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                onClick={() => product.stok > 0 && addToCart(product)}
                className={cn(
                  "group bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden active:scale-95",
                  product.stok <= 0 && "opacity-60 grayscale cursor-not-allowed"
                )}
              >
                <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden border border-gray-100 relative">
                  <ProductImage
                    src={product.urlGambar}
                    alt={product.nama}
                    className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.stok <= 5 && product.stok > 0 && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Sisa {product.stok}
                    </div>
                  )}
                  {product.stok <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-black text-[10px] font-black px-3 py-1 rounded-full">STOK HABIS</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">{product.kategori}</p>
                  <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 text-sm">{product.nama}</h4>
                  <p className="text-sm font-black text-gray-900">{formatCurrency(product.harga)}</p>
                </div>
                
                {product.stok > 0 && (
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="w-96 bg-white border border-gray-200 rounded-3xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Keranjang</h3>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {cart.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id}
                className="flex gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group"
              >
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                  <ProductImage
                    src={item.urlGambar}
                    alt={item.nama}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-gray-900 truncate">{item.nama}</h5>
                  <p className="text-xs font-bold text-indigo-600 mb-2">{formatCurrency(item.harga)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-0.5 hover:text-indigo-600 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.kuantitas}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-0.5 hover:text-indigo-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-medium">Keranjang masih kosong.</p>
              <p className="text-xs text-gray-400 mt-1">Pilih produk di sebelah kiri.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(totalHarga)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-black text-indigo-600">{formatCurrency(totalHarga)}</span>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              
              {cashReceived !== '' && (
                <div className={cn(
                  "flex justify-between items-center p-3 rounded-xl border",
                  changeAmount >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
                )}>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {changeAmount >= 0 ? 'Kembalian' : 'Kurang'}
                  </span>
                  <span className="text-sm font-black">
                    {formatCurrency(Math.abs(changeAmount))}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            disabled={cart.length === 0 || cashReceived === '' || Number(cashReceived) < totalHarga}
            onClick={handleCheckout}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3",
              cart.length > 0 && cashReceived !== '' && Number(cashReceived) >= totalHarga
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            Proses Pembayaran
          </button>
        </div>
      </div>

      {/* Success Animation */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-md p-12 rounded-full shadow-2xl border border-emerald-100 flex flex-col items-center">
              <div className="bg-emerald-500 text-white p-6 rounded-full mb-4 animate-bounce">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <h2 className="text-2xl font-black text-emerald-600">BERHASIL!</h2>
              <p className="text-gray-500 font-medium">Transaksi telah disimpan.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastTransaction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceipt(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div id="receipt-content" className="p-8 bg-white">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="bg-indigo-600 p-3 rounded-2xl mb-4">
                    <Store className="text-white w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">UMKM PoS</h2>
                  <p className="text-xs text-gray-500 font-medium">Jl. Wirausaha No. 123, Jakarta</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-widest">{lastTransaction.id}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
                    <span>Item</span>
                    <span>Total</span>
                  </div>
                  {lastTransaction.itemDibeli.map((item, idx) => (
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
                    <span className="font-black text-gray-900">{formatCurrency(lastTransaction.totalHarga)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Bayar (Tunai)</span>
                    <span className="font-black text-gray-900">{formatCurrency(lastTransaction.tunai)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-indigo-600 font-black uppercase tracking-wider text-xs">Kembalian</span>
                    <span className="font-black text-indigo-600">{formatCurrency(lastTransaction.kembalian)}</span>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-xs font-bold text-gray-900 mb-1">Terima Kasih!</p>
                  <p className="text-[10px] text-gray-400 font-medium italic">Barang yang sudah dibeli tidak dapat ditukar.</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-4">{formatDate(lastTransaction.tanggal)}</p>
                </div>
              </div>

              <div id="receipt-modal-footer" className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 relative z-20">
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl text-sm hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
