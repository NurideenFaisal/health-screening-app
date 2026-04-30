import { getSectionColorClasses } from '../../lib/sectionUtils'
import { CheckCircle } from 'lucide-react'

export default function TemplateActivationPanel({ activeCycle, activeCycleQuery, publishedTemplates, templateAssignments, activatingSection, handleActivateTemplate, sectionOptions, navigate }) {
  if (!activeCycle) return null

  const findTemplate = (sectionName) => publishedTemplates.find(t => t.name?.toLowerCase() === sectionName?.toLowerCase())

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Section Templates</h3>
        <span className="text-xs text-slate-400">{activeCycle?.name} · {publishedTemplates.length} published</span>
      </div>

      {activeCycleQuery.isLoading ? (
        <div className="text-sm text-slate-400 flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />Checking cycle...</div>
      ) : activeCycleQuery.error ? (
        <div className="text-sm text-red-600">{activeCycleQuery.error.message}</div>
      ) : !activeCycle ? (
        <div className="text-sm text-amber-600">No active cycle. <button onClick={() => navigate('/admin/cycle-manager')} className="underline">Open Cycle Manager</button></div>
      ) : sectionOptions.length === 0 ? (
        <div className="text-sm text-slate-400">No sections found. Publish a template in Form Builder.</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 px-2 -mx-2">
          {sectionOptions.map(section => {
            const assignment = templateAssignments[section.value]
            const template = findTemplate(section.label)
            const isActive = !!assignment?.form_templates?.name
            const palette = getSectionColorClasses(section.color)
            const groups = template?.field_schema?.groups || []

            return (
              <div key={section.value} className={`flex-shrink-0 w-56 rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isActive ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-white'}`}>
                <div className={`h-1.5 ${isActive ? 'bg-emerald-400' : palette.dot}`} />
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${palette.badgeLight}`}>{section.shortLabel}</span>
                    <span className="text-xs font-semibold text-slate-800 truncate">{section.label}</span>
                    {isActive && <CheckCircle size={12} className="text-emerald-500 ml-auto flex-shrink-0" />}
                  </div>

                  {groups.length > 0 ? (
                    <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                      {groups.map(g => (
                        <div key={g.id}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                            <span className="text-[10px] font-medium text-slate-500">{g.label}</span>
                          </div>
                          {g.fields?.slice(0, 4).map(f => (
                            <div key={f.id} className="flex items-center gap-1.5 ml-3">
                              <span className="text-[9px] text-slate-300 w-3 text-center">{f.type === 'computed' ? 'ƒ' : f.type === 'number' ? '#' : f.type === 'date' ? 'D' : f.type === 'textarea' ? '¶' : f.type === 'dropdown' ? '▾' : f.type === 'radio' ? '◉' : f.type === 'checkbox' ? '✓' : 'T'}</span>
                              <span className="text-[10px] text-slate-500 truncate">{f.label || 'Untitled'}</span>
                              {f.required && <span className="text-[8px] text-red-400">*</span>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-300 text-center py-4 mb-3">No matching template</p>
                  )}

                  <button onClick={() => { if (template) handleActivateTemplate(section.value, template.id) }} disabled={!template || activatingSection === section.value}
                    className={`w-full py-1.5 text-[11px] font-medium rounded-lg transition ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                    {activatingSection === section.value ? '...' : isActive ? 'Active' : 'Activate'}
                  </button>
                </div>
              </div>  
            )
          })}
        </div>
      )}
    </div>
  )
}