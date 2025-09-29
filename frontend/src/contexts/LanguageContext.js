import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation data
const translations = {
  en: {
    // Header
    brandName: 'K2 Coffee',
    brandTagline: 'Premium Coffee Experience',
    language: 'En',
    
    // Navigation
    mainMenu: 'Main menu',
    myOrder: 'My order',
    orderQueue: 'Order Queue',
    eatIn: 'Eat in',
    
    // Product actions
    addToCart: 'Add to Cart',
    unavailable: 'Unavailable',
    loading: 'Loading...',
    
    // Cart
    emptyCart: 'Your order is empty',
    total: 'Total',
    order: 'Order',
    processing: 'Processing...',
    
    // Order status
    queuing: 'Queuing',
    making: 'Making',
    noOrders: 'No orders in queue',
    
    // Success modal
    orderPlaced: 'Order Placed Successfully!',
    thankYou: 'Thank you for your order! Your delicious coffee will be ready soon.',
    orderMore: 'Order More',
    printReceipt: 'Print Receipt',
    printing: 'Printing...',
    
    // Out of order
    outOfOrder: 'Out of Order',
    maintenanceMode: 'System Status: Maintenance Mode',
    sorryMessage: 'Sorry, our coffee machine is temporarily out of order. Please try again later.',
    
    // Categories
    allItems: 'All Items',
    
    // Customization
    customize: 'Customize',
    selectOptions: 'Select Options',
    confirm: 'Confirm',
    cancel: 'Cancel',
    
    // Latte Art
    selectLatteArt: 'Select Latte Art',
    uploadCustom: 'Upload Custom',
    takePhoto: 'Take Photo',
    none: 'None',
    
    // Missing ingredients
    missing: 'Missing',
    ingredients: 'ingredients',
    
    // Customization Modal
    beanType: 'Bean Type',
    milkType: 'Milk Type',
    icePreference: 'Ice Preference',
    coffeeShots: 'Coffee Shots',
    latteArtDesign: 'Latte Art Design',
    quantity: 'Quantity',
    addToCart: 'Add to Cart',
    uploading: 'Uploading...',
    uploadCustom: 'Upload Custom',
    takePhoto: 'Take Photo',
    none: 'None',
    withIce: 'With Ice',
    noIce: 'No Ice',
    singleShot: 'Single Shot',
    doubleShot: 'Double Shot',
    regularIce: 'Regular ice',
    hotBeverage: 'Hot beverage',
    regularStrength: 'Regular strength',
    houseBlend: 'House Blend',
    premiumRoast: 'Premium Roast',
    wholeMilk: 'Whole milk',
    plantBased: 'Plant-based',
    customImagePreview: 'Custom Image Preview:'
  },
  ar: {
    // Header
    brandName: 'كوفي كي تو',
    brandTagline: 'تجربة قهوة مميزة',
    language: 'ع',
    
    // Navigation
    mainMenu: 'القائمة الرئيسية',
    myOrder: 'طلبي',
    orderQueue: 'طابور الطلبات',
    eatIn: 'تناول في المطعم',
    
    // Product actions
    addToCart: 'أضف للسلة',
    unavailable: 'غير متوفر',
    loading: 'جاري التحميل...',
    
    // Cart
    emptyCart: 'سلتك فارغة',
    total: 'المجموع',
    order: 'اطلب',
    processing: 'جاري المعالجة...',
    
    // Order status
    queuing: 'في الطابور',
    making: 'جاري التحضير',
    noOrders: 'لا توجد طلبات في الطابور',
    
    // Success modal
    orderPlaced: 'تم وضع الطلب بنجاح!',
    thankYou: 'شكراً لك على طلبك! قهوتك اللذيذة ستكون جاهزة قريباً.',
    orderMore: 'اطلب المزيد',
    printReceipt: 'اطبع الفاتورة',
    printing: 'جاري الطباعة...',
    
    // Out of order
    outOfOrder: 'خارج الخدمة',
    maintenanceMode: 'حالة النظام: وضع الصيانة',
    sorryMessage: 'عذراً، آلة القهوة لدينا خارج الخدمة مؤقتاً. يرجى المحاولة لاحقاً.',
    
    // Categories
    allItems: 'جميع الأصناف',
    
    // Customization
    customize: 'تخصيص',
    selectOptions: 'اختر الخيارات',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    
    // Latte Art
    selectLatteArt: 'اختر فن اللاتيه',
    uploadCustom: 'رفع صورة مخصصة',
    takePhoto: 'التقاط صورة',
    none: 'بدون',
    
    // Missing ingredients
    missing: 'مفقود',
    ingredients: 'مكونات',
    
    // Customization Modal
    beanType: 'نوع الحبوب',
    milkType: 'نوع الحليب',
    icePreference: 'تفضيل الثلج',
    coffeeShots: 'جرعات القهوة',
    latteArtDesign: 'تصميم فن اللاتيه',
    quantity: 'الكمية',
    addToCart: 'أضف للسلة',
    uploading: 'جاري الرفع...',
    uploadCustom: 'رفع مخصص',
    takePhoto: 'التقاط صورة',
    none: 'بدون',
    withIce: 'مع ثلج',
    noIce: 'بدون ثلج',
    singleShot: 'جرعة واحدة',
    doubleShot: 'جرعتان',
    regularIce: 'ثلج عادي',
    hotBeverage: 'مشروب ساخن',
    regularStrength: 'قوة عادية',
    houseBlend: 'مزيج البيت',
    premiumRoast: 'تحميص مميز',
    wholeMilk: 'حليب كامل',
    plantBased: 'نباتي',
    customImagePreview: 'معاينة الصورة المخصصة:'
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Get language from localStorage or default to English
    const savedLanguage = localStorage.getItem('kiosk-language');
    return savedLanguage && translations[savedLanguage] ? savedLanguage : 'en';
  });

  const [isRTL, setIsRTL] = useState(currentLanguage === 'ar');

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('kiosk-language', currentLanguage);
    setIsRTL(currentLanguage === 'ar');
    
    // Update document direction
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key, fallback = '') => {
    return translations[currentLanguage]?.[key] || fallback || key;
  };

  const getProductName = (product) => {
    if (currentLanguage === 'ar' && product.goodsNameOt) {
      return product.goodsNameOt;
    }
    return product.goodsNameEn || product.goodsName;
  };

  const value = {
    currentLanguage,
    isRTL,
    toggleLanguage,
    t,
    getProductName
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
