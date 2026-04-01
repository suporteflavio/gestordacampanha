'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, TrendingUp, TrendingDown, Wallet, X, Loader2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  status: string
  dueDate: string | null
  paidAt: string | null
  supplier: string | null
  municipality: { name: string } | null
  createdAt: string
}

interface Summary {
  income: number
  expense: number
  balance: number
}

interface TransactionModalProps {
  type: 'income' | 'expense'
  transaction?: Transaction | null
  onClose: () => void
  onSaved: () => void
}

const EXPENSE_CATEGORIES = [
  'combustível', 'alimentação', 'hotel', 'deslocamento',
  'produção de vídeo', 'material gráfico', 'equipe', 'outros',
]

const INCOME_CATEGORIES = [
  'doação', 'fundo partidário', 'evento', 'outro',
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' },
]

function TransactionModal({ type, transaction, onClose, onSaved }: TransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const [form, setForm] = useState({
    category: transaction?.category ?? categories[0],
    description: transaction?.description ?? '',
    amount: transaction?.amount ? String(transaction.amount) : '',
    status: transaction?.status ?? 'pending',
    dueDate: transaction?.dueDate ? transaction.dueDate.slice(0, 10) : '',
    supplier: transaction?.supplier ?? '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) {
      toast.error('Descrição e valor são obrigatórios')
      return
    }
    setLoading(true)
    try {
      const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions'
      const method = transaction ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      toast.success(transaction ? 'Lançamento atualizado!' : 'Lançamento criado!')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">
            {transaction ? 'Editar' : 'Novo'} {type === 'expense' ? 'Despesa' : 'Receita'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria *</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
            >
              {categories.map(c => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição *</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {type === 'expense' ? 'Vencimento' : 'Data prevista'}
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {type === 'expense' ? 'Fornecedor' : 'Fonte'}
              </label>
              <input
                type="text"
                value={form.supplier}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {transaction ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchTransactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, categoryFilter, page])

  async function fetchTransactions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: activeTab, page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      const response = await fetch(`/api/transactions?${params}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setTransactions(data.transactions)
      setSummary(data.summary)
      setTotalPages(data.pagination.pages)
    } catch {
      toast.error('Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este lançamento?')) return
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      toast.success('Lançamento excluído')
      fetchTransactions()
    } catch {
      toast.error('Erro ao excluir lançamento')
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error()
      toast.success('Marcado como pago!')
      fetchTransactions()
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  function handleEdit(t: Transaction) {
    setEditingTransaction(t)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
    setEditingTransaction(null)
  }

  function handleSaved() {
    handleCloseModal()
    fetchTransactions()
  }

  const currentCategories = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Controle de receitas e despesas da campanha"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Saldo</span>
            <Wallet className={cn('w-5 h-5', summary.balance >= 0 ? 'text-blue-400' : 'text-red-400')} />
          </div>
          <p className={cn('text-2xl font-bold', summary.balance >= 0 ? 'text-white' : 'text-red-400')}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Receitas (pagas)</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(summary.income)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Despesas (pagas)</span>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.expense)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        {(['expense', 'income'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); setCategoryFilter('') }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition',
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            )}
          >
            {tab === 'expense' ? 'Despesas' : 'Receitas'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
        >
          <option value="">Todas as categorias</option>
          {currentCategories.map(c => (
            <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando lançamentos..." />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={activeTab === 'expense' ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
          title={`Nenhuma ${activeTab === 'expense' ? 'despesa' : 'receita'} encontrada`}
          description="Registre seus lançamentos financeiros para controlar o orçamento da campanha."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </button>
          }
        />
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Descrição</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">
                    {activeTab === 'expense' ? 'Fornecedor' : 'Fonte'}
                  </th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Vencimento</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-gray-400 text-xs font-medium">Valor</th>
                  <th className="px-4 py-3 text-gray-400 text-xs font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{t.description}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-400 text-xs capitalize bg-gray-800 px-2 py-1 rounded">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {t.supplier ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {t.dueDate ? formatDate(t.dueDate, 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium', getStatusColor(t.status))}>
                        {getStatusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('font-semibold text-sm', t.type === 'income' ? 'text-green-400' : 'text-red-400')}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.status === 'pending' && (
                          <button
                            onClick={() => handleMarkPaid(t.id)}
                            className="text-green-400 hover:text-green-300 text-xs font-medium transition"
                          >
                            Pagar
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition"
              >
                Anterior
              </button>
              <span className="text-gray-400 text-sm">Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <TransactionModal
          type={activeTab}
          transaction={editingTransaction}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
