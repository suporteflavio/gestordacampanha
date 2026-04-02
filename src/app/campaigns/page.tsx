'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, ChevronRight, Loader2 } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  role: string
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    try {
      const response = await fetch('/api/auth/campaigns')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setCampaigns(data.campaigns)
    } catch {
      toast.error('Erro ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }

  async function selectCampaign(tenantId: string) {
    setSelecting(tenantId)
    try {
      const response = await fetch('/api/auth/select-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })

      if (!response.ok) {
        toast.error('Erro ao selecionar campanha')
        return
      }

      toast.success('Campanha selecionada!')
      router.push('/dashboard')
    } catch {
      toast.error('Erro ao selecionar campanha')
    } finally {
      setSelecting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Selecione a Campanha</h1>
          <p className="text-gray-400 mt-1">Escolha qual campanha deseja acessar</p>
        </div>

        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => selectCampaign(campaign.id)}
              disabled={!!selecting}
              className="w-full bg-gray-800/50 backdrop-blur border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-700/50 rounded-xl p-4 text-left transition-all flex items-center gap-4 disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                {campaign.logoUrl ? (
                  <img src={campaign.logoUrl} alt={campaign.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{campaign.name}</p>
                <p className="text-gray-400 text-sm capitalize">{campaign.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
              </div>
              {selecting === campaign.id ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
