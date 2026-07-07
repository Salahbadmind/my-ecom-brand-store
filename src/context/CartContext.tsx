import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { CartItem, Product } from "../types";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateProfileCart } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Track whether initial loading/syncing is complete
  const isInitialSyncRef = useRef(false);

  // Load cart initially
  useEffect(() => {
    if (!user) {
      // Offline/Guest user: load from localStorage
      const localCart = localStorage.getItem("sbb_tech_cart");
      if (localCart) {
        try {
          setCart(JSON.parse(localCart));
        } catch (e) {
          console.error("Error parsing local cart:", e);
        }
      } else {
        setCart([]);
      }
      isInitialSyncRef.current = true;
    }
  }, [user]);

  // Sync cart when user signs in
  useEffect(() => {
    if (user && profile) {
      const localCartStr = localStorage.getItem("sbb_tech_cart");
      const localCart: CartItem[] = localCartStr ? JSON.parse(localCartStr) : [];
      const dbCart: CartItem[] = profile.cartItems || [];

      if (localCart.length > 0) {
        // Merge local guest cart into db cart
        const mergedCart = [...dbCart];
        
        localCart.forEach((guestItem) => {
          const existingIdx = mergedCart.findIndex((item) => item.id === guestItem.id);
          if (existingIdx > -1) {
            mergedCart[existingIdx].quantity += guestItem.quantity;
          } else {
            mergedCart.push(guestItem);
          }
        });

        setCart(mergedCart);
        updateProfileCart(mergedCart);
        
        // Clear local storage after merging
        localStorage.removeItem("sbb_tech_cart");
        showToast("Synced guest cart with your account!", "success");
      } else {
        // Just load db cart
        setCart(dbCart);
      }
      isInitialSyncRef.current = true;
    }
  }, [user, profile]);

  // Save cart to local storage or database on change
  const saveCartState = (newCart: CartItem[]) => {
    setCart(newCart);
    
    if (user) {
      updateProfileCart(newCart);
    } else {
      localStorage.setItem("sbb_tech_cart", JSON.stringify(newCart));
    }
  };

  // Toast controls
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const hideToast = () => {
    setToast(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stockCount <= 0) {
      showToast(`Sorry, ${product.name} is out of stock!`, "error");
      return;
    }

    const existingItemIdx = cart.findIndex((item) => item.id === product.id);
    const newCart = [...cart];

    if (existingItemIdx > -1) {
      const currentQty = newCart[existingItemIdx].quantity;
      if (currentQty + quantity > product.stockCount) {
        showToast(`Cannot add more. Limit reached (Stock: ${product.stockCount})`, "error");
        return;
      }
      newCart[existingItemIdx].quantity += quantity;
    } else {
      newCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageURL: product.imageURL,
        quantity: quantity,
        category: product.category
      });
    }

    saveCartState(newCart);
    showToast(`Added ${product.name} to cart!`, "success");
  };

  const removeFromCart = (productId: string) => {
    const itemToRemove = cart.find(item => item.id === productId);
    const newCart = cart.filter((item) => item.id !== productId);
    saveCartState(newCart);
    if (itemToRemove) {
      showToast(`Removed ${itemToRemove.name} from cart`, "info");
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cart.map((item) => {
      if (item.id === productId) {
        return { ...item, quantity };
      }
      return item;
    });

    saveCartState(newCart);
  };

  const clearCart = () => {
    saveCartState([]);
  };

  // Derived properties
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toast,
        showToast,
        hideToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
