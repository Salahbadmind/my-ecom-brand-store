import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { X, LogIn, UserPlus, Chrome, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
  const { language, t, isRtl } = useLanguage();
  const { theme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError(language === "en" ? "Please fill in all fields." : "يرجى ملء جميع الحقول.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(language === "en" ? "Password must be at least 6 characters long." : "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        // Inform user to check email if verification is required, or let them log in
        setError(language === "en" ? "Verification email sent if enabled, or registration successful!" : "تم إرسال بريد التحقق أو إتمام التسجيل بنجاح!");
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An unexpected auth error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Google Login failed.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        {/* Backdrop close click */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-md p-6 overflow-hidden border rounded-none shadow-2xl z-10 transition-all duration-200 ${
            theme === "dark" 
              ? "bg-[#0d111b] border-[#00d2ff]/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]" 
              : "bg-white border-slate-200 shadow-xl"
          }`}
        >
          {/* Cyber accents */}
          <div className="absolute top-0 left-0 w-8 h-[2px] bg-[#00d2ff] hidden dark:block" />
          <div className="absolute top-0 left-0 w-[2px] h-8 bg-[#00d2ff] hidden dark:block" />
          <div className="absolute top-0 right-0 w-8 h-[2px] bg-[#ff6b35] hidden dark:block" />
          <div className="absolute top-0 right-0 w-[2px] h-8 bg-[#ff6b35] hidden dark:block" />

          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1 transition-colors ${
              theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className={`text-xl font-display font-black tracking-wider uppercase ${
              theme === "dark" ? "text-white" : "text-slate-800"
            }`}>
              {isSignUp 
                ? (language === "en" ? "Create Account" : "إنشاء حساب جديد") 
                : (language === "en" ? "Access Database" : "تسجيل الدخول")}
            </h2>
            <p className={`mt-1 text-[9px] font-mono tracking-widest uppercase ${
              theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"
            }`}>
              {language === "en" ? "SBB TECH STORE // ACCESS_PORTAL" : "متجر SBB تيك // بوابة الدخول"}
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 text-[10px] border border-[#ff6b35]/30 bg-[#ff6b35]/5 text-[#ff6b35] rounded-none font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#ff6b35]" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-[10px] uppercase font-mono tracking-wider mb-1 ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}>
                {language === "en" ? "Security Email" : "البريد الإلكتروني الأمني"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@sbbstore.com"
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
                {language === "en" ? "Access Code / Password" : "رمز الدخول / كلمة المرور"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className={`w-full px-3 py-2 pr-10 rounded-none focus:outline-none focus:ring-1 font-mono text-xs transition-colors ${
                    theme === "dark"
                      ? "bg-[#121624] border border-[#00d2ff]/30 text-white focus:ring-[#00d2ff]"
                      : "bg-slate-50 border border-slate-300 text-slate-800 focus:ring-[#00a8cc] focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-3 flex items-center transition-colors ${
                    theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#ff6b35] text-white hover:bg-[#ff6b35]/90 font-bold uppercase tracking-wider font-sans text-xs rounded-none flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-none animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  {language === "en" ? "Sign Up" : "تسجيل حساب"}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {language === "en" ? "Authenticate" : "تسجيل الدخول"}
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative flex items-center justify-center my-6">
            <div className={`absolute inset-x-0 h-[1px] ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`} />
            <span className={`relative px-3 text-[10px] uppercase font-mono tracking-widest text-slate-500 ${
              theme === "dark" ? "bg-[#0d111b]" : "bg-white"
            }`}>
              {language === "en" ? "Or Connect Via" : "أو الاتصال عبر"}
            </span>
          </div>

          {/* Social login */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className={`w-full py-2 px-4 border font-bold font-sans text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2.5 transition-all ${
              theme === "dark"
                ? "border-[#00d2ff]/30 hover:border-[#00d2ff] bg-[#00d2ff]/5 text-white hover:bg-[#00d2ff]/10"
                : "border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Chrome className={`w-4 h-4 ${theme === "dark" ? "text-[#00d2ff]" : "text-[#00a8cc]"}`} />
            <span>{language === "en" ? "Google Core Credentials" : "بيانات اعتماد Google"}</span>
          </button>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className={`text-[10px] transition-colors underline decoration-dotted underline-offset-4 uppercase font-mono ${
                theme === "dark" ? "text-slate-400 hover:text-[#00d2ff]" : "text-slate-500 hover:text-[#00a8cc]"
              }`}
            >
              {isSignUp
                ? (language === "en" ? "Already registered? Use Existing Credentials" : "هل لديك حساب بالفعل؟ سجل الدخول")
                : (language === "en" ? "Need security clearance? Create New Account" : "بحاجة إلى تصريح أمني؟ أنشئ حساباً جديداً")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
