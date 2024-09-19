import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Image } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ColumnType } from 'antd/es/table';

import { Student } from '../../models/Student';
import { studentService } from '../../services/studentService';
import edit from '../../assets/edit.png';
import view from '../../assets/view.png';
import './studentsForUpdate.css'
import Message from '../Message';
import { MySingletonService } from '../../services/MySingletonService';
import { studentStatusService } from '../../services/studentStatusService';

const StudentsForUpdate = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { identityNumber } = useParams<{ identityNumber: string }>();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]); const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        getStudentsForUpdate(identityNumber || '');
    }, [identityNumber]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get the students of the employee how enter
    const getStudentsForUpdate = async (identityNumber: string) => {
        setLoading(true);
        try {
            const responseFromDB = await studentService.getStudentsForUpdate(identityNumber);
            const studentsForUpdate = await responseFromDB.studentsForUpdate[0];
            setStudents(studentsForUpdate);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    };
    // update student details clicked
    const onUpdateStudentClick = (student: Student) => {
        const userPermission = MySingletonService.getInstance().getBaseUser().permission;
        if (userPermission === 2) {
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
        if (isStatusFinish) {
            navigate(`/menu/student-status/${student_id}`, { state: { from: location.pathname } });
        }
        else {
            addMessage("סטטוס התלמיד עדיין לא מוכן, אין אפשרות להציג", "error");
        }
    }
    // check if all employees fill the status
    const checkStudentStatus = async (studentId: number) => {
        try {
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId);
            const numbersOfValues = responseFromDB.numbersOfValues[0][0];
            if (numbersOfValues.totalExpectedValues === numbersOfValues.totalFilledValues) {
                return true;
            }
            else {
                return false;
            }
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
    const gradeFilterOptions = Array.from(new Set(students.map(student => student.grade))).map(grade => ({
        text: grade,
        value: grade,
    }));
    // add new student
    const addNewStudent = () => {
        navigate(`/menu/student-details/`);
    }

    const columns: ColumnType<Student>[] = [
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
            onFilter: (value, record) => record.grade?.indexOf(value as string) === 0,
        },
        {
            title: 'עדכון פרטי התלמיד',
            key: 'updateStudent',
            render: (text, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={edit}
                        alt="עדכון פרטי התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => onUpdateStudentClick(record)}
                    />
                </div>
            ),
            width: 150,
        },
        {
            title: 'עדכון סטטוס התלמיד',
            key: 'updateStatus',
            render: (text, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={edit}
                        alt="עדכון סטטוס התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => onUpdateStatusClick(record.studentId)}
                    />
                </div>
            ),
            width: 150,
        },
        {
            title: 'צפייה בסטטוס התלמיד',
            key: 'viewStatus',
            render: (text, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={view}
                        alt="צפייה בסטטוס התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => onViewStatusClick(record.studentId)}
                    />
                </div>
            ),
            width: 150,
        }
    ];
    const userPermission = MySingletonService.getInstance().getBaseUser().permission;
    
    return (
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">תלמידים לעדכון סטטוס תלמיד</h1>
                <div>
                    {userPermission === 2 && (
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
