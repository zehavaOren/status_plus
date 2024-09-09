import { ConflictChoice } from "../models/ConflictChoice";
import { ValueSelected } from "../models/ValueSelected";

const BASE_URL = 'http://localhost:4000/studentStatus';

export const studentStatusService = {

    getStudentsStatuses: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getStudentsStatuses/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getStatusesListById: async (studentId: string) => {
        try {
            const response = await fetch(`${BASE_URL}/getStatusesList/${studentId}`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getCategoriesByEmployee: async (employeeId: string) => {
        try {
            const response = await fetch(`${BASE_URL}/getCategories/${employeeId}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getValues: async (employeeId: string) => {
        try {
            const response = await fetch(`${BASE_URL}/getValues/${employeeId}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getValuesByStudentId: async (data: any) => {
        const studentId = data.studentId;
        const employeeId = data.employeeId;
        const year = data.year;
        try {
            const response = await fetch(`${BASE_URL}/getStatusValuesByEmployeeAndStudent/${studentId}/${employeeId}/${year}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    upsertStudentStatus: async (statusValues: ValueSelected[]) => {
        const results = [];

        for (const value of statusValues) {
            try {
                const response = await fetch(`${BASE_URL}/upsertStudentStatus/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(value)
                });
                if (!response.ok) {
                    throw new Error(`Error fetching value ${value.valueId}`);
                }
                const result = await response.json();
                results.push({ value, status: 'success', result });
            } catch (error: any) {
                results.push({ value, status: 'error', error: error.message });
            }
        }

        return results;
    },

    getStudentStatus: async (studentId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/getStudentStatus/${studentId}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getStdentsConflicts: async (employeeId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/getStudetsConflicts/${employeeId}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getConflictsList: async (studentId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/getConflictList/${studentId}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    upsertConflictResolution: async (choices: ConflictChoice[]) => {
        const results = [];
        for (const value of choices) {
            try {
                const response = await fetch(`${BASE_URL}/upsertConflictResolution/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(value)
                });
                if (!response.ok) {
                    throw new Error(`Error fetching value ${value.valueId}`);
                }
                const result = await response.json();
                results.push({ value, status: 'success', result });
            } catch (error: any) {
                results.push({ value, status: 'error', error: error.message });
            }
        }

        return results;
    },
}