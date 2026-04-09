import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Building2,
  Globe,
  Loader2,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { toast } from 'sonner'

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
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Registry</h1>
          <p className="text-sm text-gray-500">Global control of clinical outreach instances</p>
        </div>
        <button
          onClick={() => navigate('/super-admin/launch-clinic')}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95"
        >
          <Plus size={20} />
          Launch New Clinic
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name, code, or slug..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="font-medium text-gray-500">Syncing registry...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                          <p className="font-bold text-gray-900">{clinic.name}</p>
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
                      <button
                        onClick={() => toggleClinic(clinic.id, clinic.is_active)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold transition-all ${clinic.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {clinic.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        {clinic.is_active ? 'ACTIVE' : 'LOCKED'}
                      </button>
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
