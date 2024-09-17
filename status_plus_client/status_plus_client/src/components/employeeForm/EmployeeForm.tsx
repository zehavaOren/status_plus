import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Form, Input, Select, Spin, Modal, Card } from "antd";
import { Employee } from "../../models/Employee"; // Assuming Employee is your model
import { employeeService } from "../../services/employeeService"; // Import your service for fetching/saving employee data
import Message from "../Message";

const { TextArea } = Input;
const { Option } = Select;

const EmployeeForm = () => {
    const { employeeId } = useParams<{ employeeId: string }>(); // For fetching an existing employee by ID
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/employees'; // Default redirect after save/cancel

    const [employee, setEmployee] = useState<Employee | null>(null); // Store employee data
    const [loading, setLoading] = useState(false); // Loading state for fetching
    const [form] = Form.useForm(); // Ant Design Form instance
    const [isModalVisible, setIsModalVisible] = useState(false); // For confirming navigation away
    const [isFormChanged, setIsFormChanged] = useState(false); // Track form changes
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]); // Client messages

    useEffect(() => {
        alert(employeeId)
        if (employeeId) {
            fetchEmployeeData();
        }
    }, [employeeId]);

    // Fetch employee data by ID
    const fetchEmployeeData = async () => {
        setLoading(true);
        try {
            const data = await employeeService.getEmployeeById(Number(employeeId!));
            setEmployee(data);
            form.setFieldsValue(data);
        } catch (error) {
            addMessage('Failed to fetch employee data.', 'error');
        } finally {
            setLoading(false);
        }
    };
    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
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
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}
            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={onValuesChange}
                >
                    {/* Employee Identity Number */}
                    <Form.Item
                        label="Identity Number"
                        name="identityNumber"
                        rules={[{ required: true, message: 'Please input the identity number' }]}
                    >
                        <Input disabled={!!employeeId} />
                    </Form.Item>

                    {/* First Name */}
                    <Form.Item
                        label="First Name"
                        name="firstName"
                        rules={[{ required: true, message: 'Please input the first name' }]}
                    >
                        <Input />
                    </Form.Item>

                    {/* Last Name */}
                    <Form.Item
                        label="Last Name"
                        name="lastName"
                        rules={[{ required: true, message: 'Please input the last name' }]}
                    >
                        <Input />
                    </Form.Item>

                    {/* Phone */}
                    <Form.Item
                        label="Phone"
                        name="phone"
                        rules={[{ required: true, message: 'Please input the phone number' }]}
                    >
                        <Input />
                    </Form.Item>

                    {/* Job */}
                    <Form.Item
                        label="Job"
                        name="job"
                        rules={[{ required: true, message: 'Please select a job' }]}
                    >
                        <Select placeholder="Select a job">
                            <Option value="Teacher">Teacher</Option>
                            <Option value="Assistant">Assistant</Option>
                            <Option value="Administrator">Administrator</Option>
                        </Select>
                    </Form.Item>

                    {/* Grades */}
                    <Form.Item
                        label="Grades"
                        name="grades"
                        rules={[{ required: true, message: 'Please select grades' }]}
                    >
                        <Select mode="multiple" placeholder="Select grades">
                            <Option value="10/A">10/A</Option>
                            <Option value="11/B">11/B</Option>
                            <Option value="12/C">12/C</Option>
                        </Select>
                    </Form.Item>

                    {/* Permission */}
                    <Form.Item
                        label="Permission"
                        name="permission"
                        rules={[{ required: true, message: 'Please select a permission' }]}
                    >
                        <Select placeholder="Select permission">
                            <Option value="Admin">Admin</Option>
                            <Option value="Editor">Editor</Option>
                            <Option value="Viewer">Viewer</Option>
                        </Select>
                    </Form.Item>

                    {/* Save and Cancel Buttons */}
                    <Form.Item>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Button type="primary" htmlType="submit">
                                Save
                            </Button>
                            <Button onClick={showModal} style={{ marginLeft: '10px' }}>
                                Cancel
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Card>

            {/* Modal for confirming navigation away */}
            <Modal
                title="Warning"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Yes"
                cancelText="No"
            >
                <p>Are you sure you want to leave the form without saving?</p>
            </Modal>
        </div>
    );
};

export default EmployeeForm;
