export interface StudentForm {
    studentId: string | '' | undefined;
    lastName: string |undefined;
    firstName: string |undefined;
    phone1: string |undefined;
    phone2: string |undefined;
    birthDate: string ;
    address?: string;
    cityId?: number;
    gradeId?: number;
    classId?: number | undefined;
    morningTeacher: number;
    communicationTherapist: number;
    afternoonTeacher: number;
    occupationalTherapist: number;
    employeeId: string;
    employeeName: string;
    jobId: number;
    jobDescription: string;
}