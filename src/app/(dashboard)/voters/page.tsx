'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, UserCheck } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatPhone, getStatusLabel, getStatusColor, cn } from '@/lib/utils'
import ContactModal from '@/components/contacts/ContactModal'

interface Contact {
  id: string
  name: string
  cpf: string | null
  phone: string | null
  email: string | null
  type: string
  status: string
  engagementScore: number
  estimatedVotes: number
  municipality: { name: string } | null
  neighborhood: string | null
  influenceGroup: string | null
  notes: string | null
}

export default function VotersPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchContacts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page])

  async function fetchContacts() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'voter', page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setContacts(data.contacts)
      setTotalPages(data.pagination.pages)
    } catch {
      toast.error('Erro ao carregar eleitores')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover este eleitor?')) return
    try {
      const response = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      toast.success('Eleitor removido')
      fetchContacts()
    } catch {
      toast.error('Erro ao remover eleitor')
    }
  }

  function handleEdit(contact: Contact) {
    setEditingContact(contact)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
    setEditingContact(null)
  }

  function handleSaved() {
    handleCloseModal()
    fetchContacts()
  }

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'probable', label: 'Provável' },
    { value: 'uncertain', label: 'Incerto' },
    { value: 'negative', label: 'Negativo' },
  ]

  return (
    <div>
      <PageHeader
        title="Eleitores"
        description="Base de eleitores cadastrados"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Novo Eleitor
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando eleitores..." />
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="w-8 h-8" />}
          title="Nenhum eleitor encontrado"
          description="Cadastre seu primeiro eleitor para começar a construir sua base."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Eleitor
            </button>
          }
        />
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Nome</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Município</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Bairro</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Status</th>
                  <th className="px-4 py-3 text-gray-400 text-xs font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{contact.name}</p>
                      {contact.cpf && (
                        <p className="text-gray-500 text-xs">
                          {contact.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                      {contact.municipality?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {contact.phone ? formatPhone(contact.phone) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {contact.neighborhood ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium', getStatusColor(contact.status))}>
                        {getStatusLabel(contact.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
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
        <ContactModal
          type="voter"
          contact={editingContact}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
