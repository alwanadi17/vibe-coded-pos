/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product, Transaction, Supplier, Category, GlobalSettings } from '../types';

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
  suppliers: {
    key: string;
    value: Supplier;
  };
  categories: {
    key: string;
    value: Category;
  };
  settings: {
    key: string;
    value: GlobalSettings;
  };
}

const DB_NAME = 'PosUmkmDB';
const DB_VERSION = 4;

export async function getDB(): Promise<IDBPDatabase<PosUmkmDB>> {
  return openDB<PosUmkmDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
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
      }
      
      if (oldVersion < 2) {
        db.createObjectStore('suppliers', {
          keyPath: 'id',
        });
      }

      if (oldVersion < 3) {
        db.createObjectStore('categories', {
          keyPath: 'id',
        });
      }

      if (oldVersion < 4) {
        db.createObjectStore('settings', {
          keyPath: 'id',
        });
      }
    },
  });
}

// Settings CRUD
export async function getSettings(): Promise<GlobalSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'global');
  if (!settings) {
    return { id: 'global', marginPercentage: 30, lowStockThreshold: 5, adminPin: '1234' };
  }
  return settings;
}

export async function updateSettings(settings: GlobalSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// Category CRUD
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB();
  return db.getAll('categories');
}

export async function addCategory(category: Category): Promise<string> {
  const db = await getDB();
  await db.add('categories', category);
  return category.id;
}

export async function updateCategory(category: Category): Promise<void> {
  const db = await getDB();
  await db.put('categories', category);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('categories', id);
}

// Supplier CRUD
export async function getAllSuppliers(): Promise<Supplier[]> {
  const db = await getDB();
  return db.getAll('suppliers');
}

export async function addSupplier(supplier: Supplier): Promise<string> {
  const db = await getDB();
  await db.add('suppliers', supplier);
  return supplier.id;
}

export async function updateSupplier(supplier: Supplier): Promise<void> {
  const db = await getDB();
  await db.put('suppliers', supplier);
}

export async function deleteSupplier(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('suppliers', id);
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

let isSeeding = false;

// Database Seeding
export async function seedInitialPerfumes(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const db = await getDB();
    
    // Seed settings
    const settingsCount = await db.count('settings');
    if (settingsCount === 0) {
      const tx = db.transaction('settings', 'readwrite');
      tx.store.add({ id: 'global', marginPercentage: 30, lowStockThreshold: 5, adminPin: '1234' });
      await tx.done;
    }

    // Clean up duplicate categories if any due to React StrictMode
    const allCategories = await db.getAll('categories');
    const seenCategories = new Set<string>();
    const dupCats: string[] = [];
    for (const cat of allCategories) {
      if (seenCategories.has(cat.namaKategori)) {
        dupCats.push(cat.id);
      } else {
        seenCategories.add(cat.namaKategori);
      }
    }
    if (dupCats.length > 0) {
      const tx = db.transaction('categories', 'readwrite');
      dupCats.forEach(id => tx.store.delete(id));
      await tx.done;
    }

    // Clean up duplicate suppliers
    const allSuppliers = await db.getAll('suppliers');
    const seenSuppliers = new Set<string>();
    const dupSups: string[] = [];
    for (const sup of allSuppliers) {
      if (seenSuppliers.has(sup.namaSupplier)) {
        dupSups.push(sup.id);
      } else {
        seenSuppliers.add(sup.namaSupplier);
      }
    }
    if (dupSups.length > 0) {
      const tx = db.transaction('suppliers', 'readwrite');
      dupSups.forEach(id => tx.store.delete(id));
      await tx.done;
    }

    // Seed categories
    const categoryCount = await db.count('categories');
  if (categoryCount === 0) {
    const initialCategories: Category[] = [
      { id: crypto.randomUUID(), namaKategori: 'Maison Margiela Replica' },
      { id: crypto.randomUUID(), namaKategori: 'Le Labo' },
      { id: crypto.randomUUID(), namaKategori: 'Yves Saint Laurent' },
      { id: crypto.randomUUID(), namaKategori: 'Tom Ford' },
      { id: crypto.randomUUID(), namaKategori: 'Creed' }
    ];
    const tx = db.transaction('categories', 'readwrite');
    initialCategories.forEach(c => tx.store.add(c));
    await tx.done;
  }

  // Seed suppliers
  const supplierCount = await db.count('suppliers');
  let p1Id = null, p2Id = null;
  if (supplierCount === 0) {
    p1Id = crypto.randomUUID();
    p2Id = crypto.randomUUID();
    const initialSuppliers: Supplier[] = [
      { id: p1Id, namaSupplier: 'PT Indo Aroma Emas', kontakPerson: 'Budi', noTelepon: '081234567890', alamat: 'Jl. Sudirman No 1', status: 'aktif' },
      { id: p2Id, namaSupplier: 'Global Fragrance Dist', kontakPerson: 'Sarah', noTelepon: '081345678901', alamat: 'Jl. Thamrin No 2', status: 'aktif' }
    ];
    const tx = db.transaction('suppliers', 'readwrite');
    initialSuppliers.forEach(s => tx.store.add(s));
    await tx.done;
  }

  const count = await db.count('products');
  
  if (count < 14) {
    if (count > 0) {
      // Clear existing to avoid duplicates if partial seed
      const keys = await db.getAllKeys('products');
      const deleteTx = db.transaction('products', 'readwrite');
      keys.forEach(k => deleteTx.store.delete(k));
      await deleteTx.done;
    }

    const initialPerfumes: Product[] = [
      // Maison Margiela Replica
      { id: crypto.randomUUID(), nama: 'When the Rain Stops', hargaModal: 1645000, harga: 2350000, stok: 15, kategori: 'Maison Margiela Replica', urlGambar: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'By the Fireplace', hargaModal: 1645000, harga: 2350000, stok: 10, kategori: 'Maison Margiela Replica', urlGambar: 'https://images.unsplash.com/photo-1595425970377-c9703bc48b2d?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Sailing Day', hargaModal: 1645000, harga: 2350000, stok: 20, kategori: 'Maison Margiela Replica', urlGambar: 'https://images.unsplash.com/photo-1629853900913-92ed49c95276?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Jazz Club', hargaModal: 1750000, harga: 2500000, stok: 12, kategori: 'Maison Margiela Replica', urlGambar: 'https://images.unsplash.com/photo-1588696772719-79ad2af3910c?auto=format&fit=crop&q=80&w=400' },
      
      // Le Labo
      { id: crypto.randomUUID(), nama: 'Another 13', hargaModal: 2660000, harga: 3800000, stok: 8, kategori: 'Le Labo', urlGambar: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Santal 33', hargaModal: 2660000, harga: 3800000, stok: 12, kategori: 'Le Labo', urlGambar: 'https://images.unsplash.com/photo-1616949755610-8c9bac08f9d7?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Bergamote 22', hargaModal: 2450000, harga: 3500000, stok: 5, kategori: 'Le Labo', urlGambar: 'https://images.unsplash.com/photo-1602693892795-5cbda7daec2a?auto=format&fit=crop&q=80&w=400' },

      // Yves Saint Laurent
      { id: crypto.randomUUID(), nama: 'Y', hargaModal: 1470000, harga: 2100000, stok: 25, kategori: 'Yves Saint Laurent', urlGambar: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=400&auto=format&fit=crop' },
      { id: crypto.randomUUID(), nama: 'Libre', hargaModal: 1610000, harga: 2300000, stok: 18, kategori: 'Yves Saint Laurent', urlGambar: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400' },
      { id: crypto.randomUUID(), nama: 'La Nuit de L\'Homme', hargaModal: 1470000, harga: 2100000, stok: 14, kategori: 'Yves Saint Laurent', urlGambar: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=80&w=400' },

      // Tom Ford
      { id: crypto.randomUUID(), nama: 'Oud Wood', hargaModal: 3360000, harga: 4800000, stok: 7, kategori: 'Tom Ford', urlGambar: 'https://images.unsplash.com/photo-1587820108343-441f71dfb271?auto=format&fit=crop&q=80&w=400' },
      { id: crypto.randomUUID(), nama: 'Tobacco Vanille', hargaModal: 3150000, harga: 4500000, stok: 9, kategori: 'Tom Ford', urlGambar: 'https://images.unsplash.com/photo-1595700779836-e04e46048d08?auto=format&fit=crop&q=80&w=400' },

      // Creed
      { id: crypto.randomUUID(), nama: 'Aventus', hargaModal: 3500000, harga: 5000000, stok: 10, kategori: 'Creed', urlGambar: 'https://images.unsplash.com/photo-1614846467385-eb9615fd6fb4?auto=format&fit=crop&q=80&w=400' },
      { id: crypto.randomUUID(), nama: 'Silver Mountain Water', hargaModal: 3290000, harga: 4700000, stok: 6, kategori: 'Creed', urlGambar: 'https://images.unsplash.com/photo-1601332766864-1da5faae6a63?auto=format&fit=crop&q=80&w=400' }
    ];

    const tx = db.transaction('products', 'readwrite');
    initialPerfumes.forEach(p => tx.store.add(p));
    await tx.done;
  }
} finally {
  isSeeding = false;
}
}
