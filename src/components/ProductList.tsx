import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { DirectCheckoutModal } from "./DirectCheckoutModal";
import { 
  Search, 
  ShoppingBag, 
  Layers, 
  Cpu, 
  AlertCircle, 
  Eye, 
  RefreshCw,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Default seed products to populate database if empty
const SEED_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "SBB Titan Quantum Laptop",
    price: 2499,
    category: "Laptops",
    imageURL: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800",
    stockCount: 5,
    description: "Equipped with a 128-qubit hardware accelerated neural processor, active liquid helium cooling, and a 240Hz holographic OLED display.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Neural Link VR Headset",
    price: 899,
    category: "VR Gear",
    imageURL: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=800",
    stockCount: 8,
    description: "Direct synaptic transmission bypasses optical delays. 16K per-eye resolution with immersive sub-audible mechanical haptic strap.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Cyberdeck MK-IV Keyboard",
    price: 189,
    category: "Peripherals",
    imageURL: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800",
    stockCount: 15,
    description: "Hot-swappable tactile electromagnetic switches, laser-etched translucent keycaps, and integrated diagnostic status monitor.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Quantum Core GPU V8",
    price: 1299,
    category: "Components",
    imageURL: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800",
    stockCount: 3,
    description: "Overclocked 32GB Ray-tracing matrix core. Liquid metal thermal paste pre-applied. Consumes 450W of raw cybernetic power.",
    createdAt: new Date().toISOString()
  },
  {
    name: "Aura-RGB HUD Glasses",
    price: 299,
    category: "Wearables",
    imageURL: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800",
    stockCount: 12,
    description: "HUD transparent display showing real-time ambient data, smart translation feeds, and active digital lens noise-canceling overlays.",
    createdAt: new Date().toISOString()
  },
  {
    name: "SBB Ultra-Nano SSD 4TB",
    price: 349,
    category: "Storage",
    imageURL: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800",
    stockCount: 20,
    description: "PCIe Gen 6 ultra-lane, writing up to 14,000 MB/s. Thermal armored outer casing with carbon nanotube high dissipation grids.",
    createdAt: new Date().toISOString()
  }
];

export const ProductList: React.FC = () => {
  const { showToast } = useCart();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Details Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Direct Buy Modal
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  
  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: dbProducts, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .order("createdAt", { ascending: false });

      let productList: Product[] = [];

      if (fetchErr) {
        console.warn("Could not retrieve products from Supabase table. Falling back to default list.", fetchErr);
        productList = SEED_PRODUCTS.map((p, index) => ({
          id: `temp-seed-id-${index}`,
          ...p
        }));
      } else if (dbProducts && dbProducts.length > 0) {
        productList = dbProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category,
          imageURL: p.imageURL,
          stockCount: Number(p.stockCount),
          description: p.description,
          createdAt: p.createdAt
        }));
      } else {
        // Seed if empty database
        try {
          const seededList: Product[] = [];
          for (const item of SEED_PRODUCTS) {
            const itemWithId = {
              id: `prod-${Math.random().toString(36).substr(2, 9)}`,
              ...item
            };
            const { error: insertErr } = await supabase
              .from("products")
              .insert([itemWithId]);
            
            if (insertErr) {
              console.warn("Seeding row failed: ", insertErr);
              throw insertErr;
            }
            seededList.push(itemWithId);
          }
          productList = seededList;
          showToast("Successfully seeded Supabase database!", "success");
        } catch (seedErr) {
          console.warn("Seeding failed (table might be missing), using in-memory default products.", seedErr);
          productList = SEED_PRODUCTS.map((p, index) => ({
            id: `temp-seed-id-${index}`,
            ...p
          }));
        }
      }

      // Extract unique categories
      const cats = ["All", ...Array.from(new Set(productList.map((p) => p.category)))];
      setCategories(cats);
      
      // Sort by createdAt descending (or name if no date)
      productList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setProducts(productList);
    } catch (err: any) {
      console.error("Error loading products:", err);
      // Fallback if everything fails
      const offlineFallbackList = SEED_PRODUCTS.map((p, index) => ({
        id: `temp-seed-id-${index}`,
        ...p
      }));
      setProducts(offlineFallbackList);
      const cats = ["All", ...Array.from(new Set(offlineFallbackList.map((p) => p.category)))];
      setCategories(cats);
      setError(null); // Don't show blocking error so the user gets a functional offline catalog!
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered list
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="product-listing-root" className="space-y-8">
      {/* Search and Filters Section */}
      <div className={`p-5 border transition-all duration-200 flex flex-col md:flex-row gap-4 items-center justify-between rounded-none ${
        theme === "dark" 
          ? "bg-[#0d111b] border-[#00d2ff]/20 shadow-[0_0_15px_rgba(0,210,255,0.03)]" 
          : "bg-white border-slate-200 shadow-sm"
      }`}>
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className={`absolute left-3 top-2.5 h-4 w-4 ${
            theme === "dark" ? "text-[#00d2ff]/70" : "text-[#00a8cc]/70"
          }`} />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-none transition-colors duration-200 font-mono text-sm focus:outline-none focus:ring-1 ${
              theme === "dark" 
                ? "bg-[#121624] border-[#00d2ff]/30 text-white placeholder-slate-600 focus:ring-[#00d2ff]" 
                : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-[#00a8cc]"
            }`}
          />
        </div>

        {/* Categories Carousel/Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-all duration-200 border rounded-none ${
                selectedCategory === cat
                  ? theme === "dark"
                    ? "bg-[#00d2ff] text-[#0d111b] border-[#00d2ff] font-bold shadow-[0_0_10px_rgba(0,210,255,0.3)]"
                    : "bg-[#00a8cc] text-white border-[#00a8cc] font-bold"
                  : theme === "dark"
                    ? "bg-[#121624] text-slate-400 border-slate-800 hover:border-[#00d2ff]/50 hover:text-white"
                    : "bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-950"
              }`}
            >
              {cat === "All" ? t("all") : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className={`w-10 h-10 animate-spin ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
          <p className={`font-mono text-xs uppercase tracking-widest animate-pulse ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>
            SYNCING_SBB_INVENTORY_CORES...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className={`p-6 border rounded-none flex flex-col items-center text-center space-y-3 ${
          theme === "dark" ? "border-[#ff6b35]/30 bg-[#ff6b35]/5" : "border-red-200 bg-red-50/50"
        }`}>
          <AlertCircle className="w-10 h-10 text-[#ff6b35]" />
          <h3 className={`font-display font-bold text-lg uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Database Core Offline</h3>
          <p className="font-mono text-xs text-red-500 max-w-md">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-1.5 border border-[#ff6b35] text-[#ff6b35] text-xs font-bold uppercase tracking-widest hover:bg-[#ff6b35]/10 transition-colors rounded-none"
          >
            RETRY_SYNCHRONIZATION
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className={`p-16 border rounded-none flex flex-col items-center text-center space-y-3 ${
          theme === "dark" ? "border-[#00d2ff]/10 bg-[#0d111b]/50" : "border-slate-200 bg-white"
        }`}>
          <ShoppingBag className="w-12 h-12 text-slate-400" />
          <h3 className={`font-display font-bold text-lg uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-slate-900"}`}>No Systems Found</h3>
          <p className={`text-sm max-w-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
            We couldn't find any products fitting your search parameters or category selection.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
            }}
            className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest transition-colors rounded-none ${
              theme === "dark"
                ? "border-[#00d2ff] text-[#00d2ff] hover:bg-[#00d2ff]/10"
                : "border-[#00a8cc] text-[#00a8cc] hover:bg-[#00a8cc]/10"
            }`}
          >
            RESET_FILTERS
          </button>
        </div>
      )}

      {/* Responsive Products Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProducts.map((product) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className={`group relative flex flex-col p-4 rounded-none border transition-all duration-300 ${
                theme === "dark"
                  ? "bg-[#0d111b] border-slate-800/80 hover:border-[#00d2ff]/30 shadow-md hover:shadow-[0_0_20px_rgba(0,210,255,0.04)]"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
              } ${product.stockCount <= 0 ? "opacity-60" : ""}`}
            >
              {/* Category tag */}
              <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border rounded-none ${
                theme === "dark"
                  ? "bg-[#121624] border-[#00d2ff]/20 text-[#00d2ff]"
                  : "bg-slate-100 border-slate-200 text-[#00a8cc] font-semibold"
              }`}>
                {product.category}
              </div>

              {/* Stock status tag / Hot item badge */}
              <div className="absolute top-2 right-2 z-10">
                {product.stockCount <= 0 ? (
                  <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-[#ff6b35] text-white rounded-none font-bold">
                    {t("outOfStock")}
                  </span>
                ) : product.stockCount <= 3 ? (
                  <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-[#ff6b35] text-white rounded-none font-bold animate-pulse">
                    {t("hotItems", { count: product.stockCount })}
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded-none font-semibold ${
                    theme === "dark" ? "bg-slate-800/50 text-slate-300 border border-slate-850" : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {t("inStock")}
                  </span>
                )}
              </div>

              {/* Product Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-b from-slate-700 to-slate-850 mb-4 flex items-center justify-center rounded-none border border-black/5">
                <img
                  src={product.imageURL || "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800"}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-40" />
                
                {/* View Details Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-widest transition-colors rounded-none ${
                      theme === "dark"
                        ? "border-[#00d2ff] text-[#00d2ff] bg-[#0d111b] hover:bg-[#00d2ff]/10"
                        : "border-[#00a8cc] text-[#00a8cc] bg-white hover:bg-[#00a8cc]/10"
                    }`}
                  >
                    {t("inspectCore")}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className={`font-bold mb-1 transition-colors line-clamp-1 ${
                    theme === "dark"
                      ? "text-white group-hover:text-[#00d2ff]"
                      : "text-slate-800 group-hover:text-[#00a8cc]"
                  }`}>{product.name}</h4>
                  <p className={`text-xs flex-1 line-clamp-2 leading-relaxed min-h-[32px] ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    {product.description}
                  </p>
                </div>

                {/* Footer price / action */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                  theme === "dark" ? "border-slate-800/80" : "border-slate-100"
                }`}>
                  <span className={`font-mono text-lg font-bold ${
                    theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
                  }`}>
                    {product.price.toLocaleString()} DA
                  </span>

                  <button
                    onClick={() => setCheckoutProduct(product)}
                    disabled={product.stockCount <= 0}
                    className={`px-3 py-1 text-white text-[10px] font-bold uppercase tracking-tighter rounded-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                      theme === "dark"
                        ? "bg-[#ff6b35] hover:bg-[#ff6b35]/80 disabled:hover:bg-[#ff6b35]"
                        : "bg-[#e56212] hover:bg-[#e56212]/90 disabled:hover:bg-[#e56212]"
                    }`}
                  >
                    {product.stockCount <= 0 ? t("outOfStock") : t("buyNow")}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedProduct(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`relative w-full max-w-2xl border-2 rounded-none overflow-hidden z-10 flex flex-col md:flex-row ${
                theme === "dark"
                  ? "bg-[#121624] border-[#00d2ff]/30 shadow-[0_0_35px_rgba(0,210,255,0.1)]"
                  : "bg-white border-slate-300 shadow-xl"
              }`}
            >
              {/* Product Visual */}
              <div className={`w-full md:w-1/2 relative aspect-video md:aspect-auto flex items-center justify-center rounded-none ${
                theme === "dark" ? "bg-[#0d111b]" : "bg-slate-100"
              }`}>
                <img
                  src={selectedProduct.imageURL}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className="object-cover w-full h-full"
                />
                <div className={`absolute top-3 left-3 px-2 py-0.5 text-[9px] font-mono uppercase border rounded-none ${
                  theme === "dark"
                    ? "bg-[#121624] border-[#00d2ff]/20 text-[#00d2ff]"
                    : "bg-slate-100 border-slate-200 text-[#00a8cc] font-semibold"
                }`}>
                  {selectedProduct.category}
                </div>
              </div>

              {/* Product Info */}
              <div className={`p-6 w-full md:w-1/2 flex flex-col justify-between space-y-6 rounded-none ${
                theme === "dark" ? "bg-[#0d111b]" : "bg-slate-50"
              }`}>
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className={`text-xl font-display font-black uppercase tracking-tight ${
                        theme === "dark" ? "text-white" : "text-slate-900"
                      }`}>
                        {selectedProduct.name}
                      </h2>
                      <p className={`text-[9px] uppercase font-mono tracking-widest mt-1 ${
                        theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
                      }`}>
                        SBB_SYSTEM_IDENTIFIER
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className={`font-mono text-sm uppercase font-bold ${
                        theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      [x]
                    </button>
                  </div>

                  <p className={`mt-4 text-xs leading-relaxed ${
                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                  }`}>
                    {selectedProduct.description}
                  </p>

                  <div className={`mt-6 space-y-2 border-t pt-4 font-mono text-[10px] ${
                    theme === "dark" ? "border-slate-850" : "border-slate-200"
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">SYS_INVENTORY:</span>
                      <span className={selectedProduct.stockCount > 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                        {selectedProduct.stockCount > 0 ? `${selectedProduct.stockCount} ${t("inStock").toUpperCase()}` : t("outOfStock").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">ROUTING_NODE:</span>
                      <span className={theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}>SBB_PORT_3000 // ACTIVE</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-4 border-t ${
                  theme === "dark" ? "border-slate-850" : "border-slate-200"
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-mono text-slate-500">{t("unitCost")}</span>
                    <span className={`text-2xl font-mono font-bold ${
                      theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
                    }`}>
                      {selectedProduct.price.toLocaleString()} DA
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutProduct(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stockCount <= 0}
                    className={`px-4 py-2 text-white text-xs font-bold uppercase tracking-widest rounded-none disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                      theme === "dark"
                        ? "bg-[#ff6b35] hover:bg-[#ff6b35]/90"
                        : "bg-[#e56212] hover:bg-[#e56212]/95"
                    }`}
                  >
                    {t("buyNow")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Algerian COD Purchase Flow Modal */}
      <DirectCheckoutModal
        isOpen={checkoutProduct !== null}
        onClose={() => setCheckoutProduct(null)}
        product={checkoutProduct}
        showToast={showToast}
      />
    </div>
  );
};
