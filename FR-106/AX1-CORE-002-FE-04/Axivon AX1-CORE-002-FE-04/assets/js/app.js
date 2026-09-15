/* =========================================================
   AXIVON ONE
   USER MANAGEMENT APPLICATION
   Vanilla JS Router + State + UI
========================================================= */

(() => {


    /* =====================================================
       REFERENCES
    ===================================================== */

    const API =
        window.AxivonAPI;

    const UI =
        window.AxivonUI;


    const app =
        document.getElementById("app");

    const pageTitle =
        document.getElementById("pageTitle");

    const navUserCount =
        document.getElementById("navUserCount");


    /* =====================================================
       CONSTANTS
    ===================================================== */

    const STATUSES = [

        "Active",
        "Pending",
        "Inactive",
        "Suspended"

    ];


    const MEMBERSHIPS = [

        "Free",
        "Basic",
        "Pro",
        "Enterprise"

    ];


    /* =====================================================
       APPLICATION STATE
    ===================================================== */

    const state = {

        users: [],

        selectedUser: null,

        search: "",

        statusFilter: "All Status",

        membershipFilter:
            "All Membership",


        usersLoading: false,

        usersError: null,


        userLoading: false,

        userError: null,


        formSubmitting: false,


        statusUpdating: false,

        membershipUpdating: false

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function setPageTitle(
        title
    ) {

        pageTitle.textContent =
            title;

    }


    function route() {

        return (
            location.hash
                .replace(/^#/, "") ||
            "/users"
        );

    }


    function navigate(
        path
    ) {

        location.hash =
            path;

    }


    function page(
        content
    ) {

        return `
            <section class="page-section">
                ${content}
            </section>
        `;

    }


    /* =====================================================
       LOADING STATE
    ===================================================== */

    function loadingState(
        message
    ) {

        return page(`

            <div
                class="state-card"
                role="status"
            >

                <div
                    class="big-spinner"
                    aria-hidden="true"
                ></div>

                <h3>
                    ${UI.escapeHtml(message)}
                </h3>

                <p>
                    Please wait while AXIVON ONE
                    completes the request.
                </p>

            </div>

        `);

    }


    /* =====================================================
       ERROR STATE
    ===================================================== */

    function errorState(
        message,
        retryPath
    ) {

        return page(`

            <div class="state-card">

                <div class="state-icon">
                    !
                </div>

                <h3>
                    We couldn't load this data
                </h3>

                <p>
                    ${UI.escapeHtml(message)}
                </p>

                <button
                    class="btn btn-primary"
                    data-retry="${UI.escapeHtml(
                        retryPath
                    )}"
                >
                    Retry
                </button>

            </div>

        `);

    }


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    function emptyState(
        filtered
    ) {

        if (filtered) {

            return `

                <div class="empty-card">

                    <h3>
                        No users match your search or filters.
                    </h3>

                    <p>
                        Try changing your search or filters.
                    </p>

                    <div class="empty-actions">

                        <button
                            class="btn btn-secondary"
                            data-clear-filters
                        >
                            Clear Filters
                        </button>

                    </div>

                </div>

            `;

        }


        return `

            <div class="empty-card">

                <h3>
                    No users found.
                </h3>

                <p>
                    Create your first user to get started.
                </p>

                <div class="empty-actions">

                    <a
                        href="#/users/new"
                        class="btn btn-primary"
                    >
                        + Create User
                    </a>

                </div>

            </div>

        `;

    }


    /* =====================================================
       LOAD USERS
    ===================================================== */

    async function loadUsers() {

        state.usersLoading = true;

        state.usersError = null;

        renderUsers();


        try {

            state.users =
                await API.getUsers();

        } catch (error) {

            state.usersError =
                error;

        } finally {

            state.usersLoading =
                false;

            renderUsers();

        }

    }


    /* =====================================================
       FILTER USERS
    ===================================================== */

    function getFilteredUsers() {

        const query =
            state.search
                .trim()
                .toLowerCase();


        return state.users.filter(
            user => {

                const matchesSearch =

                    !query ||

                    user.name
                        .toLowerCase()
                        .includes(query) ||

                    user.email
                        .toLowerCase()
                        .includes(query);


                const matchesStatus =

                    state.statusFilter ===
                        "All Status" ||

                    user.status ===
                        state.statusFilter;


                const matchesMembership =

                    state.membershipFilter ===
                        "All Membership" ||

                    user.membership ===
                        state.membershipFilter;


                return (

                    matchesSearch &&

                    matchesStatus &&

                    matchesMembership

                );

            }
        );

    }


    /* =====================================================
       USER ROW
    ===================================================== */

    function renderUserRow(
        user
    ) {

        return `

            <tr>

                <td>

                    <div class="user-cell">

                        ${UI.avatar(user)}

                        <div>

                            <strong>
                                ${UI.escapeHtml(
                                    user.name
                                )}
                            </strong>

                            <small>
                                ${UI.escapeHtml(
                                    user.role
                                )}
                            </small>

                        </div>

                    </div>

                </td>


                <td>
                    ${UI.escapeHtml(
                        user.email
                    )}
                </td>


                <td>
                    ${UI.escapeHtml(
                        user.phone
                    )}
                </td>


                <td class="mono">
                    ${UI.escapeHtml(
                        user.id
                    )}
                </td>


                <td>
                    ${UI.statusBadge(
                        user.status
                    )}
                </td>


                <td>
                    ${UI.membershipBadge(
                        user.membership
                    )}
                </td>


                <td>

                    <a
                        class="action-link"
                        href="#/users/${encodeURIComponent(
                            user.id
                        )}"
                    >
                        View
                    </a>

                    <a
                        class="action-link"
                        href="#/users/${encodeURIComponent(
                            user.id
                        )}/edit"
                    >
                        Edit
                    </a>

                </td>

            </tr>

        `;

    }


    /* =====================================================
       USERS PAGE
    ===================================================== */

    function renderUsers() {

        setPageTitle("Users");


        navUserCount.textContent =
            state.users.length;


        if (state.usersLoading) {

            app.innerHTML =
                loadingState(
                    "Loading users..."
                );

            return;

        }


        if (state.usersError) {

            app.innerHTML =
                errorState(

                    UI.getErrorMessage(
                        state.usersError
                    ),

                    "/users"

                );

            return;

        }


        const users =
            getFilteredUsers();


        const filtered =
            state.search !== "" ||

            state.statusFilter !==
                "All Status" ||

            state.membershipFilter !==
                "All Membership";


        app.innerHTML = page(`

            <div class="page-header">

                <div>

                    <div class="eyebrow">
                        USER DIRECTORY
                    </div>

                    <h2>
                        Users
                    </h2>

                    <p>
                        Manage profiles, access status
                        and membership from one place.
                    </p>

                </div>


                <a
                    href="#/users/new"
                    class="btn btn-primary"
                >
                    + Create User
                </a>

            </div>


            <!-- FILTERS -->

            <div class="filters">

                <label
                    class="search-container"
                >

                    <span
                        class="search-icon"
                        aria-hidden="true"
                    >
                        ⌕
                    </span>

                    <input
                        id="userSearch"
                        type="search"
                        placeholder="Search users by name or email..."
                        value="${UI.escapeHtml(
                            state.search
                        )}"
                        aria-label="Search users by name or email"
                    >

                </label>


                <select
                    id="statusFilter"
                    aria-label="Filter by status"
                >

                    <option>
                        All Status
                    </option>

                    ${STATUSES.map(
                        status => `
                            <option
                                ${
                                    state.statusFilter ===
                                    status
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${status}
                            </option>
                        `
                    ).join("")}

                </select>


                <select
                    id="membershipFilter"
                    aria-label="Filter by membership"
                >

                    <option>
                        All Membership
                    </option>

                    ${MEMBERSHIPS.map(
                        membership => `
                            <option
                                ${
                                    state.membershipFilter ===
                                    membership
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${membership}
                            </option>
                        `
                    ).join("")}

                </select>


                <button
                    class="btn btn-ghost"
                    id="clearFilters"
                >
                    Clear Filters
                </button>

            </div>


            <!-- TABLE -->

            <div class="table-card">

                <div class="table-header">

                    <strong>
                        ${users.length}
                        ${
                            users.length === 1
                                ? "user"
                                : "users"
                        }
                    </strong>

                    <span>
                        Latest confirmed API state
                    </span>

                </div>


                ${
                    users.length

                        ? `

                            <div class="table-scroll">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                User
                                            </th>

                                            <th>
                                                Email
                                            </th>

                                            <th>
                                                Phone
                                            </th>

                                            <th>
                                                User ID
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Membership
                                            </th>

                                            <th>
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        ${users
                                            .map(
                                                renderUserRow
                                            )
                                            .join("")}

                                    </tbody>

                                </table>

                            </div>

                        `

                        : emptyState(
                            filtered
                        )

                }

            </div>

        `);


        bindUserListEvents();

    }


    /* =====================================================
       USER LIST EVENTS
    ===================================================== */

    function bindUserListEvents() {

        const search =
            document.getElementById(
                "userSearch"
            );


        const status =
            document.getElementById(
                "statusFilter"
            );


        const membership =
            document.getElementById(
                "membershipFilter"
            );


        const clear =
            document.getElementById(
                "clearFilters"
            );


        search?.addEventListener(
            "input",
            event => {

                state.search =
                    event.target.value;

                renderUsers();


                const input =
                    document.getElementById(
                        "userSearch"
                    );


                input?.focus();


                if (input) {

                    input.setSelectionRange(
                        input.value.length,
                        input.value.length
                    );

                }

            }
        );


        status?.addEventListener(
            "change",
            event => {

                state.statusFilter =
                    event.target.value;

                renderUsers();

            }
        );


        membership?.addEventListener(
            "change",
            event => {

                state.membershipFilter =
                    event.target.value;

                renderUsers();

            }
        );


        clear?.addEventListener(
            "click",
            clearFilters
        );

    }


    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    function clearFilters() {

        state.search = "";

        state.statusFilter =
            "All Status";

        state.membershipFilter =
            "All Membership";

        renderUsers();

    }


    /* =====================================================
       LOAD USER DETAILS
    ===================================================== */

    async function loadUser(
        id
    ) {

        state.userLoading =
            true;

        state.userError =
            null;

        renderUserDetails(id);


        try {

            state.selectedUser =
                await API.getUser(id);

        } catch (error) {

            state.userError =
                error;

        } finally {

            state.userLoading =
                false;

            renderUserDetails(id);

        }

    }


    /* =====================================================
       INFO ITEM
    ===================================================== */

    function infoItem(
        label,
        value,
        mono = false
    ) {

        return `

            <div class="info-item">

                <small>
                    ${UI.escapeHtml(label)}
                </small>

                <strong
                    class="${mono ? "mono" : ""}"
                >
                    ${value}
                </strong>

            </div>

        `;

    }


    /* =====================================================
       USER DETAILS PAGE
    ===================================================== */

    function renderUserDetails(
        id
    ) {

        setPageTitle(
            "User Details"
        );


        if (state.userLoading) {

            app.innerHTML =
                loadingState(
                    "Loading user..."
                );

            return;

        }


        if (state.userError) {

            app.innerHTML =
                errorState(

                    UI.getErrorMessage(
                        state.userError
                    ),

                    `/users/${encodeURIComponent(id)}`

                );

            return;

        }


        const user =
            state.selectedUser;


        if (!user) {

            return;

        }


        app.innerHTML = page(`

            <div class="breadcrumb">

                <a href="#/users">
                    Users
                </a>

                <span>/</span>

                <span>
                    ${UI.escapeHtml(
                        user.name
                    )}
                </span>

            </div>


            <!-- PROFILE HEADER -->

            <div class="profile-header">

                <div class="profile-main">

                    ${UI.avatar(
                        user,
                        true
                    )}

                    <div>

                        <div class="eyebrow">
                            USER PROFILE
                        </div>

                        <h2>
                            ${UI.escapeHtml(
                                user.name
                            )}
                        </h2>

                        <p>
                            ${UI.escapeHtml(
                                user.role
                            )}
                        </p>

                    </div>

                </div>


                <div class="profile-actions">

                    <a
                        class="btn btn-secondary"
                        href="#/users"
                    >
                        Back to Users
                    </a>

                    <a
                        class="btn btn-dark"
                        href="#/users/${encodeURIComponent(
                            user.id
                        )}/edit"
                    >
                        Edit User
                    </a>

                </div>

            </div>


            <!-- DETAIL PANELS -->

            <div class="detail-grid">

                <!-- PROFILE -->

                <article
                    class="panel profile-info-panel"
                >

                    <div class="panel-title">
                        Profile information
                    </div>


                    <div class="info-grid">

                        ${infoItem(
                            "Full name",
                            UI.escapeHtml(
                                user.name
                            )
                        )}


                        ${infoItem(
                            "Email",
                            UI.escapeHtml(
                                user.email
                            )
                        )}


                        ${infoItem(
                            "Phone",
                            UI.escapeHtml(
                                user.phone
                            )
                        )}


                        ${infoItem(
                            "Project role",
                            UI.escapeHtml(
                                user.role
                            )
                        )}


                        ${infoItem(
                            "User ID",
                            UI.escapeHtml(
                                user.id
                            ),
                            true
                        )}


                        ${infoItem(
                            "Status",
                            UI.statusBadge(
                                user.status
                            )
                        )}


                        ${infoItem(
                            "Membership",
                            UI.membershipBadge(
                                user.membership
                            )
                        )}

                    </div>

                </article>


                <!-- STATUS -->

                <article class="panel">

                    <div class="panel-title">
                        Status management
                    </div>


                    <div class="current-value">

                        <span>
                            Current status
                        </span>

                        ${UI.statusBadge(
                            user.status
                        )}

                    </div>


                    <select
                        id="detailStatus"
                        aria-label="Select user status"
                    >

                        ${STATUSES.map(
                            status => `

                                <option
                                    ${
                                        status ===
                                        user.status
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${status}
                                </option>

                            `
                        ).join("")}

                    </select>


                    <button
                        id="applyStatus"
                        class="btn btn-dark full-width"
                    >
                        Apply status
                    </button>

                </article>


                <!-- MEMBERSHIP -->

                <article class="panel">

                    <div class="panel-title">
                        Membership management
                    </div>


                    <div class="current-value">

                        <span>
                            Current membership
                        </span>

                        ${UI.membershipBadge(
                            user.membership
                        )}

                    </div>


                    <select
                        id="detailMembership"
                        aria-label="Select membership"
                    >

                        ${MEMBERSHIPS.map(
                            membership => `

                                <option
                                    ${
                                        membership ===
                                        user.membership
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${membership}
                                </option>

                            `
                        ).join("")}

                    </select>


                    <button
                        id="applyMembership"
                        class="btn btn-dark full-width"
                    >
                        Apply membership
                    </button>

                </article>

            </div>

        `);


        bindDetailEvents();

    }


    /* =====================================================
       DETAIL EVENTS
    ===================================================== */

    function bindDetailEvents() {

        document
            .getElementById(
                "applyStatus"
            )
            ?.addEventListener(
                "click",
                updateStatus
            );


        document
            .getElementById(
                "applyMembership"
            )
            ?.addEventListener(
                "click",
                updateMembership
            );

    }


    /* =====================================================
       UPDATE STATUS
    ===================================================== */

    async function updateStatus() {

        if (
            state.statusUpdating
        ) {

            return;

        }


        const user =
            state.selectedUser;


        const select =
            document.getElementById(
                "detailStatus"
            );


        const button =
            document.getElementById(
                "applyStatus"
            );


        const newStatus =
            select.value;


        if (
            newStatus ===
            user.status
        ) {

            UI.showToast(
                "Status is already set to this value.",
                "info"
            );

            return;

        }


        state.statusUpdating =
            true;


        select.disabled = true;

        button.disabled = true;


        button.innerHTML =
            UI.spinner(
                "Updating status..."
            );


        try {

            const updatedUser =
                await API.updateStatus(
                    user.id,
                    newStatus
                );


            state.selectedUser =
                updatedUser;


            updateUserInLocalState(
                updatedUser
            );


            UI.showToast(
                "User status updated successfully."
            );


            renderUserDetails(
                user.id
            );

        } catch (error) {

            UI.showToast(

                UI.getErrorMessage(
                    error,
                    "Could not update status. Please try again."
                ),

                "error"

            );


            select.disabled =
                false;

            button.disabled =
                false;

            button.textContent =
                "Apply status";

        } finally {

            state.statusUpdating =
                false;

        }

    }


    /* =====================================================
       UPDATE MEMBERSHIP
    ===================================================== */

    async function updateMembership() {

        if (
            state.membershipUpdating
        ) {

            return;

        }


        const user =
            state.selectedUser;


        const select =
            document.getElementById(
                "detailMembership"
            );


        const button =
            document.getElementById(
                "applyMembership"
            );


        const newMembership =
            select.value;


        if (
            newMembership ===
            user.membership
        ) {

            UI.showToast(
                "Membership is already set to this value.",
                "info"
            );

            return;

        }


        state.membershipUpdating =
            true;


        select.disabled = true;

        button.disabled = true;


        button.innerHTML =
            UI.spinner(
                "Updating membership..."
            );


        try {

            const updatedUser =
                await API.updateMembership(
                    user.id,
                    newMembership
                );


            state.selectedUser =
                updatedUser;


            updateUserInLocalState(
                updatedUser
            );


            UI.showToast(
                "User membership updated successfully."
            );


            renderUserDetails(
                user.id
            );

        } catch (error) {

            UI.showToast(

                UI.getErrorMessage(
                    error,
                    "Could not update membership. Please try again."
                ),

                "error"

            );


            select.disabled =
                false;

            button.disabled =
                false;

            button.textContent =
                "Apply membership";

        } finally {

            state.membershipUpdating =
                false;

        }

    }


    /* =====================================================
       LOCAL STATE UPDATE
    ===================================================== */

    function updateUserInLocalState(
        updatedUser
    ) {

        const index =
            state.users.findIndex(
                user =>
                    user.id ===
                    updatedUser.id
            );


        if (index !== -1) {

            state.users[index] =
                updatedUser;

        }

    }


    /* =====================================================
       FORM FIELD
    ===================================================== */

    function textField(
        name,
        label,
        value,
        required = false,
        placeholder = "",
        type = "text"
    ) {

        return `

            <label class="form-field">

                <span>

                    ${UI.escapeHtml(
                        label
                    )}

                    ${
                        required
                            ? `<span class="required">*</span>`
                            : ""
                    }

                </span>


                <input
                    id="${name}"
                    name="${name}"
                    type="${type}"
                    value="${UI.escapeHtml(
                        value
                    )}"
                    placeholder="${UI.escapeHtml(
                        placeholder
                    )}"
                    ${
                        required
                            ? "required"
                            : ""
                    }
                    aria-describedby="${name}Error"
                >


                <small
                    id="${name}Error"
                    class="field-error"
                ></small>

            </label>

        `;

    }


    /* =====================================================
       SELECT FIELD
    ===================================================== */

    function selectField(
        name,
        label,
        options,
        selected
    ) {

        return `

            <label class="form-field">

                <span>

                    ${UI.escapeHtml(
                        label
                    )}

                    <span class="required">
                        *
                    </span>

                </span>


                <select
                    id="${name}"
                    name="${name}"
                    aria-describedby="${name}Error"
                >

                    ${options.map(
                        option => `

                            <option
                                ${
                                    option ===
                                    selected
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${UI.escapeHtml(
                                    option
                                )}
                            </option>

                        `
                    ).join("")}

                </select>


                <small
                    id="${name}Error"
                    class="field-error"
                ></small>

            </label>

        `;

    }


    /* =====================================================
       CREATE / EDIT PAGE
    ===================================================== */

    function renderUserForm(
        user = null
    ) {

        const isEdit =
            Boolean(user);


        setPageTitle(
            isEdit
                ? "Edit User"
                : "Create User"
        );


        const data =
            user || {

                name: "",

                email: "",

                phone: "",

                role: "",

                status: "Active",

                membership: "Free"

            };


        app.innerHTML = page(`

            <div class="breadcrumb">

                <a href="#/users">
                    Users
                </a>

                <span>/</span>

                <span>
                    ${
                        isEdit
                            ? "Edit"
                            : "Create"
                    }
                </span>

            </div>


            <div class="page-header">

                <div>

                    <div class="eyebrow">
                        ${
                            isEdit
                                ? "USER EDIT"
                                : "NEW USER"
                        }
                    </div>

                    <h2>
                        ${
                            isEdit
                                ? "Edit user"
                                : "Create a user"
                        }
                    </h2>

                    <p>
                        ${
                            isEdit
                                ? "Update confirmed user information."
                                : "Add a new user to the AXIVON ONE directory."
                        }
                    </p>

                </div>

            </div>


            <form
                id="userForm"
                class="form-card"
                novalidate
                ${
                    isEdit
                        ? `data-user-id="${UI.escapeHtml(
                            user.id
                        )}"`
                        : ""
                }
            >

                <div class="form-grid">


                    ${textField(
                        "name",
                        "Full name",
                        data.name,
                        true,
                        "e.g. Aarav Mehta"
                    )}


                    ${textField(
                        "email",
                        "Email",
                        data.email,
                        true,
                        "name@company.com",
                        "email"
                    )}


                    ${textField(
                        "phone",
                        "Phone",
                        data.phone === "—"
                            ? ""
                            : data.phone,
                        false,
                        "+91 98765 43210",
                        "tel"
                    )}


                    ${textField(
                        "role",
                        "Project role",
                        data.role === "—"
                            ? ""
                            : data.role,
                        false,
                        "e.g. Frontend Developer"
                    )}


                    ${selectField(
                        "status",
                        "Status",
                        STATUSES,
                        data.status
                    )}


                    ${selectField(
                        "membership",
                        "Membership",
                        MEMBERSHIPS,
                        data.membership
                    )}

                </div>


                <div
                    id="formError"
                    class="form-error"
                    hidden
                ></div>


                <div class="form-actions">

                    <a
                        class="btn btn-secondary"
                        href="${
                            isEdit
                                ? `#/users/${encodeURIComponent(
                                    user.id
                                )}`
                                : "#/users"
                        }"
                    >
                        Cancel
                    </a>


                    <button
                        id="submitUser"
                        class="btn btn-dark"
                        type="submit"
                    >

                        ${
                            isEdit
                                ? "Save changes"
                                : "Create User"
                        }

                    </button>

                </div>

            </form>

        `);


        document
            .getElementById(
                "userForm"
            )
            .addEventListener(
                "submit",
                event =>
                    submitUserForm(
                        event,
                        isEdit
                    )
            );

    }


    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateUser(
        data
    ) {

        const errors = {};


        if (
            !data.name.trim()
        ) {

            errors.name =
                "Full name is required.";

        }


        if (
            !data.email.trim()
        ) {

            errors.email =
                "Email is required.";

        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(data.email)
        ) {

            errors.email =
                "Enter a valid email address.";

        }


        if (
            data.phone &&
            !/^[+0-9() .-]{7,20}$/
                .test(data.phone)
        ) {

            errors.phone =
                "Enter a valid phone number.";

        }


        if (
            !STATUSES.includes(
                data.status
            )
        ) {

            errors.status =
                "Select a valid status.";

        }


        if (
            !MEMBERSHIPS.includes(
                data.membership
            )
        ) {

            errors.membership =
                "Select a valid membership.";

        }


        return errors;

    }


    /* =====================================================
       DISPLAY FIELD ERRORS
    ===================================================== */

    function displayFieldErrors(
        errors
    ) {

        Object.entries(
            errors
        ).forEach(
            ([field, message]) => {

                const error =
                    document.getElementById(
                        `${field}Error`
                    );


                const input =
                    document.getElementById(
                        field
                    );


                if (error) {

                    error.textContent =
                        message;

                }


                if (input) {

                    input.classList.add(
                        "input-invalid"
                    );

                }

            }
        );

    }


    /* =====================================================
       CREATE / EDIT SUBMIT
    ===================================================== */

    async function submitUserForm(
        event,
        isEdit
    ) {

        event.preventDefault();


        if (
            state.formSubmitting
        ) {

            return;

        }


        const form =
            event.currentTarget;


        const data =
            Object.fromEntries(
                new FormData(form)
            );


        document
            .querySelectorAll(
                ".field-error"
            )
            .forEach(
                element =>
                    element.textContent = ""
            );


        document
            .querySelectorAll(
                ".input-invalid"
            )
            .forEach(
                element =>
                    element.classList.remove(
                        "input-invalid"
                    )
            );


        const errors =
            validateUser(
                data
            );


        if (
            Object.keys(errors)
                .length > 0
        ) {

            displayFieldErrors(
                errors
            );

            return;

        }


        state.formSubmitting =
            true;


        const submitButton =
            document.getElementById(
                "submitUser"
            );


        submitButton.disabled =
            true;


        submitButton.innerHTML =
            UI.spinner(
                isEdit
                    ? "Saving..."
                    : "Creating..."
            );


        try {

            let result;


            if (isEdit) {

                result =
                    await API.updateUser(

                        form.dataset.userId,

                        data

                    );

            } else {

                result =
                    await API.createUser(
                        data
                    );

            }


            updateUserInLocalState(
                result
            );


            if (!isEdit) {

                state.users.unshift(
                    result
                );

            }


            UI.showToast(

                isEdit
                    ? "User updated successfully."
                    : "User created successfully."

            );


            if (isEdit) {

                navigate(
                    `/users/${encodeURIComponent(
                        result.id
                    )}`
                );

            } else {

                navigate(
                    "/users"
                );

            }

        } catch (error) {

            const errorBox =
                document.getElementById(
                    "formError"
                );


            errorBox.hidden =
                false;


            errorBox.textContent =
                UI.getErrorMessage(

                    error,

                    isEdit
                        ? "Could not update user. Please try again."
                        : "Could not create user. Please try again."

                );


            submitButton.disabled =
                false;


            submitButton.textContent =
                isEdit
                    ? "Save changes"
                    : "Create User";

        } finally {

            state.formSubmitting =
                false;

        }

    }


    /* =====================================================
       ROUTER
    ===================================================== */

    async function router() {

        const currentRoute =
            route();


        /* USERS */

        if (
            currentRoute ===
            "/users" ||
            currentRoute ===
            "/users/"
        ) {

            if (
                !state.users.length &&
                !state.usersLoading
            ) {

                await loadUsers();

            } else {

                renderUsers();

            }

            return;

        }


        /* CREATE */

        if (
            currentRoute ===
            "/users/new"
        ) {

            renderUserForm();

            return;

        }


        /* USER ID */

        const match =
            currentRoute.match(
                /^\/users\/([^/]+)(?:\/(edit))?$/
            );


        if (!match) {

            navigate(
                "/users"
            );

            return;

        }


        const id =
            decodeURIComponent(
                match[1]
            );


        /* EDIT */

        if (
            match[2] === "edit"
        ) {

            setPageTitle(
                "Edit User"
            );


            app.innerHTML =
                loadingState(
                    "Loading user..."
                );


            try {

                const user =
                    await API.getUser(
                        id
                    );


                renderUserForm(
                    user
                );

            } catch (error) {

                app.innerHTML =
                    errorState(

                        UI.getErrorMessage(
                            error
                        ),

                        `/users/${encodeURIComponent(
                            id
                        )}`

                    );

            }


            return;

        }


        /* DETAILS */

        await loadUser(
            id
        );

    }


    /* =====================================================
       GLOBAL EVENTS
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const retryButton =
                event.target.closest(
                    "[data-retry]"
                );


            if (
                retryButton
            ) {

                navigate(
                    retryButton.dataset.retry
                );

            }


            const clearButton =
                event.target.closest(
                    "[data-clear-filters]"
                );


            if (
                clearButton
            ) {

                clearFilters();

            }

        }
    );


    window.addEventListener(
        "hashchange",
        router
    );


    window.addEventListener(
        "load",
        () => {

            document.getElementById(
                "apiMode"
            ).textContent =

                API.config.DEMO_MODE
                    ? "DEMO API"
                    : "LIVE API";


            router();

        }
    );


})();