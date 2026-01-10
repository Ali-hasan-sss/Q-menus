"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Github,
  Send,
  Building,
  Clock,
  User,
} from "lucide-react";

export type SectionType = "GENERAL" | "CONTACT" | "ANNOUNCEMENTS";

export interface SectionAttribute {
  key: string;
  keyAr: string;
  value: string;
  valueAr: string;
  icon: string;
}

export interface Section {
  id?: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  images?: string[];
  attributes?: SectionAttribute[];
  type: SectionType;
}

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Section, "id">) => Promise<void>;
  section?: Section | null;
  title: string;
}

export function SectionFormModal({
  isOpen,
  onClose,
  onSubmit,
  section,
  title,
}: SectionFormModalProps) {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    images: [] as string[],
    attributes: [] as SectionAttribute[],
    type: "GENERAL" as SectionType,
  });

  const [newAttribute, setNewAttribute] = useState<SectionAttribute>({
    key: "",
    keyAr: "",
    value: "",
    valueAr: "",
    icon: "",
  });

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || "",
        titleAr: section.titleAr || "",
        description: section.description || "",
        descriptionAr: section.descriptionAr || "",
        images: section.images || [],
        attributes: section.attributes || [],
        type: section.type || "GENERAL",
      });
    } else {
      setFormData({
        title: "",
        titleAr: "",
        description: "",
        descriptionAr: "",
        images: [],
        attributes: [],
        type: "GENERAL",
      });
    }
    setNewAttribute({
      key: "",
      keyAr: "",
      value: "",
      valueAr: "",
      icon: "",
    });
  }, [section, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        attributes:
          formData.attributes.length > 0 ? formData.attributes : undefined,
        type: formData.type,
      });
      onClose();
    } catch (error) {
      console.error("Error submitting section:", error);
    } finally {
      setLoading(false);
    }
  };

  const addImage = (url: string) => {
    if (url && !formData.images.includes(url)) {
      setFormData({
        ...formData,
        images: [...formData.images, url],
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const addAttribute = () => {
    if (newAttribute.key.trim() && newAttribute.keyAr.trim()) {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, { ...newAttribute }],
      });
      setNewAttribute({
        key: "",
        keyAr: "",
        value: "",
        valueAr: "",
        icon: "",
      });
    }
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index),
    });
  };

  const updateAttribute = (
    index: number,
    field: keyof SectionAttribute,
    value: string
  ) => {
    const updated = [...formData.attributes];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, attributes: updated });
  };

  const sectionTypeOptions = [
    {
      value: "GENERAL",
      label: isRTL ? "قسم عام" : "General Section",
      labelAr: "قسم عام",
    },
    {
      value: "CONTACT",
      label: isRTL ? "قسم تواصل" : "Contact Section",
      labelAr: "قسم تواصل",
    },
    {
      value: "ANNOUNCEMENTS",
      label: isRTL ? "قسم إعلانات" : "Announcements Section",
      labelAr: "قسم إعلانات",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "نوع القسم" : "Section Type"} *
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as SectionType })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            {sectionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {isRTL ? option.labelAr : option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title - English */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "العنوان (إنجليزي)" : "Title (English)"} *
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder={
              isRTL ? "أدخل العنوان بالإنجليزية" : "Enter title in English"
            }
            required
          />
        </div>

        {/* Title - Arabic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "العنوان (عربي)" : "Title (Arabic)"} *
          </label>
          <Input
            type="text"
            value={formData.titleAr}
            onChange={(e) =>
              setFormData({ ...formData, titleAr: e.target.value })
            }
            placeholder={
              isRTL ? "أدخل العنوان بالعربية" : "Enter title in Arabic"
            }
            required
          />
        </div>

        {/* Description - English */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "الوصف (إنجليزي)" : "Description (English)"}{" "}
            <span className="text-gray-400 text-sm">
              ({isRTL ? "اختياري" : "Optional"})
            </span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={
              isRTL ? "أدخل الوصف بالإنجليزية" : "Enter description in English"
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Description - Arabic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "الوصف (عربي)" : "Description (Arabic)"}{" "}
            <span className="text-gray-400 text-sm">
              ({isRTL ? "اختياري" : "Optional"})
            </span>
          </label>
          <textarea
            value={formData.descriptionAr}
            onChange={(e) =>
              setFormData({ ...formData, descriptionAr: e.target.value })
            }
            placeholder={
              isRTL ? "أدخل الوصف بالعربية" : "Enter description in Arabic"
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Images Array */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "صور القسم" : "Section Images"}{" "}
            <span className="text-gray-400 text-sm">
              ({isRTL ? "اختياري" : "Optional"})
            </span>
          </label>

          {/* Add Image */}
          <div className="mb-4">
            <ImageUpload
              value=""
              onChange={(url) => url && addImage(url)}
              placeholder={isRTL ? "إضافة صورة للقسم" : "Add image to section"}
            />
          </div>

          {/* Display Images */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Section image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attributes Array */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "الخصائص" : "Attributes"}{" "}
            <span className="text-gray-400 text-sm">
              ({isRTL ? "اختياري" : "Optional"})
            </span>
          </label>

          {/* Add Attribute Form */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {isRTL ? "إضافة خاصية جديدة" : "Add New Attribute"}
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  value={newAttribute.key}
                  onChange={(e) =>
                    setNewAttribute({ ...newAttribute, key: e.target.value })
                  }
                  placeholder={isRTL ? "المفتاح (إنجليزي)" : "Key (English)"}
                />
                <Input
                  type="text"
                  value={newAttribute.keyAr}
                  onChange={(e) =>
                    setNewAttribute({ ...newAttribute, keyAr: e.target.value })
                  }
                  placeholder={isRTL ? "المفتاح (عربي)" : "Key (Arabic)"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  value={newAttribute.value}
                  onChange={(e) =>
                    setNewAttribute({ ...newAttribute, value: e.target.value })
                  }
                  placeholder={isRTL ? "القيمة (إنجليزي)" : "Value (English)"}
                />
                <Input
                  type="text"
                  value={newAttribute.valueAr}
                  onChange={(e) =>
                    setNewAttribute({
                      ...newAttribute,
                      valueAr: e.target.value,
                    })
                  }
                  placeholder={isRTL ? "القيمة (عربي)" : "Value (Arabic)"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "الأيقونة" : "Icon"}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[
                    { name: "Phone", value: "phone", icon: Phone },
                    { name: "Mail", value: "mail", icon: Mail },
                    { name: "MapPin", value: "map-pin", icon: MapPin },
                    {
                      name: "MessageCircle",
                      value: "message-circle",
                      icon: MessageCircle,
                    },
                    { name: "Globe", value: "globe", icon: Globe },
                    { name: "Facebook", value: "facebook", icon: Facebook },
                    { name: "Instagram", value: "instagram", icon: Instagram },
                    { name: "Twitter", value: "twitter", icon: Twitter },
                    { name: "Linkedin", value: "linkedin", icon: Linkedin },
                    { name: "Youtube", value: "youtube", icon: Youtube },
                    { name: "Github", value: "github", icon: Github },
                    { name: "Send", value: "send", icon: Send },
                    { name: "Building", value: "building", icon: Building },
                    { name: "Clock", value: "clock", icon: Clock },
                    { name: "User", value: "user", icon: User },
                  ].map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <button
                        key={iconOption.value}
                        type="button"
                        onClick={() =>
                          setNewAttribute({
                            ...newAttribute,
                            icon: iconOption.value,
                          })
                        }
                        className={`p-2 border rounded-lg flex items-center justify-center transition-colors ${
                          newAttribute.icon === iconOption.value
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-primary-300"
                        }`}
                        title={iconOption.name}
                      >
                        <IconComponent className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                    );
                  })}
                </div>
                <Input
                  type="text"
                  value={newAttribute.icon}
                  onChange={(e) =>
                    setNewAttribute({ ...newAttribute, icon: e.target.value })
                  }
                  placeholder={
                    isRTL
                      ? "أو أدخل رابط صورة أو اسم أيقونة مخصص"
                      : "Or enter image URL or custom icon name"
                  }
                />
              </div>
              <Button
                type="button"
                onClick={addAttribute}
                variant="outline"
                className="w-full"
                disabled={
                  !newAttribute.key.trim() || !newAttribute.keyAr.trim()
                }
              >
                {isRTL ? "إضافة خاصية" : "Add Attribute"}
              </Button>
            </div>
          </div>

          {/* Display Attributes */}
          {formData.attributes.length > 0 && (
            <div className="space-y-3">
              {formData.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {attr.icon && (
                        <span className="text-lg">{attr.icon}</span>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {isRTL ? attr.keyAr : attr.key}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isRTL ? attr.valueAr : attr.value}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">
                        {isRTL ? "المفتاح" : "Key"}
                      </label>
                      <Input
                        type="text"
                        value={attr.key}
                        onChange={(e) =>
                          updateAttribute(index, "key", e.target.value)
                        }
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={attr.keyAr}
                        onChange={(e) =>
                          updateAttribute(index, "keyAr", e.target.value)
                        }
                        className="text-sm mt-1"
                        placeholder={isRTL ? "عربي" : "Arabic"}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">
                        {isRTL ? "القيمة" : "Value"}
                      </label>
                      <Input
                        type="text"
                        value={attr.value}
                        onChange={(e) =>
                          updateAttribute(index, "value", e.target.value)
                        }
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={attr.valueAr}
                        onChange={(e) =>
                          updateAttribute(index, "valueAr", e.target.value)
                        }
                        className="text-sm mt-1"
                        placeholder={isRTL ? "عربي" : "Arabic"}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 text-xs">
                      {isRTL ? "الأيقونة" : "Icon"}
                    </label>
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {[
                        { name: "Phone", value: "phone", icon: Phone },
                        { name: "Mail", value: "mail", icon: Mail },
                        { name: "MapPin", value: "map-pin", icon: MapPin },
                        {
                          name: "MessageCircle",
                          value: "message-circle",
                          icon: MessageCircle,
                        },
                        { name: "Globe", value: "globe", icon: Globe },
                        { name: "Facebook", value: "facebook", icon: Facebook },
                        {
                          name: "Instagram",
                          value: "instagram",
                          icon: Instagram,
                        },
                        { name: "Twitter", value: "twitter", icon: Twitter },
                        { name: "Linkedin", value: "linkedin", icon: Linkedin },
                        { name: "Youtube", value: "youtube", icon: Youtube },
                        { name: "Github", value: "github", icon: Github },
                        { name: "Send", value: "send", icon: Send },
                        { name: "Building", value: "building", icon: Building },
                        { name: "Clock", value: "clock", icon: Clock },
                        { name: "User", value: "user", icon: User },
                      ].map((iconOption) => {
                        const IconComponent = iconOption.icon;
                        return (
                          <button
                            key={iconOption.value}
                            type="button"
                            onClick={() =>
                              updateAttribute(index, "icon", iconOption.value)
                            }
                            className={`p-1.5 border rounded flex items-center justify-center transition-colors ${
                              attr.icon === iconOption.value
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-300 dark:border-gray-600 hover:border-primary-300"
                            }`}
                            title={iconOption.name}
                          >
                            <IconComponent className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                          </button>
                        );
                      })}
                    </div>
                    <Input
                      type="text"
                      value={attr.icon}
                      onChange={(e) =>
                        updateAttribute(index, "icon", e.target.value)
                      }
                      className="text-sm"
                      placeholder={
                        isRTL
                          ? "أو رابط صورة أو اسم مخصص"
                          : "Or image URL or custom name"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div
          className={`flex pt-4 ${
            isRTL
              ? "justify-start space-x-reverse space-x-3"
              : "justify-end space-x-3"
          }`}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? isRTL
                ? "جاري الحفظ..."
                : "Saving..."
              : section
                ? isRTL
                  ? "تحديث"
                  : "Update"
                : isRTL
                  ? "إنشاء"
                  : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
