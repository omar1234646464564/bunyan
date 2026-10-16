import { VAT_RATE } from "./constants";

const currencyFormatter = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("ar-SA-u-nu-latn");

const dateFormatter = new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatSAR(value: number | string | { toString(): string }): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  return currencyFormatter.format(Number.isFinite(n) ? n : 0);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return dateFormatter.format(d);
}

export function toNumber(value: number | string | { toString(): string }): number {
  return typeof value === "number" ? value : Number(value.toString());
}

export function calcVat(subtotal: number): number {
  return Math.round(subtotal * VAT_RATE * 100) / 100;
}

export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || `s-${Date.now().toString(36)}`;
}

export function orderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `BY-${y}-${rand}`;
}
