import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { ClipboardList, Users, Clock, RefreshCw, FileText } from 'lucide-react'


// ========= FETCH =========

async function fetchClinicianStats(userId) {
  const [patientsRes, screeningsRes] = await Promise.all([
    supabase.from('children').select('id', { count: 'exact', head: true }),
    supabase.from('screenings')
      .select('id, status, screening_date')
      .eq('created_by', userId),
  ])

  if (patientsRes.error) throw new Error(patientsRes.error.message)
  if (screeningsRes.error) throw new Error(screeningsRes.error.message)

  const all = screeningsRes.data ?? []
  const today = new Date().toISOString().split('T')[0]

  return {
    totalPatients: patientsRes.count ?? 0,
    screeningsToday: all.filter(s => s.screening_date === today).length,
    drafts: all.filter(s => s.status === 'draft').length,
  }
}


// ========= QUICK ACTION =========

function QuickAction({ icon: Icon, label, onClick, iconBg, iconColor }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-5 w-full text-left bg-white rounded-2xl border border-gray-200 hover:border-emerald-200 hover:shadow-md active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-100"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
        <div className={`${iconBg} w-full h-full rounded-xl flex items-center justify-center`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>

      <p className="font-semibold text-gray-800 text-base">{label}</p>
    </button>
  )
}


// ========= STAT CARD =========

function StatCard({ icon: Icon, value, label, iconColor, loading }) {
  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50 border border-gray-100 rounded-2xl p-7 flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-md transition">

      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
        <Icon size={24} className={iconColor} />
      </div>

      {loading
        ? <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        : <p className="text-5xl font-bold text-gray-900">{value ?? '—'}</p>
      }

      <p className="text-sm font-semibold text-gray-500">{label}</p>

    </div>
  )
}


// ========= PAGE =========

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
  const section = profile?.section

  return (

    <div className="min-h-screen bg-gray-100 p-6 sm:p-8 lg:p-12 font-sans">

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">


        {/* HEADER */}

        <div className="px-8 py-7 border-b border-gray-100">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Hey, {firstName}
              </h1>

              <div className="flex items-center gap-3 mt-2">

                {section &&
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                    Section {section}
                  </span>
                }

                <p className="text-sm text-gray-400">
                  Child health screenings
                </p>

              </div>

            </div>


            <button
              onClick={refetch}
              disabled={isFetching}
              className="p-3 rounded-xl hover:bg-gray-100 transition text-gray-300 hover:text-gray-500 disabled:opacity-40"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''}/>
            </button>

          </div>

        </div>



        {/* QUICK ACTIONS */}

        <div className="px-8 py-7 border-b border-gray-100 bg-gray-50/60">

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Quick Actions
          </p>

          <div className="grid gap-4">

            <QuickAction
              icon={ClipboardList}
              label="New Screening"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              onClick={() => navigate('/clinician/screening-data')}
            />

            <QuickAction
              icon={Users}
              label="Enroll Patient"
              iconBg="bg-blue-100"
              iconColor="text-blue-500"
              onClick={() => navigate('/clinician/patient-data')}
            />

          </div>

        </div>



        {/* STATS */}

        <div className="px-8 py-8">

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            Your Activity
          </p>


          {isError ? (

            <div className="text-center py-6">

              <p className="text-base text-red-400">
                Couldn't load stats
              </p>

              <button
                onClick={refetch}
                className="text-sm text-red-300 underline mt-2"
              >
                Retry
              </button>

            </div>

          ) : (

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

              <StatCard
                icon={Users}
                value={stats?.totalPatients}
                label="Total Enrolled Children"
                iconColor="text-emerald-500"
                loading={isLoading}
              />

              <StatCard
                icon={FileText}
                value={stats?.screeningsToday}
                label="Today"
                iconColor="text-blue-500"
                loading={isLoading}
              />

              <StatCard
                icon={Clock}
                value={stats?.drafts}
                label="Drafts"
                iconColor="text-amber-500"
                loading={isLoading}
              />

            </div>

          )}

        </div>

      </div>

    </div>

  )

}