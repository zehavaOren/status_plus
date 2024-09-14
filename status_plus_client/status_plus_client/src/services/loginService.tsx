import { MySingletonService } from "./MySingletonService";

const BASE_URL = 'http://localhost:4000/auth';

class loginService {
    identityNumber: string = '';
    userName: string = '';
    permission: number = 0;

    async login(userId: any): Promise<any> {
        try {
            const identityNumber = userId.identityNumber;
            const response = await fetch(`${BASE_URL}/${identityNumber}`);
            if (!response.ok) {
                throw new Error('Error fetching employees');
            }
            const data = await response.json();
            if (data) {
                this.identityNumber = data.employeeData[1][0].identityNumber;
                this.userName = data.employeeData[1][0].name;
                this.permission = data.employeeData[0][0].permission_id;
                const user = {
                    identityNumber: this.identityNumber,
                    userName: this.userName,
                    permission: this.permission
                }
                MySingletonService.getInstance().setBaseUser(user);
            }
            return data;
        } catch (error: any) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    }
}
export default new loginService();
