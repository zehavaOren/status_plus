import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Pagination, Table, Image, Button, Upload, Progress, Popconfirm, message as AntMessage } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { studentService } from '../../services/studentService';
import { studentStatusService } from '../../services/studentStatusService';
import { Student } from '../../models/Student';
import view from '../../assets/view.png';
import edit from '../../assets/edit.png';
import Message from '../Message';
import './AllStudents.css';

const AllStudents = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [gradeFilter, setGradeFilter] = useState<string | null>(null);

    useEffect(() => {
        getStudents();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, gradeFilter]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };

    const getStudents = async () => {
        setLoading(true);
        try {
            const responseFromDB = await studentService.getAllStudents();
            const allStudents = responseFromDB.allStudents[0];
            const studentsWithStatus = await addStatusToStudents(allStudents);
            setStudents(studentsWithStatus);
        } catch (error) {
            addMessage('Error fetching students data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addStatusToStudents = async (students: Student[]): Promise<Student[]> => {
        const updatedStudents = await Promise.all(
            students.map(async (student) => {
                const status = await getAmuntValues(Number(student.studentId));
                if (status) {
                    const { totalExpectedValues, totalFilledValues } = status;
                    const statusPercentage = totalExpectedValues
                        ? Math.round((totalFilledValues / totalExpectedValues) * 100)
                        : 0;
                    return {
                        ...student,
                        statusPercentage,
                    };
                }
                return student;
            })
        );

        return updatedStudents;
    };

    const getAmuntValues = async (studentId: number) => {
        try {
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId, 'year');
            const numbersOfValues = responseFromDB.numbersOfValues[0][0];
            return {
                totalExpectedValues: numbersOfValues.totalExpectedValues,
                totalFilledValues: numbersOfValues.totalFilledValues
            };
        } catch (error) {
            addMessage('Error fetching student status', 'error');
        }
    };

    // Convert file to base64 string
    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Handle file upload
    // const handleUpload = async (file: File, studentId: string) => {
    //     try {
    //         const base64PDF = await convertToBase64(file);  // Convert PDF to base64
    //         // Save base64 string to database (through service)
    //         await studentService.uploadStudentPDF(studentId, base64PDF, 'תשפד');  // Create an appropriate API service
    //         addMessage(`PDF uploaded successfully for student ID: ${studentId}`, 'success');
    //     } catch (error) {
    //         addMessage(`Error uploading PDF for student ID: ${studentId}`, 'error');
    //     }
    // };

    const columns = [
        {
            title: 'Student ID',
            dataIndex: 'studentId',
            key: 'studentId',
        },
        {
            title: 'First Name',
            dataIndex: 'firstName',
            key: 'firstName',
        },
        {
            title: 'Last Name',
            dataIndex: 'lastName',
            key: 'lastName',
        },
        {
            title: 'Upload PDF',
            key: 'uploadPDF',
            render: (text: any, record: Student) => (
                <Upload
                    accept=".pdf"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        // handleUpload(file, record.studentId);
                        return false;  // Prevent automatic upload, we handle it manually
                    }}
                >
                    <Button icon={<UploadOutlined />}>Upload PDF</Button>
                </Upload>
            ),
        },
    ];

    return (
        <>
            <Message messages={messages} duration={5000} />
            <Table
                columns={columns}
                dataSource={students}
                loading={loading}
                rowKey="studentId"
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: students.length,
                    onChange: (page, pageSize) => {
                        setCurrentPage(page);
                        setPageSize(pageSize);
                    },
                }}
            />
        </>
    );
};

export default AllStudents;
