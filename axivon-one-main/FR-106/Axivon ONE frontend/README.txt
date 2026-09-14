AXIVON ONE — Connected Frontend
================================

ENTRY POINT
-----------
Run/open: index.html
For the best experience in VS Code, use Live Server and open index.html.

USER MANAGEMENT
---------------
The User Management task is implemented as a connected frontend module:

1. Users list
   users.html
   - Search users
   - Filter by status
   - Filter by membership
   - View profile
   - Edit user
   - Create user

2. User profile/details
   user-details.html?id=<USER_ID>
   - Full profile information
   - Status badge
   - Membership badge
   - Created/updated dates
   - Edit profile
   - Change status
   - Change membership

3. Create
   user-form.html

4. Edit
   user-form.html?id=<USER_ID>

5. Status
   Active / Pending / Inactive / Suspended

6. Membership
   Free / Basic / Pro / Enterprise

ARCHITECTURE
------------
assets/js/users.js exposes:
- AxivonUsers.State     : shared UI/data state
- AxivonUsers.Store     : state access/update helpers
- AxivonUsers.Components: reusable UI components
- AxivonUsers.Routes    : centralized user-management routes
- AxivonUsers.Validators: create/edit validation
- AxivonUsers CRUD      : getAll/getById/create/update/setStatus/remove

DATA STORAGE
------------
This is a frontend-only demo. Managed users are persisted in browser localStorage:
axivon_managed_users_v1

Authentication remains separate and is handled by assets/js/auth.js.

CONNECTED FLOW
--------------
index.html
  -> dashboard.html
  -> users.html
      -> user-details.html?id=<id>
          -> user-form.html?id=<id>
          -> status/membership update
      -> user-form.html
  -> sessions.html
  -> security.html
  -> settings.html

The public index page contains direct entry cards for all major workspace and
user-management areas.

IMPORTANT
---------
Because there is no backend/API in this project, users, accounts and sessions
are demo data stored in the browser. A real production deployment should replace
these localStorage operations with authenticated API/database calls.


USER MANAGEMENT ROUTE STRUCTURE
AXIVON ONE -> Login -> Dashboard -> Users -> User Management
User Management -> users.html (List/Search/Filter/Actions)
User Management -> user-form.html (Create/Edit)
User Management -> user-details.html?id=... (Profile/Details/Status/Membership)
User Management -> status.html (Status overview -> filtered user list)
User Management -> membership.html (Membership overview -> filtered user list)
All User Management screens share assets/js/users.js state, components and localStorage data.


OWNER DEMO ACCESS
Email: owner@axivon.one
Password: Axivon@123

USER MANAGEMENT
User List defaults to Active users. User Profiles & Details opens every managed/auth account. Create/Edit update profiles. Status includes Active, Pending, Inactive, Suspended and Banned. Membership includes Free, Basic, Pro and Enterprise. Auth accounts from Sign Up are synchronized into the user-management store.
