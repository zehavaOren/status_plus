import { Employee } from "../models/Employee";

const BASE_URL = 'http://localhost:4000/employee';
// const BASE_URL = `${process.env.REACT_APP_BASE_URL}/employee`;

export const employeeService = {

    getEmployeesByGrade: async (data: any) => {
        const gradeId = data.gradeId;
        const classId = data.classId;

        try {
            const response = await fetch(`${BASE_URL}/getEmployeesByGrade/${gradeId}/${classId}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getAllEmployees: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getAllEmployees/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getEmployeeById: async (employeeId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/getEmployeeById/${employeeId}/`);
            if (!response.ok) {
                throw new Error('Error getting data');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    deleteEmployee: async (employeeId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/deleteEmployee/${employeeId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Error deleting employee');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error deleting employee: ${error.message}`);
        }
    },

    upsertEmployee: async (employee: Employee) => {
        const employeeForSave = {
            employeeId: employee.identityNumber,
            lastName: employee.lastName,
            firstName: employee.firstName,
            phone: employee.phone,
            email: employee.email,
            jobId: employee.jobId,
            permissionId: employee.permissionId
        }
        try {
            const response = await fetch(`${BASE_URL}/upsertEmployee/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeForSave)
            });
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

}

