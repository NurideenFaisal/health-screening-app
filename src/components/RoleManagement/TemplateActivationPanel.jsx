import { getSectionColorClasses } from '../../lib/sectionUtils'

export default function TemplateActivationPanel({
  activeCycle,
  activeCycleQuery,
  publishedTemplates,
  templateAssignments,
  templateSelections,
  setTemplateSelections,
  activatingSection,
  handleActivateTemplate,
  sectionOptions,
  navigate,
}) {
  if (!activeCycle) return null

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Cycle Template Activation</h3>
          <p className="text-sm text-slate-500 mt-1">
            Only published templates can be activated for clinicians in the active cycle.
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>{activeCycle?.name || 'No active cycle'}</p>
          <p>{publishedTemplates.length} published template{publishedTemplates.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {activeCycleQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
          Checking for an active clinic cycle...
        </div>
      ) : activeCycleQuery.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-3">
          <p className="font-semibold">Error loading active cycle.</p>
          <p>{activeCycleQuery.error.message || 'Please refresh the page or check your clinic cycle configuration.'}</p>
          <button
            type="button"
            onClick={() => activeCycleQuery.refetch()}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : !activeCycle ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 space-y-3">
          <p className="font-semibold">No active cycle found.</p>
          <p>
            Only clinic admins can create and activate cycles. Create and activate a cycle in
            Cycle Manager before assigning clinician sections or templates.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/cycle-manager')}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
          >
            Open Cycle Manager
          </button>
        </div>
      ) : publishedTemplates.length === 0 ? (
        <div className="text-sm text-slate-400">Loading templates...</div>
      ) : sectionOptions.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          This cycle has no section order configured.
        </div>
      ) : (
        <div className="space-y-3">
          {sectionOptions.map(section => {
            const assignment = templateAssignments[section.value]
            const palette = getSectionColorClasses(section.color)

            return (
              <div key={section.value} className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[1fr,1.25fr,auto]">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${palette.badgeLight}`}>
                    {section.shortLabel}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{section.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {assignment?.form_templates?.name
                      ? `Active: ${assignment.form_templates.name} v${assignment.form_templates.version || '1.0'}`
                      : 'No template activated yet'}
                  </p>
                </div>

                <select
                  value={templateSelections[section.value] || ''}
                  onChange={event => setTemplateSelections(current => ({
                    ...current,
                    [section.value]: event.target.value,
                  }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select a published template</option>
                  {publishedTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} (v{template.version || '1.0'})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleActivateTemplate(section.value)}
                  disabled={!templateSelections[section.value] || activatingSection === section.value}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activatingSection === section.value ? 'Activating...' : 'Activate'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
