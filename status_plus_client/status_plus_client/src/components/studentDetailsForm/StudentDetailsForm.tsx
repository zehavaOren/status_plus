import React, { useEffect, useMemo, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Select, DatePicker, Modal, Spin } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';

import './StudentDetailsForm.css';
import { StudentForm } from '../../models/StudentForm';
import { studentService } from '../../services/studentService';
import { commonService } from '../../services/commonService';
import { JobForEmployee } from '../../models/JobForEmployee';
import { Grade } from '../../models/Grades';
import { employeeService } from '../../services/employeeService';
import Message from '../Message';
import { MySingletonService } from '../../services/MySingletonService';

const { Option } = Select;

interface StudentDetailsFormProps {
    componentUrl: string;
}

const StudentDetailsForm: React.FC<StudentDetailsFormProps> = ({ componentUrl }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { studentId } = useParams<{ studentId: string }>();
    const [form] = Form.useForm();
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [studentDetails, setStudentDetails] = useState<StudentForm | null>(null);
    const [citiesList, setCitiesList] = useState<{ cityId: number, cityDesc: string }[]>([]);
    const [jobForEmployee, setJobForEmployee] = useState<JobForEmployee[]>([]);
    const [educators, setEducators] = useState<JobForEmployee[]>([]);
    const [occupationalClinics, setOccupationalClinics] = useState<JobForEmployee[]>([]);
    const [languageTeachers, setLanguageTeachers] = useState<JobForEmployee[]>([]);
    const [gradeList, setGradeList] = useState<Grade[]>([]);
    const [selectedGradeClasses, setSelectedGradeClasses] = useState<number[]>([]);
    const [grade, setGrade] = useState<number>();
    const [jobsList, setJobsList] = useState<{ jobId: number, jobDescription: string }[]>([]);
    const [jobsAndEmployees, setJobsAndEmployees] = useState<Array<{ job: number, employee: string }>>([]);
    const [isItemDisabled, setIsItemDisabled] = useState(false);
    const [employeesForStudent, setEmployeesForStudent] = useState<string[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isFormChanged, setIsFormChanged] = useState(false);
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);

    useEffect(() => {
        if (studentId) {
            fetchStudentDetails(studentId);
            setIsItemDisabled(true);
        }
        else {
            setIsItemDisabled(false);
        }
        getGradesList();
        getCitiesList();
        getJobForEmployee();
        getJobsList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    useEffect(() => {
        if (studentDetails) {
            // Populate the form with student details
            form.setFieldsValue({
                ...studentDetails,
                birthDate: studentDetails.birthDate ? moment(studentDetails.birthDate) : null,
                morningTeacher: studentDetails.morningTeacher || undefined,
                afternoonTeacher: studentDetails.afternoonTeacher || undefined, // Ensure this is populated
                occupationalTherapist: studentDetails.occupationalTherapist || undefined,
                communicationTherapist: studentDetails.communicationTherapist || undefined,
            });
            // Check if the selected grade has associated classes and update the class dropdown
            if (studentDetails.gradeId) {
                handleGradeChange(studentDetails.gradeId);
                if (studentDetails.classId) {
                    form.setFieldsValue({
                        classId: studentDetails.classId,
                    });
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentDetails, form]);

    // Ensure form correctly updates morning and afternoon teachers after educators are fetched
    // useEffect(() => {
    //     if (studentDetails) {
    //         // Fetch educators after student details are populated
    //         form.setFieldsValue({
    //             // Convert studentDetails.morningTeacher to string for comparison
    //             morningTeacher: jobForEmployee.find(job => job.job_id === 10 && job.employee_id === String(studentDetails.morningTeacher))?.employee_id || undefined,
    //             // Convert studentDetails.afternoonTeacher to string for comparison
    //             afternoonTeacher: jobForEmployee.find(job => job.job_id === 11 && job.employee_id === String(studentDetails.afternoonTeacher))?.employee_id || undefined,
    //         });
    //     }
    // }, [jobForEmployee, studentDetails, form]);



    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // Determine the back navigation route
    const from = useMemo(() => {
        if (location.state?.from) {
            return location.state.from;
        }
        if (employeeDet.permission === 1 || employeeDet.permission === 2) {
            return `/students-for-update/${employeeDet.identityNumber}`;
        } else if (employeeDet.permission === 3) {
            return '/all-students';
        } else {
            return location.state?.from || '/menu';
        }
    }, [employeeDet, location.state?.from]);
    // get correct year
    const getYearForSystem = (): string => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const year = currentMonth > 10 ? currentYear + 1 : currentYear;
        return year.toString();
    };
    // get the student details and init the form
    const fetchStudentDetails = async (studentId: string, isShowError?: boolean) => {
        setLoading(true);
        try {
            const responseFromDB = await studentService.getStudentDeatils(studentId);
            const studentDetails = responseFromDB.studentDetails[0][0];
            await fetchEducators(studentDetails.gradeId, studentDetails.classId);
            setStudentDetails({
                ...studentDetails,
                birthDate: studentDetails.birthDate ? moment(studentDetails.birthDate) : null,
            });
            const employees = responseFromDB.studentDetails[1].map((e: { employeeId: any }) => e.employeeId);
            setEmployeesForStudent(employees);
        } catch (error) {
            if (!isShowError) {
                addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            }
        } finally {
            setLoading(false);
        }
    };
    const moratBokerEducators = educators.filter((educator) => educator.job_id === 10);
    const moratTzaherEducators = educators.filter((educator) => educator.job_id === 11);
    // get the list of the cities
    const getCitiesList = async () => {
        try {
            const responseFromDB = await commonService.getCities();
            setCitiesList(responseFromDB.citiesList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    }
    // get the list of the jobs
    const getJobsList = async () => {
        try {
            const responseFromDB = await commonService.getJobs();
            setJobsList(responseFromDB.jobsList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    }
    // get the list of the employee for students
    const getJobForEmployee = async () => {
        try {
            const responseFromDB = await commonService.getJobForEmployee();
            const jobs = await responseFromDB.jobs[0];
            setJobForEmployee(jobs);
            filterJobs(jobs);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    }
    // get the list of the grades
    const getGradesList = async () => {
        try {
            const responseFromDB = await commonService.getGradesAndClasses();
            const grades = await responseFromDB.gradesAndClasses[0];
            const perfectGrades = await addUniqueIdsToGrades(grades);
            setGradeList(perfectGrades);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    }
    // get the list of the employee according to the grade and class that choos
    const getEmployeesByGrade = async (gradeId: number, classId: number | null) => {
        const data = {
            'gradeId': gradeId,
            'classId': classId
        };
        try {
            const responseFromDB = await employeeService.getEmployeesByGrade(data);
            return responseFromDB.employeesDetails[0];
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        } finally {
            setLoading(false);
        }
    }
    // map the employee to the correct input according to his job
    const filterJobs = async (jobs: JobForEmployee[]) => {
        const educatorsArray = jobs.filter(job => job.job_id === 10 || job.job_id === 11 || job.job_id === 23);
        const occupationalClinicsArray = jobs.filter(job => job.job_id === 19);
        const languageTeachersArray = jobs.filter(job => job.job_id === 18);

        setEducators(educatorsArray);
        setOccupationalClinics(occupationalClinicsArray);
        setLanguageTeachers(languageTeachersArray);

    }
    // add id to the grade list to add unique key
    const addUniqueIdsToGrades = async (grades: Grade[]) => {
        return grades.map((grade, index) => {
            return { ...grade, id: index + 1 };
        });
    }
    // map the grade list to select new id as id
    const uniqueGrades = Array.from(
        new Map(gradeList.map(grade => [grade.gradeId, grade])).values()
    );
    // funcionality when grade change to add or remove class input
    const handleGradeChange = (value: number) => {
        const selectedGrade = gradeList.find(grade => grade.gradeId === value);
        setGrade(selectedGrade?.gradeId);
        if (selectedGrade && selectedGrade.classId !== null) {
            const classes = gradeList
                .filter(grade => grade.gradeId === selectedGrade.gradeId && grade.classId !== null)
                .map(grade => grade.classId);

            setSelectedGradeClasses(classes);
        } else {
            setSelectedGradeClasses([]);
        }

        // Fetch the educators based on the selected grade
        if (selectedGrade) {
            fetchEducators(selectedGrade.gradeId, null);
        }
    };
    // funcionality when class change to put the correct employee according to the coose value
    const handleClassChange = async (value: number) => {
        const selectedClass = gradeList.find(grade => grade.classId === value);
        const classId = selectedClass?.classId;
        await fetchEducators(grade! || studentDetails?.gradeId!, classId!);
        form.setFieldsValue({
            classId: value,
            morningTeacher: undefined,
            afternoonTeacher: undefined,
            occupationalTherapist: undefined,
            communicationTherapist: undefined,
        });
    };
    // choose the educators acoording to the grade and class that choos
    const fetchEducators = async (gradeId: number, classId: number | null) => {
        const educatorsFromService = await getEmployeesByGrade(gradeId, classId);
        const educatorIds = educatorsFromService.map((e: { employee_id: any }) => e.employee_id);

        const morningTeacher = jobForEmployee.find(
            job => job.job_id === 10 && educatorIds.includes(job.employee_id) && job.employee_id === String(studentDetails?.morningTeacher)
        );
        const afternoonTeacher = jobForEmployee.find(
            job => job.job_id === 11 && educatorIds.includes(job.employee_id) && job.employee_id === String(studentDetails?.afternoonTeacher)
        );
        const occupationalTherapist = jobForEmployee.find(
            job => job.job_id === 19 && educatorIds.includes(job.employee_id) && job.employee_id === String(studentDetails?.occupationalTherapist)
        );
        const communicationTherapist = jobForEmployee.find(
            job => job.job_id === 18 && educatorIds.includes(job.employee_id) && job.employee_id === String(studentDetails?.communicationTherapist)
        );
        // Set the form with the new teacher names
        form.setFieldsValue({
            morningTeacher: morningTeacher?.employee_id || undefined,
            afternoonTeacher: afternoonTeacher?.employee_id || undefined,
            occupationalTherapist: occupationalTherapist?.employee_id || undefined,
            communicationTherapist: communicationTherapist?.employee_id || undefined,
        });
    };
    // whne finish fill the form
    const handleFinish = (values: any) => {
        onSave(values);
    };
    // when canceling the form
    const onCancel = () => {
        showModal();
    }
    // when saving the form
    const onSave = async (values: StudentForm) => {
        const studentDeail = {
            'studentId': values.studentId,
            'lastName': values.lastName,
            'firstName': values.firstName,
            'phone1': values.phone1,
            'phone2': values.phone2,
            'birthDate': new Date(values.birthDate).toISOString().slice(0, 10),
            'address': values.address,
            'cityId': values.cityId,
            'gradeId': values.gradeId,
            'classId': values.classId
        }
        const fullYear = await getYearForSystem();
        const employeesForStudent = [{
            'student_id': values.studentId,
            'employee_id': values.morningTeacher.toString(),
            'year': fullYear,
            'job_id': 10
        },
        {
            'student_id': values.studentId,
            'employee_id': values.communicationTherapist.toString(),
            'year': fullYear,
            'job_id': 18
        },
        {
            'student_id': values.studentId,
            'employee_id': values.afternoonTeacher.toString(),
            'year': fullYear,
            'job_id': 11
        },
        {
            'student_id': values.studentId,
            'employee_id': values.occupationalTherapist.toString(),
            'year': fullYear,
            'job_id': 19
        }
        ];
        // eslint-disable-next-line array-callback-return
        jobsAndEmployees.map(job => {
            const perfectJob = {
                'student_id': values.studentId,
                'employee_id': job.employee,
                'year': fullYear,
                'job_id': job.job
            }
            employeesForStudent.push(perfectJob);
        })
        const studSave = await saveStudentDetails(studentDeail);
        const resEmpSave = await saveEmployeesForStudent(employeesForStudent);
        if (studSave === 'success' && resEmpSave === 'success') {
            addMessage('הנתונים נשמרו בהצלחה', 'success');
            setTimeout(() => {
                navigate(from);
            }, 1000);
        }
        else {
            addMessage('אופס- שגיאה בשמירת הנתונים', 'error');
        }

    }
    // save the students details
    const saveStudentDetails = async (studentDet: any) => {
        const saveStudentRes = await studentService.upsertStudentDetails(studentDet);
        if (saveStudentRes.studentDetailsSave[0][0].status === 1) {
            return "success";
        }
        return "error";
    }
    // save the employees for studnet list
    const saveEmployeesForStudent = async (employeesForStudent: any[]) => {
        const employeesStudentRes = await studentService.upsertEmployeesForStudent(employeesForStudent);
        // eslint-disable-next-line array-callback-return
        employeesStudentRes.map(empUpsert => {
            if (empUpsert.status !== "success") {
                return "error";
            }
        })
        return "success";
    }
    // add inputs for new job and employee
    const addJobAndEmployee = () => {
        setJobsAndEmployees([...jobsAndEmployees, { job: 0, employee: '' }]);
    };
    // when change the job- change the employees list
    const handleJobChange = (index: number, value: number) => {
        const newRolesAndEmployees = [...jobsAndEmployees];
        newRolesAndEmployees[index].job = value;
        setJobsAndEmployees(newRolesAndEmployees);
    };
    // when change the employee- change the job
    const handleEmployeeChange = (index: number, value: string) => {
        const newRolesAndEmployees = [...jobsAndEmployees];
        newRolesAndEmployees[index].employee = value;
        setJobsAndEmployees(newRolesAndEmployees);
    };
    // get the data of student with the written ID
    const handleStudentIdBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
        fetchStudentDetails(event.target.value, true);
    };
    // update that there is a change in the form
    const onFieldsChange = (changedFields: any, allFields: any) => {
        setIsFormChanged(true);
    };
    // show modal to confirm returning
    const showModal = () => {
        if (isFormChanged) {
            setIsModalVisible(true);
        } else {
            navigateBack();
        }
    };
    // confirm returning
    const handleOk = () => {
        setIsModalVisible(false);
        navigateBack();
    };
    // cancel returning
    const handleCancel = () => {
        setIsModalVisible(false);
    };
    // navigate to the privious component
    const navigateBack = () => {
        navigate(from);
    };
    return (
        <>
            <div style={{ direction: 'ltr' }}>
                <Message messages={messages} duration={5000} />
                {loading && (
                    <div className="loading-overlay">
                        <Spin size="large" />
                    </div>
                )}
                <div className='container'>
                    <h1 style={{ textAlign: 'center' }}>הוספת/ עריכת תלמיד</h1>
                    <Button onClick={showModal} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                        חזרה
                    </Button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1px' }}>
                    <Message messages={messages} duration={5000} />
                    <Card style={{ borderRadius: '10px', width: '90%', maxWidth: '1200px', direction: 'rtl', backgroundColor: '#b4d3ef' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={studentDetails || {}}
                            onFinish={handleFinish}
                            onFieldsChange={onFieldsChange}>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Form.Item
                                        label="תעודת זהות"
                                        className="disabledInput"
                                        name="studentId"
                                        rules={[{ required: true, message: 'חובה למלא תעודת זהות' }]}>
                                        <Input
                                            value={studentId}
                                            disabled={isItemDisabled}
                                            style={{ backgroundColor: 'white' }}
                                            onBlur={handleStudentIdBlur}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="שם משפחה" name="lastName" rules={[{ required: true, message: 'חובה למלא שם משפחה' }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="שם פרטי" name="firstName" rules={[{ required: true, message: 'חובה למלא שם פרטי' }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="תאריך לידה" name="birthDate" rules={[{ required: true, message: 'חובה למלא תאריך לידה' }]}>
                                        <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Form.Item label="טלפון 1" name="phone1" rules={[{ required: true, message: 'חובה למלא טלפון' }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="טלפון 2" name="phone2">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="כתובת" name="address" rules={[{ required: true, message: 'חובה למלא כתובת' }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item label="עיר" name="cityId" rules={[{ required: true, message: 'חובה לבחור עיר' }]}>
                                        <Select>
                                            {citiesList.map(city => (
                                                <Option key={city.cityId} value={city.cityId}>
                                                    {city.cityDesc}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Form.Item label="שכבה" name="gradeId" rules={[{ required: true, message: 'חובה לבחור שכבה' }]}>
                                        <Select placeholder="בחר שכבה" onChange={handleGradeChange}>
                                            {uniqueGrades.map(grade => (
                                                <Option key={grade.id} value={grade.gradeId}>
                                                    {grade.gradeDesc}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                {selectedGradeClasses.length > 0 && (
                                    <Col span={6}>
                                        <Form.Item label="רשימת כיתות" name="classId" rules={[{ required: true, message: 'חובה לבחור כיתה' }]}>
                                            <Select placeholder="בחר כיתה" onChange={handleClassChange}>
                                                {selectedGradeClasses.map(classId => (
                                                    <Option key={classId} value={classId}>
                                                        {classId}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Form.Item label="מורת בוקר" name="morningTeacher" rules={[{ required: true, message: 'חובה לבחור מורת בוקר' }]}>
                                        <Select>
                                            {moratBokerEducators.map((educator) => (
                                                <Option key={educator.employee_id} value={educator.employee_id}>
                                                    {educator.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        label="קלינאית תקשורת"
                                        name="communicationTherapist"
                                        rules={[{ required: true, message: 'חובה לבחור קלינאית תקשורת' }]}
                                    >
                                        <Select>
                                            {languageTeachers.map(languageTeacher => (
                                                <Option key={languageTeacher.employee_id} value={languageTeacher.employee_id}>
                                                    {languageTeacher.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                </Col>
                                <Col span={6}>
                                    <Form.Item label="מורת צהריים" name="afternoonTeacher" rules={[{ required: true, message: 'חובה לבחור מורת צהרים' }]}>
                                        <Select>
                                            {moratTzaherEducators.map((educator) => (
                                                <Option key={educator.employee_id} value={educator.employee_id}>
                                                    {educator.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                </Col>
                                <Col span={6}>
                                    <Form.Item label="מרפאה בעיסוק" name="occupationalTherapist" rules={[{ required: true, message: 'חובה לבחור מרפאה בעיסוק' }]}>
                                        <Select>
                                            {occupationalClinics.map(occupationalClinic => (
                                                <Option key={occupationalClinic.employee_id} value={occupationalClinic.employee_id}>
                                                    {occupationalClinic.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <div className="inner-frame">
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Button onClick={addJobAndEmployee} type="dashed" block>
                                            הוסף תפקיד ועובד
                                        </Button>
                                    </Col>
                                </Row>
                                {jobsAndEmployees.map((roleAndEmployee, index) => (
                                    <Row gutter={16} key={index}>
                                        <Col span={12}>
                                            <Form.Item label={`תפקיד ${index + 1}`}>
                                                <Select
                                                    onChange={(value) => handleJobChange(index, value)}
                                                    value={roleAndEmployee.job}
                                                >
                                                    {jobsList.map(job => (
                                                        <Option key={job.jobId} value={job.jobId}>
                                                            {job.jobDescription}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label={`עובד ${index + 1}`} rules={[{ required: true, message: 'חובה לבחור עובד' }]}>
                                                <Select
                                                    onChange={(value) => handleEmployeeChange(index, value)}
                                                    value={roleAndEmployee.employee}
                                                >
                                                    {jobForEmployee
                                                        .filter(job => job.job_id === roleAndEmployee.job)
                                                        .map(filteredEmployee => (
                                                            <Option key={filteredEmployee.employee_id} value={filteredEmployee.employee_id}>
                                                                {filteredEmployee.name}
                                                            </Option>
                                                        ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                ))}
                            </div>
                            <Form.Item>
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                    <Button type="primary" htmlType="submit">
                                        שמירה
                                    </Button>
                                    <Button onClick={onCancel} style={{ marginLeft: '10px' }}>
                                        ביטול
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
                <Modal
                    title="אזהרה"
                    open={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    okText="כן"
                    cancelText="לא"
                >
                    <p>האם אתה בטוח שברצונך לעזוב את הטופס ללא שמירה?</p>
                </Modal>
            </div>
        </>
    );
};
export default StudentDetailsForm;