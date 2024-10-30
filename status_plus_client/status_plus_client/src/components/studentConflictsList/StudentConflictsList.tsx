import { Button } from 'antd';
import Table, { ColumnType } from 'antd/es/table';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import { studentStatusService } from '../../services/studentStatusService';
import Message from '../Message';
import { MySingletonService } from '../../services/MySingletonService';
import { EditOutlined } from '@ant-design/icons';

const StudentConflictsList = () => {

    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [studentsConflictsList, setStudentsConflictsList] = useState();
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);

    useEffect(() => {
        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId]);
    // message managment
    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // navigate
    // Ensure consistent absolute path when navigating back
    const from = useMemo(() => {
        if (location.state?.from) {
            return location.state.from;
        }
        if (employeeDet.permission === 1 || employeeDet.permission === 2) {
            return `/menu/students-for-update/${employeeId}`;
        } else if (employeeDet.permission === 3) {
            return `/menu/all-students`;
        } else {
            return '/menu';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeDet, location.state?.from]);
    // navigate to privious component
    const navigateBack = () => {
        navigate(from);
    };
    // get correct year
    const getYearForSystem = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const year = currentMonth > 10 ? currentYear + 1 : currentYear;
        return year.toString();
    };
    const getData = () => {
        if (employeeDet.permission === 3) {
            getAllStudentsConflictsList();
        }
        else {
            getStudentsConflictsList();
        }
    }
    // get students conflicts list
    const getStudentsConflictsList = async () => {
        setLoading(true);
        const employeeNumber = Number(employeeId);
        try {
            const studentConflictsResponse = await studentStatusService.getStdentsConflicts(employeeNumber);
            setStudentsConflictsList(studentConflictsResponse.studentConflicts[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            console.error('Error fetching student status:', error);
        }
        setLoading(false);
    }
    // get students conflicts list
    const getAllStudentsConflictsList = async () => {
        setLoading(true);
        try {
            const studentConflictsResponse = await studentStatusService.getAllStdentsConflicts();
            setStudentsConflictsList(studentConflictsResponse.studentConflicts[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            console.error('Error fetching student status:', error);
        }
        setLoading(false);
    }
    // when clicking to resolve conflict to student
    const onConflictHandlingClick = async (student: any) => {
        const isStatusFinish = await checkStudentStatus(Number(student.studentId));
        const numbersOfValues = isStatusFinish.numbersOfValues[0][0];
        if ((numbersOfValues.totalExpectedValues === numbersOfValues.totalFilledValues) || numbersOfValues.totalDistinctExpectedValues === numbersOfValues.totalFinalChoiceValues) {
            navigate(`/menu/conflicts-list/${student.studentId}`, { state: { from: location.pathname } });
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
            addMessage("Student status is not ready yet, cannot be displayed", "error");
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
    // columns list
    const columns: ColumnType<any>[] = [
        {
            title: 'תעודת זהות',
            dataIndex: 'studentId',
            key: 'studentId',
            width: 150,
        },
        {
            title: 'שם פרטי',
            dataIndex: 'firstName',
            key: 'firstName',
        },
        {
            title: 'שם משפחה',
            dataIndex: 'lastName',
            key: 'lastName',
        },
        {
            title: 'כיתה',
            dataIndex: 'grade',
            key: 'grade',
        },
        {
            title: 'טיפול בקונפליקט',
            key: 'conflict',
            render: (text: any, record: any) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => onConflictHandlingClick(record)}
                    />
                </div>
            ),
            width: 100,
        },
    ];
    return (<>
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">תלמידים עם קונפליקטים</h1>
            </div>
            <Button onClick={navigateBack} style={{ backgroundColor: '#d6e7f6' }}>
                חזרה
            </Button>
            <br />
            <div className="container">
                <div className="inner-container">
                    <Table
                        columns={columns}
                        dataSource={studentsConflictsList}
                        loading={loading}
                        rowKey="studentId"
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
    </>)
}
export default StudentConflictsList;