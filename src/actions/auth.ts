"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  loginSchema,
  registerCustomerSchema,
  registerSupplierSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/format";
import { type Role } from "@/lib/constants";
import { type ActionState, toFieldErrors } from "@/lib/action-state";

// A valid bcrypt hash used only to equalize login timing for unknown emails.
const DUMMY_PASSWORD_HASH =
  "$2b$10$xeSyvgBg8gfvyu2KRxwlp.w/KD//mK0pCtjNlh7BTiXoWmuVKA7hu";

export async function registerCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerCustomerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    city: formData.get("city") ?? "",
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { name, email, phone, city, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        city: city || null,
        passwordHash,
        role: "CUSTOMER",
      },
    });
    await createSession({ userId: user.id, role: "CUSTOMER", name: user.name });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { fieldErrors: { email: ["هذا البريد الإلكتروني مسجل مسبقاً"] } };
    }
    return { error: "تعذّر إنشاء الحساب، حاول مرة أخرى" };
  }

  redirect("/dashboard");
}

export async function registerSupplier(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSupplierSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    crNumber: formData.get("crNumber") ?? "",
    vatNumber: formData.get("vatNumber") ?? "",
    city: formData.get("city"),
    region: formData.get("region"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const data = parsed.data;

  try {
    const passwordHash = await hashPassword(data.password);
    const baseSlug = slugify(data.companyName);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: "SUPPLIER",
        supplier: {
          create: {
            companyName: data.companyName,
            slug: `${baseSlug}-${Date.now().toString(36)}`,
            crNumber: data.crNumber || null,
            vatNumber: data.vatNumber || null,
            phone: data.phone,
            city: data.city,
            region: data.region,
            description: data.description || null,
            status: "PENDING",
          },
        },
      },
    });
    await createSession({ userId: user.id, role: "SUPPLIER", name: user.name });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { fieldErrors: { email: ["هذا البريد الإلكتروني مسجل مسبقاً"] } };
    }
    return { error: "تعذّر إنشاء الحساب، حاول مرة أخرى" };
  }

  redirect("/supplier/dashboard");
}

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Always run a bcrypt comparison so response time does not reveal whether the
  // email exists (mitigates user enumeration).
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user || !valid) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  await createSession({
    userId: user.id,
    role: user.role as Role,
    name: user.name,
  });

  redirect(dashboardForRole(user.role));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function dashboardPath(): Promise<string> {
  const user = await getCurrentUser();
  return user ? dashboardForRole(user.role) : "/login";
}

function dashboardForRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SUPPLIER":
      return "/supplier/dashboard";
    default:
      return "/dashboard";
  }
}
