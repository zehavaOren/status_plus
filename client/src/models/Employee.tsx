export interface Employee {
    identityNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    job: string;
    jobId?: number;
    grades: string[];
    permission: string;
    permissionId?: number;
}