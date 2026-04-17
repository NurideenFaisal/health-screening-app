-- =============================================================================
-- Migration: 20260416000001_template_support.sql
-- Description: Extends existing section_definitions table with template metadata
--              for gradual migration to schema-driven forms. Maintains backward
--              compatibility while adding template capabilities.
--
-- Strategy: Extend existing normalized structure instead of creating new tables
-- Compatible with: PostgreSQL 17 (remote database)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTEND section_definitions WITH TEMPLATE METADATA
-- Adds template support to existing table without breaking current functionality
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.section_definitions
ADD COLUMN IF NOT EXISTS template_name TEXT,
ADD COLUMN IF NOT EXISTS template_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS field_schema JSONB,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS template_category TEXT DEFAULT 'screening',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.section_definitions.template_name IS
  'Name of the template this section belongs to (for grouping sections into templates)';
COMMENT ON COLUMN public.section_definitions.template_version IS
  'Version of the template (for template evolution tracking)';
COMMENT ON COLUMN public.section_definitions.field_schema IS
  'JSONB schema defining fields, types, validation rules, and display config';
COMMENT ON COLUMN public.section_definitions.is_template IS
  'Whether this section definition represents a reusable template';
COMMENT ON COLUMN public.section_definitions.template_category IS
  'Category of template: screening, assessment, followup, etc.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ADD SUPERADMIN ROLE TO EXISTING ROLE SYSTEM
-- Extends current admin/clinician roles without breaking existing functionality
-- Avoids failure if legacy roles exist during migration
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE role IS NOT NULL
      AND role NOT IN ('super-admin', 'admin', 'clinician')
  ) THEN
    ALTER TABLE public.profiles
      DROP CONSTRAINT IF EXISTS profiles_role_check,
      ADD CONSTRAINT profiles_role_check
        CHECK (role IN ('super-admin', 'admin', 'clinician'));
  ELSE
    RAISE NOTICE 'Skipping profiles_role_check addition: legacy profile roles are present';
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.role IS
  'super-admin = platform-wide template management; admin = clinic management; clinician = restricted to assigned section';

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE RLS POLICIES FOR SUPERADMIN ACCESS
-- Grants superadmins access to template management while maintaining security
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='section_definitions' AND policyname='section_definitions_superadmin_all') THEN
    CREATE POLICY "section_definitions_superadmin_all"
      ON public.section_definitions FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super-admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinics' AND policyname='clinics_superadmin_all') THEN
    CREATE POLICY "clinics_superadmin_all"
      ON public.clinics FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super-admin'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED TEMPLATE-BASED SECTION DEFINITIONS
-- Converts existing hardcoded sections to template-driven definitions
-- Maintains backward compatibility with existing section numbers
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.section_definitions
SET
  template_name = 'Child Health Screening',
  template_version = '1.0',
  template_category = 'screening',
  is_template = TRUE,
  field_schema = CASE section_number
    WHEN 1 THEN '{
      "weight": {
        "type": "number",
        "label": "Weight (kg)",
        "required": true,
        "validation": {"min": 0, "max": 200},
        "display": {"width": "half"}
      },
      "height": {
        "type": "number",
        "label": "Height (cm)",
        "required": true,
        "validation": {"min": 0, "max": 250},
        "display": {"width": "half"}
      },
      "temperature": {
        "type": "number",
        "label": "Temperature (°C)",
        "required": false,
        "validation": {"min": 30, "max": 45},
        "display": {"width": "half"}
      },
      "pulse": {
        "type": "number",
        "label": "Pulse (bpm)",
        "required": false,
        "validation": {"min": 0, "max": 300},
        "display": {"width": "half"}
      },
      "bmi": {
        "type": "number",
        "label": "BMI",
        "required": false,
        "readonly": true,
        "display": {"width": "half"}
      },
      "respiration": {
        "type": "number",
        "label": "Respiration Rate",
        "required": false,
        "display": {"width": "half"}
      },
      "bloodPressure": {
        "type": "text",
        "label": "Blood Pressure",
        "required": false,
        "placeholder": "e.g., 120/80",
        "display": {"width": "half"}
      },
      "headCircumference": {
        "type": "number",
        "label": "Head Circumference (cm)",
        "required": false,
        "display": {"width": "half"}
      },
      "vitalComment": {
        "type": "textarea",
        "label": "Comments",
        "required": false,
        "display": {"rows": 3}
      },
      "medicalHistory": {
        "type": "textarea",
        "label": "Medical History",
        "required": false,
        "display": {"rows": 4}
      },
      "noMedicalHistory": {
        "type": "checkbox",
        "label": "No significant medical history",
        "required": false
      },
      "physicalAppearance": {
        "type": "object",
        "label": "Physical Appearance",
        "fields": {
          "normalAppearance": {"type": "checkbox", "label": "Normal appearance"},
          "edema": {"type": "checkbox", "label": "Edema"},
          "jaundiced": {"type": "checkbox", "label": "Jaundiced"},
          "lethargic": {"type": "checkbox", "label": "Lethargic"},
          "pallor": {"type": "checkbox", "label": "Pallor"},
          "skinProblem": {"type": "checkbox", "label": "Skin problem"},
          "other": {"type": "checkbox", "label": "Other"}
        }
      },
      "physicalExam": {
        "type": "object",
        "label": "Physical Examination",
        "fields": {
          "normalExam": {"type": "checkbox", "label": "Normal examination"},
          "head": {
            "type": "object",
            "fields": {
              "abnormal": {"type": "checkbox", "label": "Abnormal"},
              "comment": {"type": "text", "label": "Comments"}
            }
          },
          "chest": {
            "type": "object",
            "fields": {
              "abnormal": {"type": "checkbox", "label": "Abnormal"},
              "comment": {"type": "text", "label": "Comments"}
            }
          },
          "abdomen": {
            "type": "object",
            "fields": {
              "abnormal": {"type": "checkbox", "label": "Abnormal"},
              "comment": {"type": "text", "label": "Comments"}
            }
          },
          "genitourinary": {
            "type": "object",
            "fields": {
              "abnormal": {"type": "checkbox", "label": "Abnormal"},
              "comment": {"type": "text", "label": "Comments"}
            }
          },
          "superiorExtremities": {
            "type": "object",
            "fields": {
              "abnormal": {"type": "checkbox", "label": "Abnormal"},
              "comment": {"type": "text", "label": "Comments"}
            }
          },
          "inferiorExtremities": {
            "type": "object",
            "fields": {
              "abnormal": {"type": "checkbox", "label": "Abnormal"},
              "comment": {"type": "text", "label": "Comments"}
            }
          },
          "mentalHealthStatus": {
            "type": "object",
            "fields": {
              "abnormal": {"type": "checkbox", "label": "Abnormal"},
              "comment": {"type": "text", "label": "Comments"}
            }
          }
        }
      },
      "bodySystems": {
        "type": "object",
        "label": "Body Systems",
        "fields": {
          "noDisturbances": {"type": "checkbox", "label": "No disturbances noted"},
          "auditory": {"type": "checkbox", "label": "Auditory system"},
          "circulatorySystem": {"type": "checkbox", "label": "Circulatory system"},
          "digestiveSystem": {"type": "checkbox", "label": "Digestive system"},
          "endocrineSystem": {"type": "checkbox", "label": "Endocrine system"},
          "lymphaticSystem": {"type": "checkbox", "label": "Lymphatic system"},
          "musculoskeletalSystem": {"type": "checkbox", "label": "Musculoskeletal system"},
          "nervousSystem": {"type": "checkbox", "label": "Nervous system"},
          "reproductiveSystem": {"type": "checkbox", "label": "Reproductive system"},
          "respiratorySystem": {"type": "checkbox", "label": "Respiratory system"},
          "skin": {"type": "checkbox", "label": "Skin"},
          "urinarySystem": {"type": "checkbox", "label": "Urinary system"},
          "vision": {"type": "checkbox", "label": "Vision"}
        }
      },
      "systemExplanation": {
        "type": "textarea",
        "label": "System Explanation",
        "required": false,
        "display": {"rows": 3}
      },
      "signsOfAbuse": {
        "type": "select",
        "label": "Signs of Abuse",
        "required": true,
        "options": [
          {"value": "no", "label": "No"},
          {"value": "suspected", "label": "Suspected"},
          {"value": "confirmed", "label": "Confirmed"}
        ]
      },
      "signsOfAbuseComment": {
        "type": "textarea",
        "label": "Signs of Abuse Comments",
        "required": false,
        "display": {"rows": 3}
      }
    }'::JSONB
    WHEN 2 THEN '{
      "cbc": {
        "type": "object",
        "label": "Complete Blood Count (CBC)",
        "fields": {
          "hemoglobin": {"type": "number", "label": "Hemoglobin (g/dL)", "validation": {"min": 0, "max": 20}},
          "hematocrit": {"type": "number", "label": "Hematocrit (%)", "validation": {"min": 0, "max": 100}},
          "wbc": {"type": "number", "label": "WBC Count (×10³/µL)", "validation": {"min": 0, "max": 100}},
          "platelets": {"type": "number", "label": "Platelets (×10³/µL)", "validation": {"min": 0, "max": 1000}}
        }
      },
      "bloodGroup": {
        "type": "select",
        "label": "Blood Group",
        "options": [
          {"value": "A+", "label": "A+"},
          {"value": "A-", "label": "A-"},
          {"value": "B+", "label": "B+"},
          {"value": "B-", "label": "B-"},
          {"value": "AB+", "label": "AB+"},
          {"value": "AB-", "label": "AB-"},
          {"value": "O+", "label": "O+"},
          {"value": "O-", "label": "O-"}
        ]
      },
      "urinalysis": {
        "type": "object",
        "label": "Urinalysis",
        "fields": {
          "color": {"type": "text", "label": "Color"},
          "appearance": {"type": "text", "label": "Appearance"},
          "ph": {"type": "number", "label": "pH", "validation": {"min": 0, "max": 14}},
          "protein": {"type": "select", "label": "Protein", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "trace", "label": "Trace"},
            {"value": "1+", "label": "1+"},
            {"value": "2+", "label": "2+"},
            {"value": "3+", "label": "3+"},
            {"value": "4+", "label": "4+"}
          ]},
          "glucose": {"type": "select", "label": "Glucose", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "trace", "label": "Trace"},
            {"value": "1+", "label": "1+"},
            {"value": "2+", "label": "2+"},
            {"value": "3+", "label": "3+"},
            {"value": "4+", "label": "4+"}
          ]},
          "ketones": {"type": "select", "label": "Ketones", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "trace", "label": "Trace"},
            {"value": "1+", "label": "1+"},
            {"value": "2+", "label": "2+"},
            {"value": "3+", "label": "3+"}
          ]},
          "blood": {"type": "select", "label": "Blood", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "trace", "label": "Trace"},
            {"value": "1+", "label": "1+"},
            {"value": "2+", "label": "2+"},
            {"value": "3+", "label": "3+"}
          ]},
          "leukocytes": {"type": "select", "label": "Leukocytes", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "trace", "label": "Trace"},
            {"value": "1+", "label": "1+"},
            {"value": "2+", "label": "2+"},
            {"value": "3+", "label": "3+"}
          ]}
        }
      },
      "stoolAnalysis": {
        "type": "object",
        "label": "Stool Analysis",
        "fields": {
          "color": {"type": "text", "label": "Color"},
          "consistency": {"type": "text", "label": "Consistency"},
          "occultBlood": {"type": "select", "label": "Occult Blood", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "positive", "label": "Positive"}
          ]},
          "ova": {"type": "select", "label": "Ova", "options": [
            {"value": "not_seen", "label": "Not Seen"},
            {"value": "seen", "label": "Seen"}
          ]},
          "cysts": {"type": "select", "label": "Cysts", "options": [
            {"value": "not_seen", "label": "Not Seen"},
            {"value": "seen", "label": "Seen"}
          ]},
          "parasites": {"type": "select", "label": "Parasites", "options": [
            {"value": "not_seen", "label": "Not Seen"},
            {"value": "seen", "label": "Seen"}
          ]}
        }
      },
      "serology": {
        "type": "object",
        "label": "Serology",
        "fields": {
          "vdrl": {"type": "select", "label": "VDRL", "options": [
            {"value": "non_reactive", "label": "Non-reactive"},
            {"value": "reactive", "label": "Reactive"}
          ]},
          "hiv": {"type": "select", "label": "HIV", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "positive", "label": "Positive"}
          ]},
          "hepatitisB": {"type": "select", "label": "Hepatitis B", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "positive", "label": "Positive"}
          ]},
          "hepatitisC": {"type": "select", "label": "Hepatitis C", "options": [
            {"value": "negative", "label": "Negative"},
            {"value": "positive", "label": "Positive"}
          ]}
        }
      },
      "otherTests": {
        "type": "textarea",
        "label": "Other Tests",
        "required": false,
        "display": {"rows": 3}
      }
    }'::JSONB
    WHEN 3 THEN '{
      "developmentalMilestones": {
        "type": "object",
        "label": "Developmental Milestones",
        "fields": {
          "grossMotor": {
            "type": "object",
            "label": "Gross Motor",
            "fields": {
              "sitting": {"type": "checkbox", "label": "Sitting without support"},
              "standing": {"type": "checkbox", "label": "Standing with support"},
              "walking": {"type": "checkbox", "label": "Walking independently"},
              "running": {"type": "checkbox", "label": "Running"},
              "jumping": {"type": "checkbox", "label": "Jumping"},
              "climbing": {"type": "checkbox", "label": "Climbing stairs"}
            }
          },
          "fineMotor": {
            "type": "object",
            "label": "Fine Motor",
            "fields": {
              "grasping": {"type": "checkbox", "label": "Grasping objects"},
              "pincerGrasp": {"type": "checkbox", "label": "Pincer grasp"},
              "stacking": {"type": "checkbox", "label": "Stacking blocks"},
              "drawing": {"type": "checkbox", "label": "Drawing with crayons"},
              "usingUtensils": {"type": "checkbox", "label": "Using utensils"}
            }
          },
          "language": {
            "type": "object",
            "label": "Language Development",
            "fields": {
              "cooing": {"type": "checkbox", "label": "Cooing"},
              "babbling": {"type": "checkbox", "label": "Babbling"},
              "firstWords": {"type": "checkbox", "label": "First words"},
              "twoWordPhrases": {"type": "checkbox", "label": "Two-word phrases"},
              "sentences": {"type": "checkbox", "label": "Simple sentences"}
            }
          },
          "social": {
            "type": "object",
            "label": "Social Development",
            "fields": {
              "smiling": {"type": "checkbox", "label": "Social smiling"},
              "strangerAnxiety": {"type": "checkbox", "label": "Stranger anxiety"},
              "attachment": {"type": "checkbox", "label": "Secure attachment"},
              "peerInteraction": {"type": "checkbox", "label": "Peer interaction"},
              "sharing": {"type": "checkbox", "label": "Sharing toys"}
            }
          }
        }
      },
      "developmentalConcerns": {
        "type": "textarea",
        "label": "Developmental Concerns",
        "required": false,
        "display": {"rows": 4}
      },
      "referralNeeded": {
        "type": "checkbox",
        "label": "Referral to developmental specialist needed",
        "required": false
      },
      "referralReason": {
        "type": "textarea",
        "label": "Referral Reason",
        "required": false,
        "display": {"rows": 3}
      }
    }'::JSONB
    WHEN 4 THEN '{
      "immunizationHistory": {
        "type": "object",
        "label": "Immunization History",
        "fields": {
          "bcg": {
            "type": "object",
            "label": "BCG",
            "fields": {
              "given": {"type": "checkbox", "label": "Given"},
              "date": {"type": "date", "label": "Date given"},
              "batchNumber": {"type": "text", "label": "Batch number"}
            }
          },
          "opv": {
            "type": "object",
            "label": "OPV (Oral Polio Vaccine)",
            "fields": {
              "dose1": {
                "type": "object",
                "label": "Dose 1",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose2": {
                "type": "object",
                "label": "Dose 2",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose3": {
                "type": "object",
                "label": "Dose 3",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              }
            }
          },
          "dpt": {
            "type": "object",
            "label": "DPT",
            "fields": {
              "dose1": {
                "type": "object",
                "label": "Dose 1",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose2": {
                "type": "object",
                "label": "Dose 2",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose3": {
                "type": "object",
                "label": "Dose 3",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              }
            }
          },
          "measles": {
            "type": "object",
            "label": "Measles",
            "fields": {
              "given": {"type": "checkbox", "label": "Given"},
              "date": {"type": "date", "label": "Date given"},
              "batchNumber": {"type": "text", "label": "Batch number"}
            }
          },
          "hepatitisB": {
            "type": "object",
            "label": "Hepatitis B",
            "fields": {
              "dose1": {
                "type": "object",
                "label": "Dose 1",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose2": {
                "type": "object",
                "label": "Dose 2",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose3": {
                "type": "object",
                "label": "Dose 3",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              }
            }
          },
          "hib": {
            "type": "object",
            "label": "Hib",
            "fields": {
              "dose1": {
                "type": "object",
                "label": "Dose 1",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose2": {
                "type": "object",
                "label": "Dose 2",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose3": {
                "type": "object",
                "label": "Dose 3",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              }
            }
          },
          "pneumococcal": {
            "type": "object",
            "label": "Pneumococcal",
            "fields": {
              "dose1": {
                "type": "object",
                "label": "Dose 1",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose2": {
                "type": "object",
                "label": "Dose 2",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose3": {
                "type": "object",
                "label": "Dose 3",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              }
            }
          },
          "rotavirus": {
            "type": "object",
            "label": "Rotavirus",
            "fields": {
              "dose1": {
                "type": "object",
                "label": "Dose 1",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              },
              "dose2": {
                "type": "object",
                "label": "Dose 2",
                "fields": {
                  "given": {"type": "checkbox", "label": "Given"},
                  "date": {"type": "date", "label": "Date given"},
                  "batchNumber": {"type": "text", "label": "Batch number"}
                }
              }
            }
          }
        }
      },
      "immunizationStatus": {
        "type": "select",
        "label": "Overall Immunization Status",
        "required": true,
        "options": [
          {"value": "up_to_date", "label": "Up to date"},
          {"value": "partially_complete", "label": "Partially complete"},
          {"value": "overdue", "label": "Overdue"},
          {"value": "not_started", "label": "Not started"}
        ]
      },
      "nextDueVaccines": {
        "type": "textarea",
        "label": "Next Due Vaccines",
        "required": false,
        "display": {"rows": 3}
      },
      "immunizationComments": {
        "type": "textarea",
        "label": "Comments",
        "required": false,
        "display": {"rows": 3}
      }
    }'::JSONB
    ELSE '{}'::JSONB
  END
WHERE section_number IN (1, 2, 3, 4);
