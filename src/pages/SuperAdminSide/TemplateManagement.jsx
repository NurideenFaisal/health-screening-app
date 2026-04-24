import { useState, useEffect } from 'react'
import { FileText, Search, Edit3, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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

      setSelectedTemplate({
        ...template,
        ...(data || {}),
      })
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
      const { error } = await supabase.rpc('delete_template', {
        p_template_id: templateId,
      })

      if (error) throw error

      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
      }

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Template Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            View and manage draft and published form templates
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 w-64"
            />
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading templates...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => {
            const status = template.status || 'draft'
            const StatusIcon = STATUS_CONFIG[status].icon
            
            return (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleOpenTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-100">
                    <FileText size={18} className="text-emerald-600" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[status].color}`}>
                    <StatusIcon size={12} />
                    {STATUS_CONFIG[status].label}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1">
                  {template.name || 'Untitled Template'}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {template.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span>v{template.version || '1.0'}</span>
                  <span>{template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'Not updated'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedTemplate.name || 'Untitled Template'}
                </h3>
                <p className="text-sm text-gray-500">
                  Version {selectedTemplate.version || '1.0'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedTemplate.fieldSchema?.groups || selectedTemplate.field_schema?.groups ? (
                <div className="space-y-6">
                  {(selectedTemplate.fieldSchema?.groups || selectedTemplate.field_schema?.groups).map((group) => (
                    <div key={group.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        <h4 className="font-medium text-gray-900">{group.label}</h4>
                      </div>
                      <div className="space-y-2 pl-5">
                        {group.fields?.map((field) => (
                          <div 
                            key={field.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{field.label}</span>
                              {field.required && (
                                <span className="text-red-500 text-xs">*</span>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs capitalize">
                              {field.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle size={48} className="mx-auto mb-4 text-amber-300" />
                  <p>No field schema published</p>
                  <p className="text-sm mt-1">Use Form Builder to publish fields</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/super-admin/form-builder?templateId=${selectedTemplate.id}`)}
                className="flex-1 py-2.5 text-center text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
              >
                <Edit3 size={16} className="inline mr-2" />
                Edit in Form Builder
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                disabled={deletingTemplateId === selectedTemplate.id || selectedTemplate.activation_count > 0}
                className="flex-1 py-2.5 text-center text-sm font-medium border border-red-200 rounded-xl text-red-600 hover:bg-red-50 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} className="inline mr-2" />
                {deletingTemplateId === selectedTemplate.id ? 'Deleting...' : 'Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
