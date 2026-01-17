"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const currentPath = pathname || window.location.pathname;

    // Skip auth check for public pages, but only if user is not already authenticated
    // This allows redirects after login to work properly
    const isPublicPage =
      currentPath === "/" ||
      currentPath.startsWith("/menu/") ||
      currentPath.startsWith("/order/") ||
      currentPath.startsWith("/auth/login") ||
      currentPath.startsWith("/auth/register") ||
      currentPath.startsWith("/kitchen/login") ||
      currentPath === "/contact" ||
      currentPath.startsWith("/contact");

    // If user is authenticated and on login page, redirect them
    if (
      user &&
      (currentPath.startsWith("/auth/login") ||
        currentPath.startsWith("/auth/register"))
    ) {
      console.log("✅ User already authenticated on login page - redirecting");
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.restaurant) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
      setLoading(false);
      return;
    }

    // For protected pages (admin, dashboard), always check authentication
    const isProtectedPage =
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/dashboard") ||
      currentPath.startsWith("/kitchen");

    // Only check authentication for protected pages to avoid 401 errors on public pages
    // For public pages, we skip the auth check to avoid unnecessary API calls and 401 errors
    if (!isProtectedPage) {
      // Public page - skip auth check to avoid 401 errors
      // User state will remain null for public pages unless already set
      console.log("🌐 Public page, skipping auth check to avoid 401 errors");
      setLoading(false);
      return;
    }

    // Check authentication only for protected pages (dashboard, admin, kitchen)
    try {
      console.log("🔐 Checking auth with httpOnly cookie (protected page)");
      console.log("📡 Fetching user profile...");
      const response = await api.get("/auth/me");
      console.log("✅ User profile fetched:", response.data.data.user);
      const fetchedUser = response.data.data.user;
      setUser(fetchedUser);
      console.log("🔐 User state updated, isAuthenticated:", !!fetchedUser);

      // Check if user is on the wrong page and redirect accordingly
      if (fetchedUser.role === "ADMIN" && !currentPath.startsWith("/admin")) {
        // Admin user not on admin page
        if (
          currentPath.startsWith("/dashboard") ||
          currentPath.startsWith("/order/") ||
          isProtectedPage
        ) {
          console.log("🔄 Redirecting admin to admin dashboard");
          router.push("/admin");
        }
      } else if (
        fetchedUser.role === "OWNER" &&
        currentPath.startsWith("/admin")
      ) {
        // Owner user on admin page
        console.log("🔄 Redirecting owner to restaurant dashboard");
        router.push("/dashboard");
      } else if (
        isProtectedPage &&
        fetchedUser.role === "OWNER" &&
        !fetchedUser.restaurant &&
        !currentPath.startsWith("/onboarding")
      ) {
        // Owner without restaurant should go to onboarding
        console.log("🔄 Redirecting owner without restaurant to onboarding");
        router.push("/onboarding");
      }
      // For public pages with authenticated user, don't redirect here
      // Let the page component handle the redirect (e.g., home page)
    } catch (error: any) {
      console.error(
        "❌ Auth check failed:",
        error.response?.data || error.message
      );
      // Clear user state and any stale localStorage tokens
      setUser(null);
      localStorage.removeItem("token");
      console.log("🔐 User state cleared, isAuthenticated: false");

      // If on protected page and auth failed, redirect to login
      if (isProtectedPage) {
        console.log("🔄 Redirecting to login (protected page, auth failed)");
        if (currentPath.startsWith("/admin")) {
          router.push("/auth/login");
        } else if (currentPath.startsWith("/dashboard")) {
          router.push("/auth/login");
        } else if (currentPath.startsWith("/kitchen")) {
          router.push("/kitchen/login");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  // Check if user is authenticated on mount and when pathname changes
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("🔐 Attempting login for:", email);
      console.log("🌐 API URL:", api.defaults.baseURL);
      console.log("🍪 withCredentials:", api.defaults.withCredentials);

      const response = await api.post("/auth/login", { email, password });

      // Check for Set-Cookie header in response
      const setCookieHeader = response.headers["set-cookie"];
      console.log("🍪 Set-Cookie header from response:", setCookieHeader);
      console.log("📋 Response headers:", {
        "set-cookie": setCookieHeader,
        "access-control-allow-origin":
          response.headers["access-control-allow-origin"],
        "access-control-allow-credentials":
          response.headers["access-control-allow-credentials"],
      });

      const { user } = response.data.data;
      console.log("✅ Login successful. User:", user);

      // Check if cookie was set in browser
      if (typeof document !== "undefined") {
        const cookies = document.cookie;
        console.log("🍪 All cookies after login:", cookies);
        const authToken = cookies
          .split("; ")
          .find((row) => row.startsWith("auth-token="));
        console.log("🔑 auth-token cookie found:", !!authToken);
        if (authToken) {
          console.log("✅ Cookie successfully set in browser!");
        } else {
          console.warn(
            "⚠️ Cookie NOT found in browser - this may cause issues!"
          );
        }
      }

      setUser(user);
      console.log(
        "🔐 Login successful, user state updated, isAuthenticated:",
        !!user
      );
      toast.success("Login successful");

      // Redirect immediately based on role
      // Use router.push for client-side navigation which is faster
      // Check if we're on kitchen login page - if so, don't redirect here (let the page handle it)
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/kitchen/login")
      ) {
        console.log("🔄 Redirecting based on role:", user.role);
        console.log("🔄 User restaurant:", user.restaurant);

        // Use a small delay to ensure state is updated and cookie is set
        setTimeout(() => {
          if (user.role === "ADMIN") {
            console.log("👑 Redirecting admin to admin dashboard");
            router.push("/admin");
          } else if (user.restaurant) {
            console.log("🏪 Redirecting owner to restaurant dashboard");
            router.push("/dashboard");
          } else {
            console.log("📝 Redirecting to onboarding");
            router.push("/onboarding");
          }
        }, 100); // Small delay to ensure state update
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      console.error("❌ Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
      });

      // Don't show toast here - let the login page component handle translation
      // The error message will be translated in the login page component
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
