import React, { useState, useEffect } from 'react';
import { Table, Input, Image, Pagination, Upload, Button, message as AntMessage } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { useLocation, useNavigate } from 'react-router-dom';

import { StudentsStatus } from "../../models/StudentStatus";
import view from '../../assets/view.png';
import { studentStatusService } from '../../services/studentStatusService';
import './StudentsStatuses.css';
import Message from '../Message';
import { studentService } from '../../services/studentService';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

const StudentsStatuses = () => {
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [studentsStatuses, setStudentsStatuses] = useState<StudentsStatus[]>([]);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();
    const location = useLocation();
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        getStudentsStatuses();
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };

    // Get all students' statuses from the last 5 years
    const getStudentsStatuses = async () => {
        setLoading(true);
        try {
            const responseFromDB = await studentStatusService.getStudentsStatuses();
            const studentsStatuses = await responseFromDB.studentsStatuses[0];
            setStudentsStatuses(studentsStatuses);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const result = reader.result as string; // Ensure result is a string (data URL)
                const base64String = result.split(',')[1]; // Extract base64 part
                resolve(base64String);
            };

            reader.onerror = error => reject(error);

            reader.readAsDataURL(file); // Read file as base64 encoded data URL
        });
    };


    // Handle file upload
    const handleUpload = async (file: any, studentId: string) => {
        try {
            setUploading(true);
            // Convert the PDF to base64
            const base64PDF = await fileToBase64(file);
            // Upload the base64 PDF via the service
            await studentService.uploadStudentPDF(studentId, base64PDF, 'תשפד');
            AntMessage.success('ה-PDF הועלה ונשמר בהצלחה');
        } catch (error) {
            console.error('Error uploading PDF:', error);
            AntMessage.error('שגיאה בהעלאת ה-PDF');
        } finally {
            setUploading(false);
        }
    };


    // Handle viewing student status
    const onViewingStudentStatusClick = (student_id: string) => {
        navigate(`statuses-list/${student_id}`, { state: { from: location.pathname } });
    };

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    // Filter students based on search text
    const filteredStudents = studentsStatuses.filter(student =>
        Object.keys(student).some(key =>
            student[key as keyof StudentsStatus]?.toString().toLowerCase().includes(searchText.toLowerCase())
        )
    );

    // Pagination handler
    const handlePageChange = (page: number, pageSize: number) => {
        setCurrentPage(page);
        setPageSize(pageSize);
    };

    // Paginated students
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    const columns: ColumnType<StudentsStatus>[] = [
        {
            title: 'תעודת זהות',
            dataIndex: 'studentId',
            key: 'studentId',
            sorter: (a: StudentsStatus, b: StudentsStatus) => a.studentId.localeCompare(b.studentId),
            width: 150,
        },
        {
            title: 'שם פרטי',
            dataIndex: 'firstName',
            key: 'firstName',
            sorter: (a: StudentsStatus, b: StudentsStatus) => a.firstName.localeCompare(b.firstName),
        },
        {
            title: 'שם משפחה',
            dataIndex: 'lastName',
            key: 'lastName',
            sorter: (a: StudentsStatus, b: StudentsStatus) => a.lastName.localeCompare(b.lastName),
        },
        {
            title: 'טלפון',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'כתובת',
            dataIndex: 'address',
            key: 'address',
            sorter: (a: StudentsStatus, b: StudentsStatus) => a.address.localeCompare(b.address),
        },
        {
            title: 'עיר',
            dataIndex: 'city',
            key: 'city',
            sorter: (a: StudentsStatus, b: StudentsStatus) => a.city.localeCompare(b.city),
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
                        onClick={() => onViewingStudentStatusClick(record.studentId)}
                    />
                </div>
            ),
            width: 150,
        },
        {
            title: 'העלה PDF',
            key: 'uploadPDF',
            render: (text, record) => (
                <Upload
                    accept=".pdf"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleUpload(file, record.studentId); // Replace with actual student ID
                        return false;
                    }}
                >
                    <Button icon={<UploadOutlined />} loading={uploading}>Upload PDF</Button>
                </Upload>
            ),
            width: 150,
        },
    ];

    return (
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">סטטוסי תלמידי בית הספר</h1>
            </div>
            <div className="container">
                <div className="inner-container">
                    <div className="search-container">
                        <Input
                            placeholder="חיפוש תלמיד"
                            value={searchText}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                    <Table
                        columns={columns}
                        dataSource={paginatedStudents}
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
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredStudents.length}
                        onChange={handlePageChange}
                        showSizeChanger
                        pageSizeOptions={['10', '20', '50', '100']}
                        locale={{
                            items_per_page: 'לכל דף',
                            jump_to: 'עבור ל',
                            jump_to_confirm: 'אישור',
                            page: '',
                            prev_page: 'העמוד הקודם',
                            next_page: 'העמוד הבא',
                            prev_5: 'הקודם 5',
                            next_5: 'הבא 5',
                            prev_3: 'הקודם 3',
                            next_3: 'הבא 3',
                        }}
                    />
                </div>
            </div>
        </>
    );
}

export default StudentsStatuses;
