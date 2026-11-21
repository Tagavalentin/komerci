import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'marketlocal.cart.v1';

const CartContext = createContext(null);

function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function maxQuantityOf(stock) {
  const value = Number(stock) || 0;
  return value > 0 ? value : 1;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      /* stockage local indisponible : le panier reste en mémoire */
    }
  }, [items]);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        const limit = maxQuantityOf(product.stock);
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantite: Math.min(item.quantite + 1, limit) }
            : item,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          nom: product.nom,
          prix: Number(product.prix) || 0,
          image: product.image || '',
          vendeur_nom: product.vendeur_nom || '',
          stock: Number(product.stock) || 0,
          quantite: 1,
        },
      ];
    });
  }, []);

  const setQuantite = useCallback((productId, quantite) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantite: Math.max(1, Math.min(Number(quantite) || 1, maxQuantityOf(item.stock))) }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantite, 0);
    const subtotal = items.reduce((sum, item) => sum + item.prix * item.quantite, 0);
    const vendors = new Set(items.map((item) => item.vendeur_nom || 'Boutique locale')).size;
    return { items, addItem, setQuantite, removeItem, clearCart, count, subtotal, vendors };
  }, [items, addItem, setQuantite, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart doit être utilisé dans un CartProvider');
  return context;
}