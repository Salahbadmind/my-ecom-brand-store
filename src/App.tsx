/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
// @ts-expect-error - Vite handles raw image resolution at runtime
import logoImage from "./assets/images/sbb_tech_logo_1782896699199.jpg";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ProductList } from "./components/ProductList";
import { AdminPanel } from "./components/AdminPanel";
import { OrderHistory } from "./components/OrderHistory";
import { AuthModal } from "./components/AuthModal";
import { 
  ShoppingBag, 
  User, 
  Terminal, 
  Settings, 
  LogOut, 
  Cpu, 
  Grid, 
  History, 
  ExternalLink,
  ShieldAlert,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function MainAppContent() {
  const { user, profile, logout } = useAuth();
  const { toast, hideToast } = useCart();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  // Navigation Routing Tab State: "home" | "admin" | "profile"
  const [currentTab, setCurrentTab] = useState<"home" | "admin" | "profile">("home");
  
  // Dialog States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === "dark" 
        ? "bg-[#07090e] text-slate-100 selection:bg-[#00d2ff] selection:text-black" 
        : "bg-[#f8f9fa] text-slate-900 selection:bg-[#ff6b35] selection:text-white"
    } flex flex-col justify-between font-sans ${isRtl ? "text-right" : "text-left"}`}>
      {/* Background Matrix/Hex Accent Layer */}
      <div className={`absolute inset-0 pointer-events-none ${
        theme === "dark"
          ? "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,210,255,0.04),rgba(255,107,53,0.01))]"
          : "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,168,204,0.03),rgba(229,98,18,0.02))]"
      }`} />

      {/* Header Panel */}
      <header className={`sticky top-0 z-40 transition-colors duration-200 border-b ${
        theme === "dark"
          ? "bg-[#0d111b]/95 backdrop-blur-md border-[#00d2ff]/20"
          : "bg-white/95 backdrop-blur-md border-slate-200/80 shadow-sm"
      } px-4 py-3 md:px-8`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <button 
            onClick={() => { setCurrentTab("home"); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 group ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}
          >
            <div className={`w-11 h-11 shrink-0 border transition-colors ${
              theme === "dark" ? "border-[#00d2ff]/30 bg-black/40" : "border-slate-300 bg-slate-100"
            } overflow-hidden flex items-center justify-center`}>
              <img 
                src={logoImage} 
                alt="SBB TECH" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-display font-black text-lg leading-none tracking-tight transition-colors">
                {language === "en" ? (
                  <span className={theme === "dark" ? "text-white" : "text-slate-900"}>
                    SBB <span className="text-[#00d2ff]">TECH</span> STORE
                  </span>
                ) : (
                  <span className="text-[#00d2ff] font-bold">متجر SBB تيك</span>
                )}
              </h1>
            </div>
          </button>

          {/* Navigation Links - Desktop */}
          <nav className={`hidden md:flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => setCurrentTab("home")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-none text-xs uppercase font-mono tracking-widest font-bold transition-all border ${
                currentTab === "home"
                  ? theme === "dark"
                    ? "bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/30"
                    : "bg-slate-200/60 text-[#00a8cc] border-slate-300"
                  : theme === "dark"
                    ? "text-slate-400 hover:text-white border-transparent"
                    : "text-slate-600 hover:text-slate-900 border-transparent"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              {t("catalogue")}
            </button>

            {user && (
              <button
                onClick={() => setCurrentTab("profile")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-none text-xs uppercase font-mono tracking-widest font-bold transition-all border ${
                  currentTab === "profile"
                    ? theme === "dark"
                      ? "bg-[#00d2ff]/10 text-[#00d2ff] border-[#00d2ff]/30"
                      : "bg-slate-200/60 text-[#00a8cc] border-slate-300"
                    : theme === "dark"
                      ? "text-slate-400 hover:text-white border-transparent"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                {t("purchaseLogs")}
              </button>
            )}

            {profile?.isAdmin && (
              <button
                onClick={() => setCurrentTab("admin")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-none text-xs uppercase font-mono tracking-widest font-bold transition-all border ${
                  currentTab === "admin"
                    ? theme === "dark"
                      ? "bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/30"
                      : "bg-[#ff6b35]/10 text-[#e56212] border-[#ff6b35]/30"
                    : theme === "dark"
                      ? "text-[#ff6b35] hover:text-[#ff6b35]/80 border-transparent"
                      : "text-[#e56212] hover:text-[#e56212]/80 border-transparent"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                {t("adminDeck")}
              </button>
            )}
          </nav>

          {/* Right Action Controllers */}
          <div className={`hidden md:flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 border transition-all flex items-center justify-center rounded-none ${
                theme === "dark"
                  ? "border-amber-500/30 bg-[#1a1a2e] text-amber-400 hover:text-amber-300 hover:border-amber-400/60"
                  : "border-slate-300 bg-white text-slate-700 hover:text-slate-950 hover:border-slate-400 shadow-sm"
              }`}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className={`px-2.5 py-1.5 border transition-all flex items-center gap-1 uppercase text-xs font-mono font-bold rounded-none ${
                theme === "dark"
                  ? "border-[#00d2ff]/30 bg-[#1a1a2e] text-slate-300 hover:text-[#00d2ff]"
                  : "border-slate-300 bg-white text-slate-700 hover:text-slate-900 shadow-sm"
              }`}
            >
              <span className="text-xs">🌐</span>
              <span>{language === "en" ? "العربية" : "ENGLISH"}</span>
            </button>

            {/* User Session status */}
            {user ? (
              <div className={`flex items-center gap-3 pl-3 pr-3 ${isRtl ? "border-r border-l-0" : "border-l"} ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                <div className={isRtl ? "text-left" : "text-right"}>
                  <span className={`block text-xs font-sans font-bold line-clamp-1 ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                    {profile?.displayName || user.email}
                  </span>
                  <span className={`block text-[9px] font-mono uppercase tracking-widest ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>
                    {profile?.isAdmin ? "ADMIN_CLEARANCE" : "STORE_CLIENT"}
                  </span>
                </div>
                
                <button
                  onClick={() => { logout(); setCurrentTab("home"); }}
                  className={`p-2 rounded-none transition-colors border ${
                    theme === "dark"
                      ? "bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border-red-500/30"
                      : "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200"
                  }`}
                  title="Disconnect Security Credentials"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className={`px-4 py-1.5 border font-bold uppercase tracking-widest text-xs transition-all rounded-none ${
                  theme === "dark"
                    ? "border-[#00d2ff] text-[#00d2ff] hover:bg-[#00d2ff]/10"
                    : "border-[#00a8cc] text-[#00a8cc] hover:bg-[#00a8cc]/10"
                }`}
              >
                {t("authenticate")}
              </button>
            )}
          </div>

          {/* Mobile controllers */}
          <div className="flex items-center md:hidden gap-2">
            {/* Theme Switcher (Mobile) */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 border rounded-none ${
                theme === "dark"
                  ? "bg-[#1a1a2e] border-amber-500/40 text-amber-400"
                  : "bg-white border-slate-300 text-slate-700 shadow-sm"
              }`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher (Mobile) */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className={`p-1.5 rounded-none border text-xs font-mono font-bold ${
                theme === "dark"
                  ? "bg-[#1a1a2e] border-[#00d2ff]/40 text-slate-300"
                  : "bg-white border-slate-300 text-slate-700 shadow-sm"
              }`}
            >
              {language === "en" ? "AR" : "EN"}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-none border ${
                theme === "dark"
                  ? "bg-[#1a1a2e] border-[#00d2ff]/40 text-slate-400 hover:text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm"
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>
      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#16213e] border-b border-[#00d2ff]/20 px-4 py-4 space-y-4 relative z-30"
          >
            <div className="flex flex-col gap-2 font-mono text-xs">
              <button
                onClick={() => { setCurrentTab("home"); setIsMobileMenuOpen(false); }}
                className={`py-2 text-left uppercase ${currentTab === "home" ? "text-[#00d2ff]" : "text-slate-400"}`}
              >
                // {t("catalogue").toUpperCase()}
              </button>

              {user && (
                <button
                  onClick={() => { setCurrentTab("profile"); setIsMobileMenuOpen(false); }}
                  className={`py-2 text-left uppercase ${currentTab === "profile" ? "text-[#00d2ff]" : "text-slate-400"}`}
                >
                  // {t("purchaseLogs").toUpperCase()}
                </button>
              )}

              {profile?.isAdmin && (
                <button
                  onClick={() => { setCurrentTab("admin"); setIsMobileMenuOpen(false); }}
                  className={`py-2 text-left uppercase text-[#ff6b35]`}
                >
                  // {t("adminDeck").toUpperCase()}
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-[#00d2ff]/20 flex items-center justify-between">
              {user ? (
                <>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-white max-w-[150px] truncate">{profile?.displayName || user.email}</span>
                    <span className="block text-[9px] font-mono text-[#00d2ff] uppercase">{profile?.isAdmin ? "ADMIN" : "CLIENT"}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setCurrentTab("home"); setIsMobileMenuOpen(false); }}
                    className="px-3 py-1.5 bg-red-950/20 text-red-400 border border-red-500/30 text-xs uppercase font-mono rounded-none"
                  >
                    {t("disconnect")}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-2 border border-[#00d2ff] text-[#00d2ff] font-bold uppercase tracking-widest text-xs rounded-none text-center bg-transparent hover:bg-[#00d2ff]/10"
                >
                  {t("authenticate")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Visual Frame */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-8 relative z-10">
        
        {/* Dynamic Route views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {currentTab === "home" && <ProductList />}
            
            {currentTab === "admin" && (
              <AdminPanel onAuthClick={() => setIsAuthOpen(true)} />
            )}
            
            {currentTab === "profile" && <OrderHistory />}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Toast Notifications System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 border rounded-none shadow-[0_0_20px_rgba(0,210,255,0.15)] max-w-xs flex items-center justify-between gap-3 ${
              toast.type === "success"
                ? "bg-[#16213e] border-emerald-500/40 text-emerald-300"
                : toast.type === "error"
                ? "bg-[#16213e] border-[#ff6b35]/40 text-[#ff6b35]"
                : "bg-[#16213e] border-[#00d2ff]/40 text-[#00d2ff]"
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold uppercase tracking-wider">
                {toast.type === "success" && "[ OK ]"}
                {toast.type === "error" && "[ ERR ]"}
                {toast.type === "info" && "[ INFO ]"}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={hideToast}
              className="text-gray-400 hover:text-white font-mono text-[10px] font-bold"
            >
              [X]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Slide-outs */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Cybernetic Footer */}
      <footer className={`border-t transition-colors duration-200 px-4 py-6 mt-12 text-center relative overflow-hidden ${
        theme === "dark" 
          ? "border-[#00d2ff]/10 bg-[#0d111b] text-slate-400" 
          : "border-slate-200 bg-white text-slate-600 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={isRtl ? "text-right" : "text-left"}>
            <span className={`font-display font-black text-sm block uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-slate-800"}`}>SBB TECH STORE // INC.</span>
            <span className="text-[9px] font-mono text-slate-500 uppercase block mt-1 tracking-widest">
              NODE_ENV: production // FIREBASE_REGION: us-east-1 // SBB-TECH-STORE-OS V1.1.0
            </span>
          </div>

          <div className="font-mono text-[9px] text-slate-500 flex flex-wrap gap-4 items-center uppercase tracking-wider justify-end">
            <span>CENTRAL_NODE: SBB_SYS_PORT_3000</span>
            <span className="hidden sm:inline">|</span>
            <span className={`font-bold flex items-center gap-1 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`}>
              <span className={`h-1.5 w-1.5 rounded-none animate-pulse inline-block ${theme === "dark" ? "bg-[#00d2ff]" : "bg-[#00a8cc]"}`} />
              Database Online (Firestore)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <MainAppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
