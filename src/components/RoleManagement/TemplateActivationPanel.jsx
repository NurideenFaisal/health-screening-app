import { CheckCircle, Loader2 } from 'lucide-react'
import { Button, CardSkeleton, EmptyState, SectionPill, StatusBadge } from '../ui/primitives'

const fieldIcon = {
  computed: 'f',
  number: '#',
  date: 'D',
  textarea: 'P',
  dropdown: 'v',
  radio: 'o',
  checkbox: 'x',
  text: 'T',
}

export default function TemplateActivationPanel({
  activeCycle,
  activeCycleQuery,
  publishedTemplates,
  templateAssignments,
  activatingSection,
  handleActivateTemplate,
  sectionOptions,
  navigate,
}) {
  const findTemplate = sectionName => publishedTemplates.find(template => template.name?.toLowerCase() === sectionName?.toLowerCase())

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Section Templates</h3>
          <p className="mt-1 text-sm text-slate-500">
            {activeCycle ? `${activeCycle.name} · ${publishedTemplates.length} published` : 'No active cycle'}
          </p>
        </div>
        {activeCycle && <StatusBadge status="active">Active cycle</StatusBadge>}
      </div>

      <div className="mt-4">
        {activeCycleQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <CardSkeleton rows={4} />
            <CardSkeleton rows={4} />
            <CardSkeleton rows={4} />
          </div>
        ) : activeCycleQuery.error ? (
          <EmptyState title="Cycle check failed" description={activeCycleQuery.error.message} />
        ) : !activeCycle ? (
          <EmptyState
            title="No active cycle"
            description="Open Cycle Manager to activate a screening cycle before assigning templates."
            action={<Button variant="primary" onClick={() => navigate('/admin/cycle-manager')}>Open Cycle Manager</Button>}
          />
        ) : sectionOptions.length === 0 ? (
          <EmptyState title="No sections found" description="Publish a template in Form Builder to start assigning sections." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sectionOptions.map(section => {
              const assignment = templateAssignments[section.value]
              const template = findTemplate(section.label)
              const isActive = !!assignment?.form_templates?.name
              const groups = template?.field_schema?.groups || []
              const isBusy = activatingSection === section.value

              return (
                <article
                  key={section.value}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md ${isActive ? 'border-emerald-300' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <SectionPill color={section.color} label={section.shortLabel} />
                      <h4 className="mt-2 truncate text-sm font-semibold text-slate-900">{section.label}</h4>
                      <p className="mt-1 text-xs text-slate-500">{template?.name || 'No matching template'}</p>
                    </div>
                    {isActive && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />}
                  </div>

                  <div className="mt-4 min-h-24 space-y-3">
                    {groups.length > 0 ? groups.slice(0, 2).map(group => (
                      <div key={group.id}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: group.color || '#059669' }} />
                          <span className="truncate text-xs font-semibold text-slate-600">{group.label}</span>
                        </div>
                        <div className="space-y-1">
                          {group.fields?.slice(0, 3).map(field => (
                            <div key={field.id} className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500">{fieldIcon[field.type] || 'T'}</span>
                              <span className="truncate">{field.label || 'Untitled'}</span>
                              {field.required && <span className="text-rose-500">*</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                        No template match
                      </div>
                    )}
                  </div>

                  <Button
                    variant={isActive ? 'secondary' : 'primary'}
                    className="mt-4 w-full"
                    disabled={!template || isBusy}
                    onClick={() => template && handleActivateTemplate(section.value, template.id)}
                  >
                    {isBusy && <Loader2 size={14} className="animate-spin" />}
                    {isBusy ? 'Activating...' : isActive ? 'Active' : 'Activate'}
                  </Button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
