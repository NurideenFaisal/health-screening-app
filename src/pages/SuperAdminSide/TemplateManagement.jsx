import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Edit3, FileText, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button, CardSkeleton, IconButton, SearchInput } from '../../components/ui/primitives'
import { toSentenceCase, toTitleCase } from '../../lib/textFormat'

const STATUS_CONFIG = {
  published: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Published' },
  draft: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Draft' },
  archived: { color: 'bg-gray-100 text-gray-600', icon: AlertCircle, label: 'Archived' },
}

export default function TemplateManagement() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [deletingTemplateId, setDeletingTemplateId] = useState(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase.rpc('list_templates')
      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTemplate = async (template) => {
    try {
      const { data, error } = await supabase.rpc('get_template_by_id', {
        p_template_id: template.id,
      })

      if (error) throw error
      setSelectedTemplate({ ...template, ...(data || {}) })
      setActionError(null)
    } catch (err) {
      console.error('Error loading template detail:', err)
      setActionError(err.message)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    setDeletingTemplateId(templateId)
    setActionError(null)

    try {
      const { error } = await supabase.rpc('delete_template', { p_template_id: templateId })
      if (error) throw error
      if (selectedTemplate?.id === templateId) setSelectedTemplate(null)
      await fetchTemplates()
    } catch (err) {
      console.error('Error deleting template:', err)
      setActionError(err.message)
    } finally {
      setDeletingTemplateId(null)
    }
  }

  const filtered = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Template Management</h2>
          <p className="mt-1 text-sm text-gray-500">View and manage draft and published form templates</p>
        </div>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full sm:w-64"
        />
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(index => <CardSkeleton key={index} rows={3} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-gray-500 shadow-sm">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const status = template.status || 'draft'
            const StatusIcon = STATUS_CONFIG[status].icon

            return (
              <div
                key={template.id}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
                onClick={() => handleOpenTemplate(template)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <FileText size={18} className="text-emerald-600" />
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[status].color}`}>
                    <StatusIcon size={12} />
                    {STATUS_CONFIG[status].label}
                  </span>
                </div>

                <h3 className="mb-1 font-semibold text-gray-900">{toTitleCase(template.name || 'Untitled Template')}</h3>
                <p className="mb-3 text-sm text-gray-500">{toSentenceCase(template.description || 'No description')}</p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                  <span>v{template.version || '1.0'}</span>
                  <span>{template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'Not updated'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedTemplate(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{toTitleCase(selectedTemplate.name || 'Untitled Template')}</h3>
                <p className="text-sm text-gray-500">Version {selectedTemplate.version || '1.0'}</p>
              </div>
              <IconButton label="Close template details" onClick={() => setSelectedTemplate(null)}>
                <X size={18} />
              </IconButton>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {selectedTemplate.fieldSchema?.groups || selectedTemplate.field_schema?.groups ? (
                <div className="space-y-6">
                  {(selectedTemplate.fieldSchema?.groups || selectedTemplate.field_schema?.groups).map((group) => (
                    <div key={group.id}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
                        <h4 className="font-medium text-gray-900">{toTitleCase(group.label)}</h4>
                      </div>
                      <div className="space-y-2 pl-5">
                        {group.fields?.map((field) => (
                          <div key={field.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{toSentenceCase(field.label)}</span>
                              {field.required && <span className="text-xs text-red-500">*</span>}
                            </div>
                            <span className="text-xs capitalize text-gray-400">{field.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <AlertCircle size={48} className="mx-auto mb-4 text-amber-300" />
                  <p>No field schema published</p>
                  <p className="mt-1 text-sm">Use Form Builder to publish fields</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 p-4">
              <Button onClick={() => navigate(`/super-admin/form-builder?templateId=${selectedTemplate.id}`)} className="flex-1">
                <Edit3 size={16} />
                Edit in Form Builder
              </Button>
              <Button
                onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                disabled={deletingTemplateId === selectedTemplate.id || selectedTemplate.activation_count > 0}
                variant="danger"
                className="flex-1"
              >
                <Trash2 size={16} />
                {deletingTemplateId === selectedTemplate.id ? 'Deleting...' : 'Delete Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
