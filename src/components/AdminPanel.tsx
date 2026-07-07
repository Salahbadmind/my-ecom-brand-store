import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { Product, Order } from "../types";
import { 
  Lock, 
  Trash2, 
  Edit2, 
  PlusCircle, 
  Check, 
  X, 
  Database, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Upload,
  ImageIcon
} from "lucide-react";
import { motion } from "motion/react";

export const AdminPanel: React.FC<{ onAuthClick?: () => void }> = ({ onAuthClick }) => {
  const { profile, user } = useAuth();
  const { showToast } = useCart();
  const { theme } = useTheme();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inventory" | "orders">("inventory");
  const [schemaWarning, setSchemaWarning] = useState(false);
  
  // Custom Inline Confirmation States
  const [purgingProductId, setPurgingProductId] = useState<string | null>(null);
  const [purgingOrderId, setPurgingOrderId] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImageURL, setFormImageURL] = useState("");
  const [formStockCount, setFormStockCount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [imageUploadMethod, setImageUploadMethod] = useState<"device" | "url">("device");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormImageURL(reader.result);
        showToast("Image loaded from device successfully!", "success");
      }
    };
    reader.onerror = () => {
      showToast("Failed to read image file", "error");
    };
    reader.readAsDataURL(file);
  };

  const categories = ["Laptops", "VR Gear", "Peripherals", "Components", "Wearables", "Storage"];

  // Fetch Inventory and Orders
  const fetchData = async () => {
    if (!profile?.isAdmin) return;
    setLoading(true);
    setSchemaWarning(false);
    try {
      // Fetch Products
      const { data: dbProducts, error: prodErr } = await supabase
        .from("products")
        .select("*");

      if (prodErr) {
        if (prodErr.message.includes("relation") || prodErr.message.includes("does not exist")) {
          setSchemaWarning(true);
        }
        throw prodErr;
      }

      const prodList: Product[] = [];
      if (dbProducts) {
        dbProducts.forEach((p: any) => {
          prodList.push({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            imageURL: p.imageURL,
            stockCount: Number(p.stockCount),
            description: p.description,
            createdAt: p.createdAt
          });
        });
      }
      prodList.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setProducts(prodList);

      // Fetch Orders
      const { data: dbOrders, error: ordersErr } = await supabase
        .from("orders")
        .select("*");

      if (ordersErr) throw ordersErr;

      const orderList: Order[] = [];
      if (dbOrders) {
        dbOrders.forEach((o: any) => {
          orderList.push({
            orderId: o.orderId,
            userId: o.userId,
            items: Array.isArray(o.items) ? o.items : [],
            totalAmount: Number(o.totalAmount),
            status: o.status,
            shippingAddress: o.shippingAddress,
            createdAt: o.createdAt
          });
        });
      }
      orderList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setOrders(orderList);

    } catch (err: any) {
      console.error("Admin load error:", err);
      // Fail gracefully so UI stays rendering
      if (err.message?.includes("relation") || err.message?.includes("does not exist")) {
        setSchemaWarning(true);
      }
      showToast("Error loading administrator database files from Supabase.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  // Handle Create / Edit Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formPrice || !formCategory || !formStockCount || !formDescription) {
      showToast("Please fill out all required fields", "error");
      return;
    }

    const itemPrice = parseFloat(formPrice);
    const itemStock = parseInt(formStockCount);

    if (isNaN(itemPrice) || itemPrice < 0) {
      showToast("Invalid price format", "error");
      return;
    }

    if (isNaN(itemStock) || itemStock < 0) {
      showToast("Invalid stock count", "error");
      return;
    }

    const finalImageURL = formImageURL.trim() || "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800";

    try {
      if (isEditing && editingId) {
        // Update product in Supabase
        const { error: updateErr } = await supabase
          .from("products")
          .update({
            name: formName.trim(),
            price: itemPrice,
            category: formCategory,
            imageURL: finalImageURL,
            stockCount: itemStock,
            description: formDescription.trim()
          })
          .eq("id", editingId);

        if (updateErr) throw updateErr;
        showToast("System item upgraded successfully!", "success");
      } else {
        // Create product in Supabase
        const generatedId = `prod-${Math.random().toString(36).substr(2, 9)}`;
        const { error: insertErr } = await supabase
          .from("products")
          .insert([{
            id: generatedId,
            name: formName.trim(),
            price: itemPrice,
            category: formCategory,
            imageURL: finalImageURL,
            stockCount: itemStock,
            description: formDescription.trim(),
            createdAt: new Date().toISOString()
          }]);

        if (insertErr) throw insertErr;
        showToast("New core system loaded successfully!", "success");
      }
      
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error("Save product error:", err);
      showToast("Error executing database instruction in Supabase", "error");
    }
  };

  // Start Edit
  const handleEditInit = (product: Product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormCategory(product.category);
    setFormImageURL(product.imageURL);
    setFormStockCount(product.stockCount.toString());
    setFormDescription(product.description);
  };

  // Delete Product
  const handleDelete = async (productId: string) => {
    try {
      const { error: deleteErr } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (deleteErr) throw deleteErr;
      showToast("System core purged successfully", "info");
      setPurgingProductId(null);
      fetchData();
    } catch (err: any) {
      console.error("Purge error:", err);
      showToast("Could not purge system core in Supabase", "error");
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const statuses: Order["status"][] = ["Pending", "Processing", "Shipped", "Completed", "Cancelled"];
    const currentIdx = statuses.indexOf(currentStatus as any);
    const nextIdx = (currentIdx + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];

    try {
      const { error: orderErr } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("orderId", orderId);

      if (orderErr) throw orderErr;
      showToast(`Order status updated to ${nextStatus}`, "success");
      fetchData();
    } catch (err: any) {
      console.error("Order status error:", err);
      showToast("Error updating order tracking file in Supabase", "error");
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error: deleteErr } = await supabase
        .from("orders")
        .delete()
        .eq("orderId", orderId);

      if (deleteErr) throw deleteErr;
      showToast("Order log permanently purged successfully", "info");
      setPurgingOrderId(null);
      fetchData();
    } catch (err: any) {
      console.error("Purge order error:", err);
      showToast("Could not purge order tracking file in Supabase", "error");
    }
  };

  // Reset Form
  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormPrice("");
    setFormCategory("");
    setFormImageURL("");
    setFormStockCount("");
    setFormDescription("");
  };

  // 1. Protection State: Not logged in
  if (!user) {
    return (
      <div className={`max-w-md mx-auto text-center py-20 px-6 border rounded-none shadow-2xl transition-all duration-200 ${
        theme === "dark" 
          ? "border-[#ff6b35]/20 bg-[#ff6b35]/5" 
          : "border-orange-200 bg-orange-50/20"
      }`}>
        <Lock className="w-12 h-12 text-[#ff6b35] mx-auto mb-4 animate-pulse" />
        <h2 className={`text-xl font-display font-black uppercase tracking-wider ${
          theme === "dark" ? "text-white" : "text-slate-800"
        }`}>ADMIN_CLEARANCE_REQUIRED</h2>
        <p className="mt-2 text-xs text-[#ff6b35] font-mono tracking-widest uppercase mb-6">
          Security clearance level 4 required.
        </p>
        <p className={`text-xs mb-6 leading-relaxed font-mono ${
          theme === "dark" ? "text-slate-400" : "text-slate-600"
        }`}>
          You must authorize using your administrative credentials to access SBB Tech Store configuration directories.
        </p>
        <button
          onClick={onAuthClick}
          className="px-6 py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white font-bold rounded-none font-sans text-xs uppercase tracking-widest transition-colors"
        >
          Initialize Authorization
        </button>
      </div>
    );
  }

  // 2. Protection State: Logged in but not Admin
  if (user && profile && !profile.isAdmin) {
    return (
      <div className={`max-w-md mx-auto text-center py-20 px-6 border rounded-none transition-all duration-200 ${
        theme === "dark" 
          ? "border-[#ff6b35]/30 bg-[#ff6b35]/5" 
          : "border-orange-200 bg-orange-50/20"
      }`}>
        <Lock className="w-12 h-12 text-[#ff6b35] mx-auto mb-4" />
        <h2 className={`text-xl font-display font-black uppercase tracking-wider ${
          theme === "dark" ? "text-white" : "text-slate-800"
        }`}>ACCESS_DENIED</h2>
        <p className="mt-2 text-xs text-[#ff6b35] font-mono tracking-widest uppercase mb-6">
          LOGGED IN AS: {user.email}
        </p>
        <p className={`text-xs mb-4 leading-relaxed font-mono ${
          theme === "dark" ? "text-slate-400" : "text-slate-600"
        }`}>
          Your current profile credentials do not have the administrative clearance required to manage inventory or orders.
        </p>
        <p className={`text-[10px] font-mono ${
          theme === "dark" ? "text-slate-500" : "text-slate-500"
        }`}>
          Tip: Log in with <span className="text-[#ff6b35] font-bold">sbouragbi5@gmail.com</span> to automatically gain administrator clearance.
        </p>
      </div>
    );
  }

  // Calculate Metrics
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stockCount), 0);
  const totalOrdersValue = orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0);

  // 3. Authorized View
  return (
    <div className="space-y-8">
      {/* Admin Title Banner */}
      <div className={`p-6 rounded-none transition-all duration-200 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        theme === "dark" 
          ? "bg-[#0d111b] border-[#00d2ff]/20 shadow-[0_0_15px_rgba(0,210,255,0.03)]" 
          : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div>
          <h2 className={`text-xl font-display font-black uppercase tracking-wider flex items-center gap-2 ${
            theme === "dark" ? "text-white" : "text-slate-800"
          }`}>
            <Database className={`w-5 h-5 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
            ADMIN_CONTROL_CENTER
          </h2>
          <p className={`text-xs font-mono mt-1 tracking-widest ${
            theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
          }`}>
            SBB TECH STORE ADMINISTRATIVE DIRECTORIES // SECURE_PORT: 3000
          </p>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all rounded-none ${
              activeTab === "inventory"
                ? theme === "dark"
                  ? "bg-[#00d2ff] text-[#0d111b] border-[#00d2ff] font-bold"
                  : "bg-[#00a8cc] text-white border-[#00a8cc] font-bold"
                : theme === "dark"
                  ? "bg-transparent text-slate-400 border-[#00d2ff]/20 hover:border-[#00d2ff] hover:text-white"
                  : "bg-transparent text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            Manage Inventory
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all rounded-none ${
              activeTab === "orders"
                ? theme === "dark"
                  ? "bg-[#00d2ff] text-[#0d111b] border-[#00d2ff] font-bold"
                  : "bg-[#00a8cc] text-white border-[#00a8cc] font-bold"
                : theme === "dark"
                  ? "bg-transparent text-slate-400 border-[#00d2ff]/20 hover:border-[#00d2ff] hover:text-white"
                  : "bg-transparent text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            Review Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* Schema Warning banner */}
      {schemaWarning && (
        <div className="p-5 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-none flex items-start gap-4 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-[#ff6b35] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold text-[#ff6b35] uppercase tracking-wider">Supabase Tables Schema Setup Required</h4>
            <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
              We detected that the <code className="text-[#00d2ff]">products</code> and <code className="text-[#00d2ff]">orders</code> tables do not exist or are not accessible in your Supabase database project yet.
            </p>
            <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
              Please copy and paste the SQL script located in the <code className="text-[#00d2ff]/80">/supabase_schema.sql</code> file at the root of this project into the <strong className="text-white">Supabase SQL Editor</strong> to automatically set up all required tables and permissions!
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-none border transition-colors duration-200 ${
          theme === "dark" ? "bg-[#0d111b] border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Active Nodes</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{products.length}</span>
            <span className={`text-xs font-mono uppercase font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>Items</span>
          </div>
        </div>
        <div className={`p-4 rounded-none border transition-colors duration-200 ${
          theme === "dark" ? "bg-[#0d111b] border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Estimated Inventory Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"}`}>
              {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} DA
            </span>
            <span className="text-xs text-slate-500 font-mono">DA</span>
          </div>
        </div>
        <div className={`p-4 rounded-none border transition-colors duration-200 ${
          theme === "dark" ? "bg-[#0d111b] border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Sales Volume</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-500">
              {totalOrdersValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} DA
            </span>
            <span className="text-xs text-slate-500 font-mono">DA</span>
          </div>
        </div>
      </div>

      {activeTab === "inventory" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List of Products (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-slate-800"
              }`}>
                <Package className="w-4 h-4 text-slate-400" />
                Active Inventory Database
              </h3>
              <button
                onClick={fetchData}
                className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                  theme === "dark" ? "text-[#00d2ff] hover:text-white" : "text-[#00a8cc] hover:text-[#00a8cc]/85"
                }`}
              >
                [Reload Data]
              </button>
            </div>

            {loading ? (
              <div className={`p-20 text-center font-mono text-xs animate-pulse uppercase tracking-widest ${
                theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
              }`}>
                SYNCING_DATABASE_STATE...
              </div>
            ) : products.length === 0 ? (
              <div className={`p-10 border border-dashed rounded-none text-center font-mono text-xs uppercase tracking-widest ${
                theme === "dark" ? "border-[#00d2ff]/20 text-slate-500 bg-[#0d111b]/30" : "border-slate-300 text-slate-400 bg-slate-50/50"
              }`}>
                DATABASE_EMPTY: NO SYSTEM CORES REGISTERED
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-none border transition-all flex items-center justify-between gap-4 ${
                      theme === "dark" 
                        ? "bg-[#0d111b] border-slate-800/80 hover:border-[#00d2ff]/20" 
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageURL}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-none object-cover bg-[#090912] border border-black/5"
                      />
                      <div>
                        <h4 className={`text-xs font-bold leading-tight line-clamp-1 ${
                          theme === "dark" ? "text-white" : "text-slate-800"
                        }`}>{p.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                          <span className={`font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{p.category}</span>
                          <span>|</span>
                          <span>Stock: <strong className={p.stockCount <= 3 ? "text-[#ff6b35] font-bold" : "text-slate-500 font-bold"}>{p.stockCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-mono font-bold ${
                        theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"
                      }`}>
                        {p.price.toLocaleString()} DA
                      </span>
                      <div className="flex gap-1.5 items-center">
                        {purgingProductId === p.id ? (
                          <div className="flex items-center gap-1 font-mono text-[9px] border border-red-500/20 bg-red-950/20 p-1">
                            <span className="text-[#ff6b35] font-bold animate-pulse px-1">[SURE?]</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="px-1.5 py-0.5 bg-red-700 hover:bg-red-600 text-white font-bold transition-colors"
                            >
                              YES
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurgingProductId(null)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                            >
                              NO
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditInit(p)}
                              className="p-2 bg-[#16213e] border border-[#00d2ff]/20 hover:border-[#00d2ff] text-[#00d2ff] rounded-none transition-colors"
                              title="Edit core specifications"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPurgingProductId(p.id)}
                              className="p-2 bg-red-950/20 text-red-400 border border-red-500/30 rounded-none hover:bg-red-950/40 transition-colors"
                              title="Purge node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create/Edit Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className={`p-6 border rounded-none relative transition-all duration-200 ${
              theme === "dark" 
                ? "bg-[#0d111b] border-[#00d2ff]/20 shadow-[0_0_15px_rgba(0,210,255,0.02)]" 
                : "bg-white border-slate-200 shadow-sm"
            }`}>
              {/* Corner tech accents */}
              <div className="absolute top-0 right-0 w-4 h-[2px] bg-[#00d2ff] hidden dark:block" />
              <div className="absolute top-0 right-0 w-[2px] h-4 bg-[#00d2ff] hidden dark:block" />

              <h3 className={`font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 mb-6 ${
                theme === "dark" ? "text-white" : "text-slate-800"
              }`}>
                <PlusCircle className={`w-4 h-4 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                {isEditing ? "Modify System Node" : "Insert New Core"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-[10px] uppercase font-mono tracking-wider mb-1 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    System Component Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="SBB Quantum Reactor Pro"
                    className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 font-mono text-xs transition-colors ${
                      theme === "dark"
                        ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                        : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase font-mono tracking-wider mb-1 ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      Price (DA) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="1299.99"
                      className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 font-mono text-xs transition-colors ${
                        theme === "dark"
                          ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                          : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-mono tracking-wider mb-1 ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      Initial Inventory *
                    </label>
                    <input
                      type="number"
                      required
                      value={formStockCount}
                      onChange={(e) => setFormStockCount(e.target.value)}
                      placeholder="10"
                      className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 font-mono text-xs transition-colors ${
                        theme === "dark"
                          ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                          : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase font-mono tracking-wider mb-1 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Node Category *
                  </label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 font-mono text-xs uppercase transition-colors ${
                      theme === "dark"
                        ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                        : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                    }`}
                  >
                    <option value="" disabled>Select Core Class</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`block text-[10px] uppercase font-mono tracking-wider ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      Product Image Component
                    </label>
                    <div className="flex gap-2 text-[9px] font-mono">
                      <button
                        type="button"
                        onClick={() => setImageUploadMethod("device")}
                        className={`px-2 py-0.5 border transition-colors ${
                          imageUploadMethod === "device"
                            ? theme === "dark"
                              ? "bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/40"
                              : "bg-[#00a8cc]/10 text-[#00a8cc] border-[#00a8cc]/40 font-bold"
                            : theme === "dark"
                              ? "text-slate-500 border-white/5 hover:text-slate-300"
                              : "text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        [Upload File]
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMethod("url")}
                        className={`px-2 py-0.5 border transition-colors ${
                          imageUploadMethod === "url"
                            ? theme === "dark"
                              ? "bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/40"
                              : "bg-[#00a8cc]/10 text-[#00a8cc] border-[#00a8cc]/40 font-bold"
                            : theme === "dark"
                              ? "text-slate-500 border-white/5 hover:text-slate-300"
                              : "text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        [Image URL]
                      </button>
                    </div>
                  </div>

                  {imageUploadMethod === "device" ? (
                    <div className={`border border-dashed p-4 flex flex-col items-center justify-center text-center relative transition-colors ${
                      theme === "dark"
                        ? "border-[#00d2ff]/30 bg-[#121624] hover:border-[#00d2ff]/60"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}>
                      {formImageURL && formImageURL.startsWith("data:") ? (
                        <div className="relative w-full max-w-[150px] aspect-square border border-white/10 bg-[#090912]">
                          <img
                            src={formImageURL}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormImageURL("")}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-red-950 border border-red-500 text-red-400 hover:text-white rounded-none shadow-lg text-[10px] font-mono"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer py-4 w-full flex flex-col items-center gap-2">
                          <Upload className={`w-8 h-8 animate-pulse ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                          <div className="space-y-1">
                            <span className={`text-xs font-mono block ${theme === "dark" ? "text-white" : "text-slate-700"}`}>CHOOSE_IMAGE_FILE</span>
                            <span className="text-[10px] font-mono text-slate-400 block">SUPPORTED: PNG, JPG, WEBP (Max 5MB)</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={formImageURL}
                        onChange={(e) => setFormImageURL(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 font-mono text-xs transition-colors ${
                          theme === "dark"
                            ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                            : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                        }`}
                      />
                      {formImageURL && !formImageURL.startsWith("data:") && (
                        <div className={`p-2 border flex items-center gap-3 transition-colors ${
                          theme === "dark"
                            ? "border-slate-800 bg-[#0d111b]/40"
                            : "border-slate-200 bg-slate-50"
                        }`}>
                          <img
                            src={formImageURL}
                            alt="URL Preview"
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover border border-white/5 shrink-0 bg-black"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80";
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">Remote Preview</span>
                            <span className={`text-[10px] font-mono truncate block ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{formImageURL}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-[10px] uppercase font-mono tracking-wider mb-1 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Module Specifications / Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide performance metrics, power consumption, clock speed, or architectural specifications."
                    className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 font-mono text-xs leading-relaxed transition-colors ${
                      theme === "dark"
                        ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                        : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#ff6b35] text-white hover:bg-[#ff6b35]/90 font-bold uppercase tracking-wider font-sans text-xs rounded-none transition-all"
                  >
                    {isEditing ? "Apply Upgrade" : "Initialize Core"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-white/10 hover:border-white/20 bg-transparent text-slate-400 hover:text-white rounded-none font-mono text-xs uppercase transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Orders Review Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 ${
              theme === "dark" ? "text-white" : "text-slate-800"
            }`}>
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              Customer Checkout Logs
            </h3>
            <button
              onClick={fetchData}
              className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                theme === "dark" ? "text-[#00d2ff] hover:text-white" : "text-[#00a8cc] hover:text-[#00a8cc]/85"
              }`}
            >
              [Reload Logs]
            </button>
          </div>

          {loading ? (
            <div className={`p-20 text-center font-mono text-xs animate-pulse uppercase tracking-widest ${
              theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
            }`}>
              FETCHING_ORDER_LOGS...
            </div>
          ) : orders.length === 0 ? (
            <div className={`p-16 border border-dashed rounded-none text-center font-mono text-xs uppercase tracking-widest ${
              theme === "dark" ? "border-[#00d2ff]/20 text-slate-500 bg-[#0d111b]/30" : "border-slate-300 text-slate-400 bg-slate-50/50"
            }`}>
              SYSTEM_LOG_EMPTY: NO ORDERS FILED YET
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className={`p-5 rounded-none border transition-colors space-y-4 ${
                    theme === "dark"
                      ? "bg-[#0d111b] border-slate-800/80 hover:border-[#00d2ff]/10"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  {/* Top bar */}
                  <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b font-mono text-xs ${
                    theme === "dark" ? "border-slate-800" : "border-slate-100"
                  }`}>
                    <div>
                      <span className="text-slate-500">ORDER_ID: </span>
                      <span className={`font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{order.orderId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleUpdateOrderStatus(order.orderId, order.status)}
                        className={`px-3 py-1 rounded-none text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-all border ${
                          order.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : order.status === "Shipped"
                            ? theme === "dark"
                              ? "bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/20"
                              : "bg-[#00a8cc]/10 text-[#00a8cc] border-[#00a8cc]/20"
                            : order.status === "Cancelled"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                        }`}
                        title="Click to toggle status"
                      >
                        {order.status} // cycle
                      </button>
                      {purgingOrderId === order.orderId ? (
                        <div className="flex items-center gap-1 font-mono text-[9px] border border-red-500/20 bg-red-950/20 p-1">
                          <span className="text-[#ff6b35] font-bold animate-pulse px-1">[SURE?]</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.orderId)}
                            className="px-1.5 py-0.5 bg-red-700 hover:bg-red-600 text-white font-bold transition-colors"
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setPurgingOrderId(null)}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPurgingOrderId(order.orderId)}
                          className={`p-1.5 border transition-all rounded-none ${
                            theme === "dark"
                              ? "text-slate-500 hover:text-red-400 border-slate-800 hover:border-red-500/30 bg-transparent hover:bg-red-950/20"
                              : "text-slate-400 hover:text-red-500 border-slate-200 hover:border-red-200 hover:bg-red-50"
                          }`}
                          title="Delete customer order log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Items (8 cols) */}
                    <div className="md:col-span-8 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Manifest</span>
                      {order.items?.map((item) => (
                        <div key={item.id} className={`flex justify-between items-center p-2 rounded-none text-xs font-mono border ${
                          theme === "dark"
                            ? "bg-[#121624] border-slate-800 text-slate-300"
                            : "bg-slate-50 border-slate-100 text-slate-700"
                        }`}>
                          <span className="line-clamp-1">{item.name} <strong className={`font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>x{item.quantity}</strong></span>
                          <span className={`font-bold ${theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"}`}>{(item.price * item.quantity).toLocaleString()} DA</span>
                        </div>
                      ))}
                    </div>

                    {/* Customer specs (4 cols) */}
                    <div className={`md:col-span-4 space-y-2 font-mono text-xs border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 ${
                      theme === "dark" ? "border-slate-800" : "border-slate-100"
                    }`}>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Client Node ID</span>
                        <span className={`line-clamp-1 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{order.userId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Delivery Vector</span>
                        <span className={`line-clamp-2 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{order.shippingAddress}</span>
                      </div>
                      <div className={`pt-2 border-t flex justify-between items-center ${
                        theme === "dark" ? "border-slate-800" : "border-slate-100"
                      }`}>
                        <span className="text-[10px] text-slate-500 uppercase">NET_TOTAL:</span>
                        <span className={`text-lg font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{order.totalAmount.toLocaleString()} DA</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
