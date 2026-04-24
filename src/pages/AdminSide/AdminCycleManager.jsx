import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Power, Trash2, Calendar, Pencil, Check, X, Lock, Unlock } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'

export default function AdminCycleManager() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const clinicId = profile?.clinic_id ?? null
  const isClinicAdmin = profile?.role === 'admin' && Boolean(clinicId)

  const [cycles, setCycles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isMutating, setIsMutating] = useState(false)

  async function invalidateDependentViews() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cycles'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['active-cycle'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['screening-queue'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['children-deep-search'], exact: false }),
    ])
  }

  async function fetchCycles() {
    if (!profile) {
      return
    }

    if (profile.role === 'admin' && !clinicId) {
      setLoadError('This admin account is missing a clinic assignment.')
      setCycles([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      let query = supabase
        .from('cycles')
        .select('*')
        .order('created_at', { ascending: false })

      if (isClinicAdmin) {
        query = query.eq('clinic_id', clinicId)
      }

      const { data, error } = await query
      if (error) throw error

      setCycles(data ?? [])
    } catch (error) {
      console.error('Fetch cycles failed:', error)
      setLoadError(error.message || 'Failed to load cycles.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCycles()
  }, [profile?.id, profile?.role, clinicId])

  async function handleCreate(event) {
    event.preventDefault()
    const submittedName = String(new FormData(event.currentTarget).get('cycleName') ?? newName).trim()

    if (!submittedName) {
      return
    }

    setIsCreating(true)
    try {
      const insertData = { name: submittedName, is_active: false }
      if (isClinicAdmin) {
        insertData.clinic_id = clinicId
      }

      const { error } = await supabase.from('cycles').insert(insertData)
      if (error) throw error

      setNewName('')
      await fetchCycles()
      await invalidateDependentViews()
    } catch (error) {
      console.error('Create cycle failed:', error)
      alert(`Could not create cycle: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleToggle(id, currentState, targetClinicId) {
    setIsMutating(true)
    try {
      if (!currentState) {
        let deactivateQuery = supabase
          .from('cycles')
          .update({ is_active: false })
          .neq('id', id)

        if (targetClinicId) {
          deactivateQuery = deactivateQuery.eq('clinic_id', targetClinicId)
        }

        const { error: deactivateError } = await deactivateQuery
        if (deactivateError) throw deactivateError
      }

      const { error } = await supabase
        .from('cycles')
        .update({ is_active: !currentState })
        .eq('id', id)

      if (error) throw error

      await fetchCycles()
      await invalidateDependentViews()
    } catch (error) {
      console.error('Toggle cycle state failed:', error)
      alert(`Could not update cycle status: ${error.message}`)
    } finally {
      setIsMutating(false)
    }
  }

  async function handleSaveEdit(id) {
    const name = editValue.trim()
    if (!name) {
      return
    }

    setIsMutating(true)
    try {
      const { error } = await supabase
        .from('cycles')
        .update({ name })
        .eq('id', id)

      if (error) throw error

      setEditingId(null)
      setEditValue('')
      await fetchCycles()
      await invalidateDependentViews()
    } catch (error) {
      console.error('Edit cycle failed:', error)
      alert(`Could not rename cycle: ${error.message}`)
    } finally {
      setIsMutating(false)
    }
  }

  async function handleDelete(id, isActive) {
    if (isActive) {
      alert('Security Block: Deactivate cycle before deleting.')
      return
    }

    if (!window.confirm('FINAL WARNING: Deleting this cycle will orphan all medical screenings attached to it. Proceed?')) {
      return
    }

    setIsMutating(true)
    try {
      const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchCycles()
      await invalidateDependentViews()
    } catch (error) {
      console.error('Delete cycle failed:', error)
      alert(`Could not delete cycle: ${error.message}`)
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:mx-auto sm:max-w-lg lg:max-w-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">Screening Cycles</h2>
            <p className="mt-0.5 text-xs text-gray-400">Define outreach periods</p>
          </div>

          <button
            onClick={() => setIsUnlocked(!isUnlocked)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              isUnlocked ? 'bg-red-100 text-red-600 ring-2 ring-red-200' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
            {isUnlocked ? 'Destructive Actions Enabled' : 'Actions Locked'}
          </button>
        </div>

        <form className="flex gap-2 border-b border-gray-100 bg-gray-50 p-4 sm:px-6" onSubmit={handleCreate}>
          <input
            name="cycleName"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New Cycle Name..."
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {isCreating ? '...' : 'Create'}
          </button>
        </form>

        <ul className="divide-y divide-gray-100">
          {isLoading ? (
            <li className="p-10 text-center text-sm italic text-gray-500">Loading cycles...</li>
          ) : loadError ? (
            <li className="p-10 text-center text-sm text-red-600">{loadError}</li>
          ) : cycles.length === 0 ? (
            <li className="p-10 text-center text-sm text-slate-500">
              No cycles found for this clinic yet. Create one to activate it for clinicians.
            </li>
          ) : (
            cycles.map((cycle) => (
              <li key={cycle.id} className="flex items-center justify-between px-4 py-4 transition sm:px-6">
                <div className="mr-4 flex flex-1 items-center gap-3">
                  <div className={`shrink-0 rounded-lg p-2 ${cycle.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Calendar size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {editingId === cycle.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none ring-2 ring-emerald-400"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(cycle.id)} className="text-emerald-600" type="button">
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditValue('')
                          }}
                          className="text-gray-400"
                          type="button"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">{cycle.name}</p>
                          {isUnlocked && (
                            <button
                              onClick={() => {
                                setEditingId(cycle.id)
                                setEditValue(cycle.name)
                              }}
                              className="text-emerald-500"
                              type="button"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                        <p className={`text-[10px] font-bold uppercase ${cycle.is_active ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {cycle.is_active ? '● Currently Active' : '● Inactive'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(cycle.id, cycle.is_active, cycle.clinic_id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      cycle.is_active ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'
                    }`}
                    disabled={isMutating}
                    type="button"
                  >
                    <Power size={14} />
                    {cycle.is_active ? 'Stop' : 'Start'}
                  </button>

                  {isUnlocked && !cycle.is_active && (
                    <button
                      onClick={() => handleDelete(cycle.id, cycle.is_active)}
                      className="scale-110 rounded-lg p-1.5 text-red-400 transition-all hover:bg-red-50"
                      disabled={isMutating}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
