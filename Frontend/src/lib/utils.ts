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

export function formatDateTime(date: string | Date = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Guatemala'
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

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria de Guatemala
 * Esto evita problemas de diferencia de zona horaria entre cliente y servidor
 */
export function getTodayGuatemalaDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Guatemala'
  })
  return formatter.format(new Date())
}

/**
 * Obtiene la fecha y hora actual en zona horaria de Guatemala
 */
export function getNowGuatemalaDate(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Guatemala'
  })
  const parts = formatter.formatToParts(new Date())
  const dateObj: any = {}
  parts.forEach(part => {
    dateObj[part.type] = part.value
  })
  return new Date(`${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`)
}

/**
 * Parsea un valor numérico de forma segura evitando problemas de precisión flotante
 * Ejemplo: "4000" -> 4000, "4000.50" -> 4000.50
 * Evita: 4000 -> 3999.98
 */
export function parseDecimalAmount(value: string | number): number {
  if (typeof value === 'number') return value
  
  const str = String(value).trim()
  if (!str || str === '') return 0
  
  // Remover espacios en blanco
  const cleaned = str.replace(/\s/g, '')
  
  // Usar regex para validar formato decimal válido
  const match = cleaned.match(/^-?\d+(\.\d{1,10})?$/)
  if (!match) return 0
  
  // Usar Math.round para evitar problemas de precisión flotante
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return 0
  
  // Redondear a 2 decimales para evitar problemas de precisión
  return Math.round(parsed * 100) / 100
}

