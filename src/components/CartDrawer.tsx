import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, ALGERIAN_WILAYAS } from "../context/LanguageContext";
import { supabase } from "../supabase";
import { 
  X, 
  Trash2, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Truck, 
  CreditCard,
  ChevronRight,
  Sparkles,
  Phone,
  User,
  MapPin,
  AlertTriangle,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthClick: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onAuthClick }) => {
  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart, showToast } = useCart();
  const { user, addOrderToHistory } = useAuth();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedWilayaCode, setSelectedWilayaCode] = useState("");
  const [selectedMiniStateName, setSelectedMiniStateName] = useState("");
  const [customMiniStateName, setCustomMiniStateName] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"door" | "desk">("door");
  const [homeAddress, setHomeAddress] = useState("");

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "shipping" | "success">("cart");
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  // Prefill full name when user loads
  useEffect(() => {
    if (user && !fullName) {
      setFullName(user.displayName || "");
    }
  }, [user, fullName]);

  if (!isOpen) return null;

  const selectedWilaya = ALGERIAN_WILAYAS.find(w => String(w.code) === selectedWilayaCode);
  const deliveryPrice = selectedWilaya 
    ? (deliveryOption === "door" ? selectedWilaya.doorPrice : selectedWilaya.deskPrice) 
    : 0;
  const grandTotal = cartTotal + deliveryPrice;

  // Handle Checkout Order placement with stock validation in Supabase
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onAuthClick();
      return;
    }

    if (!fullName.trim() || !phoneNumber.trim() || !selectedWilayaCode || !selectedMiniStateName) {
      showToast(t("fillRequiredWarning"), "error");
      return;
    }

    if (selectedMiniStateName === "other" && !customMiniStateName.trim()) {
      showToast(t("fillRequiredWarning"), "error");
      return;
    }

    if (deliveryOption === "door" && !homeAddress.trim()) {
      showToast(t("fillRequiredWarning"), "error");
      return;
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");
    const phoneRegex = /^(0)(5|6|7)[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      showToast(t("invalidPhoneWarning"), "error");
      return;
    }

    setCheckingOut(true);

    try {
      // 1. Verify stock counts first in Supabase products table
      for (const item of cart) {
        const { data: currentProd, error: fetchErr } = await supabase
          .from("products")
          .select("stockCount")
          .eq("id", item.id)
          .maybeSingle();

        if (fetchErr && !fetchErr.message.includes("relation")) {
          throw new Error(fetchErr.message);
        }

        if (currentProd) {
          const currentStock = Number(currentProd.stockCount || 0);
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}`);
          }
        }
      }

      // 2. Reduce stock counts in Supabase products table
      for (const item of cart) {
        const { data: currentProd } = await supabase
          .from("products")
          .select("stockCount")
          .eq("id", item.id)
          .maybeSingle();

        if (currentProd) {
          const currentStock = Number(currentProd.stockCount || 0);
          const { error: updateErr } = await supabase
            .from("products")
            .update({ stockCount: currentStock - item.quantity })
            .eq("id", item.id);

          if (updateErr) {
            console.warn("Failed to update product stockCount in database:", updateErr);
          }
        }
      }

      const generatedOrderId = `ord-${Math.random().toString(36).substr(2, 9)}`;

      // Format custom Algerian COD shipping address
      const wilayaName = selectedWilaya ? `${selectedWilaya.code} - ${selectedWilaya[language]}` : selectedWilayaCode;
      const communeName = selectedMiniStateName === "other" ? customMiniStateName.trim() : selectedMiniStateName;
      const deliveryMethodText = deliveryOption === "door" ? "Door Home Delivery" : "Stop Desk Delivery (Office Pick-up)";
      const addressDetailText = deliveryOption === "door" ? homeAddress.trim() : "N/A (Stop Desk Pick-up)";
      const formattedAddress = `Name: ${fullName.trim()} | Phone: ${phoneNumber.trim()} | State: ${wilayaName} | Commune: ${communeName} | Method: ${deliveryMethodText} | Address: ${addressDetailText}`;

      // 3. Create the Order document in Supabase
      const orderPayload = {
        orderId: generatedOrderId,
        userId: user.uid,
        items: cart,
        totalAmount: grandTotal,
        status: "Pending",
        shippingAddress: formattedAddress,
        createdAt: new Date().toISOString()
      };

      const { error: orderErr } = await supabase
        .from("orders")
        .insert([orderPayload]);

      if (orderErr) {
        console.warn("Failed to write order log to Supabase orders table (table may be missing):", orderErr);
      }
      
      // 4. Add Order to user's history in profiles table
      await addOrderToHistory(generatedOrderId);
      
      // Complete Order
      setCompletedOrderId(generatedOrderId);
      showToast(t("orderSuccessTitle"), "success");
      clearCart();
      setCheckoutStep("success");
      // Reset inputs
      setPhoneNumber("");
      setSelectedWilayaCode("");
      setSelectedMiniStateName("");
      setCustomMiniStateName("");
      setDeliveryOption("door");
      setHomeAddress("");
    } catch (err: any) {
      console.error("Checkout order error:", err);
      showToast(err.message || "Checkout error. Node transmission failed.", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleReset = () => {
    setCheckoutStep("cart");
    setCompletedOrderId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
        {/* Backdrop Close */}
        <div className="absolute inset-0" onClick={handleReset} />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3 }}
          className={`relative w-full max-w-md h-full border-l flex flex-col justify-between shadow-2xl z-10 rounded-none transition-colors duration-200 ${
            theme === "dark" ? "bg-[#0d111b] border-[#00d2ff]/20" : "bg-white border-slate-200"
          }`}
        >
          {/* Top Tech Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00d2ff] hidden dark:block" />

          {/* Header */}
          <div className={`p-5 border-b flex items-center justify-between transition-colors ${
            theme === "dark" ? "border-slate-800 bg-[#121624]" : "border-slate-100 bg-slate-50"
          }`}>
            <div>
              <h3 className={`font-display font-black text-sm uppercase tracking-wider ${
                theme === "dark" ? "text-white" : "text-slate-800"
              }`}>
                {checkoutStep === "cart" && `SHOPPING_DECK (${cartCount})`}
                {checkoutStep === "shipping" && "TRANSMISSION_VECTOR"}
                {checkoutStep === "success" && "TRANSMISSION_COMPLETE"}
              </h3>
              <p className={`text-[10px] uppercase font-mono tracking-widest mt-0.5 ${
                theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
              }`}>
                SBB TECH STORE // ACCESS_PORTAL
              </p>
            </div>
            <button
              onClick={handleReset}
              className={`p-1.5 transition-colors ${
                theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Body Container */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {checkoutStep === "cart" && (
              <>
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                    <div className={`w-16 h-16 border border-dashed flex items-center justify-center rounded-none font-mono text-sm ${
                      theme === "dark" ? "border-[#00d2ff]/20 bg-[#121624] text-slate-500" : "border-slate-300 bg-slate-50 text-slate-400"
                    }`}>
                      [EMPTY]
                    </div>
                    <div>
                      <h4 className={`font-display font-black text-xs uppercase tracking-wider ${
                        theme === "dark" ? "text-white" : "text-slate-700"
                      }`}>Your Deck is Empty</h4>
                      <p className={`text-xs max-w-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                        Load high-performance systems from our public inventory feeds to check out.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-none flex gap-3 items-center justify-between transition-colors ${
                          theme === "dark" ? "bg-[#121624] border-slate-800" : "bg-slate-50 border-slate-100 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageURL}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-none object-cover bg-black shrink-0"
                          />
                          <div>
                            <h4 className={`text-xs font-bold line-clamp-1 ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{item.name}</h4>
                            <span className={`text-[11px] font-mono block mt-0.5 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{item.price.toLocaleString()} DA</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Quantity control */}
                          <div className={`flex items-center border rounded-none overflow-hidden ${
                            theme === "dark" ? "border-slate-700 bg-[#0d111b]" : "border-slate-300 bg-white"
                          }`}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={`p-1 transition-colors ${theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`px-2 text-xs font-mono font-bold ${theme === "dark" ? "text-white" : "text-slate-700"}`}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className={`p-1 transition-colors ${theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-500 hover:text-[#ff6b35] p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {checkoutStep === "shipping" && (
              <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-[#ff6b35]/5 border border-[#ff6b35]/20 rounded-none text-[10px] text-[#ff6b35] space-y-1">
                  <span className="font-bold block uppercase mb-0.5">🔒 SECURE CHECKOUT PROTOCOL</span>
                  <p>All orders are processed with Cash on Delivery (COD) across Algeria.</p>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className={`block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    <User className={`w-3 h-3 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                    {t("fullNameLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                    className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 text-xs transition-colors ${
                      theme === "dark"
                        ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff] placeholder-slate-600"
                        : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className={`block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    <Phone className={`w-3 h-3 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                    {t("phoneLabel")}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 text-xs transition-colors ${
                      theme === "dark"
                        ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff] placeholder-slate-600"
                        : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* State / Wilaya */}
                <div className="space-y-1">
                  <label className={`block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    <MapPin className={`w-3 h-3 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                    {t("stateLabel")}
                  </label>
                  <select
                    required
                    value={selectedWilayaCode}
                    onChange={(e) => {
                      setSelectedWilayaCode(e.target.value);
                      setSelectedMiniStateName("");
                    }}
                    className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 text-xs uppercase transition-colors ${
                      theme === "dark"
                        ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                        : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                    }`}
                  >
                    <option value="" disabled>-- {t("selectState")} --</option>
                    {ALGERIAN_WILAYAS.map((wilaya) => (
                      <option key={wilaya.code} value={String(wilaya.code)} className={theme === "dark" ? "bg-[#121624] text-white" : "bg-white text-slate-800"}>
                        {wilaya.code} - {wilaya[language]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mini-State / Commune */}
                {selectedWilaya && (
                  <div className="space-y-1">
                    <label className={`block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1 ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <MapPin className={`w-3 h-3 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                      {t("miniStateLabel")}
                    </label>
                    <select
                      required
                      value={selectedMiniStateName}
                      onChange={(e) => {
                        setSelectedMiniStateName(e.target.value);
                        if (e.target.value !== "other") {
                          setCustomMiniStateName("");
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 text-xs uppercase transition-colors ${
                        theme === "dark"
                          ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                          : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                      }`}
                    >
                      <option value="" disabled>-- {t("selectMiniState")} --</option>
                      {selectedWilaya.miniStates.map((ms, index) => (
                        <option key={index} value={ms[language]} className={theme === "dark" ? "bg-[#121624] text-white" : "bg-white text-slate-800"}>
                          {ms[language]}
                        </option>
                      ))}
                      <option value="other" className={theme === "dark" ? "bg-[#121624] text-[#ff6b35] font-bold" : "bg-white text-[#ff6b35] font-bold"}>
                        {t("otherCommuneOption")}
                      </option>
                    </select>
                  </div>
                )}

                {/* Custom Commune Name Input */}
                {selectedWilaya && selectedMiniStateName === "other" && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className={`block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1 ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <MapPin className={`w-3 h-3 text-[#ff6b35]`} />
                      {t("customCommuneLabel")}
                    </label>
                    <input
                      type="text"
                      required
                      value={customMiniStateName}
                      onChange={(e) => setCustomMiniStateName(e.target.value)}
                      placeholder={t("customCommunePlaceholder")}
                      className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 text-xs transition-colors ${
                        theme === "dark"
                          ? "bg-[#121624] border border-[#ff6b35]/40 text-white focus:ring-[#ff6b35]"
                          : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                      }`}
                    />
                  </div>
                )}

                {/* Delivery Option Selection */}
                {selectedWilaya && (
                  <div className="space-y-2">
                    <label className={`block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1 ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <Truck className={`w-3 h-3 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                      {t("deliveryOptionLabel")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryOption("door")}
                        className={`p-2 border text-left flex flex-col justify-between transition-all rounded-none ${
                          deliveryOption === "door"
                            ? (theme === "dark" ? "border-[#00d2ff] bg-[#00d2ff]/10 text-white" : "border-[#00a8cc] bg-[#00a8cc]/10 text-slate-800")
                            : (theme === "dark" ? "border-slate-800 hover:border-slate-700 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50")
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase">{t("doorDelivery").split(" ")[0]} 🏠</span>
                        <span className={`text-[9px] font-mono mt-0.5 ${deliveryOption === "door" ? "text-[#ff6b35]" : "text-slate-500"}`}>
                          {selectedWilaya.doorPrice} DA
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryOption("desk")}
                        className={`p-2 border text-left flex flex-col justify-between transition-all rounded-none ${
                          deliveryOption === "desk"
                            ? (theme === "dark" ? "border-[#00d2ff] bg-[#00d2ff]/10 text-white" : "border-[#00a8cc] bg-[#00a8cc]/10 text-slate-800")
                            : (theme === "dark" ? "border-slate-800 hover:border-slate-700 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50")
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase">{t("deskDelivery").split(" ")[0]} 🏢</span>
                        <span className={`text-[9px] font-mono mt-0.5 ${deliveryOption === "desk" ? "text-[#ff6b35]" : "text-slate-500"}`}>
                          {selectedWilaya.deskPrice} DA
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Home Address (Only if door delivery is selected) */}
                {selectedWilaya && deliveryOption === "door" && (
                  <div className="space-y-1">
                    <label className={`block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1 ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <MapPin className={`w-3 h-3 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                      {t("addressLabel")}
                    </label>
                    <textarea
                      required
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder={t("addressPlaceholder")}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-none focus:outline-none focus:ring-1 text-xs leading-relaxed transition-colors ${
                        theme === "dark"
                          ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff] placeholder-slate-600"
                          : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white placeholder-slate-400"
                      }`}
                    />
                  </div>
                )}

                {selectedWilaya && deliveryOption === "desk" && (
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-[#00d2ff] flex gap-2 rounded-none items-start">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="text-[9px] font-mono uppercase tracking-wider leading-relaxed">
                      {t("deskAddressNotice")}
                    </span>
                  </div>
                )}

                <div className={`space-y-1.5 border-t pt-3 font-mono text-[10px] ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CART_SUBTOTAL:</span>
                    <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{cartTotal.toLocaleString()} DA</span>
                  </div>
                  {selectedWilaya && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">DELIVERY_CHARGE:</span>
                      <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{deliveryPrice.toLocaleString()} DA</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-slate-700 pt-1.5 text-xs font-bold">
                    <span className="text-slate-400">{t("totalWithDeliveryLabel")}:</span>
                    <span className={theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"}>{grandTotal.toLocaleString()} DA</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={checkingOut}
                  className="w-full py-3 bg-[#ff6b35] text-white hover:bg-[#ff6b35]/90 font-bold uppercase tracking-wider font-sans text-xs rounded-none flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {checkingOut ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-none animate-spin" />
                  ) : (
                    <>
                      {t("submitOrderButton")}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {checkoutStep === "success" && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10">
                <div className="w-16 h-16 border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10 text-emerald-400 rounded-none">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`font-display font-black text-sm uppercase tracking-wider ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}>Transmission Succeeded</h3>
                  <p className={`text-xs max-w-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Your order was successfully stored in the central database.
                  </p>
                </div>
                
                <div className={`p-4 font-mono text-left w-full text-[10px] space-y-2 rounded-none border ${
                  theme === "dark" ? "bg-[#121624] border-slate-800" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div>
                    <span className="text-slate-500 block uppercase">Tracking ID</span>
                    <span className={`font-bold break-all ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{completedOrderId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase">Routing Node</span>
                    <span className={theme === "dark" ? "text-slate-300" : "text-slate-600"}>SBB_PORTAL // DATABASE</span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className={`px-5 py-2 border font-mono text-xs uppercase tracking-wider rounded-none transition-all ${
                    theme === "dark"
                      ? "border-[#00d2ff] text-[#00d2ff] bg-transparent hover:bg-[#00d2ff]/10"
                      : "border-[#00a8cc] text-[#00a8cc] bg-transparent hover:bg-[#00a8cc]/10"
                  }`}
                >
                  Return to Store
                </button>
              </div>
            )}
          </div>

          {/* Footer controls for Cart state */}
          {checkoutStep === "cart" && cart.length > 0 && (
            <div className={`p-5 border-t space-y-4 transition-colors ${
              theme === "dark" ? "border-slate-800 bg-[#121624]" : "border-slate-100 bg-slate-50"
            }`}>
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-[10px] uppercase text-slate-500">TOTAL_COST:</span>
                <span className={`text-2xl font-mono font-bold ${
                  theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
                }`}>
                  {cartTotal.toLocaleString()} DA
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!user) {
                      onAuthClick();
                    } else {
                      setCheckoutStep("shipping");
                    }
                  }}
                  className="flex-1 py-3 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white font-bold uppercase tracking-wider font-sans text-xs rounded-none text-center transition-all"
                >
                  {user ? "Initialize Checkout" : "Auth Required to Buy"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
