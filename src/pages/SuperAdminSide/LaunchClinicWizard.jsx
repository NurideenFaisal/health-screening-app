import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

const buildClinicSlug = (name, code) =>
  `${name} ${code}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const sanitizeSlug = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

async function extractResponseError(response) {
  try {
    const payload = await response.json()
    if (payload?.error) return payload.error
  } catch {
    // Ignore JSON parse errors and fall back to status text.
  }

  if (response.status === 401) {
    return 'Your security session has timed out. re-signin'
  }

  if (response.status === 403) {
    return 'Your account is authenticated but does not have permission to launch clinics.'
  }

  return response.statusText || 'Provisioning failed'
}

export default function LaunchClinicWizard({ onClose, onSuccess }) {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createdResult, setCreatedResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isSlugCustomized, setIsSlugCustomized] = useState(false)
  const [formData, setFormData] = useState({
    clinicName: '',
    clinicCode: '',
    clinicAddress: '',
    phoneContact: '',
    slug: '',
    adminEmail: '',
    adminFullName: '',
    adminPassword: '',
  })

  useEffect(() => {
    if (!isSlugCustomized) {
      setFormData((prev) => ({
        ...prev,
        slug: buildClinicSlug(prev.clinicName, prev.clinicCode),
      }))
    }
  }, [formData.clinicCode, formData.clinicName, isSlugCustomized])

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const closeWizard = (result = createdResult) => {
    if (onClose) {
      onClose(result)
      return
    }

    navigate('/super-admin/clinics', {
      replace: true,
      state: result
        ? {
            launchedClinic: {
              id: result.clinic.id,
              name: result.clinic.name,
              code: result.clinic.code,
              slug: result.clinic.slug,
            },
          }
        : undefined,
    })
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
    const pwd = Array.from(
      crypto.getRandomValues(new Uint8Array(12)),
      (b) => chars[b % chars.length]
    ).join('')

    updateField('adminPassword', pwd)
    toast.info('Secure password generated')
  }

  const validateStepOne = () => {
    if (!formData.clinicName.trim()) {
      toast.error('Clinic name is required')
      return false
    }

    if (!formData.clinicCode.trim()) {
      toast.error('Clinic code is required')
      return false
    }

    const slug = sanitizeSlug(formData.slug || buildClinicSlug(formData.clinicName, formData.clinicCode))
    if (!slug) {
      toast.error('Clinic slug is required')
      return false
    }

    updateField('slug', slug)
    return true
  }

  const handleSubmit = async (event) => {
    event?.preventDefault?.()

    if (step === 1) {
      if (!validateStepOne()) return
      setStep(2)
      return
    }

    if (!formData.adminEmail.trim()) {
      toast.error('Admin email is required')
      return
    }

    if (!formData.adminFullName.trim()) {
      toast.error('Admin full name is required')
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Your session has expired. Sign in again and retry.')
      }

      const payload = {
        clinicName: formData.clinicName.trim(),
        clinicCode: formData.clinicCode.trim().toUpperCase(),
        clinicAddress: formData.clinicAddress.trim(),
        phoneContact: formData.phoneContact.trim(),
        slug: sanitizeSlug(formData.slug || buildClinicSlug(formData.clinicName, formData.clinicCode)),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminFullName: formData.adminFullName.trim(),
        adminPassword: formData.adminPassword.trim(),
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/launch-clinic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await extractResponseError(response))
      }

      const data = await response.json()
      setCreatedResult(data)
      toast.success('Clinic launched successfully')
      onSuccess?.(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!createdResult) return

    const text = [
      `Clinic: ${createdResult.clinic.name}`,
      `Code: ${createdResult.clinic.code}`,
      `Slug: ${createdResult.clinic.slug}`,
      `Admin: ${createdResult.credentials.email}`,
      `Pass: ${createdResult.credentials.password}`,
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const Label = ({ children, hint }) => (
    <div className="mb-1.5 flex flex-col">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{children}</span>
      {hint ? <span className="text-[10px] italic text-slate-500">{hint}</span> : null}
    </div>
  )

  return (
    <div className="flex min-h-full items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.18)]">
        <div className="border-b border-slate-100 bg-slate-50/50 p-8 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-800">Provisioning Wizard</h2>
                <p className="text-xs font-medium text-slate-500">Deploying clinical infrastructure</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => closeWizard()}
              className="rounded-full border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          {!createdResult ? (
            <div className="mt-8 flex items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <div className="h-1.5 w-8 rounded-full bg-slate-100" />
            </div>
          ) : null}
        </div>

        {createdResult ? (
          <div className="animate-in zoom-in-95 p-10 text-center duration-300">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Launch Successful</h3>
            <p className="mb-8 text-sm text-slate-500">Clinical instance is now live and available in the registry.</p>

            <div className="space-y-3 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 text-left">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Clinic Slug</span>
                <span className="text-sm font-mono font-medium">{createdResult.clinic.slug}</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Admin Access</span>
                <span className="text-sm font-mono font-medium">{createdResult.credentials.email}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800">One-Time Key</span>
                <span className="text-sm font-mono font-black text-emerald-700">{createdResult.credentials.password}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                {copied ? 'Secured' : 'Copy Credentials'}
              </button>
              <button
                type="button"
                onClick={() => closeWizard(createdResult)}
                className="flex-1 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-black"
              >
                Open Registry
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
            {step === 1 ? (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label hint="Public display name">Clinic Name *</Label>
                    <input
                      required
                      type="text"
                      value={formData.clinicName}
                      onChange={(event) => updateField('clinicName', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium outline-none transition-all shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Label hint="Unique ID (MG-001)">Clinic Code *</Label>
                    <input
                      required
                      type="text"
                      value={formData.clinicCode}
                      onChange={(event) => updateField('clinicCode', event.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold uppercase outline-none transition-all shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <Label hint="Customizable identifier for routing">URL Identifier (Slug)</Label>
                  <div className="group relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500">
                      <Globe size={14} />
                    </div>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(event) => {
                        setIsSlugCustomized(true)
                        updateField('slug', sanitizeSlug(event.target.value))
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-emerald-50/20 p-3 pl-10 text-sm font-mono font-bold text-emerald-700 outline-none transition-all shadow-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSlugCustomized(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-emerald-100 bg-white px-2 py-1 text-[10px] font-black text-emerald-600 shadow-sm transition-all hover:bg-emerald-50 active:scale-95"
                    >
                      RESET
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                  <div>
                    <Label>Address</Label>
                    <input
                      type="text"
                      value={formData.clinicAddress}
                      onChange={(event) => updateField('clinicAddress', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <input
                      type="text"
                      value={formData.phoneContact}
                      onChange={(event) => updateField('phoneContact', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
                <div>
                  <Label hint="Master account for clinic">Admin Email *</Label>
                  <input
                    required
                    type="email"
                    value={formData.adminEmail}
                    onChange={(event) => updateField('adminEmail', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none shadow-sm transition-all focus:ring-2 focus:ring-blue-500"
                    placeholder="owner@clinic.com"
                  />
                </div>

                <div>
                  <Label hint="Display name in system">Full Name *</Label>
                  <input
                    required
                    type="text"
                    value={formData.adminFullName}
                    onChange={(event) => updateField('adminFullName', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none shadow-sm transition-all focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-inner">
                  <Label hint="Auto-generated if left blank">Security Access Key</Label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={formData.adminPassword}
                      onChange={(event) => updateField('adminPassword', event.target.value)}
                      placeholder="Optional custom password"
                      className="flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm font-mono outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 text-xs font-bold text-white shadow-lg transition-all hover:bg-black active:scale-95"
                    >
                      <RefreshCw size={14} />
                      GEN
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-between gap-4">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => closeWizard()}
                  className="text-sm font-bold text-slate-400 transition-all hover:text-slate-600 hover:underline"
                >
                  Discard Changes
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 transition-all hover:text-slate-600"
                >
                  <ChevronLeft size={16} />
                  Previous Stage
                </button>
              )}

              <div className="flex flex-1 justify-end">
                {step === 1 ? (
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-10 py-4 text-sm font-black text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95"
                  >
                    Next Section
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white shadow-xl shadow-slate-300 transition-all hover:bg-black disabled:pointer-events-none disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Clinic'}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
