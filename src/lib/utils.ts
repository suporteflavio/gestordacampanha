import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined, pattern = 'dd/MM/yyyy'): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistance(d, new Date(), { locale: ptBR, addSuffix: true })
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateCode(prefix = '', length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-400',
    inactive: 'text-gray-400',
    pending: 'text-yellow-400',
    approved: 'text-blue-400',
    paid: 'text-green-400',
    cancelled: 'text-red-400',
    open: 'text-blue-400',
    in_progress: 'text-yellow-400',
    resolved: 'text-green-400',
    archived: 'text-gray-400',
    scheduled: 'text-blue-400',
    done: 'text-green-400',
    issued: 'text-blue-400',
    used: 'text-green-400',
    expired: 'text-red-400',
    confirmed: 'text-green-400',
    probable: 'text-blue-400',
    uncertain: 'text-yellow-400',
    negative: 'text-red-400',
  }
  return colors[status] || 'text-gray-400'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    approved: 'Aprovado',
    paid: 'Pago',
    cancelled: 'Cancelado',
    open: 'Aberto',
    in_progress: 'Em Andamento',
    resolved: 'Resolvido',
    archived: 'Arquivado',
    scheduled: 'Agendado',
    done: 'Realizado',
    issued: 'Emitido',
    used: 'Usado',
    expired: 'Vencido',
    confirmed: 'Confirmado',
    probable: 'Provável',
    uncertain: 'Incerto',
    negative: 'Negativo',
    income: 'Receita',
    expense: 'Despesa',
    leader: 'Liderança',
    voter: 'Eleitor',
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
    admin: 'Administrador',
    standard: 'Padrão',
    root: 'Root',
  }
  return labels[status] || status
}
