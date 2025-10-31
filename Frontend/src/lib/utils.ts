import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'GTQ'): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Parse an ISO date string (YYYY-MM-DD) correctly, avoiding timezone issues
 */
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function calculatePercentage(current: number, target: number): number {
  if (target === 0) return 0
  return Math.round((current / target) * 100)
}
