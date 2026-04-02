'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Settings, Users, Shield, Loader2, Plus, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { cn, getStatusLabel } from '@/lib/utils'
import { formatCpf } from '@/lib/utils'

type Tab = 'campaign' | 'users' | 'security'

interface TenantUser {
  id: string
  role: string
  isActive: boolean
  user: { id: string; name: string; cpf: string; email: string | null }
}

interface CampaignSettings {
  id: string
  name: string
  slug: string
  cnpj: string
  primaryColor: string
  secondaryColor: string
  plan: string
  status: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('campaign')
  const [campaign, setCampaign] = useState<CampaignSettings | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [campaignForm, setCampaignForm] = useState({ name: '', primaryColor: '#1a56db', secondaryColor: '#7e3af2' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [cRes, uRes] = await Promise.all([
        fetch('/api/settings/campaign'),
        fetch('/api/settings/users'),
      ])
      if (cRes.ok) {
        const c = await cRes.json()
        setCampaign(c)
        setCampaignForm({ name: c.name, primaryColor: c.primaryColor, secondaryColor: c.secondaryColor })
      }
      if (uRes.ok) {
        const u = await uRes.json()
        setUsers(u)
      }
    } catch {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  async function saveCampaign() {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/campaign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Campanha atualizada!')
      fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Senha alterada com sucesso!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  async function toggleUserStatus(tenantUserId: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/settings/users/${tenantUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) throw new Error()
      toast.success(isActive ? 'Usuário ativado' : 'Usuário desativado')
      fetchData()
    } catch {
      toast.error('Erro ao atualizar usuário')
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'campaign', label: 'Campanha', icon: <Settings className="w-4 h-4" /> },
    { id: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
    { id: 'security', label: 'Segurança', icon: <Shield className="w-4 h-4" /> },
  ]

  return (
    <div>
      <PageHeader title="Configurações" description="Gerencie as configurações da sua campanha" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white')}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Carregando..." /></div>
      ) : (
        <>
          {/* Campaign Tab */}
          {activeTab === 'campaign' && campaign && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg">
              <h2 className="text-white font-semibold mb-6">Perfil da Campanha</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome da Campanha</label>
                  <input type="text" value={campaignForm.name} onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CNPJ</label>
                  <input type="text" value={campaign.cnpj} disabled
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-500 text-sm cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Cor Primária</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={campaignForm.primaryColor} onChange={e => setCampaignForm(f => ({ ...f, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                      <input type="text" value={campaignForm.primaryColor} onChange={e => setCampaignForm(f => ({ ...f, primaryColor: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Cor Secundária</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={campaignForm.secondaryColor} onChange={e => setCampaignForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                      <input type="text" value={campaignForm.secondaryColor} onChange={e => setCampaignForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <div className="h-8 rounded-lg flex-1" style={{ backgroundColor: campaignForm.primaryColor }} />
                  <div className="h-8 rounded-lg flex-1" style={{ backgroundColor: campaignForm.secondaryColor }} />
                </div>
                <button onClick={saveCampaign} disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Usuários da Campanha</h2>
                <button onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  <Plus className="w-4 h-4" />
                  Adicionar Usuário
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Nome</th>
                      <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">CPF</th>
                      <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Perfil</th>
                      <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Status</th>
                      <th className="px-4 py-3 text-right text-gray-400 text-xs font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(tu => (
                      <tr key={tu.id} className="border-b border-gray-800/50">
                        <td className="px-4 py-3 text-white text-sm">{tu.user.name}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                          {formatCpf(tu.user.cpf)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border',
                            tu.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-gray-700 text-gray-300 border-gray-600')}>
                            {getStatusLabel(tu.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs', tu.isActive ? 'text-green-400' : 'text-gray-500')}>
                            {tu.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => toggleUserStatus(tu.id, !tu.isActive)}
                            className={cn('text-xs font-medium transition', tu.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300')}>
                            {tu.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md">
              <h2 className="text-white font-semibold mb-6">Alterar Senha</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Senha Atual</label>
                  <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
                  <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={changePassword} disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Alterar Senha
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSaved={() => { setShowInviteModal(false); fetchData() }}
        />
      )}
    </div>
  )
}

function InviteUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ cpf: '', name: '', password: '', role: 'standard' })

  function handleCpfChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    setForm(f => ({ ...f, cpf: formatCpf(digits) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cpf || !form.name || !form.password) { toast.error('Preencha todos os campos'); return }
    setLoading(true)
    try {
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cpf: form.cpf.replace(/\D/g, '') }),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Usuário adicionado!')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">Adicionar Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome Completo *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">CPF *</label>
            <input type="text" value={form.cpf} onChange={e => handleCpfChange(e.target.value)} placeholder="000.000.000-00" required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha Temporária *</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Perfil de Acesso</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="standard">Padrão</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
