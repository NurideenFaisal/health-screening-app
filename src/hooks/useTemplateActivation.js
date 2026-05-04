import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTemplateActivation(sectionOrder, activeCycle, profile) {
  const [publishedTemplates, setPublishedTemplates] = useState([])
  const [templateAssignments, setTemplateAssignments] = useState({})
  const [templateSelections, setTemplateSelections] = useState({})
  const [loadingTemplatePanel, setLoadingTemplatePanel] = useState(false)
  const [activatingSection, setActivatingSection] = useState(null)

  const fetchTemplateCatalog = useCallback(async () => {
    if (!activeCycle?.id || !profile?.clinic_id) { setPublishedTemplates([]); return }
    setLoadingTemplatePanel(true)
    try {
      const { data, error } = await supabase.rpc('list_templates')
      if (error) throw error
      const publishedOnly = (data || []).filter(t => t.status === 'published')
      setPublishedTemplates(publishedOnly)
    } catch (err) { console.error(`Failed to load templates: ${err.message}`) }
    finally { setLoadingTemplatePanel(false) }
  }, [activeCycle?.id, profile?.clinic_id])

  const fetchTemplateAssignments = useCallback(async () => {
    if (!activeCycle?.id || !profile?.clinic_id) { setTemplateAssignments({}); return }
    try {
      const { data, error } = await supabase.from('clinic_templates').select(`section_number, template_id, activated_at, form_templates (id, name, version, status)`).eq('clinic_id', profile.clinic_id).eq('cycle_id', activeCycle.id)
      if (error) throw error
      const nextAssignments = {}; for (const a of data || []) { if (!a.section_number) continue; nextAssignments[a.section_number] = a }
      setTemplateAssignments(nextAssignments)
      setTemplateSelections(current => { let changed = false; const next = { ...current }; for (const a of data || []) { if (a.section_number && a.template_id && next[a.section_number] !== a.template_id) { next[a.section_number] = a.template_id; changed = true } }; return changed ? next : current })
    } catch (err) { console.error(`Failed to load assignments: ${err.message}`) }
  }, [activeCycle?.id, profile?.clinic_id])

  const handleActivateTemplate = useCallback(async (sectionNumber, templateId) => {
    if (!templateId || !profile?.clinic_id || !activeCycle?.id) return { error: 'Select a published template first' }
    setActivatingSection(sectionNumber)
    try {
      const { error } = await supabase.rpc('activate_template', { p_clinic_id: profile.clinic_id, p_cycle_id: activeCycle.id, p_template_id: templateId, p_section_number: Number(sectionNumber) })
      if (error) throw error
      await fetchTemplateAssignments()
      return { success: `Template activated for section ${sectionNumber}` }
    } catch (err) { return { error: `Failed to activate template: ${err.message}` } }
    finally { setActivatingSection(null) }
  }, [templateSelections, profile?.clinic_id, activeCycle?.id, fetchTemplateAssignments])

  useEffect(() => { fetchTemplateCatalog(); fetchTemplateAssignments() }, [activeCycle?.id, profile?.clinic_id, fetchTemplateCatalog, fetchTemplateAssignments])

useEffect(() => {
    if (!profile?.clinic_id || !activeCycle?.id) return
    const channel = supabase
      .channel('template-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form_templates' }, (payload) => {
        fetchTemplateCatalog()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_templates', filter: `clinic_id=eq.${profile.clinic_id}` }, (payload) => {
        fetchTemplateAssignments()
      })
      .subscribe((status, err) => {})
    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [profile?.clinic_id, activeCycle?.id])

  return { publishedTemplates, templateAssignments, templateSelections, setTemplateSelections, loadingTemplatePanel, activatingSection, fetchTemplateCatalog, fetchTemplateAssignments, handleActivateTemplate }
}