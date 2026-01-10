"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { publicApi, endpoints } from "@/lib/api";

interface SectionAttribute {
  key: string;
  keyAr: string;
  value: string;
  valueAr: string;
  icon?: string;
}

interface ContactSection {
  id: string;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  attributes: SectionAttribute[] | null;
  images: string[] | null;
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [contactSection, setContactSection] = useState<ContactSection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { isRTL } = useLanguage();

  useEffect(() => {
    fetchContactSection();
  }, []);

  const fetchContactSection = async () => {
    try {
      const response = await publicApi.get(
        endpoints.sections.getByType("CONTACT")
      );
      if (response.data.success && response.data.data.sections.length > 0) {
        setContactSection(response.data.data.sections[0]);
      }
    } catch (error) {
      console.error("Error fetching contact section:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract contact info from attributes
  const attributes = (contactSection?.attributes || []) as SectionAttribute[];
  const phone =
    attributes.length > 1
      ? (isRTL ? attributes[1].valueAr : attributes[1].value).replace(/\D/g, "") // Remove non-digits
      : "963994488858"; // Fallback
  const address =
    attributes.length > 0
      ? isRTL
        ? attributes[0].valueAr
        : attributes[0].value
      : isRTL
        ? "طرطوس - غرب مبنى المحافظة - مجمع المثنى"
        : "Tartous - West of the Governorate Building - Al-Muthanna Complex";
  const whatsappLink = attributes.find(
    (attr) =>
      attr.key.toLowerCase().includes("whatsapp") ||
      attr.key.toLowerCase().includes("واتساب")
  );
  const whatsappPhone = whatsappLink
    ? (isRTL ? whatsappLink.valueAr : whatsappLink.value).replace(/\D/g, "")
    : phone;

  // Helper function to get social media icon based on key name
  const getSocialIcon = (key: string, href: string) => {
    const keyLower = key.toLowerCase();

    if (keyLower.includes("facebook") || keyLower.includes("فيسبوك")) {
      return (
        <svg
          className="h-6 w-6 text-blue-600 hover:text-blue-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.333v21.334C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.657-4.788 1.324 0 2.462.099 2.795.143v3.24l-1.918.001c-1.505 0-1.797.716-1.797 1.767v2.318h3.59l-.467 3.622h-3.123V24h6.127C23.403 24 24 23.403 24 22.667V1.333C24 .598 23.403 0 22.675 0z" />
        </svg>
      );
    }

    if (keyLower.includes("instagram") || keyLower.includes("انستغرام")) {
      return (
        <svg
          className="h-6 w-6 text-pink-600 hover:text-pink-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3A5.25 5.25 0 1 1 6.75 12 5.25 5.25 0 0 1 12 6.5zm0 1.5A3.75 3.75 0 1 0 15.75 12 3.75 3.75 0 0 0 12 8zm5.5-.25a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
        </svg>
      );
    }

    if (keyLower.includes("youtube") || keyLower.includes("يوتيوب")) {
      return (
        <svg
          className="h-6 w-6 text-red-600 hover:text-red-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.498 6.186a2.998 2.998 0 0 0-2.114-2.115C19.217 3.5 12 3.5 12 3.5s-7.217 0-9.384.571A2.998 2.998 0 0 0 .502 6.186 31.46 31.46 0 0 0 0 12a31.46 31.46 0 0 0 .502 5.814 2.998 2.998 0 0 0 2.114 2.115C4.783 20.5 12 20.5 12 20.5s7.217 0 9.384-.571a2.998 2.998 0 0 0 2.114-2.115A31.46 31.46 0 0 0 24 12a31.46 31.46 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12l-6.068 3.568z" />
        </svg>
      );
    }

    if (
      keyLower.includes("twitter") ||
      keyLower.includes("تويتر") ||
      keyLower.includes("x")
    ) {
      return (
        <svg
          className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }

    if (keyLower.includes("linkedin") || keyLower.includes("لينكد إن")) {
      return (
        <svg
          className="h-6 w-6 text-blue-500 hover:text-blue-600 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    }

    // Default icon for unknown social media
    return (
      <svg
        className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  };

  const handleSend = () => {
    if (!name || !email || !message) {
      alert(
        isRTL
          ? "الرجاء ملء جميع الحقول قبل الإرسال."
          : "Please fill all fields before sending."
      );
      return;
    }

    const text = isRTL
      ? `👤 الاسم: ${name}\n📧 البريد: ${email}\n💬 الرسالة:\n${message}`
      : `👋 Hello, new message:\n\n👤 Name: ${name}\n📧 Email: ${email}\n💬 Message:\n${message}`;
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${whatsappPhone}?text=${encodedText}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Header />
      <div
        id="contact"
        className="relative min-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
      >
        {/* فقاعات زخرفية */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-tm-blue/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-tm-orange/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-green-400/10 rounded-full blur-xl animate-ping"></div>

        {/* القسم الأيسر (الصورة) */}
        <div className="relative w-full lg:w-1/2 flex items-center justify-center overflow-hidden">
          {contactSection?.images &&
          Array.isArray(contactSection.images) &&
          contactSection.images.length > 0 &&
          contactSection.images[0] ? (
            <img
              src={contactSection.images[0]}
              alt={isRTL ? contactSection.titleAr : contactSection.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/images/contact-us.jpg"
              alt={isRTL ? "تواصل معنا" : "Contact Us"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f3f4f6'/%3E%3Ctext x='300' y='200' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='18'%3EContact Image%3C/text%3E%3C/svg%3E";
              }}
            />
          )}
        </div>

        {/* القسم الأيمن (النموذج والمعلومات) */}
        <div className="w-full lg:w-1/2 px-6 lg:px-16 py-16 text-center lg:text-start z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {contactSection
              ? isRTL
                ? contactSection.titleAr
                : contactSection.title
              : isRTL
                ? "تواصل معنا"
                : "Contact Us"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {contactSection
              ? (isRTL
                  ? contactSection.descriptionAr
                  : contactSection.description) ||
                (isRTL
                  ? "نرحّب برسائلك واستفساراتك في أي وقت! سواء كنت مطعماً أو كافيه، نحن هنا لمساعدتك في تطوير أعمالك الذكية مع Q-Menus."
                  : "We'd love to hear from you! Whether you're a restaurant or café, we're here to help you grow smartly with Q-Menus.")
              : isRTL
                ? "نرحّب برسائلك واستفساراتك في أي وقت! سواء كنت مطعماً أو كافيه، نحن هنا لمساعدتك في تطوير أعمالك الذكية مع Q-Menus."
                : "We'd love to hear from you! Whether you're a restaurant or café, we're here to help you grow smartly with Q-Menus."}
          </p>

          {/* نموذج التواصل */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md mx-auto lg:mx-0 ${isRTL ? "text-right" : "text-left"}`}
          >
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">
                {isRTL ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-tm-blue bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                placeholder={isRTL ? "اكتب اسمك هنا" : "Enter your name"}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">
                {isRTL ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-tm-blue bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                placeholder="example@email.com"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">
                {isRTL ? "الرسالة" : "Message"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 h-32 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-tm-blue bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                placeholder={
                  isRTL ? "اكتب رسالتك هنا..." : "Type your message..."
                }
              ></textarea>
            </div>
            <button
              onClick={handleSend}
              className="w-full bg-tm-blue hover:bg-tm-orange text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              {isRTL ? "إرسال عبر واتساب" : "Send via WhatsApp"}
            </button>
          </div>

          {/* معلومات الاتصال */}
          <div className="mt-8 space-y-4 text-gray-700 dark:text-gray-300 max-w-md mx-auto lg:mx-0">
            {/* رقم الهاتف */}
            {attributes.length > 1 && (
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <svg
                  className="w-6 h-6 text-tm-blue"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 9.18 19.8 19.8 0 0 1 .08.55 2 2 0 0 1 2.05 0h3a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L6 7a16 16 0 0 0 7 7l.79-.79a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z" />
                </svg>
                <a href={`tel:${phone}`} className="hover:text-tm-orange">
                  {isRTL ? attributes[1].valueAr : attributes[1].value}
                </a>
              </div>
            )}

            {/* واتساب */}
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <svg
                className="w-6 h-6 text-green-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0a11.9 11.9 0 0 0-8.47 3.48A11.9 11.9 0 0 0 0 11.95c0 2.1.54 4.15 1.57 5.97L0 24l6.22-1.64a11.88 11.88 0 0 0 5.83 1.49h.01c6.6 0 11.95-5.35 11.95-11.94a11.9 11.9 0 0 0-3.49-8.43zM12.05 21.5a9.54 9.54 0 0 1-4.85-1.32l-.35-.2-3.69.97.98-3.59-.23-.37a9.44 9.44 0 0 1-1.44-5.04c0-5.26 4.28-9.54 9.55-9.54a9.47 9.47 0 0 1 9.54 9.54c0 5.26-4.28 9.54-9.54 9.54zm5.26-7.14c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.63.14-.19.29-.72.94-.89 1.13-.17.19-.33.21-.62.07-.29-.14-1.23-.45-2.35-1.45-.87-.77-1.45-1.72-1.62-2-.17-.29-.02-.44.13-.58.13-.13.29-.33.43-.49.14-.16.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.63-1.52-.86-2.09-.23-.56-.47-.49-.63-.5h-.54c-.19 0-.51.07-.78.36-.26.29-1 1-.96 2.42.05 1.42 1.03 2.8 1.17 2.99.14.19 2.02 3.1 4.9 4.35.68.29 1.21.46 1.63.59.68.22 1.3.19 1.79.12.55-.08 1.7-.69 1.94-1.36.24-.68.24-1.26.17-1.36-.07-.1-.26-.17-.55-.31z" />
              </svg>
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-tm-orange"
              >
                {isRTL ? "الدردشة عبر واتساب" : "Chat via WhatsApp"}
              </a>
            </div>

            {/* العنوان */}
            {attributes.length > 0 && (
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                </svg>
                <span>{address}</span>
              </div>
            )}

            {/* أيقونات التواصل الاجتماعي */}
            {attributes.length > 2 && (
              <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap pt-4">
                {attributes.slice(2).map((attr, index) => {
                  const href = isRTL ? attr.valueAr : attr.value;
                  const key = isRTL ? attr.keyAr : attr.key;
                  return (
                    <a
                      key={index}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                      title={key}
                      aria-label={key}
                    >
                      {getSocialIcon(attr.key, href)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
