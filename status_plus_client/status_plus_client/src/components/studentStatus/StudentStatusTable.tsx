import React, { useEffect, useRef, useState } from 'react';
import { Button, List, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { StudentStatusValue } from '../../models/StudentStatusValue';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { studentStatusService } from '../../services/studentStatusService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DownloadOutlined } from '@ant-design/icons';
import Message from '../Message';
import './StudentStatusTable.css';

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
    const from = location.state?.from || '/menu';
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
                width: '50%',
                render: (text: string) => (
                    <Tooltip title={text}>
                        <div style={{
                            //  whiteSpace: 'normal',   // Allow the text to wrap into multiple lines
                            //  wordWrap: 'break-word', // Break long words if needed
                            //  display: 'block',
                            //  fontSize: '16px',
                            //  lineHeight: '1.5',      // Ensure proper line height for wrapping
                            //  minHeight: '50px',
                            // whiteSpace: 'nowrap',
                            // overflow: 'hidden',
                            // textOverflow: 'ellipsis',                         
                        }}>
                            {text ? <Tag color="green" style={{ fontSize: '16px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{text}</Tag> : null}
                        </div>
                    </Tooltip>
                ),
            },
            {
                title: 'חולשה',
                dataIndex: 'weakness',
                key: 'weakness',
                width: '50%',
                render: (text: string) => (
                    <Tooltip title={text}>
                        <div style={{
                            //   whiteSpace: 'normal',   // Allow the text to wrap into multiple lines
                            //   wordWrap: 'break-word', // Break long words if needed
                            //   display: 'block',
                            //   fontSize: '16px',
                            //   lineHeight: '1.5',      // Ensure proper line height for wrapping
                            //   minHeight: '50px',
                        }}>
                            {text ? <Tag color="red" style={{ fontSize: '16px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{text}</Tag> : null}
                        </div>
                    </Tooltip>
                ),
            },
        ];

        return (
            <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                style={{ width: '70%', margin: '0 auto' }}  // Reduced width to 60% and centered
                tableLayout="fixed" // Set fixed row height
                rowClassName={() => 'wrapped-row'}
            />
        );
    };
    // PDF Generation Function
    const generatePDF = async () => {
        if (!contentRef.current) {
            addMessage("אופס, שגיאה בהורדת PDF", "error");
            return;
        };
        setLoading(true);
        try {
            const input = contentRef.current;
            const pdf = new jsPDF('p', 'pt', 'a4');  // A4 page in portrait orientation
            const scale = 3;  // Increase this value to enlarge the content

            const canvas = await html2canvas(input, {
                scale: scale,  // Scale the content for better resolution and larger font
                useCORS: true,  // Ensure cross-origin content is handled
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 595.28; // A4 page width in points
            const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio
            const pageHeight = 841.89; // A4 page height in points
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('student_status.pdf');
        }
        catch (error) {
            console.error('Error generating PDF:', error);
            addMessage('שגיאה ביצירת PDF', 'error');
        }
        setLoading(false);
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
                icon={<DownloadOutlined />}
                type="primary"
                onClick={generatePDF}
                style={{ marginBottom: '20px', backgroundColor: '#52c41a', color: '#fff' }}
            >
                הורד כ-PDF
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