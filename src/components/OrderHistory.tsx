import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { Order } from "../types";
import { ShoppingBag, Calendar, Truck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion } from "motion/react";

export const OrderHistory: React.FC = () => {
  const { profile, user } = useAuth();
  const { t, isRtl } = useLanguage();
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!profile || !profile.orderHistory || profile.orderHistory.length === 0) {
        setOrders([]);
        return;
      }

      setLoading(true);
      try {
        const fetchedOrders: Order[] = [];
        
        // Fetch matching orders from Supabase orders table
        const { data: dbOrders, error: ordersErr } = await supabase
          .from("orders")
          .select("*")
          .in("orderId", profile.orderHistory);

        if (ordersErr) {
          console.warn("Could not retrieve orders from Supabase orders table. Table may not exist.", ordersErr);
        } else if (dbOrders) {
          dbOrders.forEach((o: any) => {
            fetchedOrders.push({
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

        // Sort descending by date
        fetchedOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error loading order history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [profile]);

  if (!user) {
    return (
      <div className={`p-8 border rounded-none text-center transition-colors ${
        theme === "dark" 
          ? "border-[#00d2ff]/20 bg-[#121624]/60 text-white" 
          : "border-slate-200 bg-slate-50 text-slate-800"
      }`}>
        <h3 className={`font-display font-black text-sm uppercase tracking-wider ${
          theme === "dark" ? "text-white" : "text-slate-800"
        }`}>{t("userAuthRequired")}</h3>
        <p className={`text-xs mt-2 max-w-sm mx-auto font-mono ${
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}>
          {t("userAuthRequiredDesc")}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`py-20 text-center font-mono text-xs animate-pulse uppercase tracking-widest ${
        theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
      }`}>
        {t("retrievingSecurePurchaseFiles")}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={`p-10 border border-dashed rounded-none text-center font-mono text-xs space-y-2 transition-colors ${
        theme === "dark" 
          ? "border-[#00d2ff]/20 bg-[#121624]/30 text-slate-500" 
          : "border-slate-300 bg-slate-50/50 text-slate-400"
      }`}>
        <ShoppingBag className={`w-8 h-8 mx-auto ${theme === "dark" ? "text-slate-600" : "text-slate-300"}`} />
        <p className="uppercase tracking-widest">{t("logsEmpty")}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? "text-right" : "text-left"}`}>
      <h3 className={`font-display font-black text-sm uppercase tracking-wider ${
        theme === "dark" ? "text-white" : "text-slate-800"
      }`}>
        {t("systemPurchaseLogs")}
      </h3>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className={`p-4 border rounded-none space-y-3 transition-colors ${
              theme === "dark" 
                ? "bg-[#121624] border-slate-800" 
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            {/* Top info */}
            <div className={`flex flex-col sm:flex-row justify-between sm:items-center border-b pb-2.5 gap-2 font-mono text-xs ${
              isRtl ? "sm:flex-row-reverse" : ""
            } ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <div>
                <span className="text-slate-500">{t("sysId")}:</span>{" "}
                <span className={`font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{order.orderId}</span>
              </div>
              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                
                {/* Status indicator */}
                <span className={`px-2 py-0.5 rounded-none text-[9px] uppercase font-bold flex items-center gap-1 border ${
                  order.status === "Completed"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : order.status === "Shipped"
                    ? theme === "dark" 
                      ? "bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/20" 
                      : "bg-[#00a8cc]/10 text-[#00a8cc] border-[#00a8cc]/20"
                    : order.status === "Cancelled"
                    ? "bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/20"
                    : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                }`}>
                  {order.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
                  {order.status === "Cancelled" && <XCircle className="w-3 h-3" />}
                  {order.status !== "Completed" && order.status !== "Cancelled" && <Clock className="w-3 h-3" />}
                  {order.status}
                </span>
              </div>
            </div>

            {/* List of ordered items */}
            <div className="space-y-1.5">
              {order.items?.map((item) => (
                <div key={item.id} className={`flex justify-between text-xs font-mono ${
                  isRtl ? "flex-row-reverse" : ""
                } ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                  <span>
                    {item.name} <strong className={`font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>x{item.quantity}</strong>
                  </span>
                  <span className={theme === "dark" ? "text-[#ff6b35]" : "text-[#e56212]"}>
                    {(item.price * item.quantity).toLocaleString()} DA
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className={`pt-2.5 border-t flex justify-between items-baseline font-mono text-xs ${
              isRtl ? "flex-row-reverse" : ""
            } ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
              <div className={isRtl ? "text-right" : "text-left"}>
                <span className="text-slate-500 block text-[9px] uppercase">{t("destination")}</span>
                <span className={`line-clamp-1 max-w-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{order.shippingAddress}</span>
              </div>
              <div className={isRtl ? "text-left" : "text-right"}>
                <span className="text-[9px] text-slate-500 uppercase block">{t("total")}</span>
                <span className={`text-sm font-bold ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>{order.totalAmount.toLocaleString()} DA</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
