const BASE_URL = 'http://localhost:4000/auth';


export const loginService = {

    login: async (userId: any) => {
        const identityNumber=userId.identityNumber;
        try {
            const response = await fetch(`${BASE_URL}/${identityNumber}`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            return await response.json();
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    }
}
