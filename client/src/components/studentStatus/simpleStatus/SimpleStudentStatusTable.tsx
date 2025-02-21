import { useRef, useState, useEffect } from 'react';
import { Button, Spin, Table, Typography, Row, Col } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';

import Message from '../../Message';
import { studentStatusService } from '../../../services/studentStatusService';
import '.././tableStatus/StudentStatusTable.css';
import { StudentStatusValue } from '../../../models/StudentStatusValue';

const { Title } = Typography;

interface CategoryData {
    category: string;
    strengths: { valueDesc: string, isHadConflict: boolean }[];
    weaknesses: { valueDesc: string, isHadConflict: boolean }[];
}

const SimpleStudentStatusTable = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const [loading, setLoading] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState<{ employeeName: string, jobDesc: string }[]>([]);
    const contentRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [studentDet, setStudentDet] = useState<{ studentName: string; year: string }>();
    const [categoryDataList, setCategoryDataList] = useState<CategoryData[]>([]);

    useEffect(() => {
        fetchStudentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };

    const fetchStudentStatus = async () => {
        setLoading(true);
        try {
            const response = await studentStatusService.getStudentStatus(Number(studentId));
            setEmployeeDetails(response.studentStatusData[0]);
            setStudentDet(response.studentStatusData[1][0]);
            const processedData = processStudentStatusData(response.studentStatusData[2]);
            setCategoryDataList(processedData);
        } catch (error) {
            addMessage('Error fetching student status', 'error');
        }
        setLoading(false);
    };

    const processStudentStatusData = (data: StudentStatusValue[]) => {
        const groupedData: { [key: string]: CategoryData } = {};

        data.forEach((item) => {
            if (!groupedData[item.categoryDesc]) {
                groupedData[item.categoryDesc] = { category: item.categoryDesc, strengths: [], weaknesses: [] };
            }

            if (item.studentGrade === 'Strength') {
                groupedData[item.categoryDesc].strengths.push({ valueDesc: item.valueDesc, isHadConflict: item.isHadConflict });
            } else if (item.studentGrade === 'Weakness') {
                groupedData[item.categoryDesc].weaknesses.push({ valueDesc: item.valueDesc, isHadConflict: item.isHadConflict });
            }
        });

        return Object.values(groupedData);
    };

    const renderTable = () => {
        const columns = [
            {
                title: 'קטגוריה',
                dataIndex: 'category',
                key: 'category',
            },
            {
                title: 'חוזקות',
                dataIndex: 'strengths',
                key: 'strengths',
                render: (strengths: { valueDesc: string, isHadConflict: boolean }[]) =>
                    strengths.length > 0
                        ? strengths.map((strength, idx) => (
                            <span key={idx}>
                                {strength.valueDesc}
                                {strength.isHadConflict && <span style={{ color: 'red', marginLeft: '5px' }}>★</span>}
                                {idx < strengths.length - 1 && ', '}
                            </span>
                        ))
                        : 'אין נתונים',
            },
            {
                title: 'חולשות',
                dataIndex: 'weaknesses',
                key: 'weaknesses',
                render: (weaknesses: { valueDesc: string, isHadConflict: boolean }[]) =>
                    weaknesses.length > 0
                        ? weaknesses.map((weakness, idx) => (
                            <span key={idx}>
                                {weakness.valueDesc}
                                {weakness.isHadConflict && <span style={{ color: 'red', marginLeft: '5px' }}>★</span>}
                                {idx < weaknesses.length - 1 && ', '}
                            </span>
                        ))
                        : 'אין נתונים',
            },
        ];

        const dataSource = categoryDataList.map((item, index) => ({
            key: index,
            category: item.category,
            strengths: item.strengths,
            weaknesses: item.weaknesses,
        }));

        return (
            <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                style={{ width: '80%', margin: '0 auto' }}
            />
        );
    };

    const generatePDF = async () => {
        if (!contentRef.current) {
            addMessage('Error generating PDF', 'error');
            return;
        }

        setLoading(true);
        try {
            const input = contentRef.current;
            const pdf = new jsPDF('p', 'pt', 'a4');
            const margin = 20;
            const pageHeight = 841.89;
            const imgWidth = 595.28;
            const scale = 2.5;

            const canvas = await html2canvas(input, {
                scale: scale,
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = margin;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

            heightLeft -= pageHeight - margin * 2;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position + margin, imgWidth, imgHeight);
                heightLeft -= pageHeight - margin * 2;
            }

            pdf.save(`סטטוס התלמיד ${studentDet?.studentName}-${studentDet?.year}.pdf`);
        } catch (error) {
            addMessage('Error generating PDF', 'error');
        }
        setLoading(false);
    };

    const navigateBack = () => {
        navigate(location.state?.from || `/menu/status-options/${studentId}`);
    };

    return (
        <div>
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}

            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '30px' }}>
                    <Button
                        icon={<DownloadOutlined />}
                        type="primary"
                        onClick={generatePDF}
                        style={{ backgroundColor: '#52c41a', color: '#fff' }}
                    >
                        הורד כ-PDF
                    </Button>
                    <Button onClick={navigateBack} style={{ backgroundColor: '#d6e7f6' }}>
                        חזרה
                    </Button>
                </div>
            </div>

            <div ref={contentRef} dir="rtl">
                <div style={{ margin: '20px 0', textAlign: 'center' }}>
                    <Title level={2}>סטטוס התלמיד {studentDet?.studentName}</Title>
                    <Title level={4}>אנשי צוות ממלאים</Title>
                    <Row gutter={[16, 16]} justify="center">
                        {employeeDetails.map((item, index) => (
                            <Col key={index} span={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <strong>{item.employeeName}</strong> - {item.jobDesc}
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

                {renderTable()}
            </div>
        </div>
    );
};

export default SimpleStudentStatusTable;
