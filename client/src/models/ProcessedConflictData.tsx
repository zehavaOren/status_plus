import { EmployeeChoice } from "./EmployeeChoice";

export interface ProcessedConflictData {
    key: number;
    value: string;
    [employeeName: string]: EmployeeChoice | string | number;
    choice: string; // Add choice field for user's selection (strength or weakness)
    comment: string; // Add comment field for user's comment
}