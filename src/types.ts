/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  kategori: string;
  urlGambar: string;
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
