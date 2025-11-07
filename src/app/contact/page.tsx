"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { isRTL } = useLanguage();

  const handleSend = () => {
    if (!name || !email || !message) {
      alert(
        isRTL
          ? "الرجاء ملء جميع الحقول قبل الإرسال."
          : "Please fill all fields before sending."
      );
      return;
    }

    const phone = "963994488858";
    const text = isRTL
      ? `👤 الاسم: ${name}\n📧 البريد: ${email}\n💬 الرسالة:\n${message}`
      : `👋 Hello, new message:\n\n👤 Name: ${name}\n📧 Email: ${email}\n💬 Message:\n${message}`;
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Header />
      <div
        id="contact"
        className="relative min-h-screen flex flex-col lg:flex-row items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
      >
        {/* فقاعات زخرفية */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-tm-blue/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-tm-orange/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-green-400/10 rounded-full blur-xl animate-ping"></div>

        {/* القسم الأيسر (الصورة) */}
        <div className="relative w-full lg:w-1/2 h-96 lg:h-full flex items-center justify-center">
          <img
            src="/images/contact-us.jpg"
            alt="Contact"
            className="w-full h-full object-cover shadow-lg"
            style={{
              clipPath:
                "path('M0,150 C200,250 400,0 600,200 L600,400 L0,400 Z')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 dark:from-gray-900/50" />
        </div>

        {/* القسم الأيمن (النموذج والمعلومات) */}
        <div className="w-full lg:w-1/2 px-6 lg:px-16 py-16 text-center lg:text-start z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {isRTL ? "تواصل معنا" : "Contact Us"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {isRTL
              ? "نرحّب برسائلك واستفساراتك في أي وقت! سواء كنت مطعماً أو كافيه، نحن هنا لمساعدتك في تطوير أعمالك الذكية مع Q-Menus."
              : "We’d love to hear from you! Whether you’re a restaurant or café, we’re here to help you grow smartly with Q-Menus."}
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
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <svg
                className="w-6 h-6 text-tm-blue"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 9.18 19.8 19.8 0 0 1 .08.55 2 2 0 0 1 2.05 0h3a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L6 7a16 16 0 0 0 7 7l.79-.79a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z" />
              </svg>
              <a href="tel:+963994488858" className="hover:text-tm-orange">
                +963994488858
              </a>
            </div>

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
                href="https://wa.me/963994488858"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-tm-orange"
              >
                {isRTL ? "الدردشة عبر واتساب" : "Chat via WhatsApp"}
              </a>
            </div>

            {/* العنوان */}
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <svg
                className="w-6 h-6 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
              </svg>
              <span>
                {isRTL
                  ? "طرطوس - غرب مبنى المحافظة - مجمع المثنى"
                  : "Tartous - West of the Governorate Building - Al-Muthanna Complex"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
