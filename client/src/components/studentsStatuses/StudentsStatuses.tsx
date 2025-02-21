import React, { useState, useEffect } from 'react';
import { Table, Input, Pagination, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { useLocation, useNavigate } from 'react-router-dom';

import { StudentsStatus } from "../../models/StudentStatus";
import { studentStatusService } from '../../services/studentStatusService';
import './StudentsStatuses.css';
import Message from '../Message';
import { studentService } from '../../services/studentService';

// const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get correct year
    const getYearForSystem = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const year = currentMonth >= 12 ? currentYear + 1 : currentYear;
        return year.toString();
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
    // Handle file upload
    const handleUpload = async (file: any, studentId: string) => {
        const year = await getYearForSystem();
        uploadStudentPDFFile(studentId, file, year)
    };
    // Function to upload a PDF file after converting it to Base64
    const uploadStudentPDFFile = async (studentId: string, file: File, year: string) => {
        try {
            // Step 1: Read the file and convert it to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file); // Read file as Data URL (Base64 encoded string)

            reader.onloadend = async () => {
                const base64PDF = reader.result; // Get Base64-encoded string

                // Step 2: Upload the Base64 PDF to the server
                await studentService.uploadStudentPDF(studentId, base64PDF, year);
                console.log('PDF uploaded successfully.');
            };

            reader.onerror = (error) => {
                console.error('Error reading file:', error);
            };
        } catch (error) {
            console.error('Error uploading PDF:', error);
        }
    };
    // Handle viewing student status
    const onViewingStudentStatusClick = (student_id: string) => {
        navigate(`/menu/statuses-list/${student_id}`, { state: { from: location.pathname } });
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
            title: 'צפיה בסטטוס התלמיד',
            key: 'see',
            render: (text: any, record: any) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => onViewingStudentStatusClick(record.studentId)}
                    />
                </div>
            ),
            width: 150,
        },
        // {
        //     title: 'העלה PDF',
        //     key: 'uploadPDF',
        //     render: (text, record) => (
        //         <Upload
        //             accept=".pdf"
        //             showUploadList={false}
        //             beforeUpload={(file) => {
        //                 handleUpload(file, record.studentId);
        //                 return false;
        //             }}
        //         >
        //             <Button icon={<UploadOutlined />} loading={uploading}>Upload PDF</Button>
        //         </Upload>
        //     ),
        //     width: 150,
        // },
    ];

    return (
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">סטטוסי תלמידי בית הספר</h1>
            </div>
            <br />
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
