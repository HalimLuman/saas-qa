import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function priorityColor(priority: string) {
  switch (priority) {
    case 'P0': return 'bg-red-100 text-red-800 border-red-200'
    case 'P1': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'P2': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'P3': return 'bg-gray-100 text-gray-700 border-gray-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function severityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
    case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
