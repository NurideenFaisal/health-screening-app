import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { ClipboardList, Users, RefreshCw } from 'lucide-react'
import { getProfileSectionNumber } from '../../lib/sectionUtils'

async function fetchClinicianStats(userId) {
  const patientsRes = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })

  if (patientsRes.error) throw new Error(patientsRes.error.message)

  const today = new Date().toISOString().split('T')[0]

  const screeningsRes = await supabase
    .from('screenings')
    .select('id, screening_date')
    .eq('created_by', userId)

  if (screeningsRes.error) throw new Error(screeningsRes.error.message)

  const allScreenings = screeningsRes.data ?? []
  const screeningsToday = allScreenings.filter(s => s.screening_date === today).length

  const draftsRes = await supabase
    .from('screening_sections')
    .select('screening_id', { count: 'exact', head: true })
    .eq('is_complete', false)

  const drafts = draftsRes.count ?? 0

  return {
    totalPatients: patientsRes.count ?? 0,
    screeningsToday,
    drafts,
  }
}

function QuickAction({ icon: Icon, label, description, onClick, iconBg, iconColor }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-100"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl">
        <div className={`${iconBg} flex h-full w-full items-center justify-center rounded-xl`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-base font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </button>
  )
}

function StatCard({ value, label, loading }) {
  return (
    <div className="flex w-full flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:shadow-sm">
      {loading
        ? <div className="h-7 w-16 animate-pulse rounded bg-slate-200" />
        : <p className="text-2xl font-bold tracking-tight text-slate-950">{value ?? '—'}</p>
      }
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export default function ClinicianDashboardStats() {
  const navigate = useNavigate()
  const { profile, user } = useAuthStore()

  const { data: stats, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['clinician-stats', user?.id],
    queryFn: () => fetchClinicianStats(user?.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  })

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Clinician'
  const section = getProfileSectionNumber(profile)

  return (
    <div className="w-full font-sans">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {section && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Section {section}
                </span>
              )}
            </div>

            <button
              onClick={refetch}
              disabled={isFetching}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-40"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5 sm:px-8 sm:py-7">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            Quick Actions
          </p>
          <div className="grid gap-4 xl:grid-cols-2">
            <QuickAction
              icon={ClipboardList}
              label="New Screening"
              description=""
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              onClick={() => navigate('/clinician/screening-data')}
            />

            <QuickAction
              icon={Users}
              label="Enroll Patient"
              description="Register a new child or update an existing record."
              iconBg="bg-blue-100"
              iconColor="text-blue-500"
              onClick={() => navigate('/clinician/patient-data')}
            />
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            Your Activity
          </p>

          {isError ? (
            <div className="py-6 text-center">
              <p className="text-base text-red-400">Couldn't load stats</p>
              <button onClick={refetch} className="mt-2 text-sm text-red-300 underline">
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <StatCard
                value={stats?.totalPatients}
                label="Total Enrolled Children"
                loading={isLoading}
              />
              <StatCard
                value={stats?.screeningsToday}
                label="Screenings Logged Today"
                loading={isLoading}
              />
              <StatCard
                value={stats?.drafts}
                label="Incomplete Sections"
                loading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
