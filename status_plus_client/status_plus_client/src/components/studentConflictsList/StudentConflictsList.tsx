import { Button, Image } from 'antd';
import edit from '../../assets/edit.png';
import Table, { ColumnType } from 'antd/es/table';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { studentStatusService } from '../../services/studentStatusService';
import Message from '../Message';

const StudentConflictsList = () => {

    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    // const from = location.state?.from || '/default-path';
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [studentsConflictsList, setStudentsConflictsList] = useState();

    useEffect(() => {
        getStudentsConflictsList();
    }, [employeeId]);
    // message managment
    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
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
    // when clicking to resolve conflict to student
    const onConflictHandlingClick = (student: any) => {
        navigate(`/menu/conflicts-list/${student.studentId}`, { state: { from: location.pathname } });
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
            key: 'updateStudent',
            render: (text: any, record: any) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={edit}
                        alt="עדכון פרטי התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => onConflictHandlingClick(record)}
                    />
                </div>
            ),
            width: 150,
        },
    ];
    return (<>
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">תלמידים עם קונפליקטים</h1>
            </div>
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