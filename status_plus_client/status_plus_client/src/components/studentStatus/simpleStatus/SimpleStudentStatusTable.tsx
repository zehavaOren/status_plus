import { useRef, useState, useEffect } from 'react';
import { Button, Spin, Table, Typography, Row, Col } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Message from '../../Message';
import { studentStatusService } from '../../../services/studentStatusService';
import '.././tableStatus/StudentStatusTable.css';
import { StudentStatusValue } from '../../../models/StudentStatusValue';
import { font } from '../../../Tahoma-Regular-font-normal';

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

    // adjust pdf text to hebrew
    const reverseHebrewText = (text: string): string => {
        return text
            .split(/(\(.*?\)|[\u0590-\u05FF,★-]+|\d+|\S+)/g)
            .map(segment => {
                if (segment.startsWith('(') && segment.endsWith(')')) {
                    const innerText = segment.slice(1, -1);
                    const reversedInner = innerText
                        .split(/(\s+|,|-)/g)
                        .map(word => /^[\u0590-\u05FF]+$/.test(word) ? word.split('').reverse().join('') : word)
                        .reverse()
                        .join('');

                    return `(${reversedInner})`;
                } else if (/^\d+$/.test(segment)) {
                    return `\u2067${segment}\u2066`;
                } else if (/^[\u0590-\u05FF,-]+$/.test(segment)) {
                    return segment
                        .split(/(-)/g)
                        .map(word => word === '-' ? word : word.split('').reverse().join(''))
                        .join('');
                }
                return segment;
            })
            .reverse()
            .join('');
    };
    // create pdf file
    const generatePDF = async () => {
        setLoading(true);
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

            doc.addFileToVFS("Tahoma Regular font-normal.ttf", font);
            doc.addFont("Tahoma Regular font-normal.ttf", "Tahoma Regular", "normal");
            doc.setFont("Tahoma Regular", "normal");

            const titleText = reverseHebrewText(`סטטוס התלמיד ${studentDet?.studentName}`);
            const yearText = studentDet?.year.split('').reverse().join('') + reverseHebrewText(`שנת הלימודים: `);

            doc.setFontSize(18);
            doc.text(titleText, 300, 40, { align: 'center' });

            doc.setFontSize(12);
            doc.text(yearText, 300, 60, { align: 'center' });

            let yOffset = 100;

            if (employeeDetails.length > 0) {
                doc.setFontSize(14);
                doc.text(reverseHebrewText("אנשי צוות ממלאים"), 300, yOffset, { align: 'center' });
                yOffset += 20;
                let staffText = employeeDetails
                    .map(emp => `${reverseHebrewText(emp.employeeName)} - ${reverseHebrewText(emp.jobDesc)}`)
                    .join(" | ");

                doc.setFontSize(10);
                doc.text(staffText, 300, yOffset, { align: 'center' });
                yOffset += 30;
            }

            const formatCellText = (text: string) => {
                if (!text) return reverseHebrewText('אין נתונים');
                let wrappedLines = doc.splitTextToSize(reverseHebrewText(text), 200);
                return wrappedLines.reverse().join('\n');
            };

            const formatCategoryText = (text: string) => {
                if (!text) return reverseHebrewText('אין נתונים');
                let wrappedLines = doc.splitTextToSize(reverseHebrewText(text), 80);
                return wrappedLines.reverse().join('\n');
            };

            const tableData = categoryDataList.map(category => [
                formatCellText(category.weaknesses.length > 0
                    ? category.weaknesses.map(weak => weak.valueDesc).join(', ')
                    : 'אין נתונים'),
                formatCellText(category.strengths.length > 0
                    ? category.strengths.map(str => str.valueDesc).join(', ')
                    : 'אין נתונים'),
                formatCategoryText(category.category),

            ]);

            autoTable(doc, {
                startY: yOffset + 20,
                head: [[reverseHebrewText('חולשות'), reverseHebrewText('חוזקות'), reverseHebrewText('קטגוריה')]],
                body: tableData,
                theme: "grid",
                styles: { font: "Tahoma Regular", fontSize: 10, halign: "center", textColor: [0, 0, 0] },
                headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 200 }, 2: { cellWidth: 100 } }
            });

            doc.save(`סטטוס ${studentDet?.studentName} ${studentDet?.year}.pdf`);
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
