const BASE_URL = 'http://localhost:4000/employee';

export const employeeService = {

    getEmployeesByGrade: async (data: any) => {
        const gradeId = data.gradeId;
        const classId=data.classId;

        try {
            const response = await fetch(`${BASE_URL}/getEmployeesByGrade/${gradeId}/${classId}/`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    }
    
}

