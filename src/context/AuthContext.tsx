import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { UserProfile } from "../types";

export interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileCart: (cartItems: any[]) => Promise<void>;
  addOrderToHistory: (orderId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync session handler
  const handleSession = async (session: any) => {
    if (session?.user) {
      const currentUser = session.user;
      const userMock: User = {
        uid: currentUser.id,
        email: currentUser.email || "",
        displayName: currentUser.user_metadata?.display_name || currentUser.user_metadata?.full_name || "SBB Tech Member"
      };
      setUser(userMock);

      const isAdminEmail = 
        currentUser.email === "sbouragbi5@gmail.com" || 
        currentUser.email === "admin@sbbtechstore.com";

      try {
        // Fetch or create profile from Supabase profiles table
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("uid", currentUser.id)
          .maybeSingle();

        if (profileErr) {
          throw profileErr;
        }

        let userProfile: UserProfile;

        if (profileData) {
          // Update admin status if needed
          if (profileData.isAdmin !== isAdminEmail) {
            await supabase
              .from("profiles")
              .update({ isAdmin: isAdminEmail })
              .eq("uid", currentUser.id);
            userProfile = { ...profileData, isAdmin: isAdminEmail };
          } else {
            userProfile = {
              uid: profileData.uid,
              email: profileData.email,
              displayName: profileData.displayName || "SBB Tech Member",
              cartItems: Array.isArray(profileData.cartItems) ? profileData.cartItems : [],
              orderHistory: Array.isArray(profileData.orderHistory) ? profileData.orderHistory : [],
              isAdmin: profileData.isAdmin
            };
          }
        } else {
          // Insert a new profile
          userProfile = {
            uid: currentUser.id,
            email: currentUser.email || "",
            displayName: currentUser.user_metadata?.display_name || currentUser.user_metadata?.full_name || "SBB Tech Member",
            cartItems: [],
            orderHistory: [],
            isAdmin: isAdminEmail
          };
          
          const { error: insertErr } = await supabase
            .from("profiles")
            .insert([userProfile]);
            
          if (insertErr) {
            console.warn("Could not insert user profile in Supabase table (table may not exist yet):", insertErr);
          }
        }

        setProfile(userProfile);
      } catch (err: any) {
        console.error("Supabase Profile Sync Error, falling back to local memory:", err);
        // Resilient Fallback if tables are not created in Supabase yet!
        setProfile({
          uid: currentUser.id,
          email: currentUser.email || "",
          displayName: currentUser.user_metadata?.display_name || "SBB Tech Member (Local)",
          cartItems: [],
          orderHistory: [],
          isAdmin: isAdminEmail
        });
      }
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  // Set up Supabase Auth listener
  useEffect(() => {
    // 1. Check current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    }).catch(err => {
      console.error("Error fetching initial session:", err);
      setLoading(false);
    });

    // 2. Listen to state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Email Sign Up
  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: "SBB Tech Member"
        }
      }
    });

    if (err) {
      setError(err.message);
      throw err;
    }
  };

  // Email Sign In
  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (err) {
      setError(err.message);
      throw err;
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (err) throw err;
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Google Sign-In failed.");
      throw err;
    }
  };

  // Sign Out
  const logout = async () => {
    setError(null);
    try {
      const { error: err } = await supabase.auth.signOut();
      if (err) throw err;
    } catch (err: any) {
      console.error("Sign Out Error:", err);
      setError(err.message || "Sign-out failed.");
      throw err;
    }
  };

  // Sync cart items to database
  const updateProfileCart = async (cartItems: any[]) => {
    if (!user) return;
    try {
      const { error: syncErr } = await supabase
        .from("profiles")
        .update({ cartItems })
        .eq("uid", user.uid);

      if (syncErr) throw syncErr;
      setProfile(prev => prev ? { ...prev, cartItems } : null);
    } catch (err) {
      console.warn("Could not sync profile cart to Supabase database (table may be missing):", err);
      // Still update in-memory profile so app functions offline/partially configured!
      setProfile(prev => prev ? { ...prev, cartItems } : null);
    }
  };

  // Add completed order ID to history
  const addOrderToHistory = async (orderId: string) => {
    if (!user || !profile) return;
    try {
      const updatedHistory = [...(profile.orderHistory || []), orderId];
      const { error: syncErr } = await supabase
        .from("profiles")
        .update({ orderHistory: updatedHistory })
        .eq("uid", user.uid);

      if (syncErr) throw syncErr;
      setProfile(prev => prev ? { ...prev, orderHistory: updatedHistory } : null);
    } catch (err) {
      console.warn("Could not sync order history to Supabase database (table may be missing):", err);
      // Maintain state locally
      const updatedHistory = [...(profile.orderHistory || []), orderId];
      setProfile(prev => prev ? { ...prev, orderHistory: updatedHistory } : null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        error, 
        loginWithGoogle, 
        signUpWithEmail,
        signInWithEmail,
        logout,
        updateProfileCart,
        addOrderToHistory
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

