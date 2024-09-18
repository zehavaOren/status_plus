import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Upload, Image, Popconfirm, Input } from 'antd';
import { UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { Employee } from '../../models/Employee';
import { employeeService } from '../../services/employeeService';
import { ColumnType } from 'antd/es/table';
import Message from '../Message';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState<Employee[]>([]); // Replace `any[]` with Employee model type.
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch employees from the service
    useEffect(() => {
        fetchEmployees();
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get employee data
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const responseFromDB = await employeeService.getAllEmployees();
            setEmployees(responseFromDB.allEmployees[0]);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (employeeId: string) => {
        try {
            const isDelete = await employeeService.deleteEmployee(Number(employeeId));
            if (isDelete.employeeDelete[0][0].status === 0) {
                addMessage("אין אפשרות למחוק עובד שמקושר לתלמיד", "error");
            }
            else {
                addMessage("העובד נמחק בהצלחה", "success");
            }
            fetchEmployees();
        } catch (error) {
            console.error("Failed to delete employee", error);
        }
    };
    // navigate to edit the employee details
    const onUpdateEmployeeClick = (employee: Employee) => {
        navigate(`/menu/employee-form/${employee.identityNumber}`, { state: { from: location.pathname } })
    }
    // columns to the table
    const columns: ColumnType<Employee>[] = [
        {
            title: 'תעודת זהות',
            dataIndex: 'identityNumber',
            key: 'identityNumber',
            width: 150,
        },
        {
            title: 'שם פרטי',
            dataIndex: 'firstName',
            key: 'firstName',
        },
        {
            title: 'שם משפחה',
            dataIndex: 'lastName',
            key: 'lastName',
        },
        {
            title: 'טלפון',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'אימייל',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'תפקיד',
            dataIndex: 'job',
            key: 'job',
        },
        {
            title: 'כיתה',
            dataIndex: 'class',
            key: 'class',
        },
        {
            title: 'הרשאה',
            dataIndex: 'permission',
            key: 'permission',
        },
        {
            title: 'עריכה',
            key: 'edit',
            render: (text: any, record: any) => (
                <Button
                    icon={<EditOutlined />}
                    onClick={() => onUpdateEmployeeClick(record)}
                />
            ),
            width: 100,
        },
        {
            title: 'מחיקה',
            key: 'delete',
            render: (text: any, record: any) => (
                <Popconfirm
                    title="האם אתה בטוח שברצונך למחוק את איש הצוות?"
                    onConfirm={() => handleDelete(record.identityNumber)}
                    okText="אישור"
                    cancelText="ביטול"
                >
                    <Button icon={<DeleteOutlined />} danger />
                </Popconfirm>
            ),
            width: 100,
        },
    ];

    const handleUpload = (file: any) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = e.target?.result;
            // Process Excel file data here using XLSX or any other library
        };
        reader.readAsBinaryString(file);
    };

    // add new student
    const addNewEmployee = () => {
        navigate(`/menu/student-details/`);
    };
    return (
        <div>
            <Message messages={messages} duration={5000} />
            <div className="header">
                <h1 className="title">ניהול אנשי צוות</h1>
                <Upload
                    accept=".xlsx, .xls"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleUpload(file);
                        return false;
                    }}
                >
                    <Button icon={<UploadOutlined />} className='ant-btn ant-btn-primary import-students-button'>ייבוא אנשי צוות</Button>
                </Upload>
                <Button type="primary" className="add-student-button" onClick={addNewEmployee}>הוסף איש צוות חדש</Button>
            </div>
            {/* <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Button
                    type="primary"
                    onClick={() => navigate('/employee-details')}
                >
                    הוספת איש צוות חדש
                </Button>
                <Upload
                    accept=".xlsx, .xls"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleUpload(file);
                        return false;
                    }}
                >
                    <Button icon={<UploadOutlined />} type="primary">
                        ייבוא אנשי צוות
                    </Button>
                </Upload>
            </div> */}
            <div className="container">
                <div className="inner-container">
                    <Table
                        columns={columns}
                        dataSource={employees}
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
                </div>
            </div>
            {/* <Table
                columns={columns}
                dataSource={employees}
                rowKey="idCard"
                loading={loading}
                pagination={{ pageSize: 10 }}
                bordered
            /> */}
        </div>
    );
};

export default EmployeeManagement;
