import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "om@r.sa";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Omar2020@";
const CUSTOMER_EMAIL = process.env.DEMO_CUSTOMER_EMAIL ?? "customer@sinova.sa";
const CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD ?? "Customer@12345";

const CATEGORIES = [
  { name: "منتجات الحديد والصلب", slug: "steel", icon: "Grid3x3" },
  { name: "الأخشاب", slug: "wood", icon: "TreePine" },
  { name: "الشبك والأسلاك", slug: "mesh-wire", icon: "Grid2x2" },
  { name: "الأسوار والأسقف المعدنية", slug: "fencing-roofing", icon: "Fence" },
  { name: "شبك الأرضيات (الگراتينگ)", slug: "grating", icon: "LayoutGrid" },
  { name: "مواد ومستلزمات إنشائية", slug: "misc", icon: "Package" },
];

type Unit = "BAG" | "TON" | "CUBIC_METER" | "SQUARE_METER" | "METER" | "PIECE" | "ROLL" | "LITER" | "KILOGRAM" | "BOX" | "OTHER";

const MATERIALS: {
  category: string;
  name: string;
  unit: Unit;
  price: number;
  minOrderQty: number;
  stock: number | null;
  city: string;
  region: string;
  description: string;
}[] = [
  {
    category: "steel",
    name: "حديد تسليح 12 ملم — طول 12 م",
    unit: "TON",
    price: 2650,
    minOrderQty: 2,
    stock: 180,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "حديد تسليح عالي المقاومة مطابق للمواصفات السعودية، أطوال 12 متر.",
  },
  {
    category: "steel",
    name: "حديد تسليح 16 ملم — طول 12 م",
    unit: "TON",
    price: 2680,
    minOrderQty: 2,
    stock: 140,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "حديد تسليح عالي المقاومة للاستخدامات الإنشائية، أطوال 12 متر.",
  },
  {
    category: "steel",
    name: "مواسير حديد مجلفن 2 بوصة",
    unit: "METER",
    price: 38,
    minOrderQty: 20,
    stock: 900,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "مواسير حديد مجلفن مقاومة للصدأ للاستخدامات الإنشائية والصناعية.",
  },
  {
    category: "steel",
    name: "كمرات حديد H-Beam",
    unit: "TON",
    price: 3150,
    minOrderQty: 1,
    stock: 60,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "كمرات حديد عالية التحمل للهياكل الحاملة والمنشآت الصناعية.",
  },
  {
    category: "steel",
    name: "ألواح صاج مجلفن 1 ملم",
    unit: "SQUARE_METER",
    price: 46,
    minOrderQty: 25,
    stock: 1200,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "ألواح صاج مجلفن متعددة الاستخدامات في التغطية والتصنيع.",
  },
  {
    category: "wood",
    name: "خشب صلب 2×4 بوصة — طول 4 م",
    unit: "PIECE",
    price: 34,
    minOrderQty: 20,
    stock: 800,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "خشب صلب معروف بقوته ومتانته، مناسب للهياكل الحاملة وأعمال النجارة.",
  },
  {
    category: "wood",
    name: "خشب صلب 2×6 بوصة — طول 4 م",
    unit: "PIECE",
    price: 52,
    minOrderQty: 15,
    stock: 600,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "خشب صلب عالي الجودة لأعمال البناء والنجارة الدقيقة.",
  },
  {
    category: "wood",
    name: "خشب صلب 4×4 بوصة — طول 4 م",
    unit: "PIECE",
    price: 68,
    minOrderQty: 10,
    stock: 400,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "خشب صلب بأبعاد كبيرة للاستخدامات الإنشائية الثقيلة.",
  },
  {
    category: "mesh-wire",
    name: "شبك تسليح ملحوم 6 ملم",
    unit: "SQUARE_METER",
    price: 24,
    minOrderQty: 30,
    stock: 2500,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "شبك حديدي ملحوم لتسليح الأسقف والأرضيات الخرسانية.",
  },
  {
    category: "mesh-wire",
    name: "سلك ربط مجلفن 1.5 ملم",
    unit: "KILOGRAM",
    price: 9.5,
    minOrderQty: 50,
    stock: 3000,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "سلك ربط مجلفن عالي المرونة لأعمال التسليح والربط.",
  },
  {
    category: "fencing-roofing",
    name: "أسوار شبك مجلفن — ارتفاع 2 م",
    unit: "METER",
    price: 78,
    minOrderQty: 10,
    stock: 1500,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "أسوار شبكية مجلفنة للحماية والتسييج، مقاومة للصدأ.",
  },
  {
    category: "fencing-roofing",
    name: "ألواح تسقيف معدنية معزولة",
    unit: "SQUARE_METER",
    price: 92,
    minOrderQty: 20,
    stock: 900,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "ألواح تسقيف معدنية معزولة حرارياً ومقاومة للعوامل الجوية.",
  },
  {
    category: "grating",
    name: "شبك أرضيات مجلفن 30×100 سم",
    unit: "PIECE",
    price: 145,
    minOrderQty: 5,
    stock: 350,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "گراتينگ صناعي مجلفن للسلامة والتصريف في المنشآت الصناعية.",
  },
  {
    category: "misc",
    name: "مسامير تثبيت ثقيلة",
    unit: "BOX",
    price: 28,
    minOrderQty: 10,
    stock: 500,
    city: "الدمام",
    region: "المنطقة الشرقية",
    description: "مسامير تثبيت عالية التحمّل للاستخدامات الإنشائية والصناعية.",
  },
];

async function main() {
  console.log("Seeding categories...");
  const categoryBySlug = new Map<string, string>();
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon },
      create: category,
    });
    categoryBySlug.set(category.slug, record.id);
  }

  console.log("Seeding users...");
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const customerPasswordHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", passwordHash: adminPasswordHash },
    create: {
      name: "مدير النظام",
      email: ADMIN_EMAIL,
      phone: "0594426678",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: CUSTOMER_EMAIL },
    update: {},
    create: {
      name: "عبدالله المقاول",
      email: CUSTOMER_EMAIL,
      phone: "0551111111",
      city: "الدمام",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });

  console.log("Seeding materials...");
  for (const material of MATERIALS) {
    const categoryId = categoryBySlug.get(material.category);
    if (!categoryId) continue;

    const exists = await prisma.material.findFirst({
      where: { name: material.name },
    });
    if (exists) continue;

    await prisma.material.create({
      data: {
        categoryId,
        name: material.name,
        unit: material.unit,
        price: material.price,
        minOrderQty: material.minOrderQty,
        stock: material.stock,
        description: material.description,
        city: material.city,
        region: material.region,
      },
    });
  }

  console.log("Seeding demo order...");
  const customer = await prisma.user.findUnique({
    where: { email: CUSTOMER_EMAIL },
  });
  const steel = await prisma.material.findFirst({
    where: { name: "حديد تسليح 12 ملم — طول 12 م" },
  });

  if (customer && steel) {
    const existing = await prisma.order.findUnique({
      where: { number: "ORD-DEMO-0001" },
    });
    if (!existing) {
      const quantity = 5;
      const unitPrice = steel.price;
      const subtotal = Math.round(unitPrice * quantity * 100) / 100;
      const vat = Math.round(subtotal * 0.15 * 100) / 100;
      const total = Math.round((subtotal + vat) * 100) / 100;

      await prisma.order.create({
        data: {
          number: "ORD-DEMO-0001",
          customerId: customer.id,
          subtotal,
          vat,
          total,
          deliveryCity: "الدمام",
          deliveryAddress: "حي النابية، مشروع فيلا رقم 12",
          contactPhone: "0551111111",
          notes: "التسليم خلال أسبوع إن أمكن.",
          items: {
            create: [
              {
                materialId: steel.id,
                name: steel.name,
                unit: steel.unit,
                quantity,
                unitPrice,
                lineTotal: subtotal,
              },
            ],
          },
        },
      });
    }
  }

  console.log("Seed completed successfully.");
  console.log("Accounts:");
  console.log(`  Admin    -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Customer -> ${CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
