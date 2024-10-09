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
        if (isStatusFinish) {
            navigate(`/menu/conflicts-list/${student.studentId}`, { state: { from: location.pathname } });
        }
        else {
            addMessage("סטטוס התלמיד עדיין לא מוכן, אין אפשרות לפתור קונפליקטים", "error");
        }
    }
    // check if all employees fill the status
    const checkStudentStatus = async (studentId: number) => {
        try {
            const year = await getYearForSystem();
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId, year);
            const numbersOfValues = responseFromDB.numbersOfValues[0][0];
            if ((numbersOfValues.totalExpectedValues === numbersOfValues.totalFilledValues) || numbersOfValues.totalDistinctExpectedValues === numbersOfValues.totalFinalChoiceValues) {
                return true;
            }
            else {
                return false;
            }
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