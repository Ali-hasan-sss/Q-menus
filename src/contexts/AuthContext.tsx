"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "CASHIER" | "ADMIN";
  emailVerified: boolean;
  restaurant?: {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    isActive: boolean;
    subscription?: {
      id: string;
      status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";
      startDate: string;
      endDate: string;
      plan: {
        id: string;
        name: string;
        nameAr?: string;
        type: "BASIC" | "PREMIUM" | "ENTERPRISE";
        price: number;
        currency: string;
        duration: number;
        maxTables: number;
        maxMenus: number;
        features: string[];
      };
    };
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: any) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "OWNER" | "CASHIER";
  restaurantName?: string;
  restaurantNameAr?: string;
}

interface UpdateProfileData {
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check if we're on a public page first
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;

      // Skip auth check for public pages
      if (
        currentPath === "/" ||
        currentPath.startsWith("/menu/") ||
        currentPath.startsWith("/order/")
      ) {
        console.log("🏠 Public page detected - skipping auth check");
        setUser(null);
        setLoading(false);
        return;
      }
    }

    try {
      console.log("🔐 Checking auth with httpOnly cookie");

      // Get user profile (token is automatically sent via httpOnly cookie)
      console.log("📡 Fetching user profile...");
      const response = await api.get("/auth/me");
      console.log("✅ User profile fetched:", response.data.data.user);
      const user = response.data.data.user;
      setUser(user);
      console.log("🔐 User state updated, isAuthenticated:", !!user);

      // Check if user is on the wrong page and redirect accordingly
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;

        if (user.role === "ADMIN" && !currentPath.startsWith("/admin")) {
          // Admin user not on admin page
          if (
            currentPath.startsWith("/dashboard") ||
            currentPath.startsWith("/order/")
          ) {
            console.log("🔄 Redirecting admin to admin dashboard");
            router.push("/admin");
          }
        } else if (user.role === "OWNER" && currentPath.startsWith("/admin")) {
          // Owner user on admin page
          console.log("🔄 Redirecting owner to restaurant dashboard");
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error(
        "❌ Auth check failed:",
        error.response?.data || error.message
      );
      // Clear user state and any stale localStorage tokens
      setUser(null);
      localStorage.removeItem("token");
      console.log("🔐 User state cleared, isAuthenticated: false");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("🔐 Attempting login for:", email);
      const response = await api.post("/auth/login", { email, password });

      const { user } = response.data.data;
      console.log("✅ Login successful. User:", user);

      setUser(user);
      console.log(
        "🔐 Login successful, user state updated, isAuthenticated:",
        !!user
      );
      toast.success("Login successful");

      // Wait a bit for the cookie to be set, then redirect
      setTimeout(() => {
        console.log("🔄 Redirecting based on role:", user.role);
        console.log("🔄 User restaurant:", user.restaurant);
        if (user.role === "ADMIN") {
          console.log("👑 Redirecting to admin dashboard");
          window.location.href = "/admin";
        } else if (user.restaurant) {
          console.log("🏪 Redirecting to restaurant dashboard");
          window.location.href = "/dashboard";
        } else {
          console.log("📝 Redirecting to onboarding");
          window.location.href = "/onboarding";
        }
      }, 100);
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token: string, user: any) => {
    try {
      setLoading(true);

      setUser(user);

      // Redirect based on role
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.restaurant) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      console.error("❌ Login with token failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await api.post("/auth/register", data);

      const { user } = response.data.data;

      setUser(user);
      toast.success("Registration successful");

      // Redirect based on role
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.restaurant) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear httpOnly cookie
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear any stale localStorage tokens
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logout successful");
    router.push("/auth/login");
  }, [router]);

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      const response = await api.put("/auth/profile", data);
      setUser(response.data.data.user);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      const message = error.response?.data?.message || "Profile update failed";
      toast.error(message);
      throw error;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
    } catch (error: any) {
      const message = error.response?.data?.message || "Password change failed";
      toast.error(message);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.data.user);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithToken,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
