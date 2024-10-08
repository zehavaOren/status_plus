import { ColumnType } from "antd/es/table";
import { Table, Button } from 'antd';
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { StatusesList } from "../../../models/StatusesList";
import { studentStatusService } from "../../../services/studentStatusService";
import Message from '../../Message';
import { MySingletonService } from "../../../services/MySingletonService";

const StudentsList = () => {
    const { student_id } = useParams<{ student_id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [statusesList, setStatusesList] = useState<StatusesList[]>([]);
    const [studentName, setStudentName] = useState<string | undefined>();
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);

    useEffect(() => {
        getStatusesList(student_id || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student_id]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };

    const from = useMemo(() => {
        if (location.state?.from) {
            return location.state.from;
        }
        if (employeeDet.permission === 1 || employeeDet.permission === 2) {
            return `/students-for-update/${employeeDet.identityNumber}`;
        } else if (employeeDet.permission === 3) {
            return '/all-students';
        }
        return '/menu';
    }, [employeeDet, location.state?.from]);

    // Fetch the list of statuses (including PDF files)
    const getStatusesList = async (student_id: string) => {
        setLoading(true);
        try {
            const responseFromDB = await studentStatusService.getStatusesListById(student_id);
            const statusesList = responseFromDB.statusesList[0];
            setStatusesList(statusesList);
            setStudentName(responseFromDB.statusesList[1][0].name);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (base64File: string, year: string) => {
        const fileName = `סטטוס ${studentName}-${year}.pdf`
        try {
            const cleanedBase64File = base64File.replace(/^data:application\/pdf;base64,/, '');
            let formattedBase64File = cleanedBase64File;
            while (formattedBase64File.length % 4 !== 0) {
                formattedBase64File += '=';
            }
            const byteCharacters = atob(formattedBase64File);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading the PDF:', error);
        }
    };
    const columns: ColumnType<StatusesList>[] = [
        {
            title: 'שנה',
            dataIndex: 'year',
            key: 'year',
            width: 150,
        },
        {
            title: 'צפייה בסטטוס התלמיד',
            key: 'viewStatus',
            render: (text, record) => (
                <Button onClick={() => handleDownload(record.statusFile, record.year)}>
                    הורדת הסטטוס
                </Button>
            ),
            width: 150,
        },
    ];

    const navigateBack = () => {
        navigate(from);
    };

    return (
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">סטטוסי התלמיד: {studentName}</h1>
                <Button onClick={navigateBack} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                    חזרה
                </Button>
            </div>
            <br />
            <div className="container">
                <Table
                    columns={columns}
                    dataSource={statusesList}
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
        </>
    );
};

export default StudentsList;
