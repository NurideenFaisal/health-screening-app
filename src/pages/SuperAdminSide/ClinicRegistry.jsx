import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Building2,
  Globe,
  Plus,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, CardSkeleton, SearchInput } from '../../components/ui/primitives'
import { toTitleCase } from '../../lib/textFormat'

export default function ClinicRegistry() {
  const navigate = useNavigate()
  const location = useLocation()

  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightClinicId, setHighlightClinicId] = useState(null)

  useEffect(() => {
    fetchClinics()
  }, [])

  useEffect(() => {
    const launchedClinic = location.state?.launchedClinic
    if (!launchedClinic) return

    setHighlightClinicId(launchedClinic.id)
    toast.success(`Clinic ${launchedClinic.name} is now live`)

    const timeoutId = window.setTimeout(() => setHighlightClinicId(null), 5000)
    navigate(location.pathname, { replace: true, state: null })

    return () => window.clearTimeout(timeoutId)
  }, [location.pathname, location.state, navigate])

useEffect(() => {
    const channel = supabase
      .channel('clinic-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, async (payload) => {
        const { data } = await supabase.from('clinics').select('*').order('created_at', { ascending: false })
        if (data) setClinics(data)
      })
      .subscribe((status, err) => {})
    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [])

  async function fetchClinics() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClinics(data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to load clinic registry')
    } finally {
      setLoading(false)
    }
  }

  async function toggleClinic(id, currentStatus) {
    const original = [...clinics]
    setClinics((prev) => prev.map((clinic) => (
      clinic.id === id ? { ...clinic, is_active: !currentStatus } : clinic
    )))

    const { error } = await supabase
      .from('clinics')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      setClinics(original)
      toast.error(error.message || 'Update failed')
      return
    }

    toast.success(`Clinic ${!currentStatus ? 'activated' : 'deactivated'}`)
  }

  const filteredClinics = clinics.filter((clinic) => {
    const query = searchQuery.toLowerCase()
    return (
      clinic.name?.toLowerCase().includes(query) ||
      clinic.code?.toLowerCase().includes(query) ||
      clinic.slug?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Registry</h1>
          <p className="text-sm text-gray-500">Global control of clinical outreach instances</p>
        </div>
        <Button
          onClick={() => navigate('/super-admin/launch-clinic')}
          variant="primary"
        >
          <Plus size={20} />
          Launch New Clinic
        </Button>
      </div>

      <div className="mb-6 max-w-md">
        <SearchInput
          placeholder="Search by name, code, or slug..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Clinical Entity</th>
                  <th className="px-6 py-4">Access Code</th>
                  <th className="px-6 py-4 text-center">Domain Context</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClinics.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className={`group transition-colors hover:bg-gray-50 ${highlightClinicId === clinic.id ? 'bg-emerald-50/70' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 group-hover:bg-emerald-100">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{toTitleCase(clinic.name)}</p>
                          <p className="flex items-center gap-1 text-xs text-gray-400">
                            <Globe size={12} />
                            {clinic.slug || 'no-slug'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-sm font-bold text-slate-700">
                        {clinic.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-500">@{clinic.email_domain || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        onClick={() => toggleClinic(clinic.id, clinic.is_active)}
                        variant="secondary"
                        className={`min-h-0 rounded-full px-3 py-1 text-xs font-bold ${clinic.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {clinic.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        {clinic.is_active ? 'ACTIVE' : 'LOCKED'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!filteredClinics.length ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                      No clinics match the current search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
