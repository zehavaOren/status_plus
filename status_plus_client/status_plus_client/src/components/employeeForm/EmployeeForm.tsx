import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Form, Input, Select, Spin, Modal, Card, Col, Row } from "antd";
import { Employee } from "../../models/Employee"; // Assuming Employee is your model
import { employeeService } from "../../services/employeeService"; // Import your service for fetching/saving employee data
import Message from "../Message";
import { Job } from "../../models/Job";
import { commonService } from "../../services/commonService";
import { Permission } from "../../models/Permission";

const { TextArea } = Input;
const { Option } = Select;

const EmployeeForm = () => {
    const { employeeId } = useParams<{ employeeId: string }>(); // For fetching an existing employee by ID
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/employees';
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isFormChanged, setIsFormChanged] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]); // Client messages
    const [jobs, setJobs] = useState<Job[]>([]);
    const [permission, setPermission] = useState<Permission[]>([]);

    useEffect(() => {
        if (employeeId) {
            fetchEmployeeData();
            getJobs();
            getPermission();
        }
    }, [employeeId]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // Fetch employee data by ID
    const fetchEmployeeData = async () => {
        debugger
        setLoading(true);
        try {
            const dataFromServer = await employeeService.getEmployeeById(Number(employeeId!));
            const employeeDetails = dataFromServer.employeeData[0][0]
            debugger
            setEmployee(employeeDetails);
            form.setFieldsValue(employeeDetails);
            form.setFieldsValue({
                ...employeeDetails, // Set other employee fields
                jobId: employeeDetails.jobId, // Set jobId
                permissionId: employeeDetails.permissionId // Set permissionId
            });
        } catch (error) {
            addMessage('Failed to fetch employee data.', 'error');
        } finally {
            setLoading(false);
        }
    };
    // get jobs list
    const getJobs = async () => {
        try {
            const responseFromDB = await commonService.getJobs();
            setJobs(responseFromDB.jobsList[0]);
        } catch (error) {
            addMessage('Failed to fetch employee data.', 'error');
        }
    }
    //get permission list
    const getPermission = async () => {
        try {
            const responseFromDB = await commonService.getPermission();
            setPermission(responseFromDB.permissionList[0]);
        } catch (error) {
            addMessage('Failed to fetch employee data.', 'error');
        }
    }
    // On form values change
    const onValuesChange = () => {
        setIsFormChanged(true);
    };
    // Save form data
    const onFinish = async (values: Employee) => {
        if (!employeeId) {
            return;
        }

        setLoading(true);
        try {
            // const result = await employeeService.saveEmployee({ ...employee, ...values });
            // if (result.success) {
            addMessage('Employee saved successfully', 'success');
            navigate(from); // Redirect back to the employee list
            // } else {
            addMessage('Failed to save employee', 'error');
            // }
        } catch (error) {
            addMessage('Error while saving employee', 'error');
        } finally {
            setLoading(false);
            setIsFormChanged(false);
        }
    };

    // Confirm navigation away
    const showModal = () => {
        if (isFormChanged) {
            setIsModalVisible(true);
        } else {
            navigateBack();
        }
    };

    // Handle cancel modal
    const handleOk = () => {
        setIsModalVisible(false);
        navigateBack();
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const navigateBack = () => {
        navigate(from);
    };

    return (
        <div>
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}
            <div className='container'>
                <h1 style={{ textAlign: 'center' }}>עריכת איש צוות</h1>
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
                        onFinish={onFinish}
                        onValuesChange={onValuesChange}
                    >
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    label="Identity Number"
                                    name="identityNumber"
                                    rules={[{ required: true, message: 'Please input the identity number' }]}>
                                    <Input disabled={!!employeeId} />
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
                                <Form.Item
                                    label="טלפון"
                                    name="phone"
                                    rules={[{ required: true, message: 'Please input the phone number' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    label="אימייל"
                                    name="email"
                                    rules={[{ required: true, message: 'Please input the email number' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="תפקיד" name="jobId" rules={[{ required: true, message: 'חובה לבחור תפקיד' }]}>
                                    <Select>
                                        {jobs.map(job => (
                                            <Option key={job.jobId} value={job.jobId}>
                                                {job.jobDescription}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="הרשאה" name="permissionId" rules={[{ required: true, message: 'חובה לבחור הרשאה' }]}>
                                    <Select>
                                        {permission.map(perm => (
                                            <Option key={perm.permissionId} value={perm.permissionId}>
                                                {perm.permissionDesc}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Grades */}
                        {/* <Form.Item
                            label="Grades"
                            name="grades"
                            rules={[{ required: true, message: 'Please select grades' }]}
                        >
                            <Select mode="multiple" placeholder="Select grades">
                                <Option value="10/A">10/A</Option>
                                <Option value="11/B">11/B</Option>
                                <Option value="12/C">12/C</Option>
                            </Select>
                        </Form.Item> */}
                        {/* Save and Cancel Buttons */}
                        <Form.Item>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Button type="primary" htmlType="submit">
                                    שמירה
                                </Button>
                                <Button onClick={showModal} style={{ marginLeft: '10px' }}>
                                    ביטול
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
            {/* Modal for confirming navigation away */}
            <Modal
                title="אזהרה!"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="כן"
                cancelText="לא">
                <p>האם אתה בטוח שברצונך לעזוב את הטופס ללא שמירה?</p>
            </Modal>
        </div>
    );
};

export default EmployeeForm;
