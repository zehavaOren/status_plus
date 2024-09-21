import { BaseUser } from "../models/BaseUser";
import loginService from "./loginService";

export class MySingletonService {

    private static instance: MySingletonService;
    baseUser: BaseUser = { identityNumber: '', userName: '', permission: 0 };

    // identityNumber: string = ''
    // userName: string = '';
    // permission: number = 0;

    private constructor() {
        if (!MySingletonService.instance) {
            MySingletonService.instance = this;
        }
        return MySingletonService.instance;
    }
    // public async initializeBaseUser(): Promise<BaseUser | null> {
    //     try {
    //         // Assuming you have a service to get the current logged-in user
    //         const user = await loginService.getCurrentUser();
    //         if (user) {
    //             this.baseUser = user;
    //             return user;
    //         } else {
    //             throw new Error('No user data found');
    //         }
    //     } catch (error) {
    //         console.error('Error initializing user:', error);
    //         return null;
    //     }
    // }
    public static getInstance(): MySingletonService {
        if (!MySingletonService.instance) {
            MySingletonService.instance = new MySingletonService();
        }
        return MySingletonService.instance;
    }
    public async initializeBaseUser() {
        try {
            // Extracting user ID from the URL
            const userId = await this.extractUserIdFromUrl();
            if (!userId) {
                throw new Error('No user ID found in the URL');
            }
            let numericUserId = {
                identityNumber: Number(userId)
            }
            // Use the extracted user ID to fetch user details
            const user = await loginService.login(numericUserId);
            if (user) {
                // this.identityNumber = data.employeeData[1][0].identityNumber;
                // this.userName = data.employeeData[1][0].name;
                // this.permission = data.employeeData[0][0].permission_id;
                const userToSave = {
                    identityNumber: user.employeeData[1][0].identityNumber,
                    userName: user.employeeData[1][0].name,
                    permission:  user.employeeData[0][0].permission_id
                }
                this.baseUser = userToSave;
                return userToSave;
            } else {
                throw new Error('No user data found');
            }
        } catch (error) {
            console.error('Error initializing user:', error);
            return null;
        }
    }
    public getBaseUser(): BaseUser {
        return this.baseUser;
    }

    public setBaseUser(baseUser: BaseUser) {
        this.baseUser = baseUser;
    }
    private extractUserIdFromUrl(): string | null {
        const url = window.location.pathname; // get the current path
        const parts = url.split('/');
        const userId = parts.find(part => part.match(/^\d+$/)); // find a numeric part of the URL
        return userId || null;
    }
}
