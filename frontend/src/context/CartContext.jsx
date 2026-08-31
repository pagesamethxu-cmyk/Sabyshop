import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      // Bug #16 fix: corrupted localStorage data (e.g. from partial write / browser extension)
      // would crash the app without this guard. Reset cart to empty on parse failure.
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    // M-3 fix: fire toast AFTER state commit, reading from ref set during updater
    if (pendingToastRef.current) {
      const { type, msg, id } = pendingToastRef.current;
      pendingToastRef.current = null;
      if (type === 'error') toast.error(msg, id ? { id } : undefined);
      else toast.success(msg);
    }
  }, [items]);

  // M-3 fix: use a ref to carry toast info out of the setState updater, then fire in useEffect
  const pendingToastRef = useRef(null);

  const addItem = (product, quantity = 1, buyerInviteEmail = null, claimNote = null) => {
    const maxStock = product.stockCount != null ? product.stockCount : 99;

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);

      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        const updatedEmail = buyerInviteEmail || existingItem.buyerInviteEmail;
        const updatedNote = claimNote || existingItem.claimNote;

        if (newQty > maxStock) {
          const msg = maxStock === 0 ? 'This product is currently out of stock' : `Product in stock still ${maxStock}`;
          pendingToastRef.current = { type: 'error', msg, id: 'stock-limit-cart' };
          return prevItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: maxStock, buyerInviteEmail: updatedEmail, claimNote: updatedNote }
              : item
          );
        }
        pendingToastRef.current = { type: 'success', msg: `Updated ${product.name} quantity` };
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, buyerInviteEmail: updatedEmail, claimNote: updatedNote }
            : item
        );
      }

      if (quantity > maxStock) {
        const msg = maxStock === 0 ? 'This product is currently out of stock' : `Product in stock still ${maxStock}`;
        pendingToastRef.current = { type: 'error', msg, id: 'stock-limit-cart' };
        return [...prevItems, { product, quantity: maxStock, buyerInviteEmail, claimNote }];
      }

      pendingToastRef.current = { type: 'success', msg: `Added ${product.name} to cart` };
      return [...prevItems, { product, quantity, buyerInviteEmail, claimNote }];
    });
  };

  const updateItemInviteEmail = (productId, email) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, buyerInviteEmail: email } : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    toast.success('Item removed');
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stockCount != null ? item.product.stockCount : 99;
          if (quantity > maxStock) {
            const msg = maxStock === 0 ? 'This product is currently out of stock' : `Product in stock still ${maxStock}`;
            toast.error(msg, { id: 'stock-limit-update' });
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, updateItemInviteEmail, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
