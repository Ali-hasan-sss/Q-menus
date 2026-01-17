import axios from "axios";

const USE_PROXY = process.env.NEXT_PUBLIC_PROXY_API === "true";
const API_URL = USE_PROXY
  ? "/api"
  : process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "http://localhost:5000/api";

// API client for authenticated requests
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for Render free tier
  withCredentials: true, // Enable cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// API client for public requests (no auth required)
export const publicApi = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for Render free tier
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (cookies are automatically sent with withCredentials: true)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (for authenticated API)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear any stale localStorage tokens
      localStorage.removeItem("token");

      // Only redirect to login if:
      // 1. Not on public pages
      // 2. Not already on login/register pages
      // 3. The request was not for notifications (which can fail right after login)
      const currentPath = window.location.pathname;
      const isPublicPage =
        currentPath === "/" ||
        currentPath.startsWith("/menu/") ||
        currentPath.startsWith("/order/") ||
        currentPath.includes("/auth") ||
        currentPath.startsWith("/kitchen/login");

      // Don't redirect if:
      // - On public pages
      // - Request was for notifications (handled by NotificationContext with retry)
      const isNotificationRequest =
        error.config?.url?.includes("/notifications");

      if (
        typeof window !== "undefined" &&
        !isPublicPage &&
        !isNotificationRequest
      ) {
        // Small delay to avoid redirect loops
        setTimeout(() => {
          if (!isPublicPage && !window.location.pathname.includes("/auth")) {
            window.location.href = "/auth/login";
          }
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

// Response interceptor for public API (no auth handling)
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    me: "/auth/me",
    profile: "/auth/profile",
    changePassword: "/auth/change-password",
  },

  // Restaurant
  restaurant: {
    get: "/restaurant",
    update: "/restaurant",
    stats: "/restaurant/stats",
    toggleStatus: "/restaurant/toggle-status",
  },

  // Menu
  menu: {
    list: "/menu",
    create: "/menu",
    get: (id: string) => `/menu/${id}`,
    update: (id: string) => `/menu/${id}`,
    toggle: (id: string) => `/menu/${id}/toggle`,
    delete: (id: string) => `/menu/${id}`,
    categories: (menuId: string) => `/menu/${menuId}/categories`,
    createCategory: (menuId: string) => `/menu/${menuId}/categories`,
    updateCategory: (id: string) => `/menu/categories/${id}`,
    toggleCategory: (id: string) => `/menu/categories/${id}/toggle`,
    deleteCategory: (id: string) => `/menu/categories/${id}`,
    resetAllCategories: "/menu/categories/reset/all",
    items: (categoryId: string) => `/menu/categories/${categoryId}/items`,
    createItem: (categoryId: string) => `/menu/categories/${categoryId}/items`,
    updateItem: (id: string) => `/menu/items/${id}`,
    toggleItem: (id: string) => `/menu/items/${id}/toggle`,
    deleteItem: (id: string) => `/menu/items/${id}`,
  },

  // Orders
  orders: {
    create: "/order/create",
    list: "/order",
    get: (id: string) => `/order/${id}`,
    updateStatus: (id: string) => `/order/${id}/status`,
    track: (id: string) => `/order/track/${id}`,
    stats: "/order/stats/overview",
    tableOrders: (restaurantId: string, tableNumber: string) =>
      `/order/table/${restaurantId}/${tableNumber}`,
  },

  // QR Codes
  qr: {
    generate: "/qr/generate",
    list: "/qr",
    get: (id: string) => `/qr/${id}`,
    toggle: (id: string) => `/qr/${id}/toggle`,
    toggleOccupied: (id: string) => `/qr/${id}/toggle-occupied`,
    setOccupied: (tableNumber: string) => `/qr/table/${tableNumber}/occupied`,
    delete: (id: string) => `/qr/${id}`,
    bulkGenerate: "/qr/bulk-generate",
    bulkDelete: "/qr/bulk-delete",
  },

  // Upload
  upload: {
    image: "/upload/image",
    images: "/upload/images",
    deleteImage: "/upload/image",
  },

  // Excel Import
  excelImport: {
    template: (lang: string) => `/excel-import/template?lang=${lang}`,
    import: "/excel-import/import",
    history: "/excel-import/history",
  },

  // Admin
  admin: {
    plans: {
      list: "/admin/plans",
      create: "/admin/plans",
      update: (id: string) => `/admin/plans/${id}`,
      toggle: (id: string) => `/admin/plans/${id}/toggle`,
    },
    restaurants: {
      list: "/admin/restaurants",
      get: (id: string) => `/admin/restaurants/${id}`,
      toggle: (id: string) => `/admin/restaurants/${id}/toggle`,
    },
    users: {
      list: "/admin/users",
      create: "/admin/users",
      update: (id: string) => `/admin/users/${id}`,
      toggle: (id: string) => `/admin/users/${id}/toggle`,
    },
    stats: "/admin/stats",
  },

  // Public
  public: {
    menu: (restaurantId: string, tableNumber?: string) => {
      if (tableNumber) {
        return `/public/menu/${restaurantId}?tableNumber=${tableNumber}`;
      }
      return `/public/menu/${restaurantId}`;
    },
    menuLegacy: (restaurantId: string, tableNumber: string) =>
      `/public/menu/${restaurantId}/${tableNumber}`,
    menuCategories: (restaurantId: string) =>
      `/public/menu/${restaurantId}/categories`,
    categoryItems: (restaurantId: string, categoryId: string) =>
      `/public/menu/${restaurantId}/categories/${categoryId}/items`,
    searchMenu: (restaurantId: string, query: string) =>
      `/public/menu/${restaurantId}/search?q=${encodeURIComponent(query)}`,
    restaurant: (restaurantId: string) => `/public/restaurant/${restaurantId}`,
    health: "/public/health",
    plans: "/public/plans",
    contact: "/public/contact",
  },

  // Sections
  sections: {
    list: "/section",
    get: (id: string) => `/section/${id}`,
    getByType: (type: string) => `/section/type/${type}`,
  },

  // Kitchen
  kitchen: {
    sections: {
      list: "/kitchen/sections",
      create: "/kitchen/sections",
      update: (id: string) => `/kitchen/sections/${id}`,
      delete: (id: string) => `/kitchen/sections/${id}`,
    },
    kds: {
      items: "/kitchen/kds/items",
      updateItemStatus: (itemId: string) =>
        `/kitchen/kds/items/${itemId}/status`,
    },
  },
};

export default api;
