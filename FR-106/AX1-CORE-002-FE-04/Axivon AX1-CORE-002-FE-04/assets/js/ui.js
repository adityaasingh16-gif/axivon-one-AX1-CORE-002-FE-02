/* =========================================================
   AXIVON ONE
   REUSABLE UI HELPERS
========================================================= */

window.AxivonUI = (() => {


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHtml(value) {

        return String(
            value ?? "—"
        ).replace(
            /[&<>"']/g,
            character => {

                const entities = {

                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"

                };

                return entities[character];

            }
        );

    }


    /* =====================================================
       INITIALS
    ===================================================== */

    function getInitials(name) {

        return String(
            name || "User"
        )
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();

    }


    /* =====================================================
       AVATAR
    ===================================================== */

    function avatar(
        user,
        large = false
    ) {

        const className =
            large
                ? "avatar avatar-large"
                : "avatar";


        if (user.avatar) {

            return `
                <img
                    class="${className}"
                    src="${escapeHtml(user.avatar)}"
                    alt="${escapeHtml(user.name)}"
                >
            `;

        }


        return `
            <div
                class="${className}"
                aria-label="${escapeHtml(user.name)}"
            >
                ${escapeHtml(
                    getInitials(user.name)
                )}
            </div>
        `;

    }


    /* =====================================================
       STATUS BADGE
    ===================================================== */

    function statusBadge(status) {

        return `
            <span
                class="badge status-${String(
                    status
                ).toLowerCase()}"
            >
                ${escapeHtml(status)}
            </span>
        `;

    }


    /* =====================================================
       MEMBERSHIP BADGE
    ===================================================== */

    function membershipBadge(
        membership
    ) {

        return `
            <span
                class="badge membership-${String(
                    membership
                ).toLowerCase()}"
            >
                ${escapeHtml(membership)}
            </span>
        `;

    }


    /* =====================================================
       BUTTON SPINNER
    ===================================================== */

    function spinner(text) {

        return `
            <span
                class="spinner"
                aria-hidden="true"
            ></span>

            <span>
                ${escapeHtml(text)}
            </span>
        `;

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message,
        type = "success"
    ) {

        const container =
            document.getElementById(
                "toastContainer"
            );


        const toast =
            document.createElement("div");


        toast.className =
            `toast toast-${type}`;


        toast.textContent = message;


        container.appendChild(toast);


        requestAnimationFrame(() => {

            toast.classList.add("show");

        });


        setTimeout(() => {

            toast.classList.remove("show");


            setTimeout(() => {

                toast.remove();

            }, 250);

        }, 3500);

    }


    /* =====================================================
       HTTP ERROR MESSAGES
    ===================================================== */

    function getErrorMessage(
        error,
        fallback = "Something went wrong. Please try again."
    ) {

        const messages = {

            400:
                "Invalid request. Please check your input.",

            401:
                "Your session is invalid. Please sign in again.",

            403:
                "You do not have permission to perform this action.",

            404:
                "The requested user was not found.",

            409:
                "This action conflicts with existing user data.",

            422:
                "Some fields need correction.",

            500:
                "The server encountered an error. Please try again."

        };


        return (

            messages[error?.status] ||

            error?.message ||

            fallback

        );

    }


    return {

        escapeHtml,

        getInitials,

        avatar,

        statusBadge,

        membershipBadge,

        spinner,

        showToast,

        getErrorMessage

    };

})();