export const APP_NAME = "سينوفا إنترناشيونال";
export const APP_TAGLINE = "مواد البناء والحديد والأخشاب";
export const APP_DESCRIPTION =
  "توريد مواد البناء والحديد والأخشاب والشبك والأسلاك للمقاولات والمشاريع في المملكة العربية السعودية.";

/** بيانات التواصل الرسمية */
export const COMPANY_PHONE = "+966594426678";
export const COMPANY_PHONE_DISPLAY = "0594426678";
export const COMPANY_EMAIL = "info@alrajeh.com.sa";
export const COMPANY_ADDRESS = "الدمام — حي النابية، المملكة العربية السعودية";

/** ضريبة القيمة المضافة في المملكة العربية السعودية */
export const VAT_RATE = 0.15;

export type City = { name: string; region: string };

export const SAUDI_REGIONS = [
  "الرياض",
  "مكة المكرمة",
  "المدينة المنورة",
  "القصيم",
  "المنطقة الشرقية",
  "عسير",
  "تبوك",
  "حائل",
  "الحدود الشمالية",
  "جازان",
  "نجران",
  "الباحة",
  "الجوف",
] as const;

export const SAUDI_CITIES: City[] = [
  { name: "الرياض", region: "الرياض" },
  { name: "الخرج", region: "الرياض" },
  { name: "الدوادمي", region: "الرياض" },
  { name: "المجمعة", region: "الرياض" },
  { name: "الزلفي", region: "الرياض" },
  { name: "وادي الدواسر", region: "الرياض" },
  { name: "الأفلاج", region: "الرياض" },
  { name: "حوطة بني تميم", region: "الرياض" },
  { name: "مكة المكرمة", region: "مكة المكرمة" },
  { name: "جدة", region: "مكة المكرمة" },
  { name: "الطائف", region: "مكة المكرمة" },
  { name: "رابغ", region: "مكة المكرمة" },
  { name: "الليث", region: "مكة المكرمة" },
  { name: "القنفذة", region: "مكة المكرمة" },
  { name: "المدينة المنورة", region: "المدينة المنورة" },
  { name: "ينبع", region: "المدينة المنورة" },
  { name: "العلا", region: "المدينة المنورة" },
  { name: "بدر", region: "المدينة المنورة" },
  { name: "الدمام", region: "المنطقة الشرقية" },
  { name: "الخبر", region: "المنطقة الشرقية" },
  { name: "الظهران", region: "المنطقة الشرقية" },
  { name: "الأحساء", region: "المنطقة الشرقية" },
  { name: "القطيف", region: "المنطقة الشرقية" },
  { name: "حفر الباطن", region: "المنطقة الشرقية" },
  { name: "الجبيل", region: "المنطقة الشرقية" },
  { name: "بقيق", region: "المنطقة الشرقية" },
  { name: "رأس تنورة", region: "المنطقة الشرقية" },
  { name: "بريدة", region: "القصيم" },
  { name: "عنيزة", region: "القصيم" },
  { name: "الرس", region: "القصيم" },
  { name: "البكيرية", region: "القصيم" },
  { name: "أبها", region: "عسير" },
  { name: "خميس مشيط", region: "عسير" },
  { name: "بيشة", region: "عسير" },
  { name: "محايل عسير", region: "عسير" },
  { name: "ظهران الجنوب", region: "عسير" },
  { name: "تبوك", region: "تبوك" },
  { name: "الوجه", region: "تبوك" },
  { name: "ضباء", region: "تبوك" },
  { name: "حائل", region: "حائل" },
  { name: "بقعاء", region: "حائل" },
  { name: "عرعر", region: "الحدود الشمالية" },
  { name: "رفحاء", region: "الحدود الشمالية" },
  { name: "طريف", region: "الحدود الشمالية" },
  { name: "جازان", region: "جازان" },
  { name: "صبيا", region: "جازان" },
  { name: "أبو عريش", region: "جازان" },
  { name: "نجران", region: "نجران" },
  { name: "شرورة", region: "نجران" },
  { name: "الباحة", region: "الباحة" },
  { name: "بلجرشي", region: "الباحة" },
  { name: "سكاكا", region: "الجوف" },
  { name: "القريات", region: "الجوف" },
  { name: "دومة الجندل", region: "الجوف" },
];

export const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "عميل",
  ADMIN: "مدير النظام",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const ORDER_STATUS_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

// Forward-only progression. Terminal states (DELIVERED, CANCELLED) have no next
// status. Only admins move orders along this flow.
export const ORDER_STATUS_NEXT: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

// Statuses from which an admin may still cancel an order.
export const ORDER_STATUS_CANCELLABLE = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
];

export const UNIT_LABELS: Record<string, string> = {
  BAG: "كيس",
  TON: "طن",
  CUBIC_METER: "متر مكعب",
  SQUARE_METER: "متر مربع",
  METER: "متر طولي",
  PIECE: "قطعة",
  ROLL: "لفة",
  LITER: "لتر",
  KILOGRAM: "كيلوجرام",
  BOX: "صندوق",
  OTHER: "أخرى",
};

export const UNITS = Object.keys(UNIT_LABELS);

export const CATEGORY_SEED = [
  { name: "منتجات الحديد والصلب", slug: "steel", icon: "Grid3x3" },
  { name: "الأخشاب والأبوكسيد", slug: "wood", icon: "TreePine" },
  { name: "الشبك والأسلاك", slug: "mesh-wire", icon: "Grid2x2" },
  { name: "الأسوار والأسقف المعدنية", slug: "fencing-roofing", icon: "Fence" },
  { name: "شبك الأرضيات (الگراتينگ)", slug: "grating", icon: "LayoutGrid" },
  { name: "مواد ومستلزمات إنشائية", slug: "misc", icon: "Package" },
];

export const SESSION_COOKIE = "sinova_session";

export type Role = "CUSTOMER" | "ADMIN";
