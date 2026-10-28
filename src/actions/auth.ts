"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/dal";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import {
  loginSchema,
  registerCustomerSchema,
} from "@/lib/validation";
import { type Role } from "@/lib/constants";
import { type ActionState, toFieldErrors } from "@/lib/action-state";

// A valid bcrypt hash used only to equalize login timing for unknown emails.
const DUMMY_PASSWORD_HASH =
  "$2b$10$xeSyvgBg8gfvyu2KRxwlp.w/KD//mK0pCtjNlh7BTiXoWmuVKA7hu";

// Allow at most 5 failed attempts per client per 15 minutes.
const LOGIN_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

async function loginRateLimitKey(email: string): Promise<string> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  return `login:${ip}:${email.trim().toLowerCase()}`;
}

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

  const rateLimitKey = await loginRateLimitKey(email);
  const limit = rateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
    return {
      error: `تم تجاوز عدد محاولات الدخول المسموح بها. حاول مرة أخرى بعد ${minutes} دقيقة.`,
    };
  }

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

  resetRateLimit(rateLimitKey);

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
    default:
      return "/dashboard";
  }
}
