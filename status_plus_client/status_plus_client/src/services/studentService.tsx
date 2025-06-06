import { JobForEmployee } from "../models/JobForEmployee";
import { StudentForm } from "../models/StudentForm";

const BASE_URL = 'http://localhost:4000/student';
// const BASE_URL = `${process.env.REACT_APP_BASE_URL}/student`;

export const studentService = {

    getAllStudents: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getAllStudents/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getStudentsForUpdate: async (userId: any, year: string) => {
        const employeeId = userId;
        try {
            const response = await fetch(`${BASE_URL}/getStudentsForUpdate/${employeeId}/${year}`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getStudentDeatils: async (studentId: string, year: string) => {
        const student_id = studentId;
        try {
            const response = await fetch(`${BASE_URL}/getStudentDetails/${student_id}/${year}`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    upsertStudentDetails: async (studentDeail: StudentForm) => {
        try {
            const response = await fetch(`${BASE_URL}/upsertStudentDetails/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentDeail)
            });
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    upsertEmployeesForStudent: async (employeesForSudent: JobForEmployee[]) => {
        const results = [];

        for (const employee of employeesForSudent) {
            try {
                const response = await fetch(`${BASE_URL}/upsertEmployeesForStudent/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(employee)
                });
                if (!response.ok) {
                    throw new Error(`Error fetching employee ${employee.employee_id}`);
                }
                const result = await response.json();
                results.push({ employee, status: 'success', result });
            } catch (error: any) {
                results.push({ employee, status: 'error', error: error.message });
            }
        }

        return results;
    },

    deleteStudent: async (studentId: string, year: string) => {
        const dataToServer = { studentId, year };
        try {
            const response = await fetch(`${BASE_URL}/deleteStudent/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToServer)
            });
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    importStudents: async (studentsFile: any[]) => {
        const results = [];
        for (const student of studentsFile) {
            try {
                const response = await fetch(`${BASE_URL}/importStudents/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(student)
                });
                if (!response.ok) {
                    throw new Error(`שגיאה בהכנסת תעודת זהות ${student.employee_id}`);
                }
                const result = await response.json();
                results.push({ student, status: 'success', result });
            } catch (error: any) {
                results.push({ student, status: 'error', error: error.message });
            }
        }
        return results;
    },

    uploadStudentPDF: async (studentId: string, base64PDF: any, year: string) => {
        try {
            const response = await fetch(`${BASE_URL}/uploadStudentPDF`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ studentId, base64PDF, year }),
            });

            if (!response.ok) {
                throw new Error('Failed to upload PDF');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading PDF:', error);
            throw new Error(`Error uploading PDF: ${error}`);
        }
    },

    checkExistingJob: async (studentId: number, year: string, jobId: number) => {
        try {
            const response = await fetch(`${BASE_URL}/checkExistingJob/${studentId}/${year}/${jobId}`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },
}