export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageURL: string;
  stockCount: number;
  description: string;
  createdAt?: string; // ISO date string
}

export interface CartItem {
  id: string; // matches product id
  name: string;
  price: number;
  imageURL: string;
  quantity: number;
  category: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  cartItems: CartItem[];
  orderHistory: string[]; // List of orderIds
  isAdmin?: boolean;
}

export interface Order {
  orderId: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: "Pending" | "Processing" | "Shipped" | "Completed" | "Cancelled";
  shippingAddress: string;
  createdAt: string; // ISO date string
}
