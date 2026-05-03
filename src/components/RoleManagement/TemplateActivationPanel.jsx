import { CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { Button, CardSkeleton, EmptyState, StatusBadge } from '../ui/primitives'

export default function TemplateActivationPanel({ activeCycle, activeCycleQuery, publishedTemplates, templateAssignments, activatingSection, handleActivateTemplate, sectionOptions, navigate }) {
  if (!activeCycle) return null

  const findTemplate = name => publishedTemplates.find(t => t.name?.toLowerCase() === name?.toLowerCase())

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-semibold text-slate-900">Section Templates</h3>
        <span className="text-xs text-slate-400">{activeCycle?.name} · {publishedTemplates.length} published</span>
      </div>
      <div className="p-4">
        {activeCycleQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : activeCycleQuery.error ? (
          <EmptyState title="Cycle check failed" description={activeCycleQuery.error.message} />
        ) : !activeCycle ? (
          <EmptyState title="No active cycle" description="Open Cycle Manager first." action={<Button variant="primary" onClick={() => navigate('/admin/cycle-manager')}>Open Cycle Manager</Button>} />
        ) : sectionOptions.length === 0 ? (
          <EmptyState title="No sections found" description="Publish a template in Form Builder." />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {sectionOptions.map(section => {
              const assignment = templateAssignments[section.value]
              const template = findTemplate(section.label)
              const isActive = !!assignment?.form_templates?.name
              const groups = template?.field_schema?.groups || []
              const totalFields = groups.reduce((a, g) => a + (g.fields?.length || 0), 0)

              return (
                <button key={section.value} type="button" onClick={() => template && handleActivateTemplate(section.value, template.id)}
                  disabled={!template || activatingSection === section.value}
                  className={`w-full text-left rounded-xl border p-3 transition-all duration-150 ${isActive ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{section.shortLabel}</span>
                    {isActive && <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate mb-2">{section.label}</p>
                  {groups.length > 0 ? (
                    <div className="space-y-0.5 mb-2">
                      {groups.slice(0, 2).map(g => (
                        <div key={g.id} className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: g.color || '#059669' }} />
                          <span className="text-[9px] text-slate-400 truncate">{g.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-slate-300 mb-2">No matching template</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">{totalFields} fields</span>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : 'text-emerald-500'}`}>
                      {activatingSection === section.value ? '...' : isActive ? 'Active' : 'Activate'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}