import { BaseUser } from "../models/BaseUser";

export class MySingletonService {
    private static instance: MySingletonService;

    // identityNumber: string = ''
    // userName: string = '';
    // permission: number = 0;
    baseUser: BaseUser = { identityNumber: '', userName: '', permission: 0 };

    private constructor() {
        if (!MySingletonService.instance) {
            MySingletonService.instance = this;
        }
        return MySingletonService.instance;
    }

    public static getInstance(): MySingletonService {
        if (!MySingletonService.instance) {
            MySingletonService.instance = new MySingletonService();
        }
        return MySingletonService.instance;
    }

    public getBaseUser(): BaseUser {
        return this.baseUser;
    }

    public setBaseUser(baseUser: BaseUser) {
        this.baseUser = baseUser;
    }
}
