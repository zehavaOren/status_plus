import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Button, Input, Modal, Progress } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ColumnType } from 'antd/es/table';

import { Student } from '../../models/Student';
import { studentService } from '../../services/studentService';
import './studentsForUpdate.css'
import Message from '../Message';
import { MySingletonService } from '../../services/MySingletonService';
import { studentStatusService } from '../../services/studentStatusService';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';

const StudentsForUpdate = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { identityNumber } = useParams<{ identityNumber: string }>();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [searchText, setSearchText] = useState('');
    const [hasCheckedConflicts, setHasCheckedConflicts] = useState(false);
    const hasInitialized = useRef(false);
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);

    useEffect(() => {
        if (hasInitialized.current) return;
        getStudentsForUpdate(identityNumber || '',);
        const conflictCheckDone = sessionStorage.getItem('hasCheckedConflicts');
        if (!conflictCheckDone && !hasCheckedConflicts) {
            getIsStudentsWithConflicts();
        }
        hasInitialized.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identityNumber]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get correct year
    const getYearForSystem = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const year = currentMonth >= 12 ? currentYear + 1 : currentYear;
        return year.toString();
    };
    // get the students of the employee how enter
    const getStudentsForUpdate = async (identityNumber: string) => {
        setLoading(true);
        try {
            const year = getYearForSystem();
            const responseFromDB = await studentService.getStudentsForUpdate(identityNumber, year);
            const studentsForUpdate = responseFromDB.studentsForUpdate[0];

            const updatedStudents = await Promise.all(
                studentsForUpdate.map(async (student: Student) => {
                    const status = await getAmountValues(Number(student.studentId));
                    if (status) {
                        const {
                            totalExpectedValues,
                            totalFilledValues,
                            totalDistinctExpectedValues,
                            totalFinalChoiceValues,
                        } = status;

                        const statusPercentage1 = totalExpectedValues
                            ? Math.round((totalFilledValues / totalExpectedValues) * 100)
                            : 0;

                        const statusPercentage2 = totalDistinctExpectedValues
                            ? Math.round((totalFinalChoiceValues / totalDistinctExpectedValues) * 100)
                            : 0;
                        const isComplete =
                            totalExpectedValues === totalFilledValues ||
                            totalExpectedValues === totalFilledValues + totalFinalChoiceValues ||
                            totalDistinctExpectedValues === totalFinalChoiceValues;

                        return {
                            ...student,
                            statusPercentage: Math.max(statusPercentage1, statusPercentage2),
                            isComplete,
                        };
                    }
                    return student;
                })
            );

            setStudents(updatedStudents);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };
    // clac the status progress
    const getAmountValues = async (studentId: number) => {
        try {
            const year = getYearForSystem();
            const responseFromDB = await studentStatusService.checkStudentStatusForEmployee(studentId, year, Number(employeeDet.identityNumber));
            return responseFromDB.numbersOfValues[0][0];
        } catch (error) {
            addMessage('שגיאה בשליפת נתוני סטטוס התלמיד', 'error');
        }
    };
    // update student details clicked
    const onUpdateStudentClick = (student: Student) => {
        if (employeeDet.permission === 2) {
            navigate(`/menu/student-details/${student.studentId}`, { state: { from: location.pathname } });
        } else {
            addMessage('אין לך הרשאה לעדכן פרטי תלמיד', 'error');
        }
    };
    // update student status clicked
    const onUpdateStatusClick = (student_id: string) => {
        navigate(`/menu/status-form/${student_id}`, { state: { from: location.pathname } });
    };
    // open the status of the student
    const onViewStatusClick = async (student_id: string) => {
        const isStatusFinish = await checkStudentStatus(Number(student_id));
        const numbersOfValues = isStatusFinish.numbersOfValues[0][0];
        if ((numbersOfValues.totalExpectedValues === (numbersOfValues.totalFilledValues) || (numbersOfValues.totalExpectedValues === numbersOfValues.totalFilledValues + numbersOfValues.totalFinalChoiceValues)) || numbersOfValues.totalDistinctExpectedValues === numbersOfValues.totalFinalChoiceValues) {
            const conflictsList = await getConflictsList(student_id);
            if (conflictsList.length === 0) {
                navigate(`/menu/status-options/${student_id}`, { state: { from: location.pathname } });
            }
            else {
                addMessage("סטטוס התלמיד עדיין לא מוכן, אין אפשרות להציג", "error");
            }
        }

        else {
            if (employeeDet.permission === 1) {
                addMessage("סטטוס התלמיד עדיין לא מוכן, אין אפשרות להציג", "error");
            }
            else {
                const employees = isStatusFinish.numbersOfValues[1];
                printError(employees);
            }
        }
    }
    // print the list of employees who not fill thw status
    const printError = (employees: any[]) => {
        const incompleteEmployees = employees
            .filter(employee => employee.totalValuesFilled !== employee.totalValuesToFill)
            .map(employee => employee.employeeName);  // Extract employee names

        if (incompleteEmployees.length > 0) {
            const employeeNamesList = incompleteEmployees.join(', ');
            addMessage(`סטטוס התלמיד עדיין לא מוכן, ישנם אנשי צוות שעדיין לא מילאו: ${employeeNamesList}`, "error");
        } else {
            addMessage("סטטוס התלמיד עדיין לא מוכן", "error");
        }

    }
    // get the conflicts list
    const getConflictsList = async (studentId: string) => {
        const student_id = Number(studentId);
        try {
            const studentConflictsResponse = await studentStatusService.getConflictsList(student_id);
            const conflictsList = studentConflictsResponse.conflictsList[0];
            return conflictsList;
        } catch (error) {
            console.error('Error fetching student status:', error);
        }
    }
    // if there is stidets with conflicts
    const showConflictModal = () => {
        Modal.confirm({
            title: 'יש לך תלמידים עם קונפליקטים',
            content: 'האם ברצונך לנסות לפתור אותם?',
            okText: 'כן',
            cancelText: 'לא',
            onOk() {
                navigate(`/menu/student-conflicts-list/${identityNumber}`, { state: { from: location.pathname } });
            },
            onCancel() {
                // Do nothing, just close the modal
            },
        });
    };
    // check if there is a students with conflicts
    const getIsStudentsWithConflicts = async () => {
        try {
            const responseFromDB = await studentStatusService.getStdentsConflicts(Number(identityNumber));
            if (responseFromDB.studentConflicts[0].length > 0) {
                if (employeeDet.permission === 2) {
                    showConflictModal();
                }
            }
            setHasCheckedConflicts(true);
            sessionStorage.setItem('hasCheckedConflicts', 'true');
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        }
    }
    // check if all employees fill the status
    const checkStudentStatus = async (studentId: number) => {
        try {
            const year = await getYearForSystem();
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId, year);
            return responseFromDB;
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        }
    }
    //search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };
    //filter
    const filteredStudents = students.filter(student =>
        Object.keys(student).some(key =>
            student[key as keyof Student]?.toString().toLowerCase().includes(searchText.toLowerCase())
        )
    );
    //filter
    const gradeFilterOptions = useMemo(() => {
        return Array.from(new Set(students.map(student => student.grade?.trim()))).map(grade => ({
            text: grade,
            value: grade,
        }));
    }, [students]);
    // add new student
    const addNewStudent = () => {
        navigate(`/menu/student-details/`, { state: { from: location.pathname } });
    }
    const columns: ColumnType<Student>[] = useMemo(() => {
        const baseColumns = [
            {
                title: 'תעודת זהות',
                dataIndex: 'studentId',
                key: 'studentId',
                sorter: (a: Student, b: Student) => a.studentId.localeCompare(b.studentId),
                width: 150,
            },
            {
                title: 'שם פרטי',
                dataIndex: 'firstName',
                key: 'firstName',
                sorter: (a: Student, b: Student) => a.firstName.localeCompare(b.firstName),

            },
            {
                title: 'שם משפחה',
                dataIndex: 'lastName',
                key: 'lastName',
                sorter: (a: Student, b: Student) => a.lastName.localeCompare(b.lastName),

            },
            {
                title: 'טלפון',
                dataIndex: 'phone',
                key: 'phone',
            },
            {
                title: 'כתובת',
                dataIndex: 'address',
                key: 'address',
                sorter: (a: Student, b: Student) => a.address.localeCompare(b.address),

            },
            {
                title: 'עיר',
                dataIndex: 'city',
                key: 'city',
                sorter: (a: Student, b: Student) => a.city.localeCompare(b.city),

            },
            {
                title: 'כיתה',
                dataIndex: 'grade',
                key: 'grade',
                filters: gradeFilterOptions,
                onFilter: (value: any, record: any) => {
                    const grade = record.grade ? record.grade.trim().toLowerCase() : '';
                    const filterValue = (value as string).trim().toLowerCase();
                    return grade === filterValue;
                },
            },
            {
                title: 'סטטוס מילוי נתונים',
                key: 'statusPercentage',
                render: (text: string, record: any) => (
                    <Progress
                        type="circle"
                        percent={record.statusPercentage || 0}
                        width={40}
                        status={record.isComplete === 100 ? 'success' : 'active'}
                    />
                ),
                width: 100,
            },
            {
                title: 'עדכון סטטוס תלמיד',
                key: 'updateStatus',
                render: (text: any, record: any) => (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => onUpdateStatusClick(record.studentId)}
                        />
                    </div>
                ),
                width: 100,
            },
            {
                title: 'צפיה בסטטוס התלמיד',
                key: 'see',
                render: (text: any, record: any) => (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => onViewStatusClick(record.studentId)}
                        />
                    </div>
                ),
                width: 100,
            },
        ];
        if (employeeDet.permission !== 1) {
            baseColumns.push({

                title: 'עדכון פרטי תלמיד',
                key: 'updateStudent',
                render: (text: any, record: any) => (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => onUpdateStudentClick(record)}
                        />
                    </div>
                ),
                width: 100,
            });
        }

        return baseColumns;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeDet.permission]);

    return (
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">תלמידים לעדכון סטטוס תלמיד</h1>
                <div>
                    {employeeDet.permission === 2 && (
                        <Button type="primary" className="add-student-button" onClick={addNewStudent}>הוסף תלמיד חדש</Button>
                    )}
                </div>
            </div>
            <div className="container">
                <div className="inner-container">
                    <div className="search-container">
                        <Input
                            placeholder="חיפוש תלמיד"
                            value={searchText}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                    <Table
                        columns={columns}
                        dataSource={filteredStudents}
                        loading={loading}
                        rowKey="student_id"
                        pagination={false}
                        className="table"
                        components={{
                            header: {
                                cell: (props: any) => (
                                    <th {...props} style={{ ...props.style, backgroundColor: '#0066ff', color: 'white' }} />
                                ),
                            },
                        }}
                        rowClassName={(record, index) =>
                            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                        }
                    />
                </div>
            </div>
        </>
    )
}
export default StudentsForUpdate;
