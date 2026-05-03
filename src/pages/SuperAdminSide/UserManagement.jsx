import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Users,
  Shield,
  Building2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { CardSkeleton, SearchInput, StatCard } from '../../components/ui/primitives'
import { toTitleCase } from '../../lib/textFormat'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sectionMap, setSectionMap] = useState(new Map())

  useEffect(() => {
    fetchData()
  }, [])


  useEffect(() => {
    supabase.from('section_definitions').select('section_number, short_name').then(({ data }) => {
      if (data) setSectionMap(new Map(data.map(s => [s.section_number, s.short_name])))
    })
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch all profiles with clinic info
      const [usersRes, clinicsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            role,
            assigned_sections,
            is_active,
            clinic_id,
            created_at,
            clinics:clinic_id (name, code)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('clinics')
          .select('id, name, code')
          .order('name')
      ])

      if (usersRes.error) throw usersRes.error
      if (clinicsRes.error) throw clinicsRes.error

      setUsers(usersRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    const clinicName = user.clinics?.name?.toLowerCase() || ''
    const clinicCode = user.clinics?.code?.toLowerCase() || ''
    const matchesSearch =
      user.full_name?.toLowerCase().includes(query) ||
      user.id?.toLowerCase().includes(query) ||
      clinicName.includes(query) ||
      clinicCode.includes(query)

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role) => {
    const roles = {
      'super-admin': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Shield },
      'admin': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Shield },
      'clinician': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: Users }
    }
    const config = roles[role] || roles.clinician
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} className="mr-1" />
        {role}
      </span>
    )
  }

  const getClinicBadge = (clinic) => {
    if (!clinic) {
      return null
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
        <Building2 size={12} className="mr-1" />
        {clinic.name}
      </span>
    )
  }

  const getScopeBadge = (user) => {
    if (user.role === 'super-admin') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
          <Shield size={12} className="mr-1" />
          Super Admin
        </span>
      )
    }

    if (!user.clinic_id) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
          <AlertTriangle size={12} className="mr-1" />
          No Clinic Assigned
        </span>
      )
    }

    return getClinicBadge(user.clinics)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage all users across all clinics</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <SearchInput
            placeholder="Search users by name, ID, or clinic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          <option value="all">All Roles</option>
          <option value="super-admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="clinician">Clinician</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard value={users.length} label="Total Users" />
        <StatCard value={users.filter(u => u.role === 'super-admin').length} label="Super Admins" valueClassName="text-purple-600" />
        <StatCard value={users.filter(u => u.role === 'admin').length} label="Admins" valueClassName="text-blue-600" />
        <StatCard value={users.filter(u => u.role === 'clinician').length} label="Clinicians" valueClassName="text-emerald-600" />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search query' : 'No users in the system yet'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-semibold text-emerald-600 flex-shrink-0">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {toTitleCase(user.full_name || 'Unknown')}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id?.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getScopeBadge(user)}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' || user.role === 'super-admin' ? (
                        <span className="text-sm text-gray-400 italic">All Access</span>
                      ) : user.assigned_sections?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.assigned_sections.map(s => (
                            <span key={s} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              {sectionMap.get(Number(s)) || `S${s}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
