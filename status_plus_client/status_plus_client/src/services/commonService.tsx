const BASE_URL = 'http://localhost:4000/common';
// const BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/common`;

export const commonService = {

    getCities: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getCities`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getJobForEmployee: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getJobForEmployee`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getGrades: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getGrades`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getJobs: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getJobs`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getPermission: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getPermission`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    }
}