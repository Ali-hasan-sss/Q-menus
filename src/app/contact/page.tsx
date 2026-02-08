"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/store/hooks/useLanguage";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { publicApi, endpoints } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Phone,
  MapPin,
  MessageCircle,
  Share2,
  ImageIcon,
  Video,
  Send,
  Briefcase,
  Globe,
} from "lucide-react";

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
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [contactSection, setContactSection] = useState<ContactSection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { isRTL, language, t } = useLanguage();

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
  const contactSectionPhone =
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
    : contactSectionPhone;

  // Helper function to get social media icon based on key name (Lucide icons)
  const getSocialIcon = (key: string) => {
    const keyLower = key.toLowerCase();
    const iconClass = "h-6 w-6 transition-colors";

    if (keyLower.includes("facebook") || keyLower.includes("فيسبوك")) {
      return <Share2 className={`${iconClass} text-blue-600 hover:text-blue-700`} strokeWidth={2} />;
    }
    if (keyLower.includes("instagram") || keyLower.includes("انستغرام")) {
      return <ImageIcon className={`${iconClass} text-pink-600 hover:text-pink-700`} strokeWidth={2} />;
    }
    if (keyLower.includes("youtube") || keyLower.includes("يوتيوب")) {
      return <Video className={`${iconClass} text-red-600 hover:text-red-700`} strokeWidth={2} />;
    }
    if (
      keyLower.includes("twitter") ||
      keyLower.includes("تويتر") ||
      keyLower.includes("x")
    ) {
      return <Send className={`${iconClass} text-gray-600 hover:text-gray-800`} strokeWidth={2} />;
    }
    if (keyLower.includes("linkedin") || keyLower.includes("لينكد إن")) {
      return <Briefcase className={`${iconClass} text-blue-500 hover:text-blue-600`} strokeWidth={2} />;
    }
    return <Globe className={`${iconClass} text-gray-600 hover:text-gray-800`} strokeWidth={2} />;
  };

  const handleSend = async () => {
    if (!name || !phone || !message) {
      toast.error(t("contact.error.fillAllFields"));
      return;
    }

    // Validate phone: 10 digits starting with 09
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error(isRTL ? "رقم الهاتف غير صحيح. يجب أن يكون 10 أرقام تبدأ بـ 09" : "Invalid phone. Must be 10 digits starting with 09");
      return;
    }

    setSending(true);
    try {
      const response = await publicApi.post(endpoints.public.contact, {
        name,
        phone: phone.trim(),
        message,
        lang: language || (isRTL ? "ar" : "en"),
      });

      if (response.data.success) {
        toast.success(t("contact.success.messageSent"));
        setName("");
        setPhone("");
        setMessage("");
      } else {
        toast.error(
          response.data.message || t("contact.error.sendFailed")
        );
      }
    } catch (error: any) {
      console.error("Error sending contact message:", error);
      const errorMessage =
        error.response?.data?.message || t("contact.error.sendFailedRetry");
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <div
        id="contact"
        className="relative min-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 -mt-24 md:-mt-28 pt-24 md:pt-28"
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
                {isRTL ? "رقم الهاتف" : "Phone Number"}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-tm-blue bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                placeholder="09xxxxxxxx"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isRTL ? "10 أرقام تبدأ بـ 09" : "10 digits starting with 09"}
              </p>
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
              disabled={sending}
              className={`w-full bg-tm-blue hover:bg-tm-orange text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-105 ${
                sending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {sending
                ? isRTL
                  ? "جاري الإرسال..."
                  : "Sending..."
                : isRTL
                  ? "إرسال الرسالة"
                  : "Send Message"}
            </button>
          </div>

          {/* معلومات الاتصال */}
          <div className="mt-8 space-y-4 text-gray-700 dark:text-gray-300 max-w-md mx-auto lg:mx-0">
            {/* رقم الهاتف */}
            {attributes.length > 1 && (
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <Phone className="w-6 h-6 text-tm-blue flex-shrink-0" strokeWidth={2} />
                <a href={`tel:${contactSectionPhone}`} className="hover:text-tm-orange">
                  {isRTL ? attributes[1].valueAr : attributes[1].value}
                </a>
              </div>
            )}

            {/* واتساب */}
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <MessageCircle className="w-6 h-6 text-green-500 flex-shrink-0" strokeWidth={2} />
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
                <MapPin className="w-6 h-6 text-red-500 flex-shrink-0" strokeWidth={2} />
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
                      {getSocialIcon(attr.key)}
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
