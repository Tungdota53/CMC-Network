import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility gộp Tailwind classes an toàn, xử lý xung đột classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng tiền tệ VND
 */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

/**
 * Format ngày giờ tương đối (Vd: "2 giờ trước")
 */
// TODO: Implement date formatter using date-fns
