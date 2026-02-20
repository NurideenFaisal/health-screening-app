import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'

/*
========================================
DEV / PRODUCTION SWITCH
========================================

true  = TEST MODE (any section accessible)
false = PRODUCTION (linear workflow)

CHANGE ONLY THIS.
*/
const BYPASS_MODE = true


const SECTION_LABELS = {
  '1': 'Vitals & Dev',
  '2': 'Laboratory',
  '3': 'Diagnosis'
}

const STATUS_WEIGHT = {
  ready: 0,
  waiting: 1,
  completed: 2
}


// Clickability controlled here
const STATUS_META = {
  ready: {
    label: 'Ready',
    clickable: true
  },
  waiting: {
    label: 'Awaiting previous section',
    clickable: BYPASS_MODE
  },
  completed: {
    label: 'Complete',
    clickable: BYPASS_MODE
  }
}

export default function ClinicianScreeningData() {

  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const [query, setQuery] = useState('')

  const mySection = profile?.section ?? '1'


  const { data: workspace, isLoading } = useQuery({

    queryKey: ['screening-queue', mySection],

    queryFn: async () => {

      // Active Cycle
      const { data: cycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (!cycle)
        return { cycle: null, patients: [] }


      const { data, error } =
        await supabase
          .from('children')
          .select(`
          id,
          first_name,
          last_name,
          child_code,
          gender,
          birthdate,
          screenings!left(
            id,
            section1_complete,
            section2_complete,
            section3_complete,
            cycle_id
          )
        `)
          .eq('screenings.cycle_id', cycle.id)

      if (error) throw error


      return {

        cycle,

        patients: data.map(child => {

          const s = child.screenings?.[0] || {}

          const p = {

            dbId: child.id,

            code: child.child_code,

            name:
              `${child.first_name} ${child.last_name}`,

            gender:
              child.gender === 'M'
                ? 'Male'
                : 'Female',

            s1: s.section1_complete || false,
            s2: s.section2_complete || false,
            s3: s.section3_complete || false
          }


          /*
          =====================================
          SECTION PROGRESSION LOGIC
          =====================================
          */

          let status = 'waiting'

          if (BYPASS_MODE) {

            // TESTING MODE
            // Ignore dependencies

            if (mySection === '1')
              status = p.s1 ? 'completed' : 'ready'

            else if (mySection === '2')
              status = p.s2 ? 'completed' : 'ready'

            else if (mySection === '3')
              status = p.s3 ? 'completed' : 'ready'

          } else {

            // PRODUCTION MODE
            // Strict workflow

            if (mySection === '1')
              status = p.s1 ? 'completed' : 'ready'

            else if (mySection === '2')
              status =
                p.s2
                  ? 'completed'
                  : (p.s1 ? 'ready' : 'waiting')

            else if (mySection === '3')
              status =
                p.s3
                  ? 'completed'
                  : (p.s2 ? 'ready' : 'waiting')

          }

          return { ...p, status }

        })

      }

    },

    refetchInterval: 5000

  })


  const allPatients =
    workspace?.patients || []


  const filtered =
    allPatients
      .filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase())
      )
      .sort(
        (a, b) =>
          STATUS_WEIGHT[a.status] -
          STATUS_WEIGHT[b.status]
      )


  const counts =
    allPatients.reduce((acc, p) => {

      acc[p.status] =
        (acc[p.status] || 0) + 1

      return acc

    }, {})



  function handlePatientClick(patientId) {
    if (mySection === '1') {
      navigate(`/clinician/patient/${patientId}`)
    } else if (mySection === '2') {
      navigate(`/clinician/patient/${patientId}/section2`)
    } else if (mySection === '3') {
      navigate(`/clinician/patient/${patientId}/section3`)
    }
  }



  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">
          Loading queue…
        </p>
      </div>
    )


  return (

    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl">

        {/* HEADER */}

        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 space-y-3">

          <div className="flex items-start justify-between gap-2">

            <div>

              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Section {mySection}
              </h2>

              <p className="text-xs text-gray-400 mt-0.5">
                {SECTION_LABELS[mySection]}
              </p>

            </div>

            <span
              className={`text-xs font-medium px-2 py-1 rounded-xl whitespace-nowrap shrink-0
      ${workspace?.cycle
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gray-100 text-gray-400'
                }`}>

              {
                workspace?.cycle
                  ? `● ${workspace.cycle.name}`
                  : 'No active cycle'
              }

            </span>

          </div>


          {/* SEARCH */}

          <label className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">

            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name or patient ID…"
              className="flex-1 bg-transparent text-sm outline-none"
            />

            {query &&
              <button
                onClick={() => setQuery('')}
                className="text-xs text-gray-400">
                ✕
              </button>
            }

          </label>


          <p className="text-xs text-gray-400">

            {counts.ready ?? 0} ready

            {counts.waiting
              ? ` · ${counts.waiting} waiting`
              : ''}

            {counts.completed
              ? ` · ${counts.completed} complete`
              : ''}

          </p>

        </div>



        {/* NO ACTIVE CYCLE */}

        {!workspace?.cycle && (

          <div className="py-12 text-center">

            <p className="text-sm text-gray-400">
              No active screening cycle.
            </p>

            <p className="text-xs text-gray-300 mt-1">
              Contact admin.
            </p>

          </div>

        )}



        {/* LIST */}

        {workspace?.cycle && (

          <ul>

            {filtered.map((p, i) => {

              const meta =
                STATUS_META[p.status]

              return (

                <React.Fragment key={p.dbId}>

                  <li>

                    <button

                      disabled={!meta.clickable}

                      onClick={() =>
                        meta.clickable &&
                        handlePatientClick(p.dbId)
                      }

                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition
        ${meta.clickable
                          ? 'hover:bg-gray-50'
                          : 'opacity-40'
                        }`}>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0
        ${p.status === 'completed'
                            ? 'bg-gray-200 text-gray-400'
                            : p.gender === 'Female'
                              ? 'bg-pink-400'
                              : 'bg-blue-400'
                          }`}>

                        {p.status === 'completed'
                          ? '✓'
                          : p.name[0]}

                      </div>


                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-semibold truncate">
                          {p.name}
                        </p>

                        <p className="text-xs text-gray-400 truncate">

                          {p.code} · {meta.label}

                        </p>

                      </div>

                    </button>

                  </li>

                  {i < filtered.length - 1 &&
                    <div className="mx-4 border-t border-gray-100" />
                  }

                </React.Fragment>

              )

            })}

          </ul>

        )}



        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">

          <p className="text-xs text-gray-400 text-center">

            Only ready patients can be screened

          </p>

        </div>

      </div>
    </div>

  )

}
