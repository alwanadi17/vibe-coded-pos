/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product, Transaction } from '../types';

interface PosUmkmDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-nama': string; 'by-kategori': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-tanggal': string };
  };
}

const DB_NAME = 'PosUmkmDB';
const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase<PosUmkmDB>> {
  return openDB<PosUmkmDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      const productStore = db.createObjectStore('products', {
        keyPath: 'id',
      });
      productStore.createIndex('by-nama', 'nama');
      productStore.createIndex('by-kategori', 'kategori');

      // Transactions store
      const transactionStore = db.createObjectStore('transactions', {
        keyPath: 'id',
      });
      transactionStore.createIndex('by-tanggal', 'tanggal');
    },
  });
}

// Product CRUD
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function addProduct(product: Product): Promise<string> {
  const db = await getDB();
  await db.add('products', product);
  return product.id;
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.put('products', product);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('products', id);
}

// Transaction CRUD
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function addTransaction(transaction: Transaction): Promise<string> {
  const db = await getDB();
  const tx = db.transaction(['products', 'transactions'], 'readwrite');
  
  // Update stock for each item
  for (const item of transaction.itemDibeli) {
    const product = await tx.objectStore('products').get(item.productId);
    if (product) {
      product.stok -= item.kuantitas;
      await tx.objectStore('products').put(product);
    }
  }

  await tx.objectStore('transactions').add(transaction);
  await tx.done;
  return transaction.id;
}
