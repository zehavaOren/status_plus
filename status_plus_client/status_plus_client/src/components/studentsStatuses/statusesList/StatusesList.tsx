import { ColumnType } from "antd/es/table";
import { Table, Image } from 'antd';
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import view from '../../../assets/view.png';
import { StatusesList } from "../../../models/StatusesList";
import { studentStatusService } from "../../../services/studentStatusService";
import { downloadFile } from '../../../utils/fileUtils';
import Message from '../../Message';

// import Message from "antd/es/message";ש

const StudentsList = () => {

    const { student_id } = useParams<{ student_id: string }>();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]); const [loading, setLoading] = useState(false);
    const [statusesList, setStatusesList] = useState<StatusesList[]>([]);
    const [studentName, setStudentName] = useState();

    useEffect(() => {
        getStatusesList(student_id || '');
    }, [student_id]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get all the statuses list for student
    const getStatusesList = async (student_id: string) => {
        setLoading(true);
        try {
            const responseFromDB = await studentStatusService.getStatusesListById(student_id);
            const statusesList = await responseFromDB.statusesList[0];
            setStatusesList(statusesList);
            setStudentName(responseFromDB.statusesList[1][0].name);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    }
    //open the file
    const onUpdateStudentClick = (statusFile: string, year: string) => {
        downloadFile(statusFile, `סטטוס התלמיד ${studentName} - ${year}.pdf`);
    }
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
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={view}
                        alt="עדכון סטטוס התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => onUpdateStudentClick(record.statusFile, record.year)}
                    />
                </div>
            ),
            width: 150,
        },
    ]

    return <>
        <Message messages={messages} duration={5000} />
        <div className="header">
            <h1 className="title">סטטוסי התלמיד: {studentName}</h1>
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
}
export default StudentsList;