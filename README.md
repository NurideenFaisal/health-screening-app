# Health Screening Application

A comprehensive React-based health screening application for managing patient health assessments, tracking immunizations, and conducting developmental screenings. The application supports role-based access for administrators and clinicians with a modern, responsive interface.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Usage Guide](#usage-guide)
  - [Admin Panel](#admin-panel)
  - [Clinician Panel](#clinician-panel)
  - [Screening Process](#screening-process)
- [API Reference](#api-reference)
  - [Supabase Client](#supabase-client)
  - [Authentication Store](#authentication-store)
  - [Patient Registry Hook](#patient-registry-hook)
- [Screening Sections](#screening-sections)
  - [Section 1: Vitals, Immunization & Development](#section-1-vitals-immunization--development)
  - [Section 2: Health Assessment](#section-2-health-assessment)
  - [Section 3: Laboratory Tests](#section-3-laboratory-tests)
  - [Section 4: Summary & Follow-up](#section-4-summary--follow-up)
- [Component Architecture](#component-architecture)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [License](#license)

---

## Project Overview

The Health Screening Application is a web-based platform designed to streamline the process of conducting health screenings for patients. It provides:

- **Role-Based Access Control**: Separate interfaces for administrators and clinicians
- **Comprehensive Screening**: Multiple screening sections covering vitals, immunizations, development, health assessment, laboratory tests, and follow-up
- **Patient Management**: Full CRUD operations for patient records
- **Session Management**: Secure authentication with Supabase
- **Responsive Design**: Works on desktop and mobile devices

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Frontend Framework | React | 19.2.0 |
| Build Tool | Vite | 7.3.1 |
| Styling | Tailwind CSS | 4.1.18 |
| State Management | Zustand | 5.0.11 |
| Data Fetching | React Query | 5.90.21 |
| Routing | React Router DOM | 7.13.0 |
| Forms | React Hook Form | 7.71.1 |
| Database & Auth | Supabase | 2.95.3 |
| Icons | Lucide React | 0.564.0 |
| Linting | ESLint | 9.39.1 |

---

## Project Structure

```
health-screening-app/
├── public/                     # Static assets
├── src/
│   ├── assets/                # Images and static files
│   ├── components/            # Reusable React components
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleRoute.jsx
│   │   └── ScreeningSection1/
│   │       ├── Vitals.jsx
│   │       ├── Immunization.jsx
│   │       └── Development.jsx
│   │   ├── ScreeningSection2.jsx
│   │   ├── ScreeningSection3.jsx
│   │   └── ScreeningSection4.jsx
│   ├── hooks/                 # Custom React hooks
│   │   └── usePatientRegistry.js
│   ├── lib/                   # Utility libraries
│   │   ├── supabase.js       # Supabase client configuration
│   │   └── loadSession.js    # Session management utilities
│   ├── pages/                 # Page components
│   │   ├── Login.jsx
│   │   ├── AdminSide/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── RoleManagement.jsx
│   │   │   ├── PatientModals.jsx
│   │   │   ├── PeopleData.jsx
│   │   │   ├── Screening_Data.jsx
│   │   │   ├── ScreeningForm.jsx
│   │   │   └── AdminCycleManager.jsx
│   │   └── ClinicianSide/
│   │       ├── ClinicianDashboard.jsx
│   │       ├── ClinicianSidebar.jsx
│   │       ├── ClinicianDashboardStats.jsx
│   │       ├── ClinicianPatientData.jsx
│   │       ├── ClinicianScreeningData.jsx
│   │       └── ClinicianScreeningForm.jsx
│   ├── store/                 # State management
│   │   └── authStore.js      # Authentication state
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # Application entry point
│   ├── index.css             # Global styles
│   └── App.css               # App-specific styles
├── supabase/                 # Supabase edge functions
│   └── functions/
│       └── create-user/
├── .env                      # Environment variables
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Installation

### Prerequisites

Before installing, ensure you have the following:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Supabase account** (for backend services)

### Steps

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd health-screening-app
   ```

2. **Install Dependencies**

   Using npm:
   ```bash
   npm install
   ```

   Or using yarn:
   ```bash
   yarn install
   ```

3. **Set Up Environment Variables**

   Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) section)

4. **Configure Supabase**

   Set up your Supabase project and configure the database schema (see [Database Setup](#database-setup))

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

---

## Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Yes |

### Supabase Configuration

The Supabase client is configured in [`src/lib/supabase.js`](src/lib/supabase.js):

```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
```

---

## Database Setup

### Required Tables

Create the following tables in your Supabase database:

1. **users** (managed by Supabase Auth)
   - `id` UUID (primary key)
   - `email` TEXT
   - `created_at` TIMESTAMP

2. **profiles**
   - `id` UUID (references auth.users)
   - `full_name` TEXT
   - `role` TEXT ('admin' or 'clinician')
   - `created_at` TIMESTAMP

3. **children** (patient records)
   - `id` UUID (primary key)
   - `first_name` TEXT
   - `last_name` TEXT
   - `birthdate` DATE
   - `gender` TEXT
   - `community` TEXT
   - `child_code` TEXT
   - `created_by` UUID (references profiles)
   - `created_at` TIMESTAMP

4. **screenings**
   - `id` UUID (primary key)
   - `child_id` UUID (references children)
   - `screening_date` DATE
   - `section1_data` JSONB
   - `section2_data` JSONB
   - `section3_data` JSONB
   - `section4_data` JSONB
   - `created_by` UUID (references profiles)
   - `created_at` TIMESTAMP

### Row Level Security (RLS)

Enable RLS on tables and configure policies:

```sql
-- Example: Enable RLS on children table
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Example: Users can read all children
CREATE POLICY "Enable read access for all users" ON children
  FOR SELECT USING (true);

-- Example: Only admins can insert children
CREATE POLICY "Enable insert for admins" ON children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

The development server will start on `http://localhost:5173` with hot module replacement enabled.

### Production Build

```bash
npm run build
```

Build files will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## User Roles and Permissions

### Admin Role

Administrators have full access to:

- **Dashboard**: View statistics and system overview
- **Role Management**: Create, edit, and manage user roles
- **Cycle Manager**: Manage screening cycles
- **Patient Data**: View and manage all patient records
- **Screening Data**: Access all screening records

### Clinician Role

Clinicians have access to:

- **Dashboard**: View personal statistics
- **Patient Data**: View assigned patients
- **Screening Data**: Create and complete patient screenings
- **Screening Forms**: Complete all screening sections

### Role-Based Routing

The application uses the [`RoleRoute`](src/components/RoleRoute.jsx) component to enforce role-based access:

```javascript
<Route
  path="/admin/*"
  element={
    <RoleRoute requiredRole="admin" user={user} profile={profile}>
      <AdminDashboard />
    </RoleRoute>
  }
>
```

---

## Usage Guide

### Admin Panel

#### Dashboard

The admin dashboard (`/admin`) provides an overview of:
- Total patients registered
- Total screenings completed
- User activity statistics

#### Role Management

Access at `/admin/role-management`:
- View all users and their roles
- Create new user accounts
- Assign roles (admin/clinician)
- Edit user profiles
- Delete users

#### Cycle Manager

Access at `/admin/cycle-manager`:
- Create new screening cycles
- Set cycle dates and parameters
- Manage active cycles

#### Patient Data

Access at `/admin/patient-data`:
- View all registered patients
- Add new patients
- Edit patient information
- Delete patient records
- View screening history

### Clinician Panel

#### Dashboard

The clinician dashboard (`/clinician`) shows:
- Personal screening statistics
- Recent activity
- Quick access to patients

#### Patient Data

Access at `/clinician/patient-data`:
- View assigned patients
- Search patients by name or ID
- View patient details

#### Screening Process

1. Select a patient from the Patient Data page
2. Navigate to `/clinician/patient/:id`
3. Complete each screening section:
   - Section 1: Vitals, Immunization, Development
   - Section 2: Health Assessment
   - Section 3: Laboratory Tests
   - Section 4: Summary & Follow-up

---

## API Reference

### Supabase Client

**File**: [`src/lib/supabase.js`](src/lib/supabase.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

#### Authentication Methods

```javascript
// Sign in with email and password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Sign out
const { error } = await supabase.auth.signOut()

// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
})
```

#### Database Operations

```javascript
// Select data
const { data, error } = await supabase
  .from('children')
  .select('*')
  .eq('id', patientId)

// Insert data
const { data, error } = await supabase
  .from('children')
  .insert({ first_name: 'John', last_name: 'Doe' })

// Update data
const { data, error } = await supabase
  .from('children')
  .update({ first_name: 'Jane' })
  .eq('id', patientId)

// Delete data
const { error } = await supabase
  .from('children')
  .delete()
  .eq('id', patientId)
```

---

### Authentication Store

**File**: [`src/store/authStore.js`](src/store/authStore.js)

The authentication state is managed using Zustand:

```javascript
import { useAuthStore } from './store/authStore'

// Access auth state
const { user, profile, loading } = useAuthStore()

// Set auth data (after login)
const { setAuth } = useAuthStore.getState()
setAuth(user, profile)

// Clear auth (after logout)
const { clearAuth } = useAuthStore.getState()
clearAuth()
```

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | object \| null | Supabase auth user object |
| `profile` | object \| null | User profile from database |
| `loading` | boolean | Initial loading state |

#### Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `setAuth` | `user, profile` | Set authenticated user and profile |
| `clearAuth` | - | Clear authentication state |

---

### Patient Registry Hook

**File**: [`src/hooks/usePatientRegistry.js`](src/hooks/usePatientRegistry.js)

A custom React Query hook for managing patient data:

```javascript
import { usePatientRegistry } from './hooks/usePatientRegistry'

function PatientList() {
  const {
    people,           // Array of patient records
    isLoading,        // Loading state
    addPatient,       // Function to add patient
    editPatient,      // Function to edit patient
    deletePatients,   // Function to delete patients
    isProcessing     // Mutation pending state
  } = usePatientRegistry()

  // Add a new patient
  await addPatient({
    first_name: 'John',
    last_name: 'Doe',
    birthdate: '2020-01-01',
    gender: 'male',
    community: 'Community A'
  })

  // Edit existing patient
  await editPatient({
    id: 'patient-uuid',
    updates: { first_name: 'Jane' }
  })

  // Delete patients
  await deletePatients(['uuid1', 'uuid2'])
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `people` | array | List of patient records |
| `isLoading` | boolean | Query loading state |
| `addPatient` | function | Mutation to add patient |
| `editPatient` | function | Mutation to edit patient |
| `deletePatients` | function | Mutation to delete patients |
| `isProcessing` | boolean | Any mutation in progress |

---

## Screening Sections

### Section 1: Vitals, Immunization & Development

**Components**:
- [`Vitals.jsx`](src/components/ScreeningSection1/Vitals.jsx)
- [`Immunization.jsx`](src/components/ScreeningSection1/Immunization.jsx)
- [`Development.jsx`](src/components/ScreeningSection1/Development.jsx)

**Data Captured**:
- Weight, height, BMI calculation
- Temperature, pulse, respiration rate
- Blood pressure
- Head circumference
- Physical appearance assessment
- Physical examination
- Body systems review
- Signs of abuse assessment
- Medical history
- Immunization records
- Developmental milestones

### Section 2: Health Assessment

**Component**: [`ScreeningSection2.jsx`](src/components/ScreeningSection2.jsx)

**Data Captured**:
- General health status
- Chronic conditions
- Current medications
- Allergies
- Family history

### Section 3: Laboratory Tests

**Component**: [`ScreeningSection3.jsx`](src/components/ScreeningSection3.jsx)

**Data Captured**:
- Blood test results
- Urine test results
- Other laboratory findings

### Section 4: Summary & Follow-up

**Component**: [`ScreeningSection4.jsx`](src/components/ScreeningSection4.jsx)

**Data Captured**:
- Screening summary
- Diagnosis
- Treatment plan
- Follow-up appointments
- Referrals
- Notes and observations

---

## Component Architecture

### Authentication Components

| Component | File | Description |
|-----------|------|-------------|
| `Login` | [`pages/Login.jsx`](src/pages/Login.jsx) | User login form with email/password authentication |
| `ProtectedRoute` | [`components/ProtectedRoute.jsx`](src/components/ProtectedRoute.jsx) | Protects routes requiring authentication |
| `RoleRoute` | [`components/RoleRoute.jsx`](src/components/RoleRoute.jsx) | Protects routes requiring specific roles |

### Admin Components

| Component | File | Description |
|-----------|------|-------------|
| `AdminDashboard` | [`pages/AdminSide/AdminDashboard.jsx`](src/pages/AdminSide/AdminDashboard.jsx) | Main admin layout |
| `AdminSidebar` | [`pages/AdminSide/AdminSidebar.jsx`](src/pages/AdminSide/AdminSidebar.jsx) | Admin navigation sidebar |
| `DashboardStats` | [`pages/AdminSide/DashboardStats.jsx`](src/pages/AdminSide/DashboardStats.jsx) | Statistics and metrics |
| `RoleManagement` | [`pages/AdminSide/RoleManagement.jsx`](src/pages/AdminSide/RoleManagement.jsx) | User role management |
| `PeopleData` | [`pages/AdminSide/PeopleData.jsx`](src/pages/AdminSide/PeopleData.jsx) | Patient data management |
| `AdminCycleManager` | [`pages/AdminSide/AdminCycleManager.jsx`](src/pages/AdminSide/AdminCycleManager.jsx) | Screening cycle management |

### Clinician Components

| Component | File | Description |
|-----------|------|-------------|
| `ClinicianDashboard` | [`pages/ClinicianSide/ClinicianDashboard.jsx`](src/pages/ClinicianSide/ClinicianDashboard.jsx) | Main clinician layout |
| `ClinicianSidebar` | [`pages/ClinicianSide/ClinicianSidebar.jsx`](src/pages/ClinicianSide/ClinicianSidebar.jsx) | Clinician navigation sidebar |
| `ClinicianPatientData` | [`pages/ClinicianSide/ClinicianPatientData.jsx`](src/pages/ClinicianSide/ClinicianPatientData.jsx) | Patient list for clinicians |
| `ClinicianScreeningForm` | [`pages/ClinicianSide/ClinicianScreeningForm.jsx`](src/pages/ClinicianSide/ClinicianScreeningForm.jsx) | Screening form container |
| `ClinicianScreeningData` | [`pages/ClinicianSide/ClinicianScreeningData.jsx`](src/pages/ClinicianSide/ClinicianScreeningData.jsx) | Screening data view |

---

## Troubleshooting

### Common Issues

#### 1. Authentication Issues

**Problem**: Users cannot log in

**Solutions**:
- Verify Supabase credentials in `.env` file
- Check Supabase authentication settings
- Ensure user exists in `profiles` table
- Verify email/password are correct

#### 2. Session Not Persisting

**Problem**: User gets logged out unexpectedly

**Solutions**:
- Check `persistSession` is set to `true` in Supabase config
- Verify browser cookies are enabled
- Check for any auth state change events

#### 3. Database Permission Errors

**Problem**: Cannot read/write to database

**Solutions**:
- Verify RLS policies are correctly configured
- Check user has appropriate role
- Verify table permissions

#### 4. Build Errors

**Problem**: `npm run build` fails

**Solutions**:
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript/ESLint errors
- Verify all imports are correct

#### 5. Environment Variable Issues

**Problem**: Application doesn't recognize environment variables

**Solutions**:
- Restart development server after changing `.env`
- Ensure variables start with `VITE_` prefix
- Verify no spaces around `=` in `.env`

### Debug Logging

Enable console logging in development:

```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

### Getting Help

For additional support:
1. Check the console for error messages
2. Review network requests in browser DevTools
3. Consult Supabase documentation
4. Check application logs in Supabase dashboard

---

## Best Practices

### Code Organization

1. **Component Structure**: Keep components small and focused
2. **Custom Hooks**: Extract reusable logic into custom hooks
3. **State Management**: Use Zustand for global state, React Query for server state
4. **File Naming**: Use descriptive, consistent naming (PascalCase for components)

### Security

1. **Environment Variables**: Never commit sensitive keys to version control
2. **Input Validation**: Validate all user inputs
3. **RLS Policies**: Implement proper database access controls
4. **Session Management**: Handle token refresh properly

### Performance

1. **React Query**: Use appropriate stale times
2. **Component Memoization**: Use `useMemo` and `useCallback` when needed
3. **Lazy Loading**: Consider lazy loading routes
4. **Optimistic Updates**: Use for better UX

### Testing

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test critical user flows

### Code Style

1. **ESLint**: Follow configured linting rules
2. **Prettier**: Use consistent formatting
3. **TypeScript**: Consider adding TypeScript for type safety

---

## Security Considerations

### Authentication

- All routes are protected by role-based access
- Session tokens are managed by Supabase
- Passwords are never stored in the application

### Data Protection

- Row Level Security (RLS) protects database access
- Sensitive data should be encrypted at rest
- HTTPS required for production

### Best Practices

1. Keep dependencies updated
2. Monitor for security vulnerabilities
3. Implement proper CORS policies
4. Use environment-specific configurations

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

The application can be deployed to any static hosting service:

- **Netlify**: `npm run build` output to `dist/`
- **AWS S3 + CloudFront**: Upload `dist/` contents
- **Firebase Hosting**: Deploy using Firebase CLI

### Build Configuration

The Vite configuration ([`vite.config.js`](vite.config.js)) is minimal:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

---

## License

This project is licensed under the MIT License.

---

## Support

For questions and support:
- Open an issue on GitHub
- Check documentation
- Contact the development team

---

## Acknowledgments

- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Lucide Icons](https://lucide.dev/)
