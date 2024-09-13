import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Spin, Card, List } from 'antd';
// import { jsPDF } from "jspdf";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import './StudentStatus.css'
import { studentStatusService } from '../../services/studentStatusService';
import { StudentStatusValue } from '../../models/StudentStatusValue';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Message from '../Message';

const { Title } = Typography;

const StudentStatus = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/default-path';
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [studentDet, setStudentDet] = useState<{ studentName: string, year: string }>();
    const [employeeDet, setEmployeeDet] = useState<{ employeeName: string, jobId: number, jobDesc: string }[]>([]);
    const [studentStatus, setStudentStatus] = useState<StudentStatusValue[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    useEffect(() => {
        fetchStudentStatus();
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get status data
    const fetchStudentStatus = async () => {
        setLoading(true);
        try {
            const studentSatusResponse = await studentStatusService.getStudentStatus(Number(studentId));
            setEmployeeDet(studentSatusResponse.studentStatusData[0]);
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
    // whe clicking category
    const onExpand = (expanded: boolean, record: { key: string }) => {
        setExpandedKeys(keys =>
            expanded
                ? [...keys, record.key]
                : keys.filter(k => k !== record.key)
        );
    };
    // export status to PDF
    // const generatePDF = () => {
    //     const input = document.getElementById('statusContent'); // Get the container element that includes the entire table
    //     if (input) {
    //         html2canvas(input).then((canvas) => {
    //             const imgData = canvas.toDataURL('image/png');
    //             const pdf = new jsPDF('p', 'mm', 'a4');
    //             const imgProps = pdf.getImageProperties(imgData);
    //             const pdfWidth = pdf.internal.pageSize.getWidth();
    //             const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    //             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    //             // Add a new page to the PDF and capture the content of the table
    //             pdf.addPage();
    //             pdf.html(input, {
    //                 html2canvas: { scale: 0.19 },
    //                 x: 10,
    //                 y: 10,
    //                 callback: () => {
    //                     pdf.save("student-status.pdf");
    //                 }
    //             });
    //         });
    //     }
    // };
    const generatePDF = () => {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            floatPrecision: 16
        });

        // הוסף גופן עברי
        doc.addFont('path/to/hebrew-font.ttf', 'Hebrew', 'normal');
        doc.setFont('Hebrew');

        const pdf = new jsPDF('p', 'mm', 'a4');
        let yOffset = 10;

        // כותרת
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text(`סטטוס ${studentDet?.studentName} ${studentDet?.year}`, pdf.internal.pageSize.width / 2, yOffset, { align: "center" });
        yOffset += 10;

        // אנשי צוות
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("אנשי צוות ממלאים:", 10, yOffset);
        yOffset += 10;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        employeeDet.forEach(employee => {
            pdf.text(`${employee.employeeName} - ${employee.jobDesc}`, 10, yOffset);
            yOffset += 7;
        });

        yOffset += 10;

        // סטטוס התלמיד
        Object.entries(groupedStatus).forEach(([category, values]) => {
            // בדיקה אם צריך דף חדש
            if (yOffset > 270) {
                pdf.addPage();
                yOffset = 10;
            }

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.text(category, 10, yOffset);
            yOffset += 10;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            values.forEach(value => {
                pdf.text(`ערך: ${value.valueDesc}`, 15, yOffset);
                yOffset += 7;
                pdf.text(`חוזקה: ${value.studentGrade === 'Strength' || value.studentGrade === 'both' ? '✓' : '-'}`, 15, yOffset);
                yOffset += 7;
                pdf.text(`חולשה: ${value.studentGrade === 'Weakness' || value.studentGrade === 'both' ? '✓' : '-'}`, 15, yOffset);
                yOffset += 7;
                if (value.note) {
                    pdf.text(`הערות: ${value.note}`, 15, yOffset);
                    yOffset += 7;
                }
                yOffset += 5;

                // בדיקה אם צריך דף חדש
                if (yOffset > 270) {
                    pdf.addPage();
                    yOffset = 10;
                }
            });
        });

        pdf.save("student-status.pdf");
    };
    function reverseRTL(str: string) {
        return str.split('').reverse().join('');
    }
    const printPDF = () => {
        // Open all the category tabs by setting all keys as expanded
        setExpandedKeys(Object.keys(groupedStatus));

        // Wait for a short delay to ensure all tabs are expanded before printing
        setTimeout(() => {
            window.print();
        }, 1000); // Adjust the delay as needed
    };
    // navigate to the privious component
    const navigateBack = () => {
        navigate(from);
    };
    // navigate to the second status vision
    const changeVision = () => {
        navigate(`/menu/student-status-table/${studentId}`, { state: { from: location.pathname } });
    }
    return (
        <><div style={{ direction: 'ltr' }} id="content-to-print">
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}
            <div className='container'>
                <Title level={2}>סטטוס {studentDet?.studentName} {studentDet?.year}</Title>
                {/* <Button onClick={navigateBack} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                    חזרה
                </Button> */}
                <Button onClick={generatePDF} type="primary" style={{ marginTop: '10px', marginRight: '80px' }}>הורד PDF</Button>
                <Button onClick={changeVision} style={{ marginRight: '60px' }}>שנה תצוגה</Button>
            </div>
        </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1px' }}>
                <Card
                    style={{ borderRadius: '10px', width: '100%', maxWidth: '1200px', direction: 'rtl', backgroundColor: '#b4d3ef' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        {/* רשימת אנשי הצוות */}
                        <div style={{ width: '25%', marginLeft: '20px' }}>
                            <Title level={4}>אנשי צוות ממלאים</Title>
                            <List
                                dataSource={employeeDet}
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
        </>
    );
};

export default StudentStatus;