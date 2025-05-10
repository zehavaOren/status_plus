import { useRef, useState, useEffect } from 'react';
import { Button, Spin, Table, Tag, Tooltip, Typography, Row, Col } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Message from '../../Message';
import { studentStatusService } from '../../../services/studentStatusService';
import './StudentStatusTable.css';
import { StudentStatusValue } from '../../../models/StudentStatusValue';
import CategoryPieChart from './CategoryPieChart';
import { font } from '../../../Tahoma-Regular-font-normal';

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
            doc.addFont(
                "Tahoma Regular font-normal.ttf",
                "Tahoma Regular",
                "normal"
            );
            doc.setFont("Tahoma Regular", "normal");

            const titleText = reverseHebrewText(`סטטוס התלמיד ${studentDet?.studentName}`);
            const yearText = studentDet?.year.split('').reverse().join('') + reverseHebrewText(`שנת הלימודים: `);

            doc.setFontSize(18);
            doc.text(titleText, 300, 40, { align: 'center' });

            doc.setFontSize(12);
            doc.text(yearText, 300, 60, { align: 'center' });

            const canvasElement = document.querySelector('canvas');
            if (canvasElement) {
                const chartImage = canvasElement.toDataURL('image/png');
                doc.addImage(chartImage, 'PNG', 170, 70, 300, 250);
            }

            let yOffset = 350;
            const pageWidth = doc.internal.pageSize.width;
            Object.values(groupedData).forEach((categoryData) => {
                const categoryTitle = reverseHebrewText(categoryData.category);
                doc.setFontSize(14);

                doc.text(categoryTitle, pageWidth - 40, yOffset, { align: 'right' });
                const tableData = categoryData.strengths.map((item, index) => [
                    {
                        content: reverseHebrewText(categoryData.weaknesses[index]?.valueDesc || ''),
                        styles: { fillColor: '#f8d7da' }
                    },
                    {
                        content: reverseHebrewText(item?.valueDesc || ''),
                        styles: { fillColor: '#d4edda' }
                    }
                ]);

                tableData.forEach((row, index) => {
                    if (categoryData.strengths[index]?.isHadConflict) {
                        row[0].content += ' ★';
                    }
                    if (categoryData.weaknesses[index]?.isHadConflict) {
                        row[1].content += ' ★';
                    }
                });

                tableData.forEach((row) => {
                    row.forEach((cell) => {
                        if (cell.content.length > 60) {
                            let wrappedLines = doc.splitTextToSize(cell.content, 300);
                            wrappedLines = wrappedLines.reverse();
                            cell.content = wrappedLines.join('\n');
                        }
                    });
                });

                autoTable(doc, {
                    startY: yOffset + 20,
                    head: [[reverseHebrewText('חוזקות'), reverseHebrewText('חולשות')]],
                    body: tableData,
                    theme: "grid",
                    styles: { font: "Tahoma Regular", fontSize: 10, halign: "center" },
                    headStyles: { fillColor: [54, 162, 235] },
                    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' } },
                });

                yOffset = (doc as any).lastAutoTable.finalY + 20;
            });

            doc.save(`סטטוס_${studentDet?.studentName}_${studentDet?.year}.pdf`);
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
