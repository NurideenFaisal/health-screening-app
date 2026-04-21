import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter, PointerSensor,
  useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const TYPE_META = {
  text:     { icon: 'T',  bg: '#ede9fe', color: '#6d28d9', label: 'Text' },
  number:   { icon: '#',  bg: '#dbeafe', color: '#1d4ed8', label: 'Number' },
  date:     { icon: 'D',  bg: '#d1fae5', color: '#065f46', label: 'Date' },
  textarea: { icon: '¶',  bg: '#fef3c7', color: '#92400e', label: 'Textarea' },
  dropdown: { icon: '▾',  bg: '#fce7f3', color: '#9d174d', label: 'Dropdown' },
  radio:    { icon: '◉',  bg: '#e0f2fe', color: '#0369a1', label: 'Radio' },
  checkbox: { icon: '✓',  bg: '#f0fdf4', color: '#166534', label: 'Checkbox' },
  computed: { icon: 'ƒ',  bg: '#fdf2f8', color: '#701a75', label: 'Computed' },
}

const PALETTE_GROUPS = [
  { label: 'Input', types: ['text','number','date','textarea'] },
  { label: 'Choice', types: ['dropdown','radio','checkbox'] },
  { label: 'Logic', types: ['computed'] },
]

const GROUP_COLORS = ['#059669','#7c3aed','#0284c7','#d97706','#dc2626','#db2777','#0891b2','#65a30d']

const INITIAL_GROUPS = [
  { id: 'g1', label: 'Vital signs', color: '#059669', fields: [
    { id: 'f1', type: 'number', label: 'Weight (kg)', required: true, help: '', step: '0.1', min: '', max: '', options: [], formula: '', conditions: [] },
    { id: 'f2', type: 'number', label: 'Height (cm)', required: true, help: '', step: '0.1', min: '', max: '', options: [], formula: '', conditions: [] },
    { id: 'f3', type: 'computed', label: 'BMI', required: false, help: 'Auto-calculated', step: '', min: '', max: '', options: [], formula: 'weight/(height/100)^2', conditions: [] },
  ]},
  { id: 'g2', label: 'Physical appearance', color: '#7c3aed', fields: [
    { id: 'f4', type: 'checkbox', label: 'Normal appearance', required: false, help: '', step: '', min: '', max: '', options: [], formula: '', conditions: [] },
    { id: 'f5', type: 'checkbox', label: 'Edema', required: false, help: '', step: '', min: '', max: '', options: [], formula: '', conditions: [] },
  ]},
  { id: 'g3', label: 'Signs of abuse / neglect', color: '#dc2626', fields: [
    { id: 'f6', type: 'radio', label: 'Signs of abuse', required: true, help: '', step: '', min: '', max: '', options: [{v:'no',l:'No'},{v:'suspected',l:'Suspected'},{v:'confirmed',l:'Confirmed'}], formula: '', conditions: [] },
    { id: 'f7', type: 'textarea', label: 'Comments / details', required: false, help: 'Provide details if suspected or confirmed', step: '', min: '', max: '', options: [], formula: '', conditions: [{field:'f6',op:'notEquals',value:'no'}] },
  ]},
]

let _id = 200
const genId = (p = 'id') => `${p}${++_id}`

function findField(groups, fid) {
  for (const g of groups) { const f = g.fields.find(x => x.id === fid); if (f) return { field: f, group: g } }
  return null
}

function allFields(groups) { return groups.flatMap(g => g.fields) }

function TypeIcon({ type, size = 'sm' }) {
  const m = TYPE_META[type] || TYPE_META.text
  const sz = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'
  return (
    <span className={`${sz} rounded flex items-center justify-center font-semibold flex-shrink-0`}
      style={{ background: m.bg, color: m.color }}>{m.icon}</span>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-[14px]' : 'translate-x-0'}`} />
    </button>
  )
}

function SortableField({ field, groupId, isSelected, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id, data: { type: 'field', fieldId: field.id, groupId },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }
  return (
    <div ref={setNodeRef} style={style} onClick={() => onSelect(field.id)}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150 mb-1 ${isSelected ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-transparent bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
      <span {...attributes} {...listeners} onClick={e => e.stopPropagation()}
        className="text-gray-300 hover:text-gray-500 text-sm select-none px-0.5 cursor-grab active:cursor-grabbing">⠿</span>
      <TypeIcon type={field.type} />
      <span className="flex-1 text-[13px] text-gray-700 truncate">
        {field.label || <span className="text-gray-400 italic">Untitled</span>}
      </span>
      <div className="flex items-center gap-1.5">
        {field.required && <span className="text-[10px] font-semibold text-red-500 tracking-wide">REQ</span>}
        {field.conditions?.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">if</span>}
        {field.type === 'computed' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">auto</span>}
        <button onClick={e => { e.stopPropagation(); onDelete(field.id) }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs">✕</button>
      </div>
    </div>
  )
}

function SortableGroup({ group, selectedFieldId, onSelectField, onDeleteField, onAddField, onUpdateGroup, onDeleteGroup, onDropFromPalette }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id, data: { type: 'group' },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [dragOver, setDragOver] = useState(false)
  const fieldIds = group.fields.map(f => f.id)

  return (
    <div ref={setNodeRef} style={style}
      className={`rounded-xl border bg-white mb-3 overflow-hidden transition-all duration-150 ${dragOver ? 'ring-2 ring-emerald-400 shadow-md' : 'border-gray-200 shadow-sm'}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const t = e.dataTransfer.getData('palette-type'); if (t) onDropFromPalette(group.id, t) }}>
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 text-sm select-none cursor-grab active:cursor-grabbing">⠿⠿</button>
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: group.color }} />
        <input value={group.label} onChange={e => onUpdateGroup(group.id, { label: e.target.value })}
          className="flex-1 text-[13px] font-semibold bg-transparent border-none text-gray-800 outline-none focus:bg-white focus:px-2 focus:rounded-md focus:border focus:border-gray-200 transition-all"
          placeholder="Group name" />
        <select value={group.color} onChange={e => onUpdateGroup(group.id, { color: e.target.value })}
          className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 cursor-pointer outline-none">
          {GROUP_COLORS.map(c => <option key={c} value={c}>{'● ' + c}</option>)}
        </select>
        <button onClick={() => onDeleteGroup(group.id)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs">✕</button>
      </div>
      <div className="p-2">
        <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
          {group.fields.length === 0 && (
            <div className={`text-center py-4 text-[12px] rounded-lg border border-dashed transition-colors ${dragOver ? 'border-emerald-400 text-emerald-500 bg-emerald-50' : 'border-gray-200 text-gray-400'}`}>
              Drop a field here
            </div>
          )}
          {group.fields.map(f => (
            <SortableField key={f.id} field={f} groupId={group.id} isSelected={f.id === selectedFieldId}
              onSelect={onSelectField} onDelete={onDeleteField} />
          ))}
        </SortableContext>
        <button onClick={() => onAddField(group.id, 'text')}
          className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-gray-200 text-[12px] text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
          + Add field
        </button>
      </div>
    </div>
  )
}

function ConfigPanel({ groups, selectedFieldId, onUpdateField, onDeleteField }) {
  const found = selectedFieldId ? findField(groups, selectedFieldId) : null
  const field = found?.field
  if (!field) return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-[13px] gap-2 px-6 text-center">
      <span className="text-3xl opacity-20">⚙</span>
      <span>Select a field to configure it</span>
    </div>
  )
  const update = patch => onUpdateField(field.id, patch)
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <TypeIcon type={field.type} size="md" />
        <span className="text-[13px] font-semibold text-gray-800 flex-1 capitalize">{field.type} field</span>
        <button onClick={() => onDeleteField(field.id)} className="text-[11px] px-2 py-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all">Delete</button>
      </div>
      <div className="px-4 py-3 space-y-4">
        <section>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Basic</p>
          <div className="mb-2.5">
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Label</label>
            <input value={field.label} onChange={e => update({ label: e.target.value })} placeholder="Field label"
              className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" />
          </div>
          <div className="mb-2.5">
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Help text</label>
            <input value={field.help} onChange={e => update({ help: e.target.value })} placeholder="Hint for clinician"
              className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-gray-700">Required</span>
            <Toggle checked={field.required} onChange={v => update({ required: v })} />
          </div>
        </section>

        {field.type === 'number' && (
          <section>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Number</p>
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div><label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Min</label>
                <input type="number" value={field.min} onChange={e => update({ min: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-emerald-400 transition-all" /></div>
              <div><label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Max</label>
                <input type="number" value={field.max} onChange={e => update({ max: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-emerald-400 transition-all" /></div>
            </div>
            <div><label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Step</label>
              <input type="number" value={field.step} onChange={e => update({ step: e.target.value })} placeholder="0.1"
                className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-emerald-400 transition-all" /></div>
          </section>
        )}

        {field.type === 'computed' && (
          <section>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Formula</p>
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Expression</label>
            <input value={field.formula} onChange={e => update({ formula: e.target.value })} placeholder="weight/(height/100)^2"
              className="w-full px-2.5 py-1.5 text-[12px] font-mono border border-purple-200 rounded-lg bg-purple-50 text-purple-800 outline-none focus:border-purple-400 transition-all" />
            <p className="text-[11px] text-gray-400 mt-1">Use field labels as variables</p>
          </section>
        )}

        {['dropdown','radio'].includes(field.type) && (
          <section>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Options</p>
            <div className="space-y-1.5">
              {(field.options||[]).map((opt,i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input value={opt.l} onChange={e => { const o=[...field.options]; o[i]={v:e.target.value.toLowerCase().replace(/\s+/g,'_'),l:e.target.value}; update({options:o}) }}
                    className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white outline-none focus:border-emerald-400 transition-all" placeholder="Label" />
                  <button onClick={() => update({options:field.options.filter((_,j)=>j!==i)})}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 rounded transition-colors text-xs">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => update({options:[...(field.options||[]),{v:`option_${(field.options?.length||0)+1}`,l:`Option ${(field.options?.length||0)+1}`}]})}
              className="mt-2 text-[12px] text-emerald-600 hover:text-emerald-700 font-medium">+ Add option</button>
          </section>
        )}

        <section>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Conditional logic</p>
          <div className="space-y-2">
            {(field.conditions||[]).map((cond,i) => {
              const siblings = allFields(groups).filter(f=>f.id!==field.id)
              return (
                <div key={i} className="bg-amber-50 rounded-lg p-3 border border-amber-100 space-y-1.5">
                  <div className="flex items-center justify-between"><p className="text-[11px] text-amber-700 font-semibold">Show when:</p>
                    <button onClick={()=>update({conditions:field.conditions.filter((_,j)=>j!==i)})} className="text-[10px] text-amber-400 hover:text-red-500">✕</button></div>
                  <select value={cond.field} onChange={e=>{const c=[...field.conditions];c[i]={...c[i],field:e.target.value};update({conditions:c})}}
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-200 bg-white text-[12px] outline-none">
                    <option value="">Pick a field...</option>
                    {siblings.map(f=><option key={f.id} value={f.id}>{f.label||'Untitled'}</option>)}
                  </select>
                  <select value={cond.op} onChange={e=>{const c=[...field.conditions];c[i]={...c[i],op:e.target.value};update({conditions:c})}}
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-200 bg-white text-[12px] outline-none">
                    <option value="equals">equals</option>
                    <option value="notEquals">does not equal</option>
                  </select>
                  <input value={cond.value} onChange={e=>{const c=[...field.conditions];c[i]={...c[i],value:e.target.value};update({conditions:c})}}
                    placeholder="Value..." className="w-full px-2 py-1.5 rounded-lg border border-amber-200 bg-white text-[12px] outline-none" />
                </div>
              )
            })}
          </div>
          <button onClick={()=>update({conditions:[...(field.conditions||[]),{field:'',op:'equals',value:''}]})}
            className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-gray-200 rounded-lg text-[12px] text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
            + Show only if...</button>
        </section>
      </div>
    </div>
  )
}

function PreviewModal({ groups, onClose }) {
  const [formData, setFormData] = useState({})
  const setValue = (id, val) => setFormData(p => ({ ...p, [id]: val }))
  const isVisible = f => {
    if (!f.conditions?.length) return true
    return f.conditions.every(c => c.op === 'equals' ? (formData[c.field]??'') === c.value : (formData[c.field]??'') !== c.value)
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-2xl">
          <div><h2 className="text-[15px] font-semibold text-gray-900">Form preview</h2>
            <p className="text-[12px] text-gray-400">Clinician view — conditional logic is live</p></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all text-sm">✕</button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {groups.map(g => (
            <div key={g.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{background:g.color}} />
                <h3 className="text-[13px] font-semibold text-gray-800">{g.label}</h3>
              </div>
              <div className="space-y-3">
                {g.fields.filter(isVisible).map(f => (
                  <div key={f.id}>
                    <label className="block text-[12px] text-gray-600 mb-1 font-medium">
                      {f.label||'Untitled'}{f.required&&<span className="text-red-500 ml-0.5">*</span>}
                      {f.conditions?.length>0&&<span className="ml-2 text-[10px] text-amber-500">(conditional)</span>}
                    </label>
                    {f.help&&<p className="text-[11px] text-gray-400 mb-1">{f.help}</p>}
                    {f.type==='textarea'&&<textarea rows={2} value={formData[f.id]||''} onChange={e=>setValue(f.id,e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-gray-50 resize-none outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"/>}
                    {f.type==='radio'&&<div className="flex flex-wrap gap-3">{f.options.map(o=>(
                      <label key={o.v} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                        <input type="radio" name={f.id} value={o.v} checked={formData[f.id]===o.v} onChange={()=>setValue(f.id,o.v)} className="text-emerald-600"/>{o.l}</label>))}</div>}
                    {f.type==='checkbox'&&<label className="flex items-center gap-2 text-[13px] cursor-pointer">
                      <input type="checkbox" checked={!!formData[f.id]} onChange={e=>setValue(f.id,e.target.checked)} className="w-4 h-4 text-emerald-600"/>{f.label}</label>}
                    {f.type==='dropdown'&&<select value={formData[f.id]||''} onChange={e=>setValue(f.id,e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-emerald-400 transition-all">
                      <option value="">Select...</option>{f.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>}
                    {f.type==='computed'&&<input readOnly value="(auto)" className="w-full px-3 py-2 text-[13px] border border-purple-200 rounded-lg bg-purple-50 text-purple-700 font-mono"/>}
                    {['text','number','date'].includes(f.type)&&<input type={f.type} value={formData[f.id]||''} onChange={e=>setValue(f.id,e.target.value)}
                      step={f.step||undefined} min={f.min||undefined} max={f.max||undefined} placeholder={f.help||''}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"/>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button className="flex-1 py-2.5 text-[13px] font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">Save draft</button>
          <button className="flex-1 py-2.5 text-[13px] font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200">Complete</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [groups, setGroups] = useState(INITIAL_GROUPS)
  const [selectedFieldId, setSelectedFieldId] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [published, setPublished] = useState(false)
  const [savedDraft, setSavedDraft] = useState(false)
  const [version, setVersion] = useState(1)
  const [isDirty, setIsDirty] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [activeType, setActiveType] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const activeDragField = activeType === 'field' ? allFields(groups).find(f => f.id === activeId) : null
  const activeDragGroup = activeType === 'group' ? groups.find(g => g.id === activeId) : null

  const addGroup = () => {
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length]
    setGroups(g => [...g, { id: genId('g'), label: 'New group', color, fields: [] }])
    setIsDirty(true)
  }
  const deleteGroup = (gid) => {
    setGroups(g => g.filter(x => x.id !== gid))
    setSelectedFieldId(p => { const grp = groups.find(x => x.id === gid); return grp?.fields.some(f => f.id === p) ? null : p })
    setIsDirty(true)
  }
  const updateGroup = (gid, patch) => { setGroups(g => g.map(x => x.id === gid ? { ...x, ...patch } : x)); setIsDirty(true) }
  const addField = (gid, type) => {
    const fid = genId('f')
    setGroups(g => g.map(x => x.id === gid ? { ...x, fields: [...x.fields, { id: fid, type, label: '', required: false, help: '', step: type === 'number' ? '1' : '', min: '', max: '', options: ['dropdown','radio'].includes(type) ? [{v:'option_1',l:'Option 1'}] : [], formula: '', conditions: [] }] } : x))
    setSelectedFieldId(fid); setIsDirty(true)
  }
  const deleteField = (fid) => {
    setGroups(g => g.map(x => ({ ...x, fields: x.fields.filter(f => f.id !== fid) })))
    if (selectedFieldId === fid) setSelectedFieldId(null); setIsDirty(true)
  }
  const updateField = (fid, patch) => { setGroups(g => g.map(x => ({ ...x, fields: x.fields.map(f => f.id === fid ? { ...f, ...patch } : f) }))); setIsDirty(true) }

  const handleDragStart = e => { setActiveId(e.active.id); setActiveType(e.active.data.current?.type || 'group') }
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null); setActiveType(null)
    if (!over || active.id === over.id) return
    const aData = active.data.current; const oData = over.data.current
    if (aData?.type === 'field') {
      const srcGid = aData.groupId
      const dstGid = oData?.groupId || over.id
      setGroups(prev => {
        const next = prev.map(g => ({ ...g, fields: [...g.fields] }))
        const src = next.find(g => g.id === srcGid)
        const dst = next.find(g => g.id === dstGid) || next.find(g => g.fields.some(f => f.id === over.id))
        if (!src || !dst) return prev
        const fld = src.fields.find(f => f.id === active.id); if (!fld) return prev
        src.fields = src.fields.filter(f => f.id !== active.id)
        const idx = dst.fields.findIndex(f => f.id === over.id)
        idx >= 0 ? dst.fields.splice(idx, 0, fld) : dst.fields.push(fld)
        return next
      })
    } else {
      setGroups(prev => { const oi = prev.findIndex(g => g.id === active.id); const ni = prev.findIndex(g => g.id === over.id); return (oi<0||ni<0) ? prev : arrayMove(prev, oi, ni) })
    }
    setIsDirty(true)
  }

  const handleSaveDraft = () => { setSavedDraft(true); setIsDirty(false); setTimeout(() => setSavedDraft(false), 2000) }
  const handlePublish = () => { setPublished(true); setVersion(v => v + 1); setIsDirty(false); setTimeout(() => setPublished(false), 2500) }

  const groupIds = groups.map(g => g.id)
  const totalFields = groups.reduce((a, g) => a + g.fields.length, 0)

  return (
    <div className="flex flex-col h-screen bg-[#f4f5f7]">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-gray-900">Form Builder</span>
            <span className="text-gray-300">·</span>
            {/* <span className="text-[12px] text-gray-400">Section 1 — Vitals tab</span> */}
          </div>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium transition-colors ${isDirty ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            v{version} {isDirty ? 'unsaved' : 'saved'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400 mr-1">{totalFields} fields · {groups.length} groups</span>
          <div className="w-px h-4 bg-gray-200" />
          <button onClick={() => setShowPreview(true)}
            className="px-3 py-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium">Preview</button>
          <button onClick={handleSaveDraft}
            className={`px-3 py-1.5 text-[13px] border rounded-lg transition-all font-medium ${savedDraft ? 'border-emerald-300 text-emerald-600 bg-emerald-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {savedDraft ? '✓ Saved' : 'Save draft'}</button>
          <button onClick={handlePublish}
            className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all shadow-sm ${published ? 'bg-emerald-800 shadow-emerald-200 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}>
            {published ? '✓ Published!' : 'Publish'}</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        <aside className="w-48 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 py-4 px-3">
          {PALETTE_GROUPS.map((pg, pi) => (
            <div key={pg.label} className={pi < PALETTE_GROUPS.length - 1 ? "mb-5" : ""}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">{pg.label}</p>
              {pg.types.map(type => {
                const m = TYPE_META[type]
                return (
                  <div key={type} draggable onDragStart={e => e.dataTransfer.setData('palette-type', type)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-white mb-1.5 select-none transition-all hover:border-gray-300 hover:bg-gray-50 hover:translate-x-0.5 active:scale-95 cursor-grab active:cursor-grabbing">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold flex-shrink-0" style={{background:m.bg,color:m.color}}>{m.icon}</span>
                    <span className="text-[13px] text-gray-700">{m.label}</span>
                  </div>
                )
              })}
              {pi < PALETTE_GROUPS.length - 1 && <div className="h-px bg-gray-100 mt-3" />}
            </div>
          ))}
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto p-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
              {groups.map(g => (
                <SortableGroup key={g.id} group={g} selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId} onDeleteField={deleteField}
                  onAddField={addField} onUpdateGroup={updateGroup} onDeleteGroup={deleteGroup}
                  onDropFromPalette={(gid, type) => addField(gid, type)} />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeDragField && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 bg-white shadow-lg w-64">
                  <TypeIcon type={activeDragField.type} />
                  <span className="text-[13px] text-gray-700 truncate">{activeDragField.label || 'Untitled'}</span>
                </div>
              )}
              {activeDragGroup && (
                <div className="rounded-xl border border-emerald-300 bg-white shadow-xl w-80 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50">
                    <span className="w-3 h-3 rounded-full" style={{background:activeDragGroup.color}} />
                    <span className="text-[13px] font-semibold text-gray-800">{activeDragGroup.label}</span>
                    <span className="ml-auto text-[11px] text-gray-400">{activeDragGroup.fields.length} fields</span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
          <button onClick={addGroup}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-[13px] text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-medium mt-1">
            + Add group
          </button>
        </main>

        {/* Config Panel */}
        <aside className="w-64 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Field settings</p>
          </div>
          <ConfigPanel groups={groups} selectedFieldId={selectedFieldId} onUpdateField={updateField} onDeleteField={deleteField} />
        </aside>
      </div>

      {showPreview && <PreviewModal groups={groups} onClose={() => setShowPreview(false)} />}
    </div>
  )
}