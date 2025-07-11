import React, { useEffect, useState } from 'react';
import { Button, Upload, Select, Row, Col, Typography, Input, Spin } from 'antd';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { Student } from '../../models/Student';
import { Grade } from '../../models/Grades';
import { studentService } from '../../services/studentService';
import { commonService } from '../../services/commonService';
import Message from '../Message';

const { Title } = Typography;
const { Option } = Select;

const UploadYearComponent = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [uploadyearsucceed, setUploadyearsucceed] = useState<boolean>(false);
    const [numClasses, setNumClasses] = useState(1);
    const [cities, setCities] = useState<{ cityId: number; cityDesc: string }[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [gradeList, setGradeList] = useState<Grade[]>([]);
    const [teachers, setTteachers] = useState<{ employee_id: string; last_name: string; first_name: string; job_id: number }[]>([]);
    const [availableTeachers, setAvailableTeachers] = useState<{ employee_id: string; last_name: string; first_name: string; job_id: number }[]>([]);
    const [selectedTeachers, setSelectedTeachers] = useState<{ [key: string]: string }>({});
    const [studentsByGrade, setStudentsByGrade] = useState<{ [key: string]: string[] }>({});
    const [targetYear, setTargetYear] = useState<string>();

    useEffect(() => {
        getStudents();
        getCitiesList();
        getGradesList();
        getTeachers();
    }, []);

    useEffect(() => {
        if (gradeList.length > 0) {
            GetClasses();
        }
    }, [gradeList]);

    useEffect(() => {
        setAvailableTeachers(teachers);
    }, [teachers]);

    // get year data
    const getYearForSystem = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        return currentMonth >= 12 ? (currentYear + 1).toString() : currentYear.toString();
    };

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };

    const handleSelectChange = (teacherId: string, className: string) => {
        setSelectedTeachers((prevState) => ({
            ...prevState,
            [className]: teacherId,
        }));

        setAvailableTeachers((prev) => prev.filter((teacher) => teacher.employee_id !== teacherId));
        console.log("selectedteachers", selectedTeachers)
    };

    const getStudents = async () => {
        setLoading(true);
        try {
            const responseFromDB = await studentService.getAllStudents();
            const allStudents = responseFromDB.allStudents[0];
            setAllStudents(allStudents);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    }

    const updateStudents = async (year: string) => {
        setLoading(true);
        try {
            const responseFromDB = await commonService.updateStudents(year, numClasses);
            if (responseFromDB.studentsUpdated[0][0]?.status === 1) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    }

    const uploadyear = async () => {
        try {
            const year = targetYear || getYearForSystem();
            if (!targetYear) {
                addMessage('חובה להכניס שנה', 'error');
                return;
            }
            const studentsSuccess = await updateStudents(year);
            getGradesList();
            setUploadyearsucceed(true);
            if (studentsSuccess) {
            } else {
                console.error("Failed to update classes");
            }
        } catch (error) {
            console.error("Error during upload:", error);
        }
    };

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

    const getCitiesList = async () => {
        setLoading(true);
        try {
            const responseFromDB = await commonService.getCities();
            setCities(responseFromDB.citiesList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    };

    const importStudents = (file: any) => {
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
                        mappedStudent[englishKey] = 1;
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
            getStudents();
        };

        reader.readAsBinaryString(file);
    };

    const exportExampleStudents = async () => {
        const perfectRows: any[] = [];
        const obj = {
            'תעודת זהות': "22222222",
            'שם משפחה': "לוי",
            'שם פרטי': "יצחק",
            'טלפון 1': "0548787784",
            'טלפון 2': "0548958585",
            'תאריך לידה': "12/12/2017",
            'כתובת': "הבנים 12",
            'עיר': "רמת גן",
            'שכבה': "א",
            'כיתה': "1",
        }
        perfectRows.push(obj);
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
            ];
            worksheet['!cols'] = wscols;
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Student Example"); //שם של הגליון
            const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
            saveAs(data, 'דוגמא לתלמיד.xlsx');
        } catch (error) {
            console.error('Error creating Excel file:', error);
        }

    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setNumClasses(value);
        }
    };

    const getGradesList = async () => {
        try {
            const responseFromDB = await commonService.getGradesAndClasses();
            const grades: Grade[] = responseFromDB.gradesAndClasses[0];
            setGradeList(grades.map((grade: Grade, index: number) => ({ ...grade, id: index + 1 })));
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        }
    };

    const GetClasses = () => {
        let classes: string[] = [];
        console.log("gradeList", gradeList)
        gradeList.forEach((grade: Grade) => {
            if (grade.classId) {
                classes.push(grade.gradeDesc + grade.classId);
            } else {
                classes.push(grade.gradeDesc + '1');
            }
        });
        setClasses(classes);
    }

    const getTeachers = async () => {
        setLoading(true);
        try {
            const responseFromDB = await commonService.getTeachers();
            setTteachers(responseFromDB.teachersList[0])
        }
        catch {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        }
        finally {
            setLoading(false);
        }
    }

    const getGradeIdByDesc = (gradeDesc: string, classId: string) => {
        let returnclassId = null;

        if (!gradeDesc) return null;

        const matchingGrades = gradeList.filter((grade) => grade.gradeDesc === gradeDesc);

        if (matchingGrades.length > 1) {
            returnclassId = classId;
        }

        return {
            gradeId: matchingGrades.length > 0 ? matchingGrades[0].gradeId : null,
            classId: returnclassId
        };
    };

    const getStudentsByGrade = async () => {
        setLoading(true);
        const tempData: { [key: string]: string[] } = {};
        for (const className of Object.keys(selectedTeachers)) {

            const gradeData = getGradeIdByDesc(className[0], className[1]);

            const data = {
                gradeId: gradeData?.gradeId,
                classId: gradeData?.classId,
            }

            try {
                const responseFromDB = await commonService.getStudentsByGrade(data);
                tempData[className] = responseFromDB.studentsByGradeList[0];
                // setStudentsByGrade((prevState) => ({
                //     ...prevState,
                //     [className]: responseFromDB.studentsByGradeList[0],
                // }));
            }
            catch {
                addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            }
            // finally {

            //     setStudentsByGrade(tempData);
            //     setLoading(false);
            //     console.log("studentsByGrade", studentsByGrade)
            //     return tempData;
            // }
        }
        setStudentsByGrade(tempData);
        setLoading(false);
        return tempData;
    }

    const saveTeachersForStudents = async () => {
        const tempData = await getStudentsByGrade();
        if (tempData) {
            addEmployeesForStudents(tempData);
        }
    }

    const getTeacherIdByGrade = (grade: string) => {
        return selectedTeachers.hasOwnProperty(grade) ? selectedTeachers[grade] : null;
    }

    const addEmployeesForStudents = async (studentsData: { [key: string]: string[] }) => {
        setLoading(true);
        for (const [grade, students] of Object.entries(studentsData)) {
            const teacherId = await getTeacherIdByGrade(grade);
            // const currrentYear = await getYearForSystem()
            const currrentYear = targetYear || getYearForSystem();
            const studentsId = students.map((s: any) => s.student_id).join(',');

            try {
                const responseFromDB = await commonService.addEmployeesForStudents(String(teacherId), studentsId, currrentYear);
            }
            catch {
                addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            }
            finally {
                setLoading(false);
            }
        }
        addMessage('הנתונים נשמרו בהצלחה', 'success');
        navigate(`/menu/all-students/`);
    }

    const getTeacherFullName = (teacherId: string) => {
        const teacher = teachers.find(t => t.employee_id === teacherId);
        return teacher ? `${teacher.first_name} ${teacher.last_name}` : '';
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center', direction: 'rtl' }}>
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}
            <Title level={2}>העלאת שנה</Title>
            <Row justify="center" style={{ marginBottom: '20px' }}>
                <label style={{ marginLeft: '10px' }}>הכנס שנת יעד</label>
                <Input
                    placeholder="למשל 2025"
                    style={{ width: 200 }}
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                />
            </Row>
            <Row justify="center" style={{ marginBottom: '20px' }}>
                <label>הכנס מספר כיתות א</label>
                <Input placeholder="הכנס מספר כיתות א" style={{ width: 200 }} value={numClasses} onChange={handleInputChange} />
                <Button type="primary" size="large" onClick={uploadyear}>העלאת שנה</Button>
            </Row>
            <div>
                <Upload
                    accept=".xlsx, .xls"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        importStudents(file);
                        return false;
                    }}
                >
                    <Button icon={<UploadOutlined />} disabled={!uploadyearsucceed} className='ant-btn ant-btn-primary'>ייבוא תלמידי כיתה א</Button>
                </Upload>
                <Button type="primary" size="large" onClick={exportExampleStudents} disabled={!uploadyearsucceed}>הורד קובץ לדוגמא</Button>
            </div>
            {classes.map((className, classIndex) => (
                <div key={classIndex}>
                    <label style={{ marginLeft: '10px' }}> כיתה {className}</label>
                    <Select defaultValue="מורת בוקר" style={{ width: '150px' }} value={getTeacherFullName(selectedTeachers[className]) || ''} onChange={(value) => handleSelectChange(value, className)}>
                        {availableTeachers.map((teacher) => (
                            <Option dir="rtl" key={teacher.employee_id} value={teacher.employee_id}>{`${teacher.first_name} ${teacher.last_name}`}</Option>))}
                    </Select>
                </div>
            ))}
            <Button type="primary" size="large" onClick={saveTeachersForStudents}>שמירה</Button>
        </div>
    );
};

export default UploadYearComponent;
