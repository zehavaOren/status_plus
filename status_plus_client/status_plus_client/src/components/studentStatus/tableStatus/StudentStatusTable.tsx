import { useRef, useState, useEffect } from 'react';
import { Button, Spin, Table, Tag, Tooltip, Typography, Row, Col } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';

import Message from '../../Message';
import { studentStatusService } from '../../../services/studentStatusService';
import './StudentStatusTable.css';
import { StudentStatusValue } from '../../../models/StudentStatusValue';
import CategoryPieChart from './CategoryPieChart';

const { Title } = Typography;
interface CategoryData {
    category: string;
    strengths: StudentStatusValue[];
    weaknesses: StudentStatusValue[];
}
interface CategoryData2 {
    category: string;
    weaknesses: number;
}


const StudentStatusTable = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const [loading, setLoading] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState<{ employeeName: string, jobDesc: string }[]>([]);
    const [studentStatus, setStudentStatus] = useState<StudentStatusValue[]>([]);
    const contentRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [studentDet, setStudentDet] = useState<{ studentName: string; year: string }>();
    const [categoryDataList, setCategoryDataList] = useState<CategoryData2[]>([]);

    useEffect(() => {
        fetchStudentStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get the data
    const fetchStudentStatus = async () => {
        setLoading(true);
        try {
            const response = await studentStatusService.getStudentStatus(Number(studentId));
            setEmployeeDetails(response.studentStatusData[0]);
            setStudentDet(response.studentStatusData[1][0]);
            setStudentStatus(response.studentStatusData[2]);
            const processedData = processStudentStatusData(response.studentStatusData[2]);
            setCategoryDataList(processedData.categories);
        } catch (error) {
            addMessage('Error fetching student status', 'error');
        }
        setLoading(false);
    };
    // prepare datat to pie off weakness
    const processStudentStatusData = (data: any[]) => {
        const groupedData: { [key: string]: CategoryData2 } = {};
        let totalWeaknesses = 0;

        data.forEach((item) => {
            if (item.studentGrade === 'Weakness') {
                totalWeaknesses++;
                if (!groupedData[item.categoryDesc]) {
                    groupedData[item.categoryDesc] = { category: item.categoryDesc, weaknesses: 0 };
                }
                groupedData[item.categoryDesc].weaknesses++;
            }
        });

        // Convert the grouped data object into an array
        const categories = Object.values(groupedData);

        return { categories, totalWeaknesses };
    };
    // set the data
    const groupedData = studentStatus.reduce((acc, curr) => {
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
    // update the data in the table
    const renderTable = (categoryData: CategoryData) => {
        const maxRows = Math.max(categoryData.strengths.length, categoryData.weaknesses.length);
        const dataSource = Array.from({ length: maxRows }, (_, index) => ({
            key: index,
            strength: categoryData.strengths[index]?.valueDesc || '',
            weakness: categoryData.weaknesses[index]?.valueDesc || '',
            strengthConflict: categoryData.strengths[index]?.isHadConflict || false,
            weaknessConflict: categoryData.weaknesses[index]?.isHadConflict || false,
        }));

        const columns = [
            {
                title: 'חוזקה',
                dataIndex: 'strength',
                key: 'strength',
                render: (text: string, record: any) => (
                    <Tooltip title={text}>
                        <Tag color="green" style={{ fontSize: '16px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {text}
                            {record.strengthConflict && <span style={{ color: 'red', marginLeft: '5px' }}>★</span>} {/* Add star for conflict */}
                        </Tag>
                    </Tooltip>
                ),
            },
            {
                title: 'חולשה',
                dataIndex: 'weakness',
                key: 'weakness',
                render: (text: string, record: any) => (
                    <Tooltip title={text}>
                        <Tag color="red" style={{ fontSize: '16px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {text}
                            {record.weaknessConflict && <span style={{ color: 'red', marginLeft: '5px' }}>★</span>} {/* Add star for conflict */}
                        </Tag>
                    </Tooltip>
                ),
            },
        ];

        return (
            <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                style={{ width: '70%', margin: '0 auto' }}
                tableLayout="fixed"
            />
        );
    };
    // generate pdf
    const generatePDF = async () => {
        if (!contentRef.current) {
            addMessage("Error generating PDF", "error");
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

            // Capture the entire content
            const canvas = await html2canvas(input, {
                scale: scale,
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = margin;

            // Add image to the PDF
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
    // navigate back- to privious component
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

            {/* Header section with buttons */}
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

            {/* Display employee details horizontally across the width of the page */}
            <div ref={contentRef} dir='rtl'>
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
                <CategoryPieChart categories={categoryDataList} />
                {Object.values(groupedData).map((categoryData) => (
                    <div key={categoryData.category} style={{ marginBottom: '20px' }}>
                        <Title level={4} style={{ textAlign: 'center' }}>{categoryData.category}</Title>
                        {renderTable(categoryData)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentStatusTable;
