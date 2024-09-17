import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Pagination, Table, Image, Button, Modal, Upload, Progress } from 'antd';
import { ColumnType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import view from '../../assets/view.png';
import { Student } from '../../models/Student';
import { studentService } from '../../services/studentService';
import edit from '../../assets/edit.png';
import deleteIcon from '../../assets/deleteIcon.png';
import Message from '../Message';
import './AllStudents.css';
import { UploadOutlined } from '@ant-design/icons';
import { studentStatusService } from '../../services/studentStatusService';



const AllStudents = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]); const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [gradeFilter, setGradeFilter] = useState<string | null>(null);
    const [file, setFile] = useState(null);

    useEffect(() => {
        getStudents();
    }, []);
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, gradeFilter]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get the studnets list
    const getStudents = async () => {
        setLoading(true);
        try {
            const responseFromDB = await studentService.getAllStudents();
            const allStudents = responseFromDB.allStudents[0];
            const studentsWithStatus = await addStatusToStudents(allStudents);
            setStudents(studentsWithStatus);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };
    // calc ths status Progress
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
    // get the anount of the values to calc the progress
    const getAmuntValues = async (studentId: number) => {
        try {
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId);
            const numbersOfValues = responseFromDB.numbersOfValues[0][0];
            return {
                totalExpectedValues: numbersOfValues.totalExpectedValues,
                totalFilledValues: numbersOfValues.totalFilledValues
            };
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        }
    }
    //see student statuses
    const onViewingStudentStatusClick = (student_id: string) => {
        navigate(`statuses-list/${student_id}`);
    }
    //search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };
    // filter and sort data before pagination
    const getFilteredAndSortedData = () => {
        let filteredStudents = students;
        if (searchText) {
            filteredStudents = students.filter(student =>
                Object.keys(student).some(key =>
                    student[key as keyof Student]?.toString().toLowerCase().includes(searchText.toLowerCase())
                )
            );
        }
        if (gradeFilter) {
            filteredStudents = filteredStudents.filter(student => student.grade === gradeFilter);
        }
        return filteredStudents;
    };
    // sort and filter before paging
    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
        if (filters.grade && filters.grade.length > 0) {
            setGradeFilter(filters.grade[0]);
        } else {
            setGradeFilter(null);
        }

        const { field, order } = sorter;
        let sortedStudents = [...students];

        if (field && order) {
            sortedStudents.sort((a: any, b: any) => {
                if (a[field] < b[field]) {
                    return order === 'ascend' ? -1 : 1;
                }
                if (a[field] > b[field]) {
                    return order === 'ascend' ? 1 : -1;
                }
                return 0;
            });
        }

        setStudents(sortedStudents);
        setCurrentPage(1);
    };
    const filteredAndSortedData = getFilteredAndSortedData();
    const paginatedStudents = filteredAndSortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    // paging
    const handlePageChange = (page: number, pageSize: number) => {
        setCurrentPage(page);
        setPageSize(pageSize);
    };
    // navigate to student form
    const onUpdateStudentClick = (student: Student) => {
        navigate(`/menu/student-details/${student.studentId}`, { state: { from: location.pathname } });
    }
    // confirm the delete modal
    const showDeleteModal = (student: Student) => {
        setStudentToDelete(student);
        setIsModalVisible(true);
    };
    // delete student
    const handleDelete = async () => {
        if (studentToDelete) {
            const deleteStudentRes = await studentService.deleteStudent(studentToDelete.studentId, 'תשפד');
            if (deleteStudentRes.studentDelete[0][0].status === 1) {
                addMessage('התלמיד נמחק בהצלחה', 'success');
            } else {
                addMessage('מחיקת התלמיד נכשלה', 'error');
            }
            getStudents();
            setIsModalVisible(false);
        }
    };
    // cnacel delete
    const handleCancel = () => {
        setIsModalVisible(false);
        setStudentToDelete(null);
    };
    // add new student
    const addNewStudent = () => {
        navigate(`/menu/student-details/`);
    };
    // map excel columns to hebrow
    const columnMapping: { [key: string]: string } = {
        'תעודת זהות': 'studentId',
        'שם משפחה': 'lastName',
        'שם פרטי': 'firstName',
        'טלפון 1': 'phone1',
        'טלפון 2': 'phone2',
        'תאריך לידה': 'birthDate',
        'כתובת': 'address',
        'עיר': 'city',
        'שכבה': 'grade',
        'כיתה': 'clas',
    };
    // import the excel file
    const handleFileChange = (file: any) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const students = XLSX.utils.sheet_to_json(sheet);

            const mappedStudents = students.map((student: any) => {
                const mappedStudent: { [key: string]: any } = {};
                for (const [hebrewKey, value] of Object.entries(student)) {
                    const englishKey = columnMapping[hebrewKey] || hebrewKey;
                    mappedStudent[englishKey] = value;
                }
                return mappedStudent;
            });
            const resImport = await studentService.importStudents(mappedStudents);
            let failStudents: any[] = [];
            resImport.map(async res => {
                if (res.status === 'error') {
                    failStudents.push(res);
                }
            })
            addMessage(`התלמידים יובאו בהצלחה`, 'success');
            exportExcelFile(failStudents);

        };

        reader.readAsBinaryString(file);
    };
    // export to excel the students how dont imported to DB
    const exportExcelFile = async (rows: ({ student: any; status: string; result: any; error?: undefined; } | { student: any; status: string; error: any; result?: undefined; })[]) => {
        const perfectRows: any[] = [];
        rows.map(row => {
            const obj = {
                'תעודת זהות': row.student.studentId,
                'שם משפחה': row.student.lastName,
                'שם פרטי': row.student.firstName,
                'טלפון 1': row.student.phone1,
                'טלפון 2': row.student.phone2,
                'תאריך לידה': row.student.birthDate,
                'כתובת': row.student.address,
                'עיר': row.student.city,
                'שכבה': row.student.grade,
                'כיתה': row.student.clas,
                'שגיאת הכנסה': row.error
            }
            perfectRows.push(obj);
        })
        try {
            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(perfectRows);
            const wscols = [
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 30 }
            ];
            worksheet['!cols'] = wscols;
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Imports");
            const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
            saveAs(data, 'תלמידים שלא יובאו.xlsx');
        } catch (error) {
            console.error('Error creating Excel file:', error);
        }

    }

    const columns: ColumnType<Student>[] = [
        {
            title: 'תעודת זהות',
            dataIndex: 'studentId',
            key: 'studentId',
            sorter: (a: Student, b: Student) => a.studentId.localeCompare(b.studentId),
            width: 150,
        },
        {
            title: 'שם פרטי',
            dataIndex: 'firstName',
            key: 'firstName',
            sorter: (a: Student, b: Student) => a.firstName.localeCompare(b.firstName),

        },
        {
            title: 'שם משפחה',
            dataIndex: 'lastName',
            key: 'lastName',
            sorter: (a: Student, b: Student) => a.lastName.localeCompare(b.lastName),

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
            sorter: (a: Student, b: Student) => a.address.localeCompare(b.address),

        },
        {
            title: 'עיר',
            dataIndex: 'city',
            key: 'city',
            sorter: (a: Student, b: Student) => a.city.localeCompare(b.city),

        },
        {
            title: 'כיתה',
            dataIndex: 'grade',
            key: 'grade',
            filters: Array.from(new Set(students.map(student => student.grade))).map(grade => ({
                text: grade,
                value: grade,
            })),
            filteredValue: gradeFilter ? [gradeFilter] : null,
            onFilter: (value, record) => record.grade === value,
        },
        {
            title: 'סטטוס מילוי נתונים',
            key: 'statusPercentage',
            render: (text, record) => (
                <Progress
                    type="circle"
                    percent={record.statusPercentage || 0}
                    width={40} 
                    // size="small"
                    status={record.statusPercentage === 100 ? 'success' : 'active'}
                />
            ),
        },
        {
            title: 'עדכון פרטי התלמיד',
            key: 'updateStudent',
            render: (text, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={edit}
                        alt="עדכון פרטי התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => onUpdateStudentClick(record)}
                    />
                </div>
            ),
            width: 150,
        },
        {
            title: 'מחיקה',
            key: 'deleteStudent',
            render: (text, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={deleteIcon}
                        alt="מחיקת התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => showDeleteModal(record)}
                    />
                </div>
            ),
            width: 150,
        },
        {
            title: 'צפייה בסטטוס התלמיד',
            key: 'viewStatus',
            render: (text, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        src={view}
                        alt="צפייה סטטוס התלמיד"
                        preview={false}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        onClick={() => onViewingStudentStatusClick(record.studentId)}
                    />
                </div>
            ),
            width: 150,
        }
    ];

    return (
        <>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">תלמידי בית הספר</h1>
                <Upload
                    accept=".xlsx, .xls"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleFileChange(file);
                        return false;
                    }}
                >
                    <Button icon={<UploadOutlined />} className='ant-btn ant-btn-primary import-students-button'>ייבוא תלמידים</Button>
                </Upload>
                <Button type="primary" className="add-student-button" onClick={addNewStudent}>הוסף תלמיד חדש</Button>
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
                                    <th {...props} style={{ ...props.style, backgroundColor: '#0066ff', color: 'white', textAlign: 'center' }} />
                                ),
                            },
                        }}
                        rowClassName={(record, index) =>
                            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                        }
                        onChange={handleTableChange}
                    />
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredAndSortedData.length}
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
                        className="pagination"
                    />
                </div>
            </div>
            <Modal
                title="אישור מחיקת תלמיד"
                open={isModalVisible}
                onOk={handleDelete}
                onCancel={handleCancel}
                okText="אישור"
                cancelText="ביטול"
                style={{ textAlign: 'center' }}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        ביטול
                    </Button>,
                    <Button key="delete" type="primary" onClick={handleDelete}>
                        אישור
                    </Button>,
                ]}
            >
                <p>?האם אתה בטוח שברצונך למחוק את התלמיד</p>
            </Modal>
        </>
    )
}
export default AllStudents;