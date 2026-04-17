/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { getSettings, updateSettings } from '../lib/db';
import { GlobalSettings } from '../types';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const data = await getSettings();
    setSettings(data);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    await updateSettings(settings);
    
    setSuccessMsg('Pengaturan berhasil disimpan!');
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
    setIsSaving(false);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-500">Konfigurasi margin profit, stok minimum, dan keamanan admin.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Konfigurasi Global</h2>
            <p className="text-sm text-gray-500">Sesuaikan parameter bisnis utama Anda</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Margin Keuntungan Default (%)</label>
              <div className="relative">
                <input
                  required
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.marginPercentage}
                  onChange={e => setSettings({ ...settings, marginPercentage: Number(e.target.value) })}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900"
                  placeholder="Contoh: 30"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Digunakan untuk menghitung Saran Harga Jual berdasar Harga Modal.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Batas Minimum Stok</label>
              <input
                required
                type="number"
                min="0"
                value={settings.lowStockThreshold}
                onChange={e => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900"
                placeholder="Contoh: 5"
              />
              <p className="text-xs text-gray-500 mt-1">Menentukan kapan peringatan "Stok Menipis" muncul di Dashboard.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">PIN Akses Admin</label>
              <input
                required
                type="text"
                maxLength={6}
                value={settings.adminPin}
                onChange={e => setSettings({ ...settings, adminPin: e.target.value.replace(/\D/g, '') })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900 tracking-widest font-mono"
                placeholder="Contoh: 1234"
              />
              <p className="text-xs text-gray-500 mt-1">Hanya angka. Min 4 digit disarankan. Melindungi Rute /admin dari webstore.</p>
            </div>

          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              {successMsg && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="text-emerald-600 font-medium text-sm"
                >
                  {successMsg}
                </motion.p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
