import { Edit2, KeyRound, Shield, Trash2, User, UserPlus } from 'lucide-react'
import { getInitial, getRoleColor, getSectionOption } from '../../hooks/useUsersManagement'
import { EmptyState, IconButton, SectionPill, Skeleton, StatusBadge } from '../ui/primitives'

function SectionBadge({ sectionNumber, sectionOptions }) {
  const option = getSectionOption(sectionOptions, String(sectionNumber))
  if (!option) return <SectionPill color="slate" label={`S${sectionNumber}`} />
  return <SectionPill color={option.color} label={option.shortLabel} />
}

function RoleBadge({ role }) {
  const isAdmin = role === 'admin'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
      {isAdmin ? <Shield size={11} /> : <User size={11} />}
      {role}
    </span>
  )
}

function UserActions({ user, isDisabled, onEdit, onReset, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton label={`Edit ${user.full_name}`} onClick={() => onEdit(user)}><Edit2 size={16} /></IconButton>
      <IconButton label={`Reset password for ${user.full_name}`} onClick={() => onReset(user)} className="hover:text-amber-600 hover:bg-amber-50"><KeyRound size={16} /></IconButton>
      <IconButton
        label={`${isDisabled ? 'Activate' : 'Deactivate'} ${user.full_name}`}
        onClick={() => onDelete(user)}
        className={isDisabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'}
      >
        {isDisabled ? <UserPlus size={16} /> : <Trash2 size={16} />}
      </IconButton>
    </div>
  )
}

function UserSections({ user, sectionOptions }) {
  if (user.role === 'admin') return <span className="text-xs italic text-slate-400">Full access</span>
  if (!user.assigned_sections?.length) return <span className="text-xs text-slate-300">No sections</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {user.assigned_sections.map(section => <SectionBadge key={section} sectionNumber={section} sectionOptions={sectionOptions} />)}
    </div>
  )
}

function UserCard({ user, onEdit, onReset, onDelete, sectionOptions }) {
  const isDisabled = user.is_active === false
  return (
    <article className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${getRoleColor(user.role)}`}>{getInitial(user.full_name)}</div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">{user.full_name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={isDisabled ? 'inactive' : 'active'}>{isDisabled ? 'Disabled' : 'Active'}</StatusBadge>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sections</p>
        <UserSections user={user} sectionOptions={sectionOptions} />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <UserActions user={user} isDisabled={isDisabled} onEdit={onEdit} onReset={onReset} onDelete={onDelete} />
      </div>
    </article>
  )
}

export default function UsersTable({ users, loading, filtered, onEdit, onReset, onDelete, sectionOptions }) {
  if (loading && users.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden border-b-2 border-slate-200 bg-slate-50 lg:grid lg:grid-cols-[1.4fr_0.7fr_1.3fr_0.6fr_0.7fr]">
          {['Name', 'Role', 'Sections', 'Status', 'Actions'].map(label => (
            <div key={label} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid gap-3 p-4 lg:grid-cols-[1.4fr_0.7fr_1.3fr_0.6fr_0.7fr] lg:items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (filtered.length === 0) return <EmptyState title="No users found" description="Try a different search term or add a new user." />

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {filtered.map(user => <UserCard key={user.id} user={user} onEdit={onEdit} onReset={onReset} onDelete={onDelete} sectionOptions={sectionOptions} />)}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Name</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Role</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sections</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const isDisabled = user.is_active === false
              return (
                <tr key={user.id} className={`border-b border-slate-100 transition hover:bg-slate-50 ${isDisabled ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${getRoleColor(user.role)}`}>{getInitial(user.full_name)}</div>
                      <span className="truncate font-medium text-slate-800">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3"><UserSections user={user} sectionOptions={sectionOptions} /></td>
                  <td className="px-4 py-3"><StatusBadge status={isDisabled ? 'inactive' : 'active'}>{isDisabled ? 'Disabled' : 'Active'}</StatusBadge></td>
                  <td className="px-4 py-3"><UserActions user={user} isDisabled={isDisabled} onEdit={onEdit} onReset={onReset} onDelete={onDelete} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
