-- =============================================================================
-- Migration: 20260416000005_cfs_v1_template_migration.sql
-- Description: Transforms existing flat field_schema in section_definitions
--              to CFS v1 nested structure (section → groups → fields).
--
-- Strategy: Updates all existing templates to CFS v1 compliance
-- Compatible with: PostgreSQL 17 (remote database)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSFORM SECTION 1 TEMPLATE TO CFS V1 STRUCTURE
-- Converts flat field schema to nested groups/fields structure
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.section_definitions
SET field_schema = jsonb_build_object(
  'groups',
  jsonb_build_object(
    'vitals_basic',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'weight', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Weight (kg)',
            'required', true,
            'validation', jsonb_build_object('min', 0, 'max', 200),
            'display', jsonb_build_object('width', 'half')
          )
        ),
        'height', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Height (cm)',
            'required', true,
            'validation', jsonb_build_object('min', 0, 'max', 250),
            'display', jsonb_build_object('width', 'half')
          )
        ),
        'temperature', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Temperature (°C)',
            'required', false,
            'validation', jsonb_build_object('min', 30, 'max', 45),
            'display', jsonb_build_object('width', 'half')
          )
        ),
        'pulse', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Pulse (bpm)',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 300),
            'display', jsonb_build_object('width', 'half')
          )
        ),
        'bmi', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'BMI',
            'required', false,
            'readonly', true,
            'display', jsonb_build_object('width', 'half')
          )
        ),
        'respiration', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Respiration Rate',
            'required', false,
            'display', jsonb_build_object('width', 'half')
          )
        ),
        'bloodPressure', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Blood Pressure',
            'required', false,
            'placeholder', 'e.g., 120/80',
            'display', jsonb_build_object('width', 'half')
          )
        ),
        'headCircumference', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Head Circumference (cm)',
            'required', false,
            'display', jsonb_build_object('width', 'half')
          )
        )
      )
    ),
    'physical_exam',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'vitalComment', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Vital Comments',
            'required', false
          )
        ),
        'medicalHistory', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Medical History',
            'required', false
          )
        ),
        'noMedicalHistory', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'No Significant Medical History',
            'required', false
          )
        ),
        'physicalAppearance_normalAppearance', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Normal Appearance',
            'required', false
          )
        ),
        'physicalAppearance_edema', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Edema',
            'required', false
          )
        ),
        'physicalAppearance_jaundiced', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Jaundiced',
            'required', false
          )
        ),
        'physicalAppearance_lethargic', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Lethargic',
            'required', false
          )
        ),
        'physicalAppearance_pallor', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Pallor',
            'required', false
          )
        ),
        'physicalAppearance_skinProblem', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Skin Problem',
            'required', false
          )
        ),
        'physicalAppearance_other', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Other Physical Appearance Issues',
            'required', false
          )
        )
      )
    )
  )
)
WHERE section_number = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSFORM SECTION 2 TEMPLATE TO CFS V1 STRUCTURE
-- Converts flat field schema to nested groups/fields structure
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.section_definitions
SET field_schema = jsonb_build_object(
  'groups',
  jsonb_build_object(
    'hematology',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'hemoglobin', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Hemoglobin (g/dL)',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 25)
          )
        ),
        'hematocrit', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Hematocrit (%)',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 100)
          )
        ),
        'wbc', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'WBC Count (×10³/μL)',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 100)
          )
        ),
        'neutrophils', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Neutrophils (%)',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 100)
          )
        ),
        'lymphocytes', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Lymphocytes (%)',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 100)
          )
        ),
        'platelets', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'Platelets (×10³/μL)',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 1000)
          )
        )
      )
    ),
    'blood_grouping',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'bloodGroup', jsonb_build_object(
          'value', null,
          'type', 'select',
          'meta', jsonb_build_object(
            'label', 'Blood Group',
            'required', false,
            'options', jsonb_build_array('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
          )
        ),
        'rhesusFactor', jsonb_build_object(
          'value', null,
          'type', 'select',
          'meta', jsonb_build_object(
            'label', 'Rhesus Factor',
            'required', false,
            'options', jsonb_build_array('Positive', 'Negative')
          )
        )
      )
    ),
    'urinalysis',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'urineColor', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Color',
            'required', false
          )
        ),
        'urineAppearance', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Appearance',
            'required', false
          )
        ),
        'urinePh', jsonb_build_object(
          'value', null,
          'type', 'number',
          'meta', jsonb_build_object(
            'label', 'pH',
            'required', false,
            'validation', jsonb_build_object('min', 0, 'max', 14)
          )
        ),
        'urineProtein', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Protein',
            'required', false
          )
        ),
        'urineGlucose', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Glucose',
            'required', false
          )
        ),
        'urineKetones', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Ketones',
            'required', false
          )
        ),
        'urineBlood', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Blood',
            'required', false
          )
        )
      )
    ),
    'stool_analysis',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'stoolConsistency', jsonb_build_object(
          'value', null,
          'type', 'select',
          'meta', jsonb_build_object(
            'label', 'Consistency',
            'required', false,
            'options', jsonb_build_array('Formed', 'Semi-formed', 'Loose', 'Watery')
          )
        ),
        'stoolColor', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Color',
            'required', false
          )
        ),
        'ova', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Ova',
            'required', false
          )
        ),
        'cysts', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Cysts',
            'required', false
          )
        ),
        'worms', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Worms',
            'required', false
          )
        ),
        'blood', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Blood Present',
            'required', false
          )
        ),
        'pus', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Pus Present',
            'required', false
          )
        )
      )
    )
  )
)
WHERE section_number = 2;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSFORM SECTION 3 TEMPLATE TO CFS V1 STRUCTURE
-- Converts flat field schema to nested groups/fields structure
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.section_definitions
SET field_schema = jsonb_build_object(
  'groups',
  jsonb_build_object(
    'diagnosis_summary',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'summary', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Clinical Summary',
            'required', true,
            'placeholder', 'Summarize key findings from examination and investigations'
          )
        ),
        'diagnosis', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Diagnosis',
            'required', true,
            'placeholder', 'Primary diagnosis and any secondary diagnoses'
          )
        ),
        'differentialDiagnosis', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Differential Diagnosis',
            'required', false,
            'placeholder', 'List of possible alternative diagnoses considered'
          )
        )
      )
    ),
    'treatment_plan',
    jsonb_build_object(
      'fields',
      jsonb_build_object(
        'treatmentGiven', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Treatment Given',
            'required', true,
            'placeholder', 'Medications, procedures, or other treatments administered'
          )
        ),
        'followUpInstructions', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Follow-up Instructions',
            'required', false,
            'placeholder', 'Instructions for follow-up care and monitoring'
          )
        ),
        'referralNeeded', jsonb_build_object(
          'value', false,
          'type', 'boolean',
          'meta', jsonb_build_object(
            'label', 'Referral Needed',
            'required', false
          )
        ),
        'referralTo', jsonb_build_object(
          'value', null,
          'type', 'text',
          'meta', jsonb_build_object(
            'label', 'Referral To',
            'required', false,
            'placeholder', 'Specialty or facility for referral'
          )
        ),
        'referralReason', jsonb_build_object(
          'value', null,
          'type', 'textarea',
          'meta', jsonb_build_object(
            'label', 'Referral Reason',
            'required', false,
            'placeholder', 'Reason for referral and urgency level'
          )
        )
      )
    )
  )
)
WHERE section_number = 3;