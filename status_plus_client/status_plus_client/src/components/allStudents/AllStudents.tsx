import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Pagination, Table, Button, Upload, Progress, Popconfirm } from 'antd';
import { ColumnType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DeleteOutlined, EditOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';

import { Student } from '../../models/Student';
import { studentService } from '../../services/studentService';
import Message from '../Message';
import { studentStatusService } from '../../services/studentStatusService';
import './AllStudents.css';
import { commonService } from '../../services/commonService';

const AllStudents = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [gradeFilter, setGradeFilter] = useState<string | null>(null);
    const [cities, setCities] = useState<{ cityId: number; cityDesc: string }[]>([]);
    const [grades, setGrades] = useState<{ gradeId: number; gradeDesc: string }[]>([]);

    useEffect(() => {
        const savedGradeFilter = sessionStorage.getItem('gradeFilter');
        if (savedGradeFilter) {
            setGradeFilter(savedGradeFilter);
        }
        getStudents();
        getYearForSystem();
        getCitiesList();
        getGradesList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, gradeFilter]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get year data
    const getYearForSystem = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        return currentMonth >= 12 ? (currentYear + 1).toString() : currentYear.toString();
    };
    // get all students
    const getStudents = async () => {
        setLoading(true);
        try {
            const responseFromDB = await studentService.getAllStudents();
            const allStudents = responseFromDB.allStudents[0];
            const studentsWithStatus = await addStatusToStudents(allStudents);
            setStudents(studentsWithStatus);
        } catch (error) {
            addMessage('Error retrieving students', 'error');
        } finally {
            setLoading(false);
        }
    };
    // get the list of the cities
    const getCitiesList = async () => {
        try {
            const responseFromDB = await commonService.getCities();
            setCities(responseFromDB.citiesList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    }
    // get the list of the grades
    const getGradesList = async () => {
        try {
            const responseFromDB = await commonService.getGrade();
            const grades = await responseFromDB.gradesList[0];
            setGrades(grades);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    }
    // clac the status progress
    const addStatusToStudents = async (students: Student[]): Promise<Student[]> => {
        const updatedStudents = await Promise.all(
            students.map(async (student) => {
                const status = await getAmountValues(Number(student.studentId));
                if (status) {
                    const {
                        totalExpectedValues,
                        totalFilledValues,
                        totalDistinctExpectedValues,
                        totalFinalChoiceValues,
                    } = status;

                    const statusPercentage1 = totalExpectedValues
                        ? Math.round((totalFilledValues / totalExpectedValues) * 100)
                        : 0;

                    const statusPercentage2 = totalDistinctExpectedValues
                        ? Math.round((totalFinalChoiceValues / totalDistinctExpectedValues) * 100)
                        : 0;

                    const statusPercentage = Math.max(statusPercentage1, statusPercentage2);

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
    // clac the status progress
    const getAmountValues = async (studentId: number) => {
        try {
            const year = getYearForSystem();
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId, year);
            const numbersOfValues = responseFromDB.numbersOfValues[0][0];
            return {
                totalExpectedValues: numbersOfValues.totalExpectedValues,
                totalFilledValues: numbersOfValues.totalFilledValues,
                totalDistinctExpectedValues: numbersOfValues.totalDistinctExpectedValues,
                totalFinalChoiceValues: numbersOfValues.totalFinalChoiceValues
            };
        } catch (error) {
            addMessage('Error retrieving student status', 'error');
        }
    };
    // open the status of the student
    const onViewingStudentStatusClick = async (student_id: string) => {
        const isStatusFinish = await checkStudentStatus(Number(student_id));
        const numbersOfValues = isStatusFinish.numbersOfValues[0][0];
        if ((numbersOfValues.totalExpectedValues === (numbersOfValues.totalFilledValues) || (numbersOfValues.totalExpectedValues === numbersOfValues.totalFilledValues + numbersOfValues.totalFinalChoiceValues)) || numbersOfValues.totalDistinctExpectedValues === numbersOfValues.totalFinalChoiceValues) {
            const conflictsList = await getConflictsList(student_id);
            if (conflictsList.length === 0) {
                navigate(`/menu/status-options/${student_id}`, { state: { from: location.pathname } });
            }
            else {
                addMessage("סטטוס התלמיד עדיין לא מוכן, אין אפשרות להציג", "error");
            }
        }
        else {
            const employees = isStatusFinish.numbersOfValues[1];
            printError(employees);
        }
    }
    // print the list of employees who not fill thw status
    const printError = (employees: any[]) => {
        const incompleteEmployees = employees
            .filter(employee => employee.totalValuesFilled !== employee.totalValuesToFill)
            .map(employee => employee.employeeName);  // Extract employee names

        if (incompleteEmployees.length > 0) {
            const employeeNamesList = incompleteEmployees.join(', ');
            addMessage(`סטטוס התלמיד עדיין לא מוכן, ישנם אנשי צוות שעדיין לא מילאו: ${employeeNamesList}`, "error");
        } else {
            addMessage("סטטוס התלמיד עדיין לא מוכן", "error");
        }

    }
    // check if all employees fill the status
    const checkStudentStatus = async (studentId: number) => {
        try {
            const year = await getYearForSystem();
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId, year);
            return responseFromDB;
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        }
    }
    // get the conflicts list
    const getConflictsList = async (studentId: string) => {
        const student_id = Number(studentId);
        try {
            const studentConflictsResponse = await studentStatusService.getConflictsList(student_id);
            const conflictsList = studentConflictsResponse.conflictsList[0];
            return conflictsList;
        } catch (error) {
            console.error('Error fetching student status:', error);
        }
    }
    // serach option
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };
    // get the true data
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
    // when table change
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
    // when move to other page
    const handlePageChange = (page: number, pageSize: number) => {
        setCurrentPage(page);
        setPageSize(pageSize);
    };
    // on edit syudet details
    const onUpdateStudentClick = (student: Student) => {
        if (gradeFilter) {
            sessionStorage.setItem('gradeFilter', gradeFilter);
        }
        navigate(`/menu/student-details/${student.studentId}`, { state: { from: location.pathname } });
    };
    // when try delete student
    const handleDelete = async (studentId: string) => {
        const year = getYearForSystem();
        const deleteStudentRes = await studentService.deleteStudent(studentId, year);
        if (deleteStudentRes.studentDelete[0][0].status === 1) {
            addMessage('Student deleted successfully', 'success');
        } else {
            addMessage('Failed to delete student', 'error');
        }
        getStudents();
    };
    // when click in add student button
    const addNewStudent = () => {
        navigate(`/menu/student-details/`, { state: { from: location.pathname } });
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
                    if (englishKey === 'city') {
                        const city = cities.find((c) => c.cityDesc === value);
                        mappedStudent[englishKey] = city ? city.cityId : null;
                    } else if (englishKey === 'grade') {
                        const grade = grades.find((g) => g.gradeDesc === value);
                        mappedStudent[englishKey] = grade ? grade.gradeId : null;
                    } else {
                        mappedStudent[englishKey] = value;
                    }
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
            addMessage('התלמידים יובאו בהצלחה', 'success');
            exportExcelFile(failStudents);
            getStudents();
        };

        reader.readAsBinaryString(file);
    };
    // export to excel the students how dont imported to DB
    const exportExcelFile = async (rows: ({ student: any; status: string; result: any; error?: undefined; } | { student: any; status: string; error: any; result?: undefined; })[]) => {
        const perfectRows: any[] = [];
        // eslint-disable-next-line array-callback-return
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
    // table columns
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
                    status={record.statusPercentage === 100 ? 'success' : 'active'}
                />
            ),
        },
        {
            title: 'עריכה',
            key: 'edit',
            render: (text: any, record: any) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => onUpdateStudentClick(record)}
                    />
                </div>
            ),
            width: 100,
        },
        {
            title: 'מחיקה',
            key: 'delete',
            render: (text: any, record: any) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Popconfirm
                        title="האם אתה בטוח שאתה רוצה למחוק את התלמיד?"
                        onConfirm={() => handleDelete(record.studentId)}
                        okText="כן"
                        cancelText="לא"
                    >
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </div>
            ),
            width: 100,
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
            width: 100,
        },
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
                    }}>
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
        </>
    );
};

export default AllStudents;