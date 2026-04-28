import { getSectionColorClasses } from '../../lib/sectionUtils'

export default function TemplateActivationPanel({ activeCycle, activeCycleQuery, publishedTemplates, templateAssignments, templateSelections, setTemplateSelections, activatingSection, handleActivateTemplate, sectionOptions, navigate }) {
  if (!activeCycle) return null

  const getTemplatePreview = (templateId) => {
    const template = publishedTemplates.find(t => t.id === templateId)
    if (!template?.field_schema?.groups) return []
    return template.field_schema.groups.flatMap(g => g.fields || []).slice(0, 4)
  }

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="text-lg font-semibold text-slate-900">Section Templates</h3><p className="text-sm text-slate-500 mt-1">Activate templates for clinicians to use in the field.</p></div>
        <div className="text-right text-xs text-slate-400"><p>{activeCycle?.name || 'No active cycle'}</p><p>{publishedTemplates.length} published</p></div>
      </div>

      {activeCycleQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />Checking for active cycle...</div>
      ) : activeCycleQuery.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-3"><p className="font-semibold">Error loading active cycle.</p><p>{activeCycleQuery.error.message}</p><button onClick={() => activeCycleQuery.refetch()} className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>
      ) : !activeCycle ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 space-y-3"><p className="font-semibold">No active cycle found.</p><p>Create and activate a cycle in Cycle Manager first.</p><button onClick={() => navigate('/admin/cycle-manager')} className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Open Cycle Manager</button></div>
      ) : publishedTemplates.length === 0 ? (
        <div className="text-sm text-slate-400">No published templates yet. Use Form Builder to create them.</div>
      ) : sectionOptions.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">No sections found. Publish a template in Form Builder to create sections.</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {sectionOptions.map(section => {
            const assignment = templateAssignments[section.value]
            const selectedId = templateSelections[section.value]
            const previewFields = getTemplatePreview(selectedId)
            const palette = getSectionColorClasses(section.color)
            const isActive = !!assignment?.form_templates?.name
            return (
              <div key={section.value} className={`flex-shrink-0 w-64 rounded-xl border-2 transition-all overflow-hidden ${isActive ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className={`h-2 ${isActive ? 'bg-emerald-400' : palette.dot}`} />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${palette.badgeLight}`}>{section.shortLabel}</span>
                    <span className="text-sm font-semibold text-slate-900">{section.label}</span>
                    {isActive && <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>}
                  </div>
                  
                  {isActive ? (
                    <div className="bg-white rounded-lg border border-emerald-100 p-3 mb-3">
                      <p className="text-xs font-medium text-slate-700">{assignment.form_templates.name} <span className="text-slate-400 font-normal">v{assignment.form_templates.version || '1.0'}</span></p>
                      <p className="text-[10px] text-slate-400 mt-1">Activated {new Date(assignment.activated_at).toLocaleDateString()}</p>
                    </div>
                  ) : previewFields.length > 0 ? (
                    <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 mb-3 space-y-1.5">
                      {previewFields.map(f => (
                        <div key={f.id} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-white border border-slate-200 flex items-center justify-center text-[8px] text-slate-400">{f.type === 'computed' ? 'ƒ' : f.type === 'number' ? '#' : f.type === 'date' ? 'D' : f.type === 'dropdown' ? '▾' : 'T'}</span>
                          <span className="text-xs text-slate-600 truncate">{f.label || 'Untitled'}</span>
                          {f.required && <span className="text-[8px] text-red-400 ml-auto">*req</span>}
                        </div>
                      ))}
                      {getTemplatePreview(selectedId).length === 4 && <p className="text-[10px] text-slate-400 pt-1">+ more fields...</p>}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 mb-3 text-center text-xs text-slate-400">Select a template to preview</div>
                  )}

                  <select value={selectedId || ''} onChange={e => setTemplateSelections(c => ({ ...c, [section.value]: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none mb-2">
                    <option value="">Pick template...</option>
                    {publishedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={() => handleActivateTemplate(section.value)} disabled={!selectedId || activatingSection === section.value} className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {activatingSection === section.value ? 'Activating...' : isActive ? 'Change Template' : 'Activate'}
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