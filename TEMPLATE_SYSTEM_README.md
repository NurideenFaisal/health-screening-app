# Schema-Driven Healthcare Screening System

This implementation transforms the healthcare screening application from hardcoded forms to a dynamic, schema-driven architecture that supports multi-tenant template management.

## Overview

The system now supports:
- **Super-admin Template Management**: Platform-wide creation and management of reusable form templates
- **Dynamic Form Rendering**: Forms are rendered based on JSON schemas stored in the database
- **Multi-tenant Access Control**: Clinics can activate templates and clinicians see only assigned sections
- **Backward Compatibility**: Existing data and functionality remain intact

## Database Changes

### New Tables
- `clinic_templates`: Tracks which templates are activated for specific clinic/cycle combinations

### Extended Tables
- `section_definitions`: Added template metadata columns
- `profiles`: Added `super-admin` support for template management

### New RPC Functions
- `get_section_template(section_number)`: Returns template schema for dynamic rendering
- `save_section_template(section_data)`: Saves/updates template schemas (`super-admin` only)
- `get_clinic_templates(clinic_id, cycle_id)`: Returns available templates for a clinic
- `activate_clinic_template()`: Activates templates for clinics (admin/`super-admin` only)
- `validate_form_response()`: Validates form responses against schemas
- `get_user_accessible_sections()`: Returns sections accessible to current user

## Frontend Components

### DynamicForm.jsx
Main component for rendering schema-driven forms with support for:
- Text, number, select, textarea, checkbox, date, and object field types
- Client-side validation based on schema rules
- Real-time saving with draft/complete states
- Responsive grid layout

### TemplateBuilder.jsx
Super-admin interface for creating and editing form templates:
- Visual field editor with drag-and-drop style interface
- Support for nested object fields
- Real-time preview of form structure
- Template versioning and categorization

### Hooks
- `useDynamicScreeningSection`: Manages form state and operations for dynamic sections
- `useActiveTemplate`: Handles template activation and access control

## Integration Points

### ClinicianScreeningForm.jsx
Updated to use DynamicForm for sections without tabs, maintaining backward compatibility for existing tabbed sections.

### Routing
- Added `/super-admin/templates` route for template management
- Updated SuperAdminSidebar with Template Builder navigation

## Migration Instructions

1. **Apply Database Migrations**:
   ```bash
   # Apply the new migrations
   npx supabase db push

   # Or reset and apply all migrations
   npx supabase db reset
   ```

2. **Update Environment**:
   - Ensure template managers use the existing app role `super-admin`
   - Existing admin/clinician roles remain unchanged

3. **Test the System**:
   - Login as `super-admin` and access `/super-admin/templates`
   - Create or modify form templates
   - Login as clinic admin to activate templates
   - Login as clinician to see dynamic forms

## Security Model

- **Super-admin**: Full access to template creation/modification
- **Clinic Admin**: Can activate/deactivate templates for their clinic
- **Clinician**: Can only access sections assigned to their role and activated for their clinic

## Backward Compatibility

- Existing hardcoded sections continue to work
- All existing data remains intact
- Gradual migration path allows phased rollout

## Field Types Supported

- `text`: Single-line text input
- `number`: Numeric input with min/max validation
- `select`: Dropdown with predefined options
- `textarea`: Multi-line text input
- `checkbox`: Boolean checkbox
- `date`: Date picker
- `object`: Nested field groups

## Schema Format

```json
{
  "field_key": {
    "type": "text|number|select|textarea|checkbox|date|object",
    "label": "Display Label",
    "required": true|false,
    "placeholder": "Placeholder text",
    "validation": {
      "min": 0,
      "max": 100
    },
    "options": [
      {"value": "option1", "label": "Option 1"}
    ],
    "display": {
      "width": "half|full",
      "rows": 3
    },
    "fields": {
      // For object type - nested fields
    }
  }
}
```

## Next Steps

1. Apply the database migrations
2. Test template creation and form rendering
3. Gradually migrate remaining hardcoded sections to use DynamicForm
4. Add template import/export functionality
5. Implement template sharing between clinics
