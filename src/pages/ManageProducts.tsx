/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X, Truck } from 'lucide-react';
import { getAllProducts, addProduct, updateProduct, deleteProduct, getAllSuppliers, getAllCategories, getSettings } from '../lib/db';
import { Product, Supplier, Category, GlobalSettings } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProductImage from '../components/ProductImage';

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  
  const [formData, setFormData] = useState<Partial<Product> & { hargaModal: string | number, harga: string | number, stok: string | number }>({
    nama: '',
    hargaModal: '',
    harga: '',
    stok: '',
    kategori: '',
    urlGambar: '',
    supplierId: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCategories();
    loadSettings();
  }, []);

  async function loadSettings() {
    const data = await getSettings();
    setSettings(data);
  }

  async function loadCategories() {
    const data = await getAllCategories();
    setCategories(data);
  }

  async function loadProducts() {
    const data = await getAllProducts();
    setProducts(data);
  }

  async function loadSuppliers() {
    const data = await getAllSuppliers();
    setSuppliers(data.filter(s => s.status === 'aktif'));
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        hargaModal: product.hargaModal || '',
        supplierId: product.supplierId || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nama: '',
        hargaModal: '',
        harga: '',
        stok: '',
        kategori: '',
        urlGambar: '',
        supplierId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleHargaModalChange = (val: string) => {
    const modalNum = Number(val);
    if (!settings || isNaN(modalNum)) {
      setFormData(prev => ({ ...prev, hargaModal: val }));
      return;
    }
    
    // Auto calculate sell price
    const marginAmount = modalNum * (settings.marginPercentage / 100);
    const suggestedSellPrice = modalNum + marginAmount;
    
    setFormData(prev => ({ ...prev, hargaModal: val, harga: Math.round(suggestedSellPrice) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData,
      hargaModal: formData.hargaModal ? Number(formData.hargaModal) : undefined,
      harga: Number(formData.harga),
      stok: Number(formData.stok),
      id: editingProduct ? editingProduct.id : crypto.randomUUID(),
      supplierId: formData.supplierId || null,
    } as Product;

    if (editingProduct) {
      await updateProduct(productData);
    } else {
      await addProduct(productData);
    }

    handleCloseModal();
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Produk</h1>
          <p className="text-gray-500">Tambah, edit, atau hapus inventaris produk Anda.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama produk atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={product.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                          <ProductImage
                            src={product.urlGambar}
                            alt={product.nama}
                            className="w-full h-full"
                            fallbackTextSize="text-lg"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{product.nama}</p>
                          <p className="text-xs text-gray-400 font-mono">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase">
                        {product.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(product.harga)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          product.stok > 10 ? "bg-emerald-500" : product.stok > 0 ? "bg-amber-500" : "bg-red-500"
                        )} />
                        <p className={cn(
                          "text-sm font-medium",
                          product.stok === 0 ? "text-red-600 font-bold" : "text-gray-700"
                        )}>
                          {product.stok} {product.stok === 0 ? '(Habis)' : ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Package className="w-12 h-12 opacity-20" />
                      <p className="text-sm font-medium">Tidak ada produk ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Produk</label>
                  <input
                    required
                    type="text"
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Contoh: Santal 33 EDP 100ml"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Harga Modal (Beli)</label>
                    <input
                      type="number"
                      value={formData.hargaModal}
                      onChange={e => handleHargaModalChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      placeholder="Opsional, auto-hitung jual"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Harga Jual</label>
                    <input
                      required
                      type="number"
                      value={formData.harga}
                      onChange={e => setFormData({ ...formData, harga: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-indigo-700"
                      placeholder="Contoh: 3500000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stok</label>
                    <input
                      required
                      type="number"
                      value={formData.stok}
                      onChange={e => setFormData({ ...formData, stok: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Contoh: 15"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori (Brand)</label>
                    <select
                      required
                      value={formData.kategori}
                      onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">Pilih Brand</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.namaKategori}>{c.namaKategori}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">URL Gambar (Opsional)</label>
                  <input
                    type="url"
                    value={formData.urlGambar}
                    onChange={e => setFormData({ ...formData, urlGambar: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Supplier (Merek)
                  </label>
                  <select
                    value={formData.supplierId || ''}
                    onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- Tidak ada supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.namaSupplier}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
