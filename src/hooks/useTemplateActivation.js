import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { normalizeSectionOrder } from '../lib/sectionUtils'

export function useTemplateActivation(sectionOrder, activeCycle, profile) {
  const [publishedTemplates, setPublishedTemplates] = useState([])
  const [templateAssignments, setTemplateAssignments] = useState({})
  const [templateSelections, setTemplateSelections] = useState({})
  const [loadingTemplatePanel, setLoadingTemplatePanel] = useState(false)
  const [activatingSection, setActivatingSection] = useState(null)
  const sectionOrderKey = Array.isArray(sectionOrder) ? sectionOrder.join(',') : String(sectionOrder ?? '')
  const normalizedSectionOrder = useMemo(() => normalizeSectionOrder(sectionOrder), [sectionOrderKey])

  // ─── Fetch Template Catalog ──────────────────────────────────────
  const fetchTemplateCatalog = useCallback(async () => {
    if (!activeCycle?.id || !profile?.clinic_id) {
      setPublishedTemplates([])
      return
    }

    setLoadingTemplatePanel(true)
    try {
      const { data, error } = await supabase.rpc('list_templates')
      if (error) throw error

      const publishedOnly = (data || []).filter(template => template.status === 'published')
      setPublishedTemplates(publishedOnly)
      setTemplateSelections(current => {
        let changed = false
        const next = { ...current }

        for (const sectionNumber of normalizedSectionOrder) {
          if (!next[sectionNumber]) {
            next[sectionNumber] = publishedOnly[0]?.id || ''
            changed = true
          }
        }

        return changed ? next : current
      })
    } catch (err) {
      console.error(`Failed to load templates: ${err.message}`)
    } finally {
      setLoadingTemplatePanel(false)
    }
  }, [activeCycle?.id, profile?.clinic_id, sectionOrderKey])

  // ─── Fetch Template Assignments ─────────────────────────────────
  const fetchTemplateAssignments = useCallback(async () => {
    if (!activeCycle?.id || !profile?.clinic_id) {
      setTemplateAssignments({})
      return
    }

    try {
      const { data, error } = await supabase
        .from('clinic_templates')
        .select(`
          section_number,
          template_id,
          activated_at,
          form_templates (
            id,
            name,
            version,
            status
          )
        `)
        .eq('clinic_id', profile.clinic_id)
        .eq('cycle_id', activeCycle.id)

      if (error) throw error

      const nextAssignments = {}
      for (const assignment of data || []) {
        if (!assignment.section_number) continue
        nextAssignments[assignment.section_number] = assignment
      }

      setTemplateAssignments(nextAssignments)
      setTemplateSelections(current => {
        let changed = false
        const next = { ...current }

        for (const assignment of data || []) {
          if (assignment.section_number && assignment.template_id && next[assignment.section_number] !== assignment.template_id) {
            next[assignment.section_number] = assignment.template_id
            changed = true
          }
        }

        return changed ? next : current
      })
    } catch (err) {
      console.error(`Failed to load active template assignments: ${err.message}`)
    }
  }, [activeCycle?.id, profile?.clinic_id])

  // ─── Activate Template ──────────────────────────────────────────
  const handleActivateTemplate = useCallback(async (sectionNumber) => {
    const templateId = templateSelections[sectionNumber]
    if (!templateId || !profile?.clinic_id || !activeCycle?.id) {
      return { error: 'Select a published template first' }
    }

    setActivatingSection(sectionNumber)
    try {
      const { error } = await supabase.rpc('activate_template', {
        p_clinic_id: profile.clinic_id,
        p_cycle_id: activeCycle.id,
        p_template_id: templateId,
        p_section_number: Number(sectionNumber),
      })

      if (error) throw error

      await fetchTemplateAssignments()
      return { success: `Template activated for section ${sectionNumber}` }
    } catch (err) {
      return { error: `Failed to activate template: ${err.message}` }
    } finally {
      setActivatingSection(null)
    }
  }, [templateSelections, profile?.clinic_id, activeCycle?.id, fetchTemplateAssignments])

  // ─── Load on mount/change ───────────────────────────────────────
  useEffect(() => {
    fetchTemplateCatalog()
    fetchTemplateAssignments()
  }, [activeCycle?.id, profile?.clinic_id, sectionOrderKey, fetchTemplateCatalog, fetchTemplateAssignments])

  return {
    publishedTemplates,
    templateAssignments,
    templateSelections,
    setTemplateSelections,
    loadingTemplatePanel,
    activatingSection,
    fetchTemplateCatalog,
    fetchTemplateAssignments,
    handleActivateTemplate,
  }
}
