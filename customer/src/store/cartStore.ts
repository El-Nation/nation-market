'use client';
import { create } from 'zustand';

export interface CartItem {
  productId: string;
  vendorId: string;
  vendorName: string;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  image: string;
  unit?: string;
}

interface CartState {
  items: CartItem[];
  initialized: boolean;
  initCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

const CART_KEY = 'nm_cart';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  initialized: false,

  initCart: () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CART_KEY);
        const items = stored ? JSON.parse(stored) : [];
        set({ items, initialized: true });
      } catch {
        set({ initialized: true });
      }
    }
  },

  addItem: (item) => {
    const current = get().items;
    const existing = current.find(i => i.productId === item.productId);
    let updated: CartItem[];
    if (existing) {
      updated = current.map(i =>
        i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      updated = [...current, { ...item, quantity: 1 }];
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
    }
    set({ items: updated, initialized: true });
  },

  removeItem: (productId) => {
    const updated = get().items.filter(i => i.productId !== productId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
    }
    set({ items: updated, initialized: true });
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    const updated = get().items.map(i =>
      i.productId === productId ? { ...i, quantity: qty } : i
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
    }
    set({ items: updated, initialized: true });
  },

  clearCart: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_KEY, JSON.stringify([]));
    }
    set({ items: [], initialized: true });
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () => get().items.reduce((sum, i) => {
    const effectivePrice = i.discount > 0 ? i.price * (1 - i.discount / 100) : i.price;
    return sum + effectivePrice * i.quantity;
  }, 0),
}));

