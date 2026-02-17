Clinician Workflow – Conveyor Belt with Offline/Online Support
1️⃣ Key Concepts
Concept	Description
Sections	Each patient form is divided into 3 sections: Section 1, Section 2, Section 3.
Clinician Roles	Clinicians are assigned to a specific section. Admins can fill all sections.
Patient Flow	Patients move sequentially through sections. Online: system highlights pending sections. Offline: clinicians search manually by patient ID.
Visibility	Each clinician sees all patients but can only edit their assigned section. Other sections are read-only.
2️⃣ Online Mode – Automated Conveyor Belt
Workflow

Clinician logs in → sees table of assigned patients.

Table highlights which patients are pending in their section:

Section 1 clinicians: see patients where Section 1 is incomplete.

Section 2 clinicians: see patients where Section 1 is completed, Section 2 pending.

Section 3 clinicians: see patients where Sections 1 & 2 are completed.

Clinician clicks on a patient → edits their section only.

On save:

The form updates in the database.

The patient automatically moves to the next section queue (online, visible to the next clinician).

Features

Automatic section highlighting.

Automatic patient queue updates.

Real-time collaboration if multiple clinicians are online.

UI Hint:

Use color-coded status indicators for each section (e.g., gray = not started, yellow = in-progress, green = completed).

3️⃣ Offline Mode – Manual Conveyor Belt
Workflow

Clinician logs in → sees all patients.

Because offline, section status may be outdated. Clinicians manually search patient by ID.

Clinician fills their assigned section only.

Clinician marks completion locally (or the system stores it locally in IndexedDB/localStorage).

When network reconnects:

Completed sections sync to the central database.

The next section’s clinician sees updated patient status.

Constraints

No automatic patient movement between sections.

Clinicians must manually manage workflow.

The “queue” effect depends on clinicians following the protocol.

UI Hint:

Include offline indicators (e.g., orange dot) for sections that haven’t synced yet.

Add a search-by-ID feature for easy navigation.