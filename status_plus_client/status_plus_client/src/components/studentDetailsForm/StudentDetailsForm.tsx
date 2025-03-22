import React, { useEffect, useMemo, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Select, DatePicker, Modal, Spin, Popconfirm } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import { MinusCircleOutlined } from '@ant-design/icons';

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
    const [gradeList, setGradeList] = useState<Grade[]>([]);
    const [selectedGradeClasses, setSelectedGradeClasses] = useState<number[]>([]);
    const [grade, setGrade] = useState<number>();
    const [jobsList, setJobsList] = useState<{ jobId: number, jobDescription: string }[]>([]);
    const [jobsAndEmployees, setJobsAndEmployees] = useState<Array<{ job: number, employee: string }>>([]);
    const [isItemDisabled, setIsItemDisabled] = useState(false);
    const [employeesForStudent, setEmployeesForStudent] = useState<JobForEmployee[]>([]);
    const [mandatoryMorningTeacher, setMandatoryMorningTeacher] = useState<string | undefined>(undefined);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isFormChanged, setIsFormChanged] = useState(false);
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);
    const [isPopConfirmVisible, setIsPopConfirmVisible] = useState(false);
    const [tempStudentId, setTempStudentId] = useState<string | null>(null);

    useEffect(() => {
        if (studentId) {
            fetchStudentDetails(studentId);
            setIsItemDisabled(true);
        } else {
            setIsItemDisabled(false);
        }
        getGradesList();
        getCitiesList();
        getJobForEmployee();
        getJobsList();
    }, [studentId]);

    useEffect(() => {
        if (studentDetails) {
            form.setFieldsValue({
                ...studentDetails,
                birthDate: studentDetails.birthDate ? moment(studentDetails.birthDate) : null,
            });
            if (studentDetails.gradeId) {
                handleGradeChange(studentDetails.gradeId);
                if (studentDetails.classId) {
                    form.setFieldsValue({
                        classId: studentDetails.classId,
                    });
                }
            }
        }
    }, [studentDetails, form]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // navigate
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
    // get year
    const getYearForSystem = (): string => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const year = currentMonth > 11 ? currentYear + 1 : currentYear;
        return year.toString();
    };
    // get data
    const fetchStudentDetails = async (studentId: string, isShowError?: boolean) => {
        setLoading(true);
        try {
            const year = await getYearForSystem();
            const responseFromDB = await studentService.getStudentDeatils(studentId, year);
            const studentDetails = responseFromDB.studentDetails[0][0];
            setStudentDetails({
                ...studentDetails,
                birthDate: studentDetails.birthDate ? moment(studentDetails.birthDate) : null,
            });

            const employees = responseFromDB.studentDetails[1].map((employee: any) => ({
                employee_id: employee.employeeId,
                job_id: employee.jobId,
                name: employee.employeeName || 'Unnamed Employee',
                job_description: employee.jobDescription || 'Unknown Job'
            }));

            setEmployeesForStudent(employees);
        } catch (error) {
            if (!isShowError) {
                addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            }
        } finally {
            setLoading(false);
        }
    };
    // get cities
    const getCitiesList = async () => {
        try {
            const responseFromDB = await commonService.getCities();
            setCitiesList(responseFromDB.citiesList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        }
    };
    // get jobs
    const getJobsList = async () => {
        try {
            const responseFromDB = await commonService.getJobs();
            setJobsList(responseFromDB.jobsList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        }
    };
    // get employees and jobs
    const getJobForEmployee = async () => {
        try {
            const responseFromDB = await commonService.getJobForEmployee();
            setJobForEmployee(responseFromDB.jobs[0]);
            if (!studentId && employeeDet.permission === 2) {
                const foundEmployee = responseFromDB.jobs[0].find((emp: { employee_id: string; }) => emp.employee_id === employeeDet.identityNumber);
                if (foundEmployee) {
                    setMandatoryMorningTeacher(foundEmployee.employee_id);
                    form.setFieldsValue({ mandatoryMorningTeacher: foundEmployee.employee_id });
                }
            }
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        }
    };
    // get classes
    const getGradesList = async () => {
        try {
            const responseFromDB = await commonService.getGradesAndClasses();
            const grades: Grade[] = responseFromDB.gradesAndClasses[0];
            setGradeList(grades.map((grade: Grade, index: number) => ({ ...grade, id: index + 1 })));
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        }
    };
    // hen grade changed
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
    };
    // when class changed
    const handleClassChange = async (value: number) => {
        form.setFieldsValue({ classId: value });
    };
    // add another inputs
    const addJobAndEmployee = () => {
        setJobsAndEmployees([...jobsAndEmployees, { job: 0, employee: '' }]);
    };
    // when change job
    const handleJobChange = (index: number, value: number) => {
        const newRolesAndEmployees = [...jobsAndEmployees];
        newRolesAndEmployees[index].job = value;
        newRolesAndEmployees[index].employee = '';
        setJobsAndEmployees(newRolesAndEmployees);
    };
    // when employee change
    const handleEmployeeChange = (index: number, value: string) => {
        const newRolesAndEmployees = [...jobsAndEmployees];
        newRolesAndEmployees[index].employee = value;
        setJobsAndEmployees(newRolesAndEmployees);
    };
    // when finish to fill the form
    const handleFinish = (values: any) => {
        onSave(values);
    };
    // when cancek the form
    const onCancel = () => {
        showModal();
    };
    // saving the datat
    const onSave = async (values: StudentForm) => {
        if (!hasMandatoryTeacherAssigned && !mandatoryMorningTeacher) {
            addMessage('יש לבחור מורה בוקר או רב כחובה', 'error');
            return;
        }

        const studentDetail = {
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
        };
        const fullYear = await getYearForSystem();
        const filteredJobsAndEmployees = [];
        for (const job of jobsAndEmployees) {
            try {
                if (!isItemDisabled) {
                    filteredJobsAndEmployees.push({
                        'student_id': values.studentId,
                        'employee_id': job.employee,
                        'year': fullYear,
                        'job_id': job.job
                    });
                }
                else {
                    const result = await studentService.checkExistingJob(Number(studentId!), fullYear, job.job);
                    const checkResult = result.exitingEmployees[0][0];
                    if (checkResult.resultJobId === -1) {
                        addMessage("הסטטוס מוכן, לא ניתן להוסיף אנשי צוות נוספים", "error");
                        setTimeout(() => {
                            navigate(from);
                        }, 1000);
                        return;
                    } else if (checkResult.resultJobId === job.job) {
                        addMessage("כבר קיים עובד עם תפקיד זה", "error");
                        setTimeout(() => {
                            navigate(from);
                        }, 1000);
                        return;
                    } else {
                        filteredJobsAndEmployees.push({
                            'student_id': values.studentId,
                            'employee_id': job.employee,
                            'year': fullYear,
                            'job_id': job.job
                        });
                    }
                }
            } catch (error) {
                addMessage(`שגיאה בבדיקת קיום העובד`, "error");
            }
        }
        const jobId = jobForEmployee.find(emp => emp.employee_id === mandatoryMorningTeacher)?.job_id;

        if (isItemDisabled && mandatoryMorningTeacher) {
            filteredJobsAndEmployees.push({
                student_id: values.studentId,
                employee_id: mandatoryMorningTeacher,
                year: fullYear,
                job_id: jobId,
            });
        }
        const studSave = await saveStudentDetails(studentDetail);
        const resEmpSave = await saveEmployeesForStudent(filteredJobsAndEmployees);
        debugger;
        if (studSave === 'success' && resEmpSave === 'success') {
            addMessage('הנתונים נשמרו בהצלחה', 'success');
            setTimeout(() => {
                navigate(from);
            }, 1000);
        } else {
            addMessage('אופס- שגיאה בשמירת הנתונים', 'error');
        }
    };
    // save the form
    const saveStudentDetails = async (studentDet: any) => {
        const saveStudentRes = await studentService.upsertStudentDetails(studentDet);
        return saveStudentRes.studentDetailsSave[0][0].status === 1 ? "success" : "error";
    };
    // save employees for student
    const saveEmployeesForStudent = async (employeesForStudent: any[]) => {
        debugger;
        const employeesStudentRes = await studentService.upsertEmployeesForStudent(employeesForStudent);
        return employeesStudentRes.every(empUpsert => empUpsert.status === "success") ? "success" : "error";
    };
    // form changed
    const onFieldsChange = () => {
        setIsFormChanged(true);
    };
    // confirm returned from the form
    const showModal = () => {
        if (isFormChanged) {
            setIsModalVisible(true);
        } else {
            navigateBack();
        }
    };
    // confirm return without saving
    const handleOk = () => {
        setIsModalVisible(false);
        navigateBack();
    };
    // cancel form
    const handleCancel = () => {
        setIsModalVisible(false);
    };
    // navigate back
    const navigateBack = () => {
        navigate(from);
    };
    // show or remove the educator input
    const hasMandatoryTeacherAssigned = useMemo(() => {
        return employeesForStudent.some(emp => emp.job_id === 10 || emp.job_id === 24);
    }, [employeesForStudent]);

    // Function to handle removing an employee from the student's list
    const handleRemoveEmployee = async (employeeId: string) => {
        const jobId = jobForEmployee.find(emp => emp.employee_id === employeeId)?.job_id;
        if (jobId === 10) {
            addMessage("אין אפשרות להסיר מחנך/ת או רב מהתלמיד", "error");
            return;
        }
        const result = await studentService.checkExistingJob(Number(studentId!), getYearForSystem(), jobId!);
        if (result.exitingEmployees[0][0].status === 1) {
            addMessage(result.exitingEmployees[0][0].msg, "error");
        } else {
            // Proceed with deletion if status = 0
            const year = await getYearForSystem();
            const employeeDeleted = await employeeService.deleteEmployeeForStudet(studentId!, employeeId, year);
            if (employeeDeleted.employeeDelete[0].status === 1) {
                addMessage("העובד הוסר מהתלמיד בהצלחה", "success");
                fetchStudentDetails(studentId!); // Refresh the list after deletion
            } else {
                addMessage("שגיאה בהסרת העובד מהתלמיד", "error");
            }
        }
        // if (employees === 0) {
        //     const year = await getYearForSystem();
        //     const employeeDeleted = await employeeService.deleteEmployeeForStudet(studentId!, employeeId, year);
        //     if (employeeDeleted.employeeDelete[0].status === 1) {
        //         addMessage("העובד הוסר מהתלמיד בהצלחה", "success");
        //     }
        //     else {
        //         addMessage("שגיאה בהסרת העובד מהתלמיד", "error");
        //     }
        // }
        // else {
        //     addMessage(`אין אפשרות להסיר עובד שמילא סטטוס תלמיד`, "error");
        // }
    };
    // function on blur the ID input to get the exiting student data
    const handleStudentIdBlur: React.FocusEventHandler<HTMLInputElement> = async (event) => {
        const enteredId = event.target.value.trim();
        if (!enteredId) return;
        setTempStudentId(enteredId);
        setLoading(true);
        const year = await getYearForSystem();
        const responseFromDB = await studentService.getStudentDeatils(enteredId, year);
        if (responseFromDB.studentDetails[0][0]) {
            setLoading(false);
            setIsPopConfirmVisible(true);
        }
        else {
            setLoading(false);
            setIsPopConfirmVisible(false);
        }
    };
    //function when confirm to edit exiting student
    const handleConfirmEditStudent = async () => {
        if (tempStudentId) {
            await fetchStudentDetails(tempStudentId);
            form.setFieldsValue({ studentId: tempStudentId });
            form.validateFields(["studentId"]);
        }
        setIsPopConfirmVisible(false);
    };
    //fucntion when cancel edit exiting student
    const handleCancelEditStudent = () => {
        form.resetFields(["studentId"]);
        setIsPopConfirmVisible(false);
    };


    return (
        <>
            <div style={{ direction: 'ltr' }}>
                <Message messages={messages} duration={6000} />
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
                                        rules={[{ required: true, message: 'חובה למלא תעודת זהות' }]}
                                    >
                                        <Popconfirm
                                            title="תלמיד עם תעודת זהות זו כבר קיים. האם ברצונך לערוך את פרטיו?"
                                            open={isPopConfirmVisible}
                                            onConfirm={handleConfirmEditStudent}
                                            onCancel={handleCancelEditStudent}
                                            okText="כן, ערוך"
                                            cancelText="לא, אפס"
                                        >
                                            <Input
                                                value={studentId}
                                                disabled={isItemDisabled}
                                                onBlur={handleStudentIdBlur}
                                                style={{ backgroundColor: 'white' }}
                                                onChange={(e) => form.setFieldsValue({ studentId: e.target.value })}
                                            />
                                        </Popconfirm>
                                    </Form.Item>

                                    {/* <Form.Item
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
                                    </Form.Item> */}
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
                                    <Form.Item label="טלפון 1" name="phone1">
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
                                        <Select
                                            showSearch
                                            placeholder="בחר עיר"
                                            optionFilterProp="children"
                                            filterOption={(input, option) =>
                                                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                                            }>
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
                                            {[...new Map(gradeList.map(grade => [grade.gradeId, grade])).values()].map(grade => (
                                                <Option key={grade.gradeId} value={grade.gradeId}>
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
                                <Col span={24}>
                                    <h3>רשימת עובדים:</h3>
                                </Col>
                                {employeesForStudent.length > 0 ? (
                                    employeesForStudent.map((employee, index) => (
                                        <Col span={6} key={index}>
                                            <Form.Item label={employee.job_description}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Input value={employee.name} disabled />
                                                    <MinusCircleOutlined
                                                        style={{ marginLeft: '8px', color: 'red', cursor: 'pointer' }}
                                                        onClick={() => handleRemoveEmployee(employee.employee_id)}
                                                    />
                                                </div>
                                            </Form.Item>
                                        </Col>
                                    ))
                                ) : (
                                    <p>אין נתונים להצגה</p>
                                )}
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
                                                    placeholder="בחר תפקיד"
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
                                                    placeholder="בחר עובד"
                                                >
                                                    {jobForEmployee
                                                        .filter(emp => emp.job_id === roleAndEmployee.job)
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
                            {!hasMandatoryTeacherAssigned && (
                                <div className="mandatory-teacher-section">
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="מורה בוקר / רב (חובה)"
                                                rules={[{ required: true, message: 'יש לבחור מורה בוקר או רב' }]}
                                            >
                                                <Select
                                                    placeholder="בחר מורה בוקר / רב"
                                                    onChange={(value) => setMandatoryMorningTeacher(value)}
                                                    value={mandatoryMorningTeacher}
                                                    disabled={!studentId && employeeDet.permission == 2}>
                                                    {jobForEmployee
                                                        .filter(emp => emp.job_id === 10 || emp.job_id === 24)
                                                        .map(emp => (
                                                            <Option key={emp.employee_id} value={emp.employee_id}>
                                                                {emp.name}
                                                            </Option>
                                                        ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            )}


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
