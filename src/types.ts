/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  namaKategori: string;
}

export interface Supplier {
  id: string;
  namaSupplier: string;
  kontakPerson: string;
  noTelepon: string;
  alamat: string;
  status: 'aktif' | 'tidak aktif';
}

export interface Product {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  kategori: string;
  urlGambar: string;
  supplierId?: string | null;
}

export interface TransactionItem {
  productId: string;
  nama: string;
  harga: number;
  kuantitas: number;
}

export interface Transaction {
  id: string;
  tanggal: string;
  totalHarga: number;
  tunai: number;
  kembalian: number;
  itemDibeli: TransactionItem[];
}

export interface CartItem extends Product {
  kuantitas: number;
}
