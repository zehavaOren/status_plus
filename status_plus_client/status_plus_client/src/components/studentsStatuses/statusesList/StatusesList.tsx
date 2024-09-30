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

    // Clean the base64 string (remove data URI prefix if it exists)
    const cleanBase64 = (base64: string) => {
        return base64.includes(',') ? base64.split(',')[1] : base64;
    };

    // Convert base64 to a Blob and download as a PDF
    const handleDownload = (base64File: string, year: string) => {
        try {
            const cleanedBase64 = cleanBase64(base64File); // Clean base64 content

            // Debugging the base64 string
            console.log("Base64 string:", cleanedBase64.slice(0, 100)); // Only log the first 100 characters for debugging

            const byteCharacters = atob(cleanedBase64); // Decode base64 into binary string

            // Convert binary string to array of bytes
            const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
            const byteArray = new Uint8Array(byteNumbers);

            // Debugging the length of byteArray
            console.log("Decoded byte length:", byteArray.length);

            // Create a Blob from the byte array
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            // Trigger file download
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `StudentStatus_${studentName}_${year}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up the URL object
        } catch (error) {
            addMessage("Error processing file download", "error");
            console.error("File download error:", error);
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
                    Download PDF
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
