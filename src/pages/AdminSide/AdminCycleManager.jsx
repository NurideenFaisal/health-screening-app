import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Power, Trash2, Calendar, Pencil, Check, X, Lock, Unlock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'

export default function AdminCycleManager() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const isClinicAdmin = profile?.role === 'admin' && profile?.clinic_id
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)

  // --- QUERIES ---
  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ['cycles', isClinicAdmin ? profile?.clinic_id : 'all'],
    queryFn: async () => {
      let query = supabase
        .from('cycles')
        .select('*')
        .order('created_at', { ascending: false })

      if (isClinicAdmin) {
        query = query.eq('clinic_id', profile.clinic_id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })

  const cycleQueryKey = ['cycles', isClinicAdmin ? profile?.clinic_id : 'all']
  const invalidateCycleViews = async () => {
    useAuthStore.getState().clearActiveCycle()

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cycles'] }),
      queryClient.invalidateQueries({ queryKey: ['active-cycle'] }),
      queryClient.invalidateQueries({ queryKey: ['screening-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['children-deep-search'] }),
    ])
  }

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (rawName) => {
      const name = rawName.trim()
      const insertData = { name, is_active: false }
      if (isClinicAdmin) {
        insertData.clinic_id = profile.clinic_id
      }
      const { error } = await supabase.from('cycles').insert(insertData)
      if (error) throw error
    },
    onSuccess: async () => {
      setNewName('')
      await queryClient.invalidateQueries({ queryKey: cycleQueryKey })
    },
    onError: (error) => {
      console.error('Create cycle failed:', error)
      alert(`Could not create cycle: ${error.message}`)
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, currentState, clinicId }) => {
      // If activating, turn off others in the same clinic
      if (!currentState) {
        await supabase
          .from('cycles')
          .update({ is_active: false })
          .eq('clinic_id', clinicId)
          .neq('id', id)
      }
      const { error } = await supabase.from('cycles').update({ is_active: !currentState }).eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await invalidateCycleViews()
    },
    onError: (error) => {
      console.error('Toggle cycle state failed:', error)
      alert(`Could not update cycle status: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('cycles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cycleQueryKey }),
    onError: (error) => {
      console.error('Delete cycle failed:', error)
      alert(`Could not delete cycle: ${error.message}`)
    }
  })

  const editMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const { error } = await supabase.from('cycles').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setEditingId(null)
      await invalidateCycleViews()
    },
    onError: (error) => {
      console.error('Edit cycle failed:', error)
      alert(`Could not rename cycle: ${error.message}`)
    }
  })

  // Real-time subscription for cycles
  useEffect(() => {
    const channel = supabase
      .channel('cycles_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cycles',
        filter: isClinicAdmin ? `clinic_id=eq.${profile.clinic_id}` : undefined
      }, () => {
        queryClient.invalidateQueries({ queryKey: cycleQueryKey })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, cycleQueryKey, isClinicAdmin, profile?.clinic_id])

  // --- HANDLERS (Maintaining your logic) ---
  const handleCreate = (e) => {
    e.preventDefault()
    const submittedName = String(new FormData(e.currentTarget).get('cycleName') ?? newName).trim()

    if (!submittedName) {
      return
    }

    createMutation.mutate(submittedName)
  }
  const handleDelete = (id, isActive) => {
    if (isActive) return alert("Security Block: Deactivate cycle before deleting.")
    if (window.confirm("FINAL WARNING: Deleting this cycle will orphan all medical screenings attached to it. Proceed?")) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 sm:px-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">Screening Cycles</h2>
            <p className="text-xs text-gray-400 mt-0.5">Define outreach periods</p>
          </div>

          <button
            onClick={() => setIsUnlocked(!isUnlocked)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
              ${isUnlocked ? 'bg-red-100 text-red-600 ring-2 ring-red-200' : 'bg-gray-100 text-gray-500'}`}
          >
            {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
            {isUnlocked ? 'Destructive Actions Enabled' : 'Actions Locked'}
          </button>
        </div>

        {/* Create Input */}
        <form className="p-4 sm:px-6 bg-gray-50 flex gap-2 border-b border-gray-100" onSubmit={handleCreate}>
          <input
            name="cycleName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New Cycle Name..."
            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {createMutation.isPending ? '...' : 'Create'}
          </button>
        </form>

        {/* List */}
        <ul className="divide-y divide-gray-100">
          {isLoading ? (
            <li className="p-10 text-center text-gray-400 text-sm italic text-gray-100">Loading cycles...</li>
          ) : cycles.map((c) => (
            <li key={c.id} className="px-4 py-4 sm:px-6 flex items-center justify-between transition">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <div className={`p-2 rounded-lg shrink-0 ${c.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Calendar size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none ring-2 ring-emerald-400"
                        autoFocus
                      />
                      <button onClick={() => editMutation.mutate({ id: c.id, name: editValue })} className="text-emerald-600"><Check size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={18} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                        {isUnlocked && (
                          <button onClick={() => { setEditingId(c.id); setEditValue(c.name); }} className="text-emerald-500">
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                      <p className={`text-[10px] font-bold uppercase ${c.is_active ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {c.is_active ? '● Currently Active' : '● Inactive'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMutation.mutate({ id: c.id, currentState: c.is_active, clinicId: c.clinic_id })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${c.is_active
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-50 text-emerald-600'
                    }`}
                >
                  <Power size={14} />
                  {c.is_active ? 'Stop' : 'Start'}
                </button>

                {isUnlocked && !c.is_active && (
                  <button
                    onClick={() => handleDelete(c.id, c.is_active)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all scale-110"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
