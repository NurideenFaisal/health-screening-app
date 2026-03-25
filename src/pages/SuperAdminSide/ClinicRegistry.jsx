import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Search, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Plus,
  X
} from 'lucide-react'
import { toast } from 'sonner'

export default function ClinicRegistry() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchClinics()
  }, [])

  async function fetchClinics() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClinics(data || [])
    } catch (err) {
      console.error('Error fetching clinics:', err)
      toast.error('Failed to load clinics')
    } finally {
      setLoading(false)
    }
  }

  async function toggleClinicStatus(clinicId, currentStatus) {
    // Optimistic UI update
    setClinics(prev => 
      prev.map(c => 
        c.id === clinicId ? { ...c, is_active: !currentStatus } : c
      )
    )

    try {
      const { error } = await supabase
        .from('clinics')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', clinicId)

      if (error) throw error
      
      toast.success(`Clinic ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      console.error('Error toggling clinic status:', err)
      // Revert on error
      setClinics(prev => 
        prev.map(c => 
          c.id === clinicId ? { ...c, is_active: currentStatus } : c
        )
      )
      toast.error('Failed to update clinic status')
    }
  }

  const filteredClinics = clinics.filter(clinic => {
    const query = searchQuery.toLowerCase()
    return (
      clinic.name?.toLowerCase().includes(query) ||
      clinic.code?.toLowerCase().includes(query) ||
      clinic.address?.toLowerCase().includes(query)
    )
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Registry</h1>
          <p className="text-gray-600">Manage all clinics and their status</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Launch Outreach
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search clinics by name, code, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
        </div>
      </div>

      {/* Clinics Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-3 text-gray-600">Loading clinics...</span>
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clinics found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search query' : 'Get started by launching a new outreach'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {clinic.name}
                          </div>
                          {clinic.slug && (
                            <div className="text-xs text-gray-500">
                              {clinic.slug}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {clinic.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {clinic.address || 'No address'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {clinic.email_domain && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail size={14} className="mr-1 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{clinic.email_domain}</span>
                          </div>
                        )}
                        {clinic.phone_contact && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone size={14} className="mr-1 flex-shrink-0" />
                            <span>{clinic.phone_contact}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleClinicStatus(clinic.id, clinic.is_active)}
                        className={`inline-flex items-center transition ${
                          clinic.is_active 
                            ? 'text-emerald-600 hover:text-emerald-800' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={clinic.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {clinic.is_active ? (
                          <ToggleRight size={32} className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={32} />
                        )}
                        <span className="ml-2 text-xs font-medium">
                          {clinic.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Launch Outreach Wizard Modal */}
      {showWizard && (
        <LaunchOutreachWizard 
          onClose={() => setShowWizard(false)} 
          onSuccess={() => {
            setShowWizard(false)
            fetchClinics()
          }}
        />
      )}
    </div>
  )
}

// Launch Outreach Wizard Component
function LaunchOutreachWizard({ onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clinicName: '',
    location: '',
    outreachCode: '',
    adminEmail: '',
    password: ''
  })
  const [generatedPassword, setGeneratedPassword] = useState('')

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    setFormData(prev => ({ ...prev, password }))
  }

  async function handleSubmit() {
    if (step === 1) {
      // Validate clinic info
      if (!formData.clinicName || !formData.outreachCode) {
        toast.error('Please fill in all required fields')
        return
      }
      setStep(2)
      return
    }

    // Step 2 - Create clinic and admin
    if (!formData.adminEmail || !generatedPassword) {
      toast.error('Please provide admin email and generate a password')
      return
    }

    setLoading(true)
    try {
      // 1. Insert the new clinic record
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: formData.clinicName,
          code: formData.outreachCode,
          address: formData.location,
          is_active: true,
          slug: formData.outreachCode.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single()

      if (clinicError) throw clinicError

      // 2. Call the Edge Function to create the admin user
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
      const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: generatedPassword,
          role: 'admin',
          clinic_id: clinicData.id,
          full_name: `${formData.clinicName} Admin`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create admin user')
      }

      const userData = await response.json()

      toast.success('Outreach launched successfully!', {
        description: `Admin credentials: ${formData.adminEmail} / ${generatedPassword}`,
        duration: 10000
      })

      onSuccess()
    } catch (err) {
      console.error('Error launching outreach:', err)
      toast.error(err.message || 'Failed to launch outreach')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Launch New Outreach</h2>
            <p className="text-sm text-gray-500">Step {step} of 2</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Step 1: Clinic Info */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
                placeholder="e.g., Sunrise Health Center"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., 123 Main Street, City"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unique Outreach Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.outreachCode}
                onChange={(e) => setFormData(prev => ({ ...prev, outreachCode: e.target.value.toUpperCase() }))}
                placeholder="e.g., OUTREACH-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">This code uniquely identifies the clinic</p>
            </div>
          </div>
        )}

        {/* Step 2: Admin Setup */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-emerald-800 mb-1">Clinic Details</h3>
              <p className="text-sm text-emerald-700">
                {formData.clinicName} ({formData.outreachCode})
              </p>
              {formData.location && (
                <p className="text-sm text-emerald-600">{formData.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Admin Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                placeholder="admin@clinic.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secure Password <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedPassword}
                  readOnly
                  placeholder="Click generate to create password"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition"
                >
                  Generate
                </button>
              </div>
              {generatedPassword && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Password generated - save this securely!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
              >
                Next Step →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
                disabled={loading}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !generatedPassword}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Creating...
                  </span>
                ) : (
                  'Launch Outreach'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
