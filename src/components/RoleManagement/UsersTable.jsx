import { useMemo } from 'react'
import { Edit2, KeyRound, Trash2, Shield, User, UserPlus } from 'lucide-react'
import { getInitial, getRoleColor, getSectionOption } from '../../hooks/useUsersManagement'
import { getSectionColorClasses } from '../../lib/sectionUtils'

function SectionBadge({ sectionNumber, sectionOptions }) {
  const opt = getSectionOption(sectionOptions, String(sectionNumber))
  if (!opt) return <span className="text-xs text-slate-400">S{sectionNumber}</span>
  const palette = getSectionColorClasses(opt.color)
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${palette.badgeLight}`}>{opt.shortLabel}</span>
}

export default function UsersTable({ users, loading, filtered, onEdit, onReset, onDelete, sectionOptions }) {
  if (loading && users.length === 0) return <div className="text-center py-12 text-slate-400">Loading users...</div>
  if (filtered.length === 0) return <div className="text-center py-12 text-slate-400">No users found</div>

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left p-3 font-semibold text-slate-600">Name</th>
            <th className="text-left p-3 font-semibold text-slate-600">Role</th>
            <th className="text-left p-3 font-semibold text-slate-600">Sections</th>
            <th className="text-left p-3 font-semibold text-slate-600">Status</th>
            <th className="text-right p-3 font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(u => {
            const isDisabled = u.is_active === false
            return (
              <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isDisabled ? 'opacity-60' : ''}`}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${getRoleColor(u.role)} flex items-center justify-center font-semibold text-xs`}>{getInitial(u.full_name)}</div>
                    <span className="font-medium text-slate-800">{u.full_name}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}{u.role}
                  </span>
                </td>
                <td className="p-3 text-slate-600">
                  {u.role === 'admin' ? (
                    <span className="text-slate-400 italic text-xs">Full Access</span>
                  ) : u.assigned_sections?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.assigned_sections.map(s => <SectionBadge key={s} sectionNumber={s} sectionOptions={sectionOptions} />)}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="p-3">
                  {isDisabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Disabled</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(u)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => onReset(u)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition" title="Reset password"><KeyRound size={14} /></button>
                    <button 
                      onClick={() => onDelete(u)} 
                      className={`p-1.5 rounded-lg transition ${isDisabled ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                      title={isDisabled ? 'Activate user' : 'Deactivate user'}
                    >
                      {isDisabled ? <UserPlus size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}