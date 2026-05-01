import { AlertCircle } from 'lucide-react'
import { getSectionColorClasses } from '../../lib/sectionUtils'

const buttonVariants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  secondary: 'border border-slate-200 text-slate-600 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  ghost: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
}

export function Button({ children, variant = 'secondary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant] || buttonVariants.secondary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({ label, children, className = '', variant = 'ghost', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant] || buttonVariants.ghost} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function TextInput({ label, error, className = '', children, ...props }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>}
      <div className="relative">
        <input
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'} ${className}`}
          {...props}
        />
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function StatusBadge({ status, children }) {
  const map = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-500',
    disabled: 'bg-slate-100 text-slate-500',
    pending: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || map.inactive}`}>
      {children || status}
    </span>
  )
}

export function SectionPill({ color, label, className = '' }) {
  const palette = getSectionColorClasses(color)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${palette.badgeLight} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
      {label}
    </span>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: rows }).map((_, index) => <Skeleton key={index} className="h-3 w-full" />)}
      </div>
    </div>
  )
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[220px] flex-col justify-center gap-3 text-sm text-slate-500">
      <span className="text-center">{label}</span>
      <div className="mx-auto w-full max-w-md space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-slate-300" />
      <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
