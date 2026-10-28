import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "أسمنت وخرسانة", slug: "cement", icon: "Layers" },
  { name: "حديد وحدادة", slug: "steel", icon: "Grid3x3" },
  { name: "ركام وحصى", slug: "aggregate", icon: "Mountain" },
  { name: "طوب وبلوك", slug: "blocks", icon: "BrickWall" },
  { name: "بلاط وسيراميك", slug: "tiles", icon: "LayoutGrid" },
  { name: "جبس وألواح جبسية", slug: "gypsum", icon: "Square" },
  { name: "دهانات", slug: "paint", icon: "Paintbrush" },
  { name: "عوازل", slug: "insulation", icon: "Shield" },
  { name: "أدوات صحية وسباكة", slug: "plumbing", icon: "Droplets" },
  { name: "كهربائيات", slug: "electrical", icon: "Zap" },
  { name: "خشب وأبوكسيد", slug: "wood", icon: "TreePine" },
  { name: "زجاج وألمنيوم", slug: "glass", icon: "PanelsTopLeft" },
  { name: "مواد بناء متنوعة", slug: "misc", icon: "Package" },
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
  const adminPassword = await bcrypt.hash("Omar2020@", 10);
  const customerPassword = await bcrypt.hash("Customer@12345", 10);
  const supplierPassword = await bcrypt.hash("Supplier@12345", 10);

  await prisma.user.upsert({
    where: { email: "om@r.sa" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "om@r.sa",
      phone: "0500000000",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@bunyan.sa" },
    update: {},
    create: {
      name: "عبدالله المقاول",
      email: "customer@bunyan.sa",
      phone: "0551111111",
      city: "الرياض",
      passwordHash: customerPassword,
      role: "CUSTOMER",
    },
  });

  console.log("Seeding suppliers...");
  const suppliers = [
    {
      email: "alsafa@bunyan.sa",
      ownerName: "خالد الصفا",
      companyName: "مؤسسة الصفا لمواد البناء",
      slug: "alsafa",
      city: "الرياض",
      region: "الرياض",
      description:
        "توريد الأسمنت والحديد والركام لمشاريع المقاولات في المنطقة الوسطى. خبرة أكثر من 15 عاماً.",
    },
    {
      email: "modern@bunyan.sa",
      ownerName: "سعيد الحديثي",
      companyName: "شركة البناء الحديث",
      slug: "modern-building",
      city: "جدة",
      region: "مكة المكرمة",
      description:
        "متخصصون في البلاط والسيراميك والأدوات الصحية والدهانات بأفضل الأسعار.",
    },
    {
      email: "sharq@bunyan.sa",
      ownerName: "ماجد الشرقي",
      companyName: "مؤسسة الشرق للعوازل والجبس",
      slug: "sharq-insulation",
      city: "الدمام",
      region: "المنطقة الشرقية",
      description: "عوازل مائية وحرارية وألواح جبسية معتمدة لمشاريع البناء.",
    },
  ];

  for (const supplier of suppliers) {
    const existing = await prisma.user.findUnique({
      where: { email: supplier.email },
    });
    if (existing) continue;

    await prisma.user.create({
      data: {
        name: supplier.ownerName,
        email: supplier.email,
        phone: "0562222222",
        passwordHash: supplierPassword,
        role: "SUPPLIER",
        supplier: {
          create: {
            companyName: supplier.companyName,
            slug: supplier.slug,
            city: supplier.city,
            region: supplier.region,
            description: supplier.description,
            phone: "0562222222",
            whatsapp: "0562222222",
            status: "APPROVED",
            crNumber: "1010000001",
          },
        },
      },
    });
  }

  const supplierProfiles = await prisma.supplierProfile.findMany();
  const supplierIdBySlug = new Map(supplierProfiles.map((s) => [s.slug, s.id]));

  console.log("Seeding materials...");
  const materials = [
    {
      supplier: "alsafa",
      category: "cement",
      name: "أسمنت بورتلاندي 50 كجم",
      unit: "BAG" as const,
      price: 14.5,
      minOrderQty: 100,
      stock: 5000,
      description: "أسمنت بورتلاند عادي مطابق للمواصفات السعودية، عبوة 50 كجم.",
    },
    {
      supplier: "alsafa",
      category: "steel",
      name: "حديد تسليح 12 ملم",
      unit: "TON" as const,
      price: 2650,
      minOrderQty: 2,
      stock: 120,
      description: "حديد تسليح عالي الجهد، أطوال 12 متر.",
    },
    {
      supplier: "alsafa",
      category: "aggregate",
      name: "ركام بحص 3/4",
      unit: "CUBIC_METER" as const,
      price: 55,
      minOrderQty: 20,
      stock: null,
      description: "ركام مغسول نظيف مناسب للخرسانة.",
    },
    {
      supplier: "modern-building",
      category: "tiles",
      name: "بلاط بورسلان أرضي 60×60",
      unit: "SQUARE_METER" as const,
      price: 42,
      minOrderQty: 50,
      stock: 2000,
      description: "بورسلان مقاوم للخدش، تشكيلات متعددة.",
    },
    {
      supplier: "modern-building",
      category: "paint",
      name: "دهان بلاستيك داخلي 18 لتر",
      unit: "LITER" as const,
      price: 9.5,
      minOrderQty: 18,
      stock: 800,
      description: "دهان مائي داخلي عالي التغطية، قابل للغسل.",
    },
    {
      supplier: "modern-building",
      category: "plumbing",
      name: "طقم خلاط مطبخ فاخر",
      unit: "PIECE" as const,
      price: 320,
      minOrderQty: 1,
      stock: 150,
      description: "خلاط مطبخ ستانلس ستيل بضمان سنتين.",
    },
    {
      supplier: "sharq-insulation",
      category: "insulation",
      name: "عازل مائي رول 4 ملم",
      unit: "ROLL" as const,
      price: 85,
      minOrderQty: 10,
      stock: 600,
      description: "رول عازل بيتوميني للحماية من الرطوبة.",
    },
    {
      supplier: "sharq-insulation",
      category: "gypsum",
      name: "لوح جبس عادي 12 ملم",
      unit: "PIECE" as const,
      price: 28,
      minOrderQty: 20,
      stock: 1500,
      description: "ألواح جبسية بمواصفات قياسية للمقاولات الداخلية.",
    },
  ];

  for (const material of materials) {
    const supplierId = supplierIdBySlug.get(material.supplier);
    const categoryId = categoryBySlug.get(material.category);
    if (!supplierId || !categoryId) continue;

    const exists = await prisma.material.findFirst({
      where: { supplierId, name: material.name },
    });
    if (exists) continue;

    const profile = supplierProfiles.find((s) => s.id === supplierId);
    await prisma.material.create({
      data: {
        supplierId,
        categoryId,
        name: material.name,
        unit: material.unit,
        price: material.price,
        minOrderQty: material.minOrderQty,
        stock: material.stock,
        description: material.description,
        city: profile?.city ?? "الرياض",
        region: profile?.region ?? "الرياض",
      },
    });
  }

  console.log("Seeding orders...");
  const customer = await prisma.user.findUnique({
    where: { email: "customer@bunyan.sa" },
  });
  const cement = await prisma.material.findFirst({
    where: { name: "أسمنت بورتلاندي 50 كجم" },
    include: { supplier: true },
  });

  if (customer && cement) {
    const existing = await prisma.order.findUnique({
      where: { number: "ORD-DEMO-0001" },
    });
    if (!existing) {
      const quantity = 200;
      const unitPrice = cement.price;
      const subtotal = Math.round(unitPrice * quantity * 100) / 100;
      const vat = Math.round(subtotal * 0.15 * 100) / 100;
      const total = Math.round((subtotal + vat) * 100) / 100;

      await prisma.order.create({
        data: {
          number: "ORD-DEMO-0001",
          customerId: customer.id,
          requestedSupplierName: cement.supplier.companyName,
          subtotal,
          vat,
          total,
          deliveryCity: "الرياض",
          deliveryAddress: "حي النرجس، مشروع فيلا رقم 12",
          contactPhone: "0551111111",
          notes: "التسليم خلال أسبوع إن أمكن.",
          items: {
            create: [
              {
                materialId: cement.id,
                name: cement.name,
                unit: cement.unit,
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
  console.log("  Admin    -> om@r.sa / Omar2020@");
  console.log("  Customer -> customer@bunyan.sa / Customer@12345");
  console.log("  Supplier -> alsafa@bunyan.sa / Supplier@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
