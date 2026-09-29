import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('makemine_cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('makemine_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.key === item.key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
  };

  const removeItem = (key) => setItems((prev) => prev.filter((p) => p.key !== key));
  const updateQty = (key, qty) =>
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, qty: Math.max(1, qty) } : p)));
  const updateProductPrices = (currentProducts = []) => {
    const byId = new Map(currentProducts.map((product) => [String(product.product_id), product]));
    setItems((prev) => prev.map((item) => {
      const currentProduct = byId.get(String(item.product_id));
      if (!currentProduct || !Number.isFinite(Number(currentProduct.unit_price))) return item;
      return {
        ...item,
        name: currentProduct.name || item.name,
        unit_price: Number(currentProduct.unit_price),
      };
    }));
  };
  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, updateProductPrices, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}