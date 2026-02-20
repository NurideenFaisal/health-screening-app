import { useState, useEffect } from 'react'

const NORMAL = 'Normal'

const devFields = [
  { key: 'grossMotor', label: 'Gross Motor' },
  { key: 'fineMotor', label: 'Fine Motor' },
  { key: 'language', label: 'Language' },
  { key: 'personalSocial', label: 'Personal / Social' },
]

export default function Development() {

  const [formData, setFormData] = useState({
    developmental: {
      grossMotor: '',
      fineMotor: '',
      language: '',
      personalSocial: ''
    },
    ophthalmic: {
      rightVision: '',
      leftVision: '',
      diagnosis: ''
    },
    combinedDiagnosis: ''
  })

  const updateDev = (key, value) => {
    setFormData(prev => ({
      ...prev,
      developmental: {
        ...prev.developmental,
        [key]: value
      }
    }))
  }

  const allDevNormal =
    devFields.every(f =>
      formData.developmental[f.key] === NORMAL
    )

  const tickAllNormal = () => {
    const updated = {}
    devFields.forEach(f => updated[f.key] = NORMAL)

    setFormData(prev => ({
      ...prev,
      developmental: updated
    }))
  }

  useEffect(() => {
    const parts = []
    if (formData.ophthalmic.rightVision)
      parts.push(`Right: ${formData.ophthalmic.rightVision}`)
    if (formData.ophthalmic.leftVision)
      parts.push(`Left: ${formData.ophthalmic.leftVision}`)

    setFormData(prev => ({
      ...prev,
      ophthalmic: {
        ...prev.ophthalmic,
        diagnosis: parts.join(' | ')
      }
    }))
  }, [formData.ophthalmic.rightVision, formData.ophthalmic.leftVision])

  return (
    <div className="space-y-8">

      {/* Developmental Milestones */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">
            Developmental Milestones
          </h3>

          <button
            type="button"
            onClick={tickAllNormal}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              allDevNormal
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-400'
            }`}
          >
            Tick Normal for All
          </button>
        </div>

        <div className="space-y-4">
          {devFields.map(({ key, label }) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">
                {label}
              </span>

              <div className="flex gap-2">
                {[NORMAL, 'Delayed'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      updateDev(
                        key,
                        formData.developmental[key] === opt ? '' : opt
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                      formData.developmental[key] === opt
                        ? opt === NORMAL
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Ophthalmic Assessment */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-bold text-gray-900 mb-4">
          Ophthalmic Assessment
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Right Vision"
            value={formData.ophthalmic.rightVision}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                ophthalmic: {
                  ...prev.ophthalmic,
                  rightVision: e.target.value
                }
              }))
            }
            className="px-3 py-2 border rounded-lg"
          />

          <input
            type="text"
            placeholder="Left Vision"
            value={formData.ophthalmic.leftVision}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                ophthalmic: {
                  ...prev.ophthalmic,
                  leftVision: e.target.value
                }
              }))
            }
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          {formData.ophthalmic.diagnosis || 'Diagnosis auto-fills here'}
        </div>
      </div>

    </div>
  )
}