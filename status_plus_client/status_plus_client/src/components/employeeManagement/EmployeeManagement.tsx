import { useState, useEffect } from 'react';
import { Table, Button, Upload, Popconfirm } from 'antd';
import { UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useLocation, useNavigate } from 'react-router-dom';

import { Employee } from '../../models/Employee';
import { employeeService } from '../../services/employeeService';
import Message from '../Message';
import './EmployeeManagement.css';
import { commonService } from '../../services/commonService';
import { Job } from '../../models/Job';
import { Permission } from '../../models/Permission';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState<Employee[]>([]); // Replace `any[]` with Employee model type.
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    // const [isModalVisible, setIsModalVisible] = useState(false);
    // const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState(1); // Current page
    const [pageSize, setPageSize] = useState(10); // Page size
    const [totalEmployees, setTotalEmployees] = useState(0); // Total number of employees
    const [jobs, setJobs] = useState<Job[]>([]);
    const [permission, setPermission] = useState<Permission[]>([]);

    // Fetch employees from the service
    useEffect(() => {
        fetchEmployee();
        getJobs();
        getPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get employee data
    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const responseFromDB = await employeeService.getAllEmployees();
            setEmployees(responseFromDB.allEmployees[0]);
            setTotalEmployees(responseFromDB.totalCount); // Set the total number of employees from the API response
        } catch (error) {
            console.error("Failed to fetch employees", error);
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
    // deleting employee
    const handleDelete = async (employeeId: string) => {
        try {
            const isDelete = await employeeService.deleteEmployee(Number(employeeId));
            if (isDelete.employeeDelete[0][0].status === 0) {
                addMessage("אין אפשרות למחוק עובד שמקושר לתלמיד", "error");
            }
            else {
                addMessage("העובד נמחק בהצלחה", "success");
            }
            fetchEmployee();
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
    // import employees
    const handleUpload = async (file: any) => {
        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(sheet);

            const employees: Employee[] = jsonData.map((item: any) => ({
                identityNumber: item['תעודת זהות'],
                lastName: item['שם משפחה'],
                firstName: item['שם פרטי'],
                phone: item['טלפון'],
                email: item['אימייל'],
                job: item['תפקיד'],
                jobId: mapJobToId(item['תפקיד']),
                grades: [],
                permission: item['הרשאה'],
                permissionId: mapPermissionToId(item['הרשאה']),
            }));

            const failedImports: { employee: Employee; status: string; error?: string }[] = [];
            for (const employee of employees) {
                try {
                    const saveRes = await employeeService.upsertEmployee(employee);
                    if (saveRes.employeeDetailsSave[0][0].status !== 1) {
                        failedImports.push({ employee, status: 'Failed', error: saveRes.message || 'Unknown error' });
                        addMessage(`שגיאה בשמירת עובד ${employee.firstName} ${employee.lastName}`, 'error');
                    }
                } catch (error: any) {
                    debugger
                    failedImports.push({ employee, status: 'Failed', error: error });
                    console.error("Failed to import employee", error);
                }
            }

            if (failedImports.length > 0) {
                await exportExcelFile(failedImports);
            } else {
                addMessage("כל העובדים נשמרו בהצלחה", "success");
            }

            fetchEmployee();
        };

        reader.readAsBinaryString(file);
        setLoading(false);
    };
    // map job
    const mapJobToId = (jobDescription: string) => {
        const job = jobs.find(j => j.jobDescription === jobDescription);
        return job ? job.jobId : 0;
    };
    // map permission
    const mapPermissionToId = (permissionDescription: string) => {
        const perm = permission.find(p => p.permissionDesc === permissionDescription);
        return perm ? perm.permissionId : 0;
    };
    // export to excel all employees that not import
    const exportExcelFile = async (rows: { employee: Employee; status: string; error?: any }[]) => {
        const perfectRows: any[] = [];

        rows.forEach(row => {
            const obj = {
                'תעודת זהות': row.employee.identityNumber,
                'שם משפחה': row.employee.lastName,
                'שם פרטי': row.employee.firstName,
                'טלפון': row.employee.phone,
                'אימייל': row.employee.email,
                'תפקיד': row.employee.job,
                'הרשאה': row.employee.permission,
                'שגיאת הכנסה': row.error.message
            };
            perfectRows.push(obj);
        });

        try {
            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(perfectRows);
            const wscols = [
                { wch: 20 }, // Adjust column widths as needed
                { wch: 20 },
                { wch: 20 },
                { wch: 20 },
                { wch: 30 },
                { wch: 20 },
                { wch: 20 },
                { wch: 50 }
            ];
            worksheet['!cols'] = wscols;
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Imports");
            const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
            saveAs(data, 'עובדים שלא יובאו.xlsx');
        } catch (error) {
            console.error('Error creating Excel file:', error);
        }
    };
    // add new student
    const addNewEmployee = () => {
        navigate(`/menu/employee-form/`, { state: { from: location.pathname } })
    };
    // paging
    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
        fetchEmployee();
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
                        rowKey="identityNumber"
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: totalEmployees,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            onChange: handleTableChange,
                            locale: {
                                items_per_page: 'לכל דף',
                                jump_to: 'עבור ל',
                                jump_to_confirm: 'אישור',
                                page: 'עמוד',
                                prev_page: 'העמוד הקודם',
                                next_page: 'העמוד הבא',
                                prev_5: 'הקודם 5',
                                next_5: 'הבא 5',
                                prev_3: 'הקודם 3',
                                next_3: 'הבא 3',
                            },
                        }}
                        // pagination={false}
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
