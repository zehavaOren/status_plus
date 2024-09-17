import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Upload, Image, Popconfirm, Input } from 'antd';
import { UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState<any[]>([]); // Replace `any[]` with Employee model type.
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const navigate = useNavigate();

    // Fetch employees from the service
    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Replace with your service function
            // const response = await employeeService.getAllEmployees();
            // setEmployees(response.data); // Assuming the service returns an array of employees
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (employeeId: string) => {
        try {
            // await employeeService.deleteEmployee(employeeId); // Call your delete service
            fetchEmployees(); // Refresh the list after deletion
        } catch (error) {
            console.error("Failed to delete employee", error);
        }
    };

    const columns = [
        {
            title: 'תעודת זהות',
            dataIndex: 'idCard',
            key: 'idCard',
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
            title: 'כתובת',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: 'עיר',
            dataIndex: 'city',
            key: 'city',
        },
        {
            title: 'תפקיד',
            dataIndex: 'position',
            key: 'position',
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
                    onClick={() => navigate(`/employee-details/${record.idCard}`)} // Navigate to employee details screen
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
                    onConfirm={() => handleDelete(record.idCard)}
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
