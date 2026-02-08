"use client";

import { useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../hooks";
import {
  fetchMenu,
  fetchCategories,
  fetchItems,
  fetchCategoryItems,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  resetAllCategories,
  createItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
  updateMenuName,
  applyDiscountToAll,
  applyDiscountToCategory,
  fetchQRCodes,
  createQRCode,
  createRestaurantQR,
  toggleQRStatus,
  toggleTableOccupied,
  deleteQRCode,
  bulkCreateQRCodes,
  bulkCreateSequentialQRCodes,
  bulkDeleteQRCodes,
  clearMenuData,
} from "../slices/menuSlice";
import { api } from "@/lib/api";

export interface CreateCategoryData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  sortOrder?: number;
}

export interface CreateItemData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency?: string;
  image?: string;
  sortOrder?: number;
  categoryId: string;
  extras?: any;
}

export function useMenu() {
  const dispatch = useAppDispatch();
  const menu = useAppSelector((s) => s.menu.menu);
  const categories = useAppSelector((s) => s.menu.categories);
  const items = useAppSelector((s) => s.menu.items);
  const qrCodes = useAppSelector((s) => s.menu.qrCodes);
  const restaurantQR = useAppSelector((s) => s.menu.restaurantQR);
  const restaurantCurrency = useAppSelector((s) => s.menu.restaurantCurrency);
  const loading = useAppSelector((s) => s.menu.loading);
  const loadingItems = useAppSelector((s) => s.menu.loadingItems);
  const error = useAppSelector((s) => s.menu.error);

  const refreshData = useCallback(async () => {
    await Promise.all([dispatch(fetchMenu()), dispatch(fetchCategories())]);
  }, [dispatch]);

  const fetchQRCodesStable = useCallback(
    () => dispatch(fetchQRCodes()),
    [dispatch]
  );
  const createRestaurantQRStable = useCallback(
    () => dispatch(createRestaurantQR()).unwrap(),
    [dispatch]
  );

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      refreshData();
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      if (localStorage.getItem("token")) {
        refreshData();
      } else {
        dispatch(clearMenuData());
      }
    };
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("authChange", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, [dispatch, refreshData]);

  const downloadExcelTemplate = async (lang: string): Promise<Blob> => {
    const response = await api.get(`/excel-import/template?lang=${lang}`, {
      responseType: "blob",
    });
    return response.data;
  };

  const importExcelFile = async (
    file: File
  ): Promise<{ categoriesCreated: number; itemsCreated: number }> => {
    const formData = new FormData();
    formData.append("excelFile", file);
    const response = await api.post("/excel-import/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await dispatch(fetchCategories());
    return response.data.summary;
  };

  const downloadMenuBackup = async (): Promise<Blob> => {
    const response = await api.get("/excel-import/backup", {
      responseType: "blob",
    });
    return response.data;
  };

  const restoreMenuBackup = async (
    file: File
  ): Promise<{ categoriesRestored: number; itemsRestored: number }> => {
    const formData = new FormData();
    formData.append("excelFile", file);
    const response = await api.post("/excel-import/restore-backup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await dispatch(fetchCategories());
    await dispatch(fetchItems());
    return response.data.summary;
  };

  return {
    menu,
    categories,
    items,
    qrCodes,
    restaurantQR,
    restaurantCurrency,
    loading,
    loadingItems,
    error,
    fetchMenu: () => dispatch(fetchMenu()),
    fetchCategories: () => dispatch(fetchCategories()),
    fetchItems: (categoryId?: string) => dispatch(fetchItems(categoryId)),
    fetchCategoryItems: (categoryId: string) => dispatch(fetchCategoryItems(categoryId)),
    createCategory: (data: CreateCategoryData) => dispatch(createCategory(data)).unwrap(),
    updateCategory: (id: string, data: CreateCategoryData) =>
      dispatch(updateCategory({ id, data })).unwrap(),
    deleteCategory: (id: string) => dispatch(deleteCategory(id)).unwrap(),
    toggleCategoryStatus: (id: string) => dispatch(toggleCategoryStatus(id)).unwrap(),
    resetAllCategories: () => dispatch(resetAllCategories()).unwrap(),
    createItem: (data: CreateItemData) => dispatch(createItem(data)).unwrap(),
    updateItem: (id: string, data: CreateItemData) =>
      dispatch(updateItem({ id, data })).unwrap(),
    deleteItem: (id: string) => dispatch(deleteItem(id)).unwrap(),
    toggleItemStatus: (id: string) => dispatch(toggleItemStatus(id)).unwrap(),
    updateMenuName: (name: string, nameAr?: string) =>
      dispatch(updateMenuName({ name, nameAr })).unwrap(),
    refreshData,
    applyDiscountToAll: (discount: number) => dispatch(applyDiscountToAll(discount)).unwrap(),
    applyDiscountToCategory: (categoryId: string, discount: number) =>
      dispatch(applyDiscountToCategory({ categoryId, discount })).unwrap(),
    downloadExcelTemplate,
    importExcelFile,
    downloadMenuBackup,
    restoreMenuBackup,
    fetchQRCodes: fetchQRCodesStable,
    createQRCode: (tableNumber: string) => dispatch(createQRCode(tableNumber)).unwrap(),
    createRestaurantQR: createRestaurantQRStable,
    toggleQRStatus: (qrId: string) => dispatch(toggleQRStatus(qrId)).unwrap(),
    toggleTableOccupied: (qrId: string) => dispatch(toggleTableOccupied(qrId)).unwrap(),
    deleteQRCode: (qrId: string) => dispatch(deleteQRCode(qrId)).unwrap(),
    bulkCreateQRCodes: (tableNumbers: string[]) =>
      dispatch(bulkCreateQRCodes(tableNumbers)).unwrap(),
    bulkCreateSequentialQRCodes: (count: number) =>
      dispatch(bulkCreateSequentialQRCodes(count)).unwrap(),
    bulkDeleteQRCodes: (qrCodeIds: string[]) =>
      dispatch(bulkDeleteQRCodes(qrCodeIds)).unwrap(),
  };
}
