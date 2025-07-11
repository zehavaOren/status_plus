const BASE_URL = 'http://localhost:4000/common';
// const BASE_URL = `${process.env.REACT_APP_BASE_URL}/common`;

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

    getGradesAndClasses: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getGradesAndClasses`);
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
    },

    getGrade: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getGrade`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getCodeTableDetails: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getCodeTableDetails`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    addDataCodeTable: async (selectedList: string, additionalValue: string) => {
        try {
            const response = await fetch(`${BASE_URL}/addDataCodeTable/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ selectedList, additionalValue })
            });
            if (!response.ok) {
                throw new Error(`Error fetching value`);
            }
            return await response.json();

        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    addCategoryValueConnection: async (valueId: string, categoryId: string) => {
        try {
            const response = await fetch(`${BASE_URL}/addCategoryValueConnection/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ valueId, categoryId })
            });
            if (!response.ok) {
                throw new Error(`Error fetching value`);
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    updateStudents: async (currentYear: string, numberOfAClasses: number) => {
        try {
            const response = await fetch(`${BASE_URL}/updateStudents/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentYear, numberOfAClasses })
            });
            if (!response.ok) {
                throw new Error(`Error fetching value`);
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    updateClasses: async (numClasses: number) => {
        try {
            const response = await fetch(`${BASE_URL}/updateClasses/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ numClasses })
            });
            if (!response.ok) {
                throw new Error(`Error fetching value`);
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getTeachers: async () => {
        try {
            const response = await fetch(`${BASE_URL}/getTeachers`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },

    getStudentsByGrade: async (data: any) => {
        const gradeId = data.gradeId;
        const classId = data.classId;
        try {
            const response = await fetch(`${BASE_URL}/getStudentsByGrade/${gradeId}/${classId}/`);
            if (!response.ok) {
                throw new Error('Error fetching students');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching students: ${error.message}`);
        }
    },

    addEmployeesForStudents: async (teacherId: string | null, studentsIds: string, currrentYear: string) => {
        try {
            const response = await fetch(`${BASE_URL}/addEmployeesForStudents/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ teacherId, studentsIds, currrentYear })
            });
            if (!response.ok) {
                throw new Error(`Error fetching value`);
            }
            return await response.json();

        }
        catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    },
}