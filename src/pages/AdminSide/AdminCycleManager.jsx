import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Power, Trash2, Calendar, Pencil, Check, X, Lock, Unlock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function AdminCycleManager() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)

  // --- QUERIES ---
  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (name) => {
      const { error } = await supabase.from('cycles').insert({ name, is_active: false })
      if (error) throw error
    },
    onSuccess: () => {
      setNewName('')
      queryClient.invalidateQueries(['cycles'])
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, currentState }) => {
      // If activating, turn others off first
      if (!currentState) {
        await supabase
          .from('cycles')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000')
      }
      const { error } = await supabase.from('cycles').update({ is_active: !currentState }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['cycles'])
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('cycles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['cycles'])
  })

  const editMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const { error } = await supabase.from('cycles').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setEditingId(null)
      queryClient.invalidateQueries(['cycles'])
    }
  })

  // --- HANDLERS (Maintaining your logic) ---
  const handleCreate = () => {
    if (!newName.trim()) return
    createMutation.mutate(newName)
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
        <div className="p-4 sm:px-6 bg-gray-50 flex gap-2 border-b border-gray-100">
          <input 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New Cycle Name..."
            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button 
            disabled={createMutation.isLoading}
            onClick={handleCreate} 
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {createMutation.isLoading ? '...' : 'Create'}
          </button>
        </div>

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
                      <button onClick={() => editMutation.mutate({ id: c.id, name: editValue })} className="text-emerald-600"><Check size={18}/></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={18}/></button>
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
                  onClick={() => toggleMutation.mutate({ id: c.id, currentState: c.is_active })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    c.is_active 
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