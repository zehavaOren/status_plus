import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Typography, Spin, Card, List } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import './StudentStatus.css'
import { studentStatusService } from '../../services/studentStatusService';
import { StudentStatusValue } from '../../models/StudentStatusValue';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Message from '../Message';
import { DownloadOutlined } from '@ant-design/icons';
import { MySingletonService } from '../../services/MySingletonService';

const { Title } = Typography;

const StudentStatus = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [studentDet, setStudentDet] = useState<{ studentName: string, year: string }>();
    const [employeeDetails, setEmployeeDetails] = useState<{ employeeName: string, jobId: number, jobDesc: string }[]>([]);
    const [studentStatus, setStudentStatus] = useState<StudentStatusValue[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);
    const contentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchStudentStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // Determine the back navigation route
    const from = useMemo(() => {
        debugger
        if (location.state?.from) {
            return location.state.from;
        }
        if (employeeDet.permission === 1 || employeeDet.permission === 2) {
            return `menu/students-for-update/${employeeDet.identityNumber}`;
        } else if (employeeDet.permission === 3) {
            return '/all-students';
        } else {
            return location.state?.from || '/menu';
        }
    }, [employeeDet, location.state?.from]);
    // get status data
    const fetchStudentStatus = async () => {
        setLoading(true);
        try {
            const id = Number(studentId);
            const studentSatusResponse = await studentStatusService.getStudentStatus(id);
            setEmployeeDetails(studentSatusResponse.studentStatusData[0]);
            setStudentDet(studentSatusResponse.studentStatusData[1][0]);
            setStudentStatus(studentSatusResponse.studentStatusData[2]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            console.error('Error fetching student status:', error);
        }
        setLoading(false);
    };
    // status columns
    const columns = [
        {
            title: 'ערך',
            dataIndex: 'valueDesc',
            key: 'valueDesc',
        },
        {
            title: 'חוזקה',
            key: 'Strength',
            render: (text: string, record: StudentStatusValue) =>
                record.studentGrade === 'Strength' || record.studentGrade === 'both' ? '✓' : '',
        },
        {
            title: 'חולשה',
            key: 'Weakness',
            render: (text: string, record: StudentStatusValue) =>
                record.studentGrade === 'Weakness' || record.studentGrade === 'both' ? '✓' : '',
        },
        {
            title: 'הערות',
            dataIndex: 'note',
            key: 'note',
        },
    ];
    const groupedStatus = studentStatus.reduce((acc, curr) => {
        if (!acc[curr.categoryDesc]) {
            acc[curr.categoryDesc] = [];
        }
        acc[curr.categoryDesc].push(curr);
        return acc;
    }, {} as { [key: string]: StudentStatusValue[] });
    // arrage the categories and the values
    const expandedRowRender = (category: string) => {
        const data = groupedStatus[category];
        return <Table columns={columns} dataSource={data} pagination={false} />;
    };
    // category columns
    const categoryColumns = [
        {
            title: 'רשימת קטגוריות',
            dataIndex: 'category',
            key: 'category',
        },
    ];
    // all the category
    const categoryData = Object.keys(groupedStatus).map(category => ({ key: category, category }));
    // when clicking category
    const onExpand = (expanded: boolean, record: { key: string }) => {
        setExpandedKeys(keys =>
            expanded
                ? [...keys, record.key]
                : keys.filter(k => k !== record.key)
        );
    };
    // open all tabsto print the page to pdf
    const openAllCategories = () => {
        // Automatically expand all rows by setting expanded keys to all categories
        const allKeys = Object.keys(studentStatus.reduce((acc: { [key: string]: StudentStatusValue[] }, curr: StudentStatusValue) => {
            if (!acc[curr.categoryDesc]) {
                acc[curr.categoryDesc] = [];
            }
            acc[curr.categoryDesc].push(curr);
            return acc;
        }, {}));
        setExpandedKeys(allKeys);
    }
    // navigate to the privious component
    const navigateBack = () => {
        navigate(location.state?.from || `/menu/students-for-update/${employeeDet.identityNumber}`);
    };
    // navigate to the second status vision
    const changeVision = () => {
        navigate(`/menu/student-status-table/${studentId}`, { state: { from: location.pathname } });
    }
    // PDF Generation Function
    const generatePDF = async () => {
        if (!contentRef.current) {
            addMessage("אופס, שגיאה בהורדת PDF", "error");
            return;
        };
        setLoading(true);
        try {
            await openAllCategories();
            const input = contentRef.current;
            const pdf = new jsPDF('p', 'pt', 'a4');
            const canvas = await html2canvas(input, { scale: 1 }); // Lower scale if necessary
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 595.28; // A4 page width in points
            const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio
            const pageHeight = 841.89; // A4 page height in points
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add pages if content exceeds one page
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('student_status.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            addMessage('שגיאה ביצירת PDF', 'error');
        }
        setLoading(false);
    };

    return (
        <div >
            <div>
                <Message messages={messages} duration={5000} />
                {loading && (
                    <div className="loading-overlay">
                        <Spin size="large" />
                    </div>
                )}
                <div className='container'>
                    <Title level={2}>סטטוס {studentDet?.studentName} {studentDet?.year}</Title>
                    <Button onClick={navigateBack} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                        חזרה
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        type="primary"
                        onClick={generatePDF}
                        style={{ marginBottom: '20px', backgroundColor: '#52c41a', color: '#fff', marginLeft: '20px' }}
                    >
                        הורד כ-PDF
                    </Button>
                    <Button onClick={changeVision} style={{ marginRight: '60px' }}>שנה תצוגה</Button>
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1px' }} ref={contentRef}>
                <Card
                    style={{ borderRadius: '10px', width: '100%', maxWidth: '1200px', direction: 'rtl', backgroundColor: '#b4d3ef' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        {/* רשימת אנשי הצוות */}
                        <div style={{ width: '25%', marginLeft: '20px' }}>
                            <Title level={4}>אנשי צוות ממלאים</Title>
                            <List
                                dataSource={employeeDetails}
                                renderItem={item => (
                                    <List.Item>
                                        <div>{item.employeeName} - {item.jobDesc}</div>
                                    </List.Item>
                                )} />
                        </div>
                        {/* טבלת סטטוס התלמיד */}
                        <div style={{ width: '70%' }}>
                            <div id="studentStatusTable" dir='rtl'>
                                <Table
                                    columns={categoryColumns}
                                    expandable={{
                                        expandedRowRender: record => expandedRowRender(record.category),
                                        onExpand: onExpand,
                                        expandedRowKeys: expandedKeys,
                                    }}
                                    dataSource={categoryData}
                                    pagination={false} />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentStatus;