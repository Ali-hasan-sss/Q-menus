"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "AR" | "EN";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Translation keys - in a real app, these would come from a translation service
const translations = {
  AR: {
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.menu": "القائمة",
    "nav.orders": "الطلبات",
    "nav.reports": "التقارير",
    "nav.qr": "رمز QR",
    "nav.settings": "الإعدادات",
    "nav.logout": "تسجيل الخروج",
    "nav.profile": "الملف الشخصي",

    // Auth
    "auth.login": "تسجيل الدخول",
    "auth.register": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.firstName": "الاسم الأول",
    "auth.lastName": "الاسم الأخير",
    "auth.restaurantName": "اسم المطعم",
    "auth.restaurantNameAr": "اسم المطعم (عربي)",
    "auth.forgotPassword": "نسيت كلمة المرور؟",
    "auth.rememberMe": "تذكرني",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.loginSuccess": "تم تسجيل الدخول بنجاح",
    "auth.registerSuccess": "تم إنشاء الحساب بنجاح",
    "auth.logoutSuccess": "تم تسجيل الخروج بنجاح",

    // Auth Error Messages - Login
    "auth.error.invalidCredentials": "بيانات الدخول غير صحيحة",
    "auth.error.loginRateLimitExceeded": "تم تجاوز عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة مرة أخرى بعد 5 دقائق",
    "auth.error.userNotFound": "المستخدم غير موجود",
    "auth.error.userInactive": "الحساب غير نشط",
    "auth.error.loginFailed": "فشل تسجيل الدخول",
    "auth.error.serverError": "خطأ في الخادم. يرجى المحاولة لاحقاً",

    // Auth Error Messages - Registration
    "auth.error.userAlreadyExists":
      "هذا البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول",
    "auth.error.emailNotVerified":
      "البريد الإلكتروني غير مفعّل. يرجى التحقق من بريدك الإلكتروني قبل إنشاء الحساب",
    "auth.error.registrationFailed": "فشل إنشاء الحساب",
    "auth.error.invalidEmail": "البريد الإلكتروني غير صحيح",
    "auth.error.passwordTooShort": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    "auth.error.passwordsDoNotMatch": "كلمات المرور غير متطابقة",
    "auth.error.firstNameRequired": "الاسم الأول مطلوب",
    "auth.error.lastNameRequired": "الاسم الأخير مطلوب",
    "auth.error.restaurantNameRequired": "اسم المطعم مطلوب",

    // Auth Error Messages - Verification Code
    "auth.error.verificationCodeSent":
      "تم إرسال رمز التحقق بنجاح. يرجى التحقق من بريدك الإلكتروني",
    "auth.error.verificationCodeFailed":
      "فشل إرسال رمز التحقق. يرجى المحاولة لاحقاً",
    "auth.error.verificationCodeInvalid": "رمز التحقق غير صحيح",
    "auth.error.verificationCodeExpired":
      "رمز التحقق منتهي الصلاحية. يرجى طلب رمز جديد",
    "auth.error.verificationCodeRequired": "رمز التحقق مطلوب",
    "auth.error.emailMissing": "البريد الإلكتروني مفقود",
    "auth.error.rateLimitExceeded":
      "تم تجاوز الحد المسموح. يرجى الانتظار {minutes} دقيقة قبل طلب رمز جديد",
    "auth.error.rateLimitExceededSingular":
      "تم تجاوز الحد المسموح. يرجى الانتظار دقيقة واحدة قبل طلب رمز جديد",

    // Auth Error Messages - Resend Verification
    "auth.error.resendCodeSuccess": "تم إرسال رمز التحقق بنجاح",
    "auth.error.resendCodeFailed": "حدث خطأ أثناء إرسال رمز التحقق",

    // Auth Success Messages
    "auth.success.verificationCodeSent":
      "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
    "auth.success.emailVerified": "تم التحقق من البريد الإلكتروني بنجاح",
    "auth.success.accountCreated": "تم إنشاء الحساب بنجاح",
    "auth.success.passwordReset": "تم إعادة تعيين كلمة المرور بنجاح",
    "auth.success.passwordResetCodeSent":
      "تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",

    // Password Reset Messages
    "auth.passwordReset.didNotReceiveCode": "لم أستلم الرمز",
    "auth.passwordReset.checkSpam":
      "يرجى التحقق من مجلد البريد غير المرغوب فيه (Spam)",
    "auth.passwordReset.resendingCode": "جاري إعادة الإرسال...",
    "auth.passwordReset.resendCodeSuccess":
      "تم إعادة إرسال رمز إعادة التعيين بنجاح",

    // Contact Us Messages
    "contact.success.messageSent": "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً",
    "contact.error.fillAllFields": "الرجاء ملء جميع الحقول قبل الإرسال.",
    "contact.error.invalidEmail": "البريد الإلكتروني غير صحيح",
    "contact.error.sendFailed": "حدث خطأ أثناء إرسال الرسالة",
    "contact.error.sendFailedRetry": "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً",

    // Common
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.add": "إضافة",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.success": "نجح",
    "common.confirm": "تأكيد",
    "common.yes": "نعم",
    "common.no": "لا",
    "common.close": "إغلاق",
    "common.back": "رجوع",
    "common.next": "التالي",
    "common.previous": "السابق",
    "common.available": "متاح",
    "common.unavailable": "غير متاح",
    "common.optional": "اختياري",

    // Menu
    "menu.title": "إدارة القائمة",
    "menu.categories": "الفئات والأصناف",
    "menu.theme": "تخصيص شكل القائمة",
    "menu.items": "الأصناف",
    "menu.addCategory": "إضافة فئة",
    "menu.addItem": "إضافة صنف",
    "menu.categoryName": "اسم الفئة",
    "menu.itemName": "اسم الصنف",
    "menu.price": "السعر",
    "menu.description": "الوصف",
    "menu.image": "الصورة",
    "menu.available": "متاح",
    "menu.unavailable": "غير متاح",
    "menu.itemsInCategory": "عنصر في هذه الفئة",
    "menu.backToCategories": "العودة للفئات",
    "menu.reorderCategories": "ترتيب الفئات",
    "category.active": "نشط",
    "category.inactive": "غير نشط",
    "menu.backToCategoriesShort": "رجوع",

    // Items
    "item.title": "إدارة الأصناف",
    "item.add": "إضافة صنف",
    "item.edit": "تعديل الصنف",
    "item.name": " اسم الصنف (انجليزي)",
    "item.nameAr": "اسم الصنف (عربي)",
    "item.description": "الوصف (انجليزي)",
    "item.descriptionAr": "الوصف (عربي)",
    "item.price": "السعر",
    "item.currency": "العملة",
    "item.category": "الفئة",
    "item.selectCategory": "اختر الفئة",
    "item.image": "صورة الصنف",
    "item.sortOrder": "ترتيب العرض",
    "item.extras": "إضافات",
    "item.available": "متاح",
    "item.unavailable": "غير متاح",
    "item.makeAvailable": "جعل متاحاً",
    "item.makeUnavailable": "جعل غير متاح",
    "item.noItemsInCategory": "لا توجد أصناف في هذه الفئة",
    "item.addFirstItem": "أضف أول صنف لهذه الفئة",
    "item.deleteConfirm": "هل أنت متأكد من حذف هذا الصنف؟",
    "item.deleteSuccess": "تم حذف الصنف بنجاح",
    "item.addSuccess": "تم إضافة الصنف بنجاح",
    "item.updateSuccess": "تم تحديث الصنف بنجاح",
    "item.noDescription": "لا يوجد وصف",
    "item.reorder": "ترتيب الأصناف",
    "item.reorderDescription": "اسحب وأفلت الأصناف لإعادة ترتيبها",
    "item.noItemsToReorder": "لا توجد أصناف لإعادة ترتيبها",

    // Orders
    "orders.title": "إدارة الطلبات",
    "orders.new": "جديد",
    "orders.received": "تم الاستلام",
    "orders.preparing": "قيد التحضير",
    "orders.ready": "جاهز",
    "orders.completed": "مكتمل",
    "orders.cancelled": "ملغي",
    "orders.tableNumber": "رقم الطاولة",
    "orders.customerName": "اسم العميل",
    "orders.total": "المجموع",
    "orders.status": "الحالة",
    "orders.notes": "ملاحظات",
    "orders.time": "الوقت",
    "orders.noOrders": "لا توجد طلبات",
    "orders.noOrdersDesc": "ستظهر الطلبات هنا عندما يقوم العملاء بإرسالها.",

    // QR Codes
    "qr.title": "إدارة رموز QR",
    "qr.subtitle": "إنشاء وإدارة رموز QR للمطعم والطاولات",
    "qr.generate": "إنشاء رمز QR",
    "qr.tableNumber": "رقم الطاولة",
    "qr.download": "تحميل",
    "qr.print": "طباعة",
    "qr.active": "نشط",
    "qr.inactive": "غير نشط",
    "qr.status": "الحالة",
    "qr.restaurantCode": "رمز QR للمطعم",
    "qr.tableCodes": "رموز QR للطاولات",
    "qr.restaurantCodeDesc":
      "هذا الرمز يوجه العملاء لقائمة المطعم بدون رقم طاولة محدد يستخدم لاستقيال الطلبات الخارجة (التوصيل) ",
    "qr.noRestaurantCode": "لا يوجد رمز QR للمطعم",
    "qr.createRestaurantCodeDesc":
      "إنشاء رمز QR يمكن للعملاء مسحه لعرض قائمة المطعم",
    "qr.createRestaurantCode": "إنشاء رمز QR للمطعم",
    "qr.viewMenu": "عرض القائمة",
    "qr.copyUrl": "نسخ الرابط",
    "qr.createSingle": "إنشاء رمز QR واحد",
    "qr.enterTableNumber": "أدخل رقم الطاولة",
    "qr.bulkGenerate": "إنشاء لجميع الطاولات ",
    "qr.bulkCreate": "إنشاء متعدد لرموز QR",
    "qr.byCount": "بالعدد (1، 2، 3...)",
    "qr.byNumbers": "بأرقام محددة",
    "qr.tableCount": "عدد الطاولات",
    "qr.tableNumbers": "أرقام الطاولات (مفصولة بفاصلة)",
    "qr.countDescription":
      "سيتم إنشاء رموز QR للطاولات 1، 2، 3... حتى العدد الذي تدخله",
    "qr.numbersDescription": "أدخل أرقام طاولات محددة مفصولة بفاصلة",
    "qr.generateAll": "إنشاء الكل",
    "qr.noQRCodes": "لا توجد رموز QR",
    "qr.noQRCodesDesc": "ابدأ بإنشاء رموز QR لطاولاتك",
    "qr.selectMultiple": "تحديد متعدد",
    "qr.cancelSelection": "إلغاء التحديد",
    "qr.deleteSelected": "حذف المحدد",
    "qr.selectAll": "تحديد الكل",
    "qr.selected": "محدد",
    "qr.orders": "الطلبات",
    "qr.created": "تاريخ الإنشاء",
    "qr.scanToView": "امسح لعرض القائمة",
    "qr.downloadPdf": "تحميل PDF",
    "qr.printAll": "طباعة الكل",

    // Settings
    "settings.title": "الإعدادات",
    "settings.restaurant": "معلومات المطعم",
    "settings.theme": "المظهر",
    "settings.language": "اللغة",
    "settings.notifications": "الإشعارات",
    "settings.account": "الحساب",

    // Theme
    "theme.light": "فاتح",
    "theme.dark": "داكن",
    "theme.system": "النظام",

    // QR Code Error Messages
    "qr.tableLimitReached":
      "لقد وصلت إلى الحد الأقصى من الطاولات ({limit}) لخطتك الحالية. يرجى ترقية خطتك لإضافة المزيد من الطاولات.",
    "qr.cannotCreateTables":
      "لا يمكن إنشاء {requested} طاولة. يمكنك إنشاء {available} طاولة إضافية فقط (حد أقصى {limit}). يرجى ترقية خطتك لإضافة المزيد من الطاولات.",
    "qr.noActiveSubscription": "لم يتم العثور على اشتراك نشط",
    "qr.restaurantNotFound": "لم يتم العثور على المطعم",

    // Customer Menu Toasts
    "menu.orderSuccess.dineIn": "تم إرسال طلب المطعم بنجاح!",
    "menu.orderSuccess.delivery": "تم إرسال طلب التوصيل بنجاح!",
    "menu.orderError.failed": "فشل في إرسال الطلب",
    "menu.orderError.qrRequired": "يجب مسح رمز QR للوصول إلى القائمة",
    "menu.orderError.customerNameRequired": "اسم العميل مطلوب لطلبات التوصيل",
    "menu.orderError.customerNameMinLength":
      "اسم العميل يجب أن يكون أكثر من حرفين",
    "menu.orderError.customerPhoneRequired": "رقم الهاتف مطلوب لطلبات التوصيل",
    "menu.orderError.customerPhoneInvalid":
      "رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 09",
    "menu.orderError.customerAddressRequired": "العنوان مطلوب لطلبات التوصيل",
    "menu.orderError.addItemsFailed": "فشل في إضافة الأصناف للطلب",
    "menu.orderError.tableNotOccupied":
      "الطاولة غير مفتوحة الجلسة. يرجى طلب فتح الجلسة من الكاشير.",
    "waiter.requestError.failed": "فشل في إرسال طلب النادل",
    "menu.orderSuccess.itemsAdded": "تم إضافة الأصناف للطلب بنجاح!",

    // Dashboard Plan Limits
    "dashboard.categoryLimitReached":
      "لقد وصلت إلى الحد الأقصى من الفئات ({limit}) لخطتك الحالية. يرجى ترقية خطتك لإضافة المزيد من الفئات.",
    "dashboard.itemLimitReached":
      "لقد وصلت إلى الحد الأقصى من الأصناف ({limit}) لهذه الفئة في خطتك الحالية. يرجى ترقية خطتك لإضافة المزيد من الأصناف.",
    "dashboard.noActiveSubscription": "لم يتم العثور على اشتراك نشط",

    // Dashboard
    "dashboard.welcome": "مرحباً بعودتك،",
    "dashboard.subtitle": "إليك ما يحدث في مطعمك اليوم.",
    "dashboard.totalOrders": "إجمالي الطلبات",
    "dashboard.activeTables": "الطاولات النشطة",
    "dashboard.menuItems": "عناصر القائمة",
    "dashboard.revenue": "الإيرادات",
    "dashboard.quickActions": "الإجراءات السريعة",
    "dashboard.manageMenu": "إدارة القائمة",
    "dashboard.menuTheme": "تصميم القائمة",
    "dashboard.generateQR": "إنشاء رموز QR",
    "dashboard.viewOrders": "عرض الطلبات",
    "dashboard.recentActivity": "النشاط الأخير",
    "dashboard.activity.newOrder": "تم استلام طلب جديد للطاولة 5",
    "dashboard.activity.qrGenerated": "تم إنشاء رمز QR للطاولة 8",
    "dashboard.activity.menuUpdated": "تم تحديث عنصر القائمة: سلمون مشوي",
  },
  EN: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.menu": "Menu",
    "nav.orders": "Orders",
    "nav.reports": "Reports",
    "nav.qr": "QR Codes",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    "nav.profile": "Profile",

    // Auth
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.firstName": "First Name",
    "auth.lastName": "Last Name",
    "auth.restaurantName": "Restaurant Name",
    "auth.restaurantNameAr": "Restaurant Name (Arabic)",
    "auth.forgotPassword": "Forgot Password?",
    "auth.rememberMe": "Remember Me",
    "auth.noAccount": "Don't have an account?",
    "auth.loginSuccess": "Login successful",
    "auth.registerSuccess": "Registration successful",
    "auth.logoutSuccess": "Logout successful",

    // Auth Error Messages - Login
    "auth.error.invalidCredentials": "Invalid credentials",
    "auth.error.loginRateLimitExceeded": "Too many login attempts. Please try again after 5 minutes",
    "auth.error.userNotFound": "User not found",
    "auth.error.userInactive": "Account is inactive",
    "auth.error.loginFailed": "Login failed",
    "auth.error.serverError": "Internal server error. Please try again later",

    // Auth Error Messages - Registration
    "auth.error.userAlreadyExists":
      "This email is already registered. Please login instead",
    "auth.error.emailNotVerified":
      "Email not verified. Please verify your email before creating an account",
    "auth.error.registrationFailed": "Registration failed",
    "auth.error.invalidEmail": "Invalid email address",
    "auth.error.passwordTooShort": "Password must be at least 6 characters",
    "auth.error.passwordsDoNotMatch": "Passwords do not match",
    "auth.error.firstNameRequired": "First name is required",
    "auth.error.lastNameRequired": "Last name is required",
    "auth.error.restaurantNameRequired": "Restaurant name is required",

    // Auth Error Messages - Verification Code
    "auth.error.verificationCodeSent":
      "Verification code sent successfully. Please check your email",
    "auth.error.verificationCodeFailed":
      "Failed to send verification code. Please try again later",
    "auth.error.verificationCodeInvalid": "Invalid verification code",
    "auth.error.verificationCodeExpired":
      "Verification code has expired. Please request a new code",
    "auth.error.verificationCodeRequired": "Verification code is required",
    "auth.error.emailMissing": "Email is missing",
    "auth.error.rateLimitExceeded":
      "Rate limit exceeded. Please wait {minutes} minutes before requesting a new code",
    "auth.error.rateLimitExceededSingular":
      "Rate limit exceeded. Please wait 1 minute before requesting a new code",

    // Auth Error Messages - Resend Verification
    "auth.error.resendCodeSuccess": "Verification code sent successfully",
    "auth.error.resendCodeFailed": "Error sending verification code",

    // Auth Success Messages
    "auth.success.verificationCodeSent": "Verification code sent to your email",
    "auth.success.emailVerified": "Email verified successfully",
    "auth.success.accountCreated": "Account created successfully",
    "auth.success.passwordReset": "Password reset successfully",
    "auth.success.passwordResetCodeSent":
      "Password reset code sent to your email",

    // Password Reset Messages
    "auth.passwordReset.didNotReceiveCode": "Didn't receive the code?",
    "auth.passwordReset.checkSpam": "Please check your spam/junk folder",
    "auth.passwordReset.resendingCode": "Resending...",
    "auth.passwordReset.resendCodeSuccess": "Reset code resent successfully",

    // Contact Us Messages
    "contact.success.messageSent": "Your message has been sent successfully. We will contact you soon",
    "contact.error.fillAllFields": "Please fill all fields before sending.",
    "contact.error.invalidEmail": "Invalid email address",
    "contact.error.sendFailed": "An error occurred while sending the message",
    "contact.error.sendFailedRetry": "An error occurred while sending the message. Please try again later",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.available": "Available",
    "common.unavailable": "Unavailable",
    "common.optional": "Optional",

    // Menu
    "menu.title": "Menu Management",
    "menu.categories": "Categories",
    "menu.theme": "Menu.Theme",
    "menu.items": "Items",
    "menu.addCategory": "Add Category",
    "menu.addItem": "Add Item",
    "menu.categoryName": "Category Name",
    "menu.itemName": "Item Name",
    "menu.price": "Price",
    "menu.description": "Description",
    "menu.image": "Image",
    "menu.available": "Available",
    "menu.unavailable": "Unavailable",
    "menu.itemsInCategory": "items in this category",
    "menu.backToCategories": "Back to Categories",
    "menu.reorderCategories": "Reorder Categories",
    "category.active": "Active",
    "category.inactive": "Inactive",
    "menu.backToCategoriesShort": "Back",

    // Items
    "item.title": "Items Management",
    "item.add": "Add Item",
    "item.edit": "Edit Item",
    "item.name": "Item Name (English)",
    "item.nameAr": "Item Name (Arabic)",
    "item.description": "Description",
    "item.descriptionAr": "Description (Arabic)",
    "item.price": "Price",
    "item.currency": "Currency",
    "item.category": "Category",
    "item.selectCategory": "Select Category",
    "item.image": "Item Image",
    "item.sortOrder": "Sort Order",
    "item.extras": "Extras",
    "item.available": "Available",
    "item.unavailable": "Unavailable",
    "item.makeAvailable": "Make Available",
    "item.makeUnavailable": "Make Unavailable",
    "item.noItemsInCategory": "No items in this category",
    "item.addFirstItem": "Add your first item to this category",
    "item.deleteConfirm": "Are you sure you want to delete this item?",
    "item.deleteSuccess": "Item deleted successfully",
    "item.addSuccess": "Item added successfully",
    "item.updateSuccess": "Item updated successfully",
    "item.noDescription": "No description",
    "item.reorder": "Reorder Items",
    "item.reorderDescription": "Drag and drop items to reorder them",
    "item.noItemsToReorder": "No items to reorder",

    // Orders
    "orders.title": "Order Management",
    "orders.new": "New",
    "orders.received": "Received",
    "orders.preparing": "Preparing",
    "orders.ready": "Ready",
    "orders.completed": "Completed",
    "orders.cancelled": "Cancelled",
    "orders.tableNumber": "Table Number",
    "orders.customerName": "Customer Name",
    "orders.total": "Total",
    "orders.status": "Status",
    "orders.notes": "Notes",
    "orders.time": "Time",
    "orders.noOrders": "No orders",
    "orders.noOrdersDesc": "Orders will appear here when customers place them.",

    // QR Codes
    "qr.title": "QR Code Management",
    "qr.subtitle":
      "Generate and manage QR codes for your restaurant and tables",
    "qr.generate": "Generate QR Code",
    "qr.tableNumber": "Table Number",
    "qr.download": "Download",
    "qr.print": "Print",
    "qr.active": "Active",
    "qr.inactive": "Inactive",
    "qr.status": "Status",
    "qr.restaurantCode": "Restaurant QR Code",
    "qr.tableCodes": "Table QR Codes",
    "qr.restaurantCodeDesc":
      "This QR code directs customers to your restaurant's menu without a specific table number",
    "qr.noRestaurantCode": "No Restaurant QR Code",
    "qr.createRestaurantCodeDesc":
      "Create a QR code that customers can scan to view your restaurant's menu",
    "qr.createRestaurantCode": "Create Restaurant QR Code",
    "qr.viewMenu": "View Menu",
    "qr.copyUrl": "Copy URL",
    "qr.createSingle": "Create Single QR Code",
    "qr.enterTableNumber": "Enter table number",
    "qr.bulkGenerate": "Bulk Generate",
    "qr.bulkCreate": "Bulk Create QR Codes",
    "qr.byCount": "By Count (1, 2, 3...)",
    "qr.byNumbers": "By Specific Numbers",
    "qr.tableCount": "Number of Tables",
    "qr.tableNumbers": "Table Numbers (comma separated)",
    "qr.countDescription":
      "Will create QR codes for tables 1, 2, 3... up to the number you enter",
    "qr.numbersDescription": "Enter specific table numbers separated by commas",
    "qr.generateAll": "Generate All",
    "qr.noQRCodes": "No QR codes",
    "qr.noQRCodesDesc": "Get started by generating QR codes for your tables",
    "qr.selectMultiple": "Select Multiple",
    "qr.cancelSelection": "Cancel Selection",
    "qr.deleteSelected": "Delete Selected",
    "qr.selectAll": "Select All",
    "qr.selected": "selected",
    "qr.orders": "Orders",
    "qr.created": "Created",
    "qr.scanToView": "Scan this QR code to view the menu",
    "qr.downloadPdf": "Download PDF",
    "qr.printAll": "Print All",

    // Settings
    "settings.title": "Settings",
    "settings.restaurant": "Restaurant Info",
    "settings.theme": "Theme",
    "settings.language": "Language",
    "settings.notifications": "Notifications",
    "settings.account": "Account",

    // Theme
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",

    // QR Code Error Messages
    "qr.tableLimitReached":
      "You have reached the maximum number of tables ({limit}) for your current plan. Please upgrade your plan to add more tables.",
    "qr.cannotCreateTables":
      "Cannot create {requested} tables. You can only create {available} more tables ({limit} total limit). Please upgrade your plan to add more tables.",
    "qr.noActiveSubscription": "No active subscription found",
    "qr.restaurantNotFound": "Restaurant not found",

    // Customer Menu Toasts
    "menu.orderSuccess.dineIn": "Dine-in order placed successfully!",
    "menu.orderSuccess.delivery": "Delivery order placed successfully!",
    "menu.orderError.failed": "Failed to place order",
    "menu.orderError.qrRequired": "QR code scan required to access menu",
    "menu.orderError.customerNameRequired":
      "Customer name is required for delivery orders",
    "menu.orderError.customerNameMinLength":
      "Customer name must be more than 2 characters",
    "menu.orderError.customerPhoneRequired":
      "Phone number is required for delivery orders",
    "menu.orderError.customerPhoneInvalid":
      "Phone number must be 10 digits starting with 09",
    "menu.orderError.customerAddressRequired":
      "Address is required for delivery orders",
    "menu.orderError.addItemsFailed": "Failed to add items to order",
    "menu.orderError.tableNotOccupied":
      "Table is not occupied. Please ask the cashier to start a session for this table.",
    "waiter.requestError.failed": "Failed to send waiter request",
    "menu.orderSuccess.itemsAdded": "Items added to order successfully!",

    // Dashboard Plan Limits
    "dashboard.categoryLimitReached":
      "You have reached the maximum number of categories ({limit}) for your current plan. Please upgrade your plan to add more categories.",
    "dashboard.itemLimitReached":
      "You have reached the maximum number of items ({limit}) for this category in your current plan. Please upgrade your plan to add more items.",
    "dashboard.noActiveSubscription": "No active subscription found",

    // Dashboard
    "dashboard.welcome": "Welcome back,",
    "dashboard.subtitle": "Here's what's happening with your restaurant today.",
    "dashboard.totalOrders": "Total Orders",
    "dashboard.activeTables": "Active Tables",
    "dashboard.menuItems": "Menu Items",
    "dashboard.revenue": "Revenue",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.manageMenu": "Manage Menu",
    "dashboard.menuTheme": "Menu Theme",
    "dashboard.generateQR": "Generate QR Codes",
    "dashboard.viewOrders": "View Orders",
    "dashboard.recentActivity": "Recent Activity",
    "dashboard.activity.newOrder": "New order received for Table 5",
    "dashboard.activity.qrGenerated": "QR code generated for Table 8",
    "dashboard.activity.menuUpdated": "Menu item updated: Grilled Salmon",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("AR");

  useEffect(() => {
    // Get language from localStorage or default to AR
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "AR" || savedLanguage === "EN")) {
      setLanguage(savedLanguage);
    } else {
      // Set default language to Arabic
      setLanguage("AR");
      localStorage.setItem("language", "AR");
    }
  }, []);

  // Additional useEffect to ensure direction is applied when language changes
  useEffect(() => {
    document.documentElement.dir = language === "AR" ? "rtl" : "ltr";
    document.documentElement.lang = language === "AR" ? "ar" : "en";
  }, [language]);

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  const isRTL = language === "AR";

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
