import { z } from "zod";

const saudiPhone = /^(?:\+9665|05)\d{8}$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("البريد الإلكتروني غير صالح");

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل");

export const phoneSchema = z
  .string()
  .trim()
  .regex(saudiPhone, "رقم جوال سعودي غير صالح (مثال 05xxxxxxxx)")
  .optional()
  .or(z.literal(""));

export const registerCustomerSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب"),
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().trim().optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const materialSchema = z.object({
  name: z.string().trim().min(2, "اسم المنتج مطلوب"),
  categoryId: z.string().trim().min(1, "التصنيف مطلوب"),
  description: z.string().trim().max(2000).optional(),
  unit: z.string().trim().min(1, "وحدة القياس مطلوبة"),
  price: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر"),
  minOrderQty: z.coerce.number().int().positive().default(1),
  stock: z.coerce.number().int().nonnegative().optional(),
  city: z.string().trim().min(1, "المدينة مطلوبة"),
  region: z.string().trim().min(1, "المنطقة مطلوبة"),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "الرسالة فارغة").max(2000),
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
