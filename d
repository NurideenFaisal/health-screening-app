[33mcommit cb03f1eab7bff305e03856327d57be1c3f9cdf1d[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mForms_Placeholder[m[33m, [m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m, [m[1;32mmain[m[33m)[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Sat Feb 21 20:52:33 2026 +0000

    Version 1 of the software
    1. AdminSide Complete
    2. Clinician Side Complete, next is to tackle new changes from stakeholder
    3. Routing Complete
    
    next: Screening Forms & Logic for screening sections, then move on to testing and bug fixes

[33mcommit 6306e9a750953eb9abc225151b2598a01f47af7a[m[33m ([m[1;31morigin/new_architecture[m[33m, [m[1;32mnew_architecture[m[33m)[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Fri Feb 20 17:42:38 2026 +0000

    Fixed routing issues, next is with styling and linear architecture,

[33mcommit 1deb60fdcf71afeed50e13b418c64d6b1055a190[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Fri Feb 20 06:24:10 2026 +0000

    feature: Add Patient from backend, AdminMangementCycle add to tell which screening we are working on, currently working on caching, next commit will be cashing all information

[33mcommit 65f13d455a9910d552daf0c974dd0df114105c08[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Thu Feb 19 09:36:12 2026 +0000

    Role Based enforeced via supabase dashboard, next commit will be add patients to system

[33mcommit a0c53000585f2068c2b6bd4768d30932ca750c75[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Tue Feb 17 12:37:19 2026 +0000

    feat(ui): finalize clinician UI integration for Supabase backend

[33mcommit 0d577232d338ac9aefafd88ade635ccbb439522a[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Tue Feb 17 02:52:33 2026 +0000

    Form Restructuring + Clinician Page setup

[33mcommit ae546be33395bcb2d9b13c5ef6a4f28ad9ecce2f[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Mon Feb 16 16:49:45 2026 +0000

    Met with Stakeholders, now about to make changes

[33mcommit e7786c914295707f90f802c24a7ca0a0affb23d5[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Sat Feb 14 13:49:07 2026 +0000

    WIP: pushing current work

[33mcommit f99eaa5865704eee33c017c5dda5495508d86ab7[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Sat Feb 14 11:53:48 2026 +0000

    Role Management UI/Ux works here

[33mcommit 93a8322a089e22d95ccdb377ebf449aa5aee7e6c[m[33m ([m[1;32mPeople_data[m[33m)[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Sat Feb 14 10:58:19 2026 +0000

    Fix changes on PeopleSidebar

[33mcommit 79461b6b9196121cc5673d60222d3750a67d499d[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Fri Feb 13 17:05:26 2026 +0000

    feat(dashboard): add DashboardStats component and update default dashboard view

[33mcommit 13d63fba2b72fb166b71c45747305cebd41c0847[m[33m ([m[1;32mPatient_Data_Sidebar[m[33m)[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Fri Feb 13 15:48:25 2026 +0000

    Sidebar icons fixed, will use modern later

[33mcommit d65828651fdf65c2af495da4a2374aae702ad5e0[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Fri Feb 13 11:37:14 2026 +0000

    feat(auth): allow admins and clinicians to access patient screening form

[33mcommit 35816af2e13d6d2a25ad737a9c90ec158ff7a575[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Fri Feb 13 11:30:35 2026 +0000

    feat(auth): allow admins and clinicians to access patient screening form
    
    - Updated RoleRoute to support multiple roles for flexible access control
    - Modified /patient/:id route to permit both 'admin' and 'clinician' roles
    - Added console logging on patient card click for easier debugging
    - Ensures admins can navigate to ScreeningForm while keeping route secure for clinicians
    - Sets up future-proof structure for clinician workflow integration

[33mcommit 613ddceec642a71a2f68b7b689c432bbe621b627[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Fri Feb 13 08:29:10 2026 +0000

    SideBar made collapsible whoth humbagar icon

[33mcommit 1da9694cb0a5a880d6da257a587d23843e77a2dc[m[33m ([m[1;31morigin/Dashboard-feature[m[33m, [m[1;32mDashboard-feature[m[33m)[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Thu Feb 12 18:27:54 2026 +0000

    Ensure dashboard loads properly and logout triggers only on button click

[33mcommit 8dbd5d833ddda2770981d04f63b1b396f9683ed9[m
Merge: 0a07f5f 9c75043
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Thu Feb 12 13:07:54 2026 +0000

    Resolve merge conflict in Login.jsx

[33mcommit 0a07f5f35c51d6b609ddd58fefbaacba37f86c39[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Thu Feb 12 12:56:21 2026 +0000

    Fix Vercel routing

[33mcommit 30f8b650f28c7b20fb485aa28c493dfdf8dcbd99[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Thu Feb 12 09:59:53 2026 +0000

    Fundamental - Superbase + LoginPage Functional

[33mcommit 9c75043a7302903f5697647b21f96b8550a63fb5[m[33m ([m[1;31morigin/deploy/vercel-mvp[m[33m, [m[1;32mdeploy/vercel-mvp[m[33m)[m
Author: Mr. Faisal <nurideenfaisal@gmail.com>
Date:   Thu Feb 12 09:59:53 2026 +0000

    Fundamental - Superbase + LoginPage Functional
