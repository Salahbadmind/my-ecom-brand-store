import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage, ALGERIAN_WILAYAS } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { Product, CartItem } from "../types";
import { 
  X, 
  Truck, 
  CheckCircle2, 
  Phone, 
  User, 
  MapPin, 
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DirectCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const DirectCheckoutModal: React.FC<DirectCheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  product,
  showToast
}) => {
  const { user, addOrderToHistory } = useAuth();
  const { t, language, isRtl } = useLanguage();
  const { theme } = useTheme();

  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<string>("");
  const [selectedMiniStateName, setSelectedMiniStateName] = useState("");
  const [customMiniStateName, setCustomMiniStateName] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"door" | "desk">("door");
  const [homeAddress, setHomeAddress] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  // Reset states when product changes or opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setError(null);
      setCompletedOrderId(null);
      // Pre-fill if logged in and displayName exists
      if (user) {
        setFullName(user.displayName || "");
      } else {
        setFullName("");
      }
      setPhoneNumber("");
      setSelectedWilayaCode("");
      setSelectedMiniStateName("");
      setCustomMiniStateName("");
      setDeliveryOption("door");
      setHomeAddress("");
    }
  }, [isOpen, product, user]);

  if (!isOpen || !product) return null;

  const selectedWilaya = ALGERIAN_WILAYAS.find(w => String(w.code) === selectedWilayaCode);
  const deliveryPrice = selectedWilaya 
    ? (deliveryOption === "door" ? selectedWilaya.doorPrice : selectedWilaya.deskPrice) 
    : 0;
  const totalAmount = (product.price * quantity) + deliveryPrice;

  const validateForm = (): boolean => {
    if (!fullName.trim() || !phoneNumber.trim() || !selectedWilayaCode || !selectedMiniStateName) {
      setError(t("fillRequiredWarning"));
      return false;
    }

    if (selectedMiniStateName === "other" && !customMiniStateName.trim()) {
      setError(t("fillRequiredWarning"));
      return false;
    }

    if (deliveryOption === "door" && !homeAddress.trim()) {
      setError(t("fillRequiredWarning"));
      return false;
    }

    // Algerian phone numbers: starts with 05, 06, 07 followed by 8 digits (e.g. 0550123456)
    // Accept spaces/dashes, clean them first
    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");
    const phoneRegex = /^(0)(5|6|7)[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError(t("invalidPhoneWarning"));
      return false;
    }

    setError(null);
    return true;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Check stock in Supabase products table
      const { data: currentProd, error: fetchErr } = await supabase
        .from("products")
        .select("stockCount")
        .eq("id", product.id)
        .maybeSingle();

      if (fetchErr && !fetchErr.message.includes("relation")) {
        throw new Error(fetchErr.message);
      }

      if (currentProd) {
        const currentStock = Number(currentProd.stockCount || 0);
        if (currentStock < quantity) {
          throw new Error(`Insufficient stock. Only ${currentStock} units remaining.`);
        }

        // Reduce stock in Supabase products table
        const { error: updateErr } = await supabase
          .from("products")
          .update({ stockCount: currentStock - quantity })
          .eq("id", product.id);

        if (updateErr) {
          console.warn("Failed to update product stockCount in database:", updateErr);
        }
      }

      // 2. Format custom Algerian COD shipping address
      const wilayaName = selectedWilaya ? `${selectedWilaya.code} - ${selectedWilaya[language]}` : selectedWilayaCode;
      const communeName = selectedMiniStateName === "other" ? customMiniStateName.trim() : selectedMiniStateName;
      const deliveryMethodText = deliveryOption === "door" ? "Door Home Delivery" : "Stop Desk Delivery (Office Pick-up)";
      const addressDetailText = deliveryOption === "door" ? homeAddress.trim() : "N/A (Stop Desk Pick-up)";
      const formattedAddress = `Name: ${fullName.trim()} | Phone: ${phoneNumber.trim()} | State: ${wilayaName} | Commune: ${communeName} | Method: ${deliveryMethodText} | Address: ${addressDetailText}`;

      // Create structured item payload that matches CartItem interface
      const itemPayload: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageURL: product.imageURL,
        quantity: quantity,
        category: product.category
      };

      const generatedOrderId = `ord-${Math.random().toString(36).substr(2, 9)}`;

      const orderPayload = {
        orderId: generatedOrderId,
        userId: user ? user.uid : "guest",
        items: [itemPayload],
        totalAmount: totalAmount,
        status: "Pending",
        shippingAddress: formattedAddress,
        createdAt: new Date().toISOString()
      };

      // 3. Save order log to Supabase
      const { error: orderErr } = await supabase
        .from("orders")
        .insert([orderPayload]);

      if (orderErr) {
        console.warn("Failed to save order to Supabase (table may be missing). Proceeding with local confirmation.", orderErr);
      }

      // 4. Update authenticated user's history if logged in
      if (user) {
        try {
          await addOrderToHistory(generatedOrderId);
        } catch (historyErr) {
          console.warn("Failed to update profile order history log:", historyErr);
        }
      }

      setCompletedOrderId(generatedOrderId);
      showToast(t("orderSuccessTitle"), "success");
    } catch (err: any) {
      console.error("Direct purchase error:", err);
      setError(err.message || "An transmission error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setCompletedOrderId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        {/* Backdrop overlay */}
        <div className="absolute inset-0" onClick={handleClose} />

        {/* Modal content body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          className={`relative w-full max-w-xl border shadow-2xl z-10 rounded-none overflow-hidden flex flex-col max-h-[90vh] transition-all duration-200 ${
            theme === "dark" ? "bg-[#0d111b] border-[#00d2ff]/30 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {/* Accent corner line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#ff6b35] dark:bg-gradient-to-r dark:from-[#00d2ff] dark:via-[#ff6b35] dark:to-[#00d2ff]" />

          {/* Header */}
          <div className={`p-5 border-b flex justify-between items-center transition-colors ${
            theme === "dark" ? "border-slate-800 bg-[#121624]" : "border-slate-100 bg-slate-50"
          }`}>
            <div>
              <h3 className={`font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-slate-800"
              }`}>
                <Truck className={`w-4 h-4 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
                {completedOrderId ? t("orderSuccessTitle") : t("directCheckout")}
              </h3>
              <p className={`text-[10px] font-mono uppercase tracking-widest mt-0.5 ${
                theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"
              }`}>
                SBB COURIER ROUTING // ALGERIA_COD_PORTAL
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`p-1.5 transition-colors ${
                theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {completedOrderId ? (
              /* Success screen layout */
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6 space-y-5 font-sans"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto rounded-none">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h4 className={`text-lg font-black uppercase tracking-wide ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}>
                    {t("orderSuccessTitle")}
                  </h4>
                  <p className={`text-xs max-w-md mx-auto leading-relaxed ${
                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                  }`}>
                    {t("orderSuccessMsg")}
                  </p>
                </div>

                {/* Receipt Card */}
                <div className={`p-4 border text-left font-mono text-xs space-y-3 max-w-md mx-auto transition-colors ${
                  theme === "dark" ? "bg-[#121624] border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className={`flex justify-between border-b pb-2 ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                    <span className="text-slate-500 uppercase">{t("orderIdLabel")}:</span>
                    <span className={`font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{completedOrderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase">{t("manifest")}:</span>
                    <span className={theme === "dark" ? "text-slate-200" : "text-slate-700"}>{product.name} (x{quantity})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase">{t("destinationLabel")}:</span>
                    <span className={`line-clamp-2 text-right max-w-[200px] ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`} title={`${fullName}, ${selectedMiniStateName}, ${selectedWilaya ? selectedWilaya[language] : ""}`}>
                      {selectedMiniStateName}, {selectedWilaya ? selectedWilaya[language] : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase">{t("deliveryOptionLabel").replace(" *", "")}:</span>
                    <span className={theme === "dark" ? "text-slate-200" : "text-slate-700"}>
                      {deliveryOption === "door" ? t("doorDelivery").split(" ")[0] : t("deskDelivery").split(" ")[0]}
                    </span>
                  </div>
                  <div className={`flex justify-between border-t border-dashed pt-2 ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                    <span className="text-slate-500 uppercase">{t("deliveryPriceLabel")}:</span>
                    <span className={theme === "dark" ? "text-slate-200" : "text-slate-700"}>{deliveryPrice.toLocaleString()} DA</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t text-sm ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                    <span className="text-slate-400 font-bold uppercase">{t("totalWithDeliveryLabel")}:</span>
                    <span className={`font-black ${theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"}`}>{totalAmount.toLocaleString()} DA</span>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className={`px-6 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-none ${
                    theme === "dark"
                      ? "bg-[#00d2ff] text-[#0d111b] hover:bg-white"
                      : "bg-[#00a8cc] text-white hover:bg-[#00a8cc]/90"
                  }`}
                >
                  {t("backToCatalogue")}
                </button>
              </motion.div>
            ) : (
              /* Checkout form layout */
              <form onSubmit={handlePlaceOrder} className="space-y-5">
                {/* Product Detail Banner */}
                <div className={`p-4 border flex gap-4 items-center rounded-none transition-colors ${
                  theme === "dark" ? "bg-[#121624] border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover bg-black border border-white/5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                      theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
                    }`}>
                      {product.category}
                    </span>
                    <h4 className={`text-xs font-bold truncate ${theme === "dark" ? "text-white" : "text-slate-800"}`}>{product.name}</h4>
                    <span className={`text-xs font-mono font-bold mt-1 block ${
                      theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"
                    }`}>
                      {product.price.toLocaleString()} DA
                    </span>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Qty</span>
                    <div className={`flex items-center border ${
                      theme === "dark" ? "border-slate-700 bg-[#0d111b]" : "border-slate-300 bg-white"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className={`px-2 py-1 font-bold transition-colors ${
                          theme === "dark" ? "text-[#00d2ff] hover:bg-[#00d2ff]/10" : "text-[#00a8cc] hover:bg-[#00a8cc]/10"
                        }`}
                      >
                        -
                      </button>
                      <span className={`px-3 text-xs font-mono font-bold ${theme === "dark" ? "text-white" : "text-slate-700"}`}>{quantity}</span>
                      <button
                        type="button"
                        disabled={quantity >= product.stockCount}
                        onClick={() => setQuantity(q => Math.min(product.stockCount, q + 1))}
                        className={`px-2 py-1 font-bold disabled:opacity-30 transition-colors ${
                          theme === "dark" ? "text-[#00d2ff] hover:bg-[#00d2ff]/10" : "text-[#00a8cc] hover:bg-[#00a8cc]/10"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info alert */}
                <div className="p-3 bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35] flex gap-2 rounded-none items-start">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-[10px] font-mono uppercase tracking-wider leading-relaxed">
                    {t("codNotice")}
                  </span>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase flex gap-2 rounded-none">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-4 font-mono text-xs">
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
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDeliveryOption("door")}
                          className={`p-3 border text-left flex flex-col justify-between transition-all rounded-none ${
                            deliveryOption === "door"
                              ? (theme === "dark" ? "border-[#00d2ff] bg-[#00d2ff]/10 text-white" : "border-[#00a8cc] bg-[#00a8cc]/10 text-slate-800")
                              : (theme === "dark" ? "border-slate-800 hover:border-slate-700 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50")
                          }`}
                        >
                          <span className="text-xs font-bold uppercase">{t("doorDelivery").split(" ")[0]} 🏠</span>
                          <span className={`text-[10px] font-mono mt-1 ${deliveryOption === "door" ? "text-[#ff6b35]" : "text-slate-500"}`}>
                            {selectedWilaya.doorPrice} DA
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryOption("desk")}
                          className={`p-3 border text-left flex flex-col justify-between transition-all rounded-none ${
                            deliveryOption === "desk"
                              ? (theme === "dark" ? "border-[#00d2ff] bg-[#00d2ff]/10 text-white" : "border-[#00a8cc] bg-[#00a8cc]/10 text-slate-800")
                              : (theme === "dark" ? "border-slate-800 hover:border-slate-700 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50")
                          }`}
                        >
                          <span className="text-xs font-bold uppercase">{t("deskDelivery").split(" ")[0]} 🏢</span>
                          <span className={`text-[10px] font-mono mt-1 ${deliveryOption === "desk" ? "text-[#ff6b35]" : "text-slate-500"}`}>
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
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-[#00d2ff] flex gap-2 rounded-none items-start">
                      <Info className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="text-[10px] font-mono uppercase tracking-wider leading-relaxed">
                        {t("deskAddressNotice")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer specs / totals */}
                <div className={`pt-4 border-t space-y-2 font-mono text-xs ${
                  theme === "dark" ? "border-slate-800" : "border-slate-100"
                }`}>
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase">
                    <span>{t("unitCost")}:</span>
                    <span>{(product.price * quantity).toLocaleString()} DA</span>
                  </div>
                  {selectedWilaya && (
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase">
                      <span>{t("deliveryPriceLabel")}:</span>
                      <span>{deliveryPrice.toLocaleString()} DA</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">{t("totalWithDeliveryLabel")}</span>
                      <span className={`text-xl font-bold ${theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"}`}>
                        {totalAmount.toLocaleString()} DA
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className={`px-4 py-2 border rounded-none transition-colors ${
                          theme === "dark"
                            ? "border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
                            : "border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        {t("cancelButton")}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            <span>{t("orderingProgress")}</span>
                          </>
                        ) : (
                        <>
                          <span>{t("submitOrderButton")}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
