/* =========================================================
   AXIVON ONE
   API SERVICE / ADAPTER

   IMPORTANT:
   DEMO_MODE = true means frontend works without backend.

   When backend APIs are available:
   1. Change DEMO_MODE to false.
   2. Set BASE_URL.
   3. Change only the real API methods below according
      to the actual backend contract.
========================================================= */

window.AxivonAPI = (() => {

    const CONFIG = {

        DEMO_MODE: true,

        BASE_URL: "/api"

    };


    /* =====================================================
       DEMO DATABASE
    ===================================================== */

    let demoUsers = [

        {
            id: "USR-1001",
            name: "Aarav Mehta",
            email: "aarav.mehta@axivon.com",
            phone: "+91 98765 12001",
            role: "Project Manager",
            status: "Active",
            membership: "Pro",
            avatar: ""
        },

        {
            id: "USR-1002",
            name: "Priya Shah",
            email: "priya.shah@axivon.com",
            phone: "+91 98765 12002",
            role: "Frontend Developer",
            status: "Active",
            membership: "Enterprise",
            avatar: ""
        },

        {
            id: "USR-1003",
            name: "Rohan Patel",
            email: "rohan.patel@axivon.com",
            phone: "+91 98765 12003",
            role: "Backend Developer",
            status: "Pending",
            membership: "Basic",
            avatar: ""
        },

        {
            id: "USR-1004",
            name: "Ananya Desai",
            email: "ananya.desai@axivon.com",
            phone: "+91 98765 12004",
            role: "UI/UX Designer",
            status: "Inactive",
            membership: "Free",
            avatar: ""
        },

        {
            id: "USR-1005",
            name: "Kabir Joshi",
            email: "kabir.joshi@axivon.com",
            phone: "+91 98765 12005",
            role: "ML Engineer",
            status: "Suspended",
            membership: "Pro",
            avatar: ""
        }

    ];


    /* =====================================================
       HELPERS
    ===================================================== */

    function delay(milliseconds) {

        return new Promise(resolve => {

            setTimeout(resolve, milliseconds);

        });

    }


    function clone(data) {

        return JSON.parse(
            JSON.stringify(data)
        );

    }


    function createApiError(status, message) {

        const error = new Error(message);

        error.status = status;

        return error;

    }


    /* =====================================================
       REAL API REQUEST
    ===================================================== */

    async function request(
        endpoint,
        options = {}
    ) {

        const response = await fetch(
            CONFIG.BASE_URL + endpoint,
            {
                headers: {
                    "Content-Type": "application/json",

                    ...(options.headers || {})
                },

                ...options
            }
        );


        if (!response.ok) {

            let body = {};

            try {

                body = await response.json();

            } catch {

                // Response was not JSON.
            }


            throw createApiError(

                response.status,

                body.message ||
                "Unexpected server response."

            );

        }


        if (response.status === 204) {

            return null;

        }


        return response.json();

    }


    /* =====================================================
       DEMO API
    ===================================================== */

    const demoApi = {


        async getUsers() {

            await delay(450);

            return clone(demoUsers);

        },


        async getUser(id) {

            await delay(400);

            const user = demoUsers.find(
                item => item.id === id
            );


            if (!user) {

                throw createApiError(
                    404,
                    "User not found."
                );

            }


            return clone(user);

        },


        async createUser(data) {

            await delay(600);


            const duplicate = demoUsers.some(
                user =>
                    user.email.toLowerCase() ===
                    data.email.toLowerCase()
            );


            if (duplicate) {

                throw createApiError(
                    409,
                    "A user with this email already exists."
                );

            }


            const newUser = {

                id:
                    "USR-" +
                    (
                        1001 +
                        demoUsers.length
                    ),

                name: data.name,

                email: data.email,

                phone:
                    data.phone ||
                    "—",

                role:
                    data.role ||
                    "—",

                status: data.status,

                membership: data.membership,

                avatar: ""

            };


            demoUsers = [
                newUser,
                ...demoUsers
            ];


            return clone(newUser);

        },


        async updateUser(
            id,
            data
        ) {

            await delay(600);


            const index =
                demoUsers.findIndex(
                    user => user.id === id
                );


            if (index === -1) {

                throw createApiError(
                    404,
                    "User not found."
                );

            }


            const duplicate =
                demoUsers.some(
                    user =>
                        user.id !== id &&
                        user.email.toLowerCase() ===
                        data.email.toLowerCase()
                );


            if (duplicate) {

                throw createApiError(
                    409,
                    "A user with this email already exists."
                );

            }


            demoUsers[index] = {

                ...demoUsers[index],

                ...data

            };


            return clone(
                demoUsers[index]
            );

        },


        async updateStatus(
            id,
            status
        ) {

            await delay(500);


            const index =
                demoUsers.findIndex(
                    user => user.id === id
                );


            if (index === -1) {

                throw createApiError(
                    404,
                    "User not found."
                );

            }


            demoUsers[index] = {

                ...demoUsers[index],

                status

            };


            return clone(
                demoUsers[index]
            );

        },


        async updateMembership(
            id,
            membership
        ) {

            await delay(500);


            const index =
                demoUsers.findIndex(
                    user => user.id === id
                );


            if (index === -1) {

                throw createApiError(
                    404,
                    "User not found."
                );

            }


            demoUsers[index] = {

                ...demoUsers[index],

                membership

            };


            return clone(
                demoUsers[index]
            );

        }

    };


    /* =====================================================
       REAL BACKEND API
    ===================================================== */

    const realApi = {


        /* GET USERS */

        getUsers() {

            return request(
                "/users"
            );

        },


        /* GET USER DETAILS */

        getUser(id) {

            return request(
                `/users/${encodeURIComponent(id)}`
            );

        },


        /* CREATE USER */

        createUser(data) {

            return request(
                "/users",
                {
                    method: "POST",

                    body: JSON.stringify(data)
                }
            );

        },


        /* UPDATE USER */

        updateUser(
            id,
            data
        ) {

            return request(
                `/users/${encodeURIComponent(id)}`,
                {
                    method: "PUT",

                    body: JSON.stringify(data)
                }
            );

        },


        /* UPDATE STATUS */

        updateStatus(
            id,
            status
        ) {

            return request(
                `/users/${encodeURIComponent(id)}/status`,
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        status
                    })
                }
            );

        },


        /* UPDATE MEMBERSHIP */

        updateMembership(
            id,
            membership
        ) {

            return request(
                `/users/${encodeURIComponent(id)}/membership`,
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        membership
                    })
                }
            );

        }

    };


    /* =====================================================
       PUBLIC API
    ===================================================== */

    return {

        config: CONFIG,


        getUsers(...args) {

            return CONFIG.DEMO_MODE

                ? demoApi.getUsers(...args)

                : realApi.getUsers(...args);

        },


        getUser(...args) {

            return CONFIG.DEMO_MODE

                ? demoApi.getUser(...args)

                : realApi.getUser(...args);

        },


        createUser(...args) {

            return CONFIG.DEMO_MODE

                ? demoApi.createUser(...args)

                : realApi.createUser(...args);

        },


        updateUser(...args) {

            return CONFIG.DEMO_MODE

                ? demoApi.updateUser(...args)

                : realApi.updateUser(...args);

        },


        updateStatus(...args) {

            return CONFIG.DEMO_MODE

                ? demoApi.updateStatus(...args)

                : realApi.updateStatus(...args);

        },


        updateMembership(...args) {

            return CONFIG.DEMO_MODE

                ? demoApi.updateMembership(...args)

                : realApi.updateMembership(...args);

        }

    };

})();