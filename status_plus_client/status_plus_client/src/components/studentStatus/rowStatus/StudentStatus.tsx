import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Typography, Spin, Card, List } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import './StudentStatus.css'
import { studentStatusService } from '../../../services/studentStatusService';
import { StudentStatusValue } from '../../../models/StudentStatusValue';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Message from '../../Message';
import { DownloadOutlined } from '@ant-design/icons';
import { MySingletonService } from '../../../services/MySingletonService';

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
    // navigate
    // Ensure consistent absolute path when navigating back
    const from = useMemo(() => {
        if (location.state?.from) {
            return location.state.from;
        }
        return `/menu/status-options/${studentId}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeDet, location.state?.from]);

    // get data
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
    // columns
    const columns = [
        {
            title: 'ערך',
            key: 'valueDesc',
            dataIndex: 'valueDesc',
            render: (text: string, record: StudentStatusValue) => (
                <span>
                    {text}
                    {record.isHadConflict && <span style={{ color: 'red', marginLeft: '5px' }}>   ★</span>}
                </span>
            ),
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
    // map data
    const groupedStatus = studentStatus.reduce((acc, curr) => {
        if (!acc[curr.categoryDesc]) {
            acc[curr.categoryDesc] = [];
        }
        acc[curr.categoryDesc].push(curr);
        return acc;
    }, {} as { [key: string]: StudentStatusValue[] });
    // on open row
    const expandedRowRender = (category: string) => {
        const data = groupedStatus[category];
        return <Table columns={columns} dataSource={data} pagination={false} />;
    };
    // columns
    const categoryColumns = [
        {
            title: 'רשימת קטגוריות',
            dataIndex: 'category',
            key: 'category',
        },
    ];
    // map data
    const categoryData = Object.keys(groupedStatus).map(category => ({ key: category, category }));
    // open category
    const onExpand = (expanded: boolean, record: { key: string }) => {
        setExpandedKeys(keys =>
            expanded
                ? [...keys, record.key]
                : keys.filter(k => k !== record.key)
        );
    };
    // open all categories
    const openAllCategories = () => {
        const allKeys = Object.keys(groupedStatus);
        setExpandedKeys(allKeys);
    }
    // navigate to privious component
    const navigateBack = () => {
        navigate(from);
    };
    // generate pdf
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
            const canvas = await html2canvas(input, { scale: 1 });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 595.28;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = 841.89;
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

            pdf.save(`סטטוס התלמיד${studentDet?.studentName}-${studentDet?.year}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            addMessage('שגיאה ביצירת PDF', 'error');
        }
        setLoading(false);
    };

    return (
        <div>
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}

            <div className='container'>
                <div style={{ marginBottom: '-10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '425px' }}>
                        <Button onClick={navigateBack} style={{ backgroundColor: '#d6e7f6' }}>
                            חזרה
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            type="primary"
                            onClick={generatePDF}
                            style={{ backgroundColor: '#52c41a', color: '#fff' }}
                        >
                            הורד כ-PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div ref={contentRef}>
                <Title level={2} style={{ textAlign: 'center' }}>
                    סטטוס התלמיד {studentDet?.studentName}
                </Title>
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1px' }} >
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
        </div>
    );
};

export default StudentStatus;
