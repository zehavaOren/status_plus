import React, { useEffect, useRef, useState } from 'react';
import { Button, List, Spin, Table, Tag, Typography } from 'antd';
import { StudentStatusValue } from '../../models/StudentStatusValue';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { studentStatusService } from '../../services/studentStatusService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DownloadOutlined } from '@ant-design/icons';
import Message from '../Message';

const { Title } = Typography;

interface CategoryData {
    category: string;
    strengths: StudentStatusValue[];
    weaknesses: StudentStatusValue[];
}

const StudentStatusTable = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const [loading, setLoading] = useState(false);
    const [studentDet, setStudentDet] = useState<{ studentName: string, year: string }>();
    const [employeeDet, setEmployeeDet] = useState<{ employeeName: string, jobId: number, jobDesc: string }[]>([]);
    const [studentStatus, setStudentStatus] = useState<StudentStatusValue[]>([]);
    const contentRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/default-path';
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);

    useEffect(() => {
        fetchStudentStatus();
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get the student data
    const fetchStudentStatus = async () => {
        setLoading(true);
        try {
            const studentStatusResponse = await studentStatusService.getStudentStatus(Number(studentId));
            setEmployeeDet(studentStatusResponse.studentStatusData[0]);
            setStudentDet(studentStatusResponse.studentStatusData[1][0]);
            setStudentStatus(studentStatusResponse.studentStatusData[2]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            console.error('Error fetching student status:', error);
        }
        setLoading(false);
    };

    const groupedData: { [key: string]: CategoryData } = studentStatus.reduce((acc, curr) => {
        if (!acc[curr.categoryDesc]) {
            acc[curr.categoryDesc] = { category: curr.categoryDesc, strengths: [], weaknesses: [] };
        }
        if (curr.studentGrade === 'Strength') {
            acc[curr.categoryDesc].strengths.push(curr);
        } else if (curr.studentGrade === 'Weakness') {
            acc[curr.categoryDesc].weaknesses.push(curr);
        }
        return acc;
    }, {} as { [key: string]: CategoryData });
    // student status
    const renderTable = (categoryData: CategoryData) => {
        const maxRows = Math.max(categoryData.strengths.length, categoryData.weaknesses.length);
        const dataSource = Array.from({ length: maxRows }, (_, index) => ({
            key: index,
            strength: categoryData.strengths[index]?.valueDesc || '',
            weakness: categoryData.weaknesses[index]?.valueDesc || '',
        }));

        const columns = [
            {
                title: 'חוזקה',
                dataIndex: 'strength',
                key: 'strength',
                render: (text: string) => (text ? <Tag color="green">{text}</Tag> : null),
            },
            {
                title: 'חולשה',
                dataIndex: 'weakness',
                key: 'weakness',
                render: (text: string) => (text ? <Tag color="red">{text}</Tag> : null),
            },
        ];

        return <Table dataSource={dataSource} columns={columns} pagination={false} />;
    };
    // export pdf
    const exportToPDF = async () => {
        setLoading(true);
        try {
            if (!contentRef.current) return;

            const contentHeight = contentRef.current.clientHeight;
            const pageHeight = 1123; // A4 page height in pixels
            const totalPages = Math.ceil(contentHeight / pageHeight);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [794, 1123] // A4 page size in pixels
            });

            let currentPosition = 0;

            for (let page = 1; page <= totalPages; page++) {
                pdf.addPage();
                const canvas = await html2canvas(contentRef.current, {
                    y: currentPosition,
                    height: pageHeight
                });
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123); // A4 page dimensions

                currentPosition += pageHeight;
            }

            pdf.save('student_status.pdf');
            setLoading(false);
        }
        catch {
            addMessage('אופס, משהו השתבש בעת הורדת סטטוס התלמיד, אנא נסה שנית', 'error');
        }
    };
    // navigate back
    const navigateBack = () => {
        navigate(from);
    };
    return (
        <div>
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}
            <Button onClick={navigateBack} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                חזרה
            </Button>
            <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                style={{ marginBottom: '20px' }}
            >
                ייצא ל-PDF
            </Button>
            {/* רשימת אנשי הצוות */}
            <div style={{ width: '25%', marginLeft: '1200px' }}>
                <Title level={4}>אנשי צוות ממלאים</Title>
                <List
                    dataSource={employeeDet}
                    renderItem={item => (
                        <List.Item>
                            <div>{item.employeeName} - {item.jobDesc}</div>
                        </List.Item>
                    )} />
            </div>
            <div ref={contentRef} dir='rtl' style={{ textAlign: 'center' }}>
                {Object.values(groupedData).map((categoryData) => (
                    <div key={categoryData.category}>
                        <Title level={2}>{categoryData.category}</Title>
                        {renderTable(categoryData)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentStatusTable;