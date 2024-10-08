import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Input, Select, Spin, Table, Tag, Typography } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/es/table';

import { studentStatusService } from "../../services/studentStatusService";
import { ConflictData } from "../../models/ConflictData";
import { ProcessedConflictData } from "../../models/ProcessedConflictData";
import { EmployeeChoice } from "../../models/EmployeeChoice";
import { ConflictChoice } from "../../models/ConflictChoice";
import Message from "../Message";
import { MySingletonService } from "../../services/MySingletonService";

const { Title } = Typography;
const { Option } = Select;

const ConflictHandling = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [conflictsList, setConflictsList] = useState<ConflictData[]>([]);
    const [columns, setColumns] = useState<ColumnsType<ProcessedConflictData>>([]);
    const [tableData, setTableData] = useState<ProcessedConflictData[]>([]);
    const [studentDetails, setStudentDetails] = useState<{ id: number, studentName: string }>();
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);
    const [fullData, setFullData] = useState<ProcessedConflictData[]>([]);

    // Pagination State
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,  // Default page size
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'], // Available page sizes
    });

    useEffect(() => {
        getConflictsList();
        getYearForSystem();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    useEffect(() => {
        // Paginate table data based on pagination settings
        paginateData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, fullData]);

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
    const getYearForSystem = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const year = currentMonth > 10 ? currentYear + 1 : currentYear;
        return year.toString();
    };
    // Fetch conflicts list and process data
    const getConflictsList = async () => {
        setLoading(true);
        const employeeNumber = Number(studentId);
        try {
            const studentConflictsResponse = await studentStatusService.getConflictsList(employeeNumber);
            setConflictsList(studentConflictsResponse.conflictsList[0]);
            setStudentDetails(studentConflictsResponse.conflictsList[1][0].studentDetails);
            processConflictsData(studentConflictsResponse.conflictsList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            console.error('Error fetching student status:', error);
        }
        setLoading(false);
    };
    // Process raw conflict data and set pagination total
    const processConflictsData = (rawData: ConflictData[]) => {
        const uniqueValues = Array.from(new Set(rawData.map(item => item.valueDescription)));
        const uniqueEmployees = Array.from(new Set(rawData.map(item => item.employeeName)));

        const columns: ColumnsType<ProcessedConflictData> = [
            {
                title: 'ערך',
                dataIndex: 'value',
                key: 'value',
            },
            ...uniqueEmployees.map(employee => ({
                title: employee,
                dataIndex: employee,
                key: employee,
                render: (text: EmployeeChoice) => (
                    <div>
                        <div>בחירה:
                            <Tag color={text?.choice === 'Strength' ? 'green' : text?.choice === 'Weakness' ? 'red' : 'default'}>
                                {text?.choice === 'Strength' ? 'חוזקה' : text?.choice === 'Weakness' ? 'חולשה' : 'Unknown'}
                            </Tag>
                        </div>
                        <div>הערה: {text?.note}</div>
                    </div>
                ),
            })),
        ];

        // Conditionally add user choice and comment columns if user has permission 2
        if (employeeDet.permission === 2) {
            columns.push(
                {
                    title: 'בחירת משתמש',
                    dataIndex: 'choice',
                    key: 'choice',
                    render: (text: string, record: ProcessedConflictData) => (
                        <div>
                            <Select value={text} onChange={(value) => handleUserChoiceChange(record, value)} placeholder="בחר בחוזקה או חולשה" style={{ minWidth: '100px' }} direction="rtl">
                                <Option value="חוזקה">חוזקה</Option>
                                <Option value="חולשה">חולשה</Option>
                            </Select>
                        </div>
                    ),
                },
                {
                    title: 'הערה משתמש',
                    dataIndex: 'comment',
                    key: 'comment',
                    render: (text: string, record: ProcessedConflictData) => (
                        <Input value={text} onChange={(e) => handleUserCommentChange(record, e.target.value)} />
                    ),
                }
            );
        }

        const data: ProcessedConflictData[] = uniqueValues.map(value => {
            const rowData: ProcessedConflictData = {
                key: rawData.find(item => item.valueDescription === value)?.valueId || 0,
                value: value,
                choice: "",
                comment: ""
            };
            uniqueEmployees.forEach(employee => {
                const employeeData = rawData.find(item =>
                    item.valueDescription === value && item.employeeName === employee
                );
                if (employeeData) {
                    rowData[employee] = {
                        choice: employeeData.choice,
                        note: employeeData.note,
                    };
                }
            });
            return rowData;
        });

        setColumns(columns);
        setFullData(data);  // Store full data for pagination
        setPagination(prev => ({
            ...prev,
            total: data.length, // Set total number of records
        }));
    };
    // Paginate data based on current pagination settings
    const paginateData = () => {
        const { current, pageSize } = pagination;
        const paginatedData = fullData.slice((current! - 1) * pageSize!, current! * pageSize!);
        setTableData(paginatedData);
    };
    // Handle user choice changes
    const handleUserChoiceChange = (record: ProcessedConflictData, value: string) => {
        setTableData(prevTableData =>
            prevTableData.map(item => {
                if (item.key === record.key) {
                    return { ...item, choice: value };
                }
                return item;
            })
        );
    };
    // Handle user comment changes
    const handleUserCommentChange = (record: ProcessedConflictData, value: string) => {
        setTableData(prevTableData =>
            prevTableData.map(item => {
                if (item.key === record.key) {
                    return { ...item, comment: value };
                }
                return item;
            })
        );
    };
    // Save the data
    const handleSave = async () => {
        const isDataValid = tableData.every(item => item.choice && item.comment);
        if (isDataValid) {
            const dataToSend = await mapProcessedConflictDataToConflictChoice(tableData);
            try {
                const saveRes = await studentStatusService.upsertConflictResolution(dataToSend);
                const allSuccessful = saveRes.every(res => res.status === 'success');
                if (allSuccessful) {
                    addMessage('כל השינויים נשמרו בהצלחה', 'success');
                    const emp = await findEmployeeIdByJobId(conflictsList);
                    const statusReady = await checkStudentStatus(Number(studentId!));
                    if (statusReady) {
                        const year = await getYearForSystem();
                        await updateReadyStatus(Number(studentId), year);
                    }
                    navigate(`/menu/student-conflicts-list/${emp}`);
                } else {
                    addMessage('חלק מהשינויים לא נשמרו בהצלחה', 'warning');
                }
            } catch (error) {
                addMessage('שגיאה בשמירת השינויים', 'error');
            }
        } else {
            addMessage('יש למלא את שני השדות - בחירת משתמש והערה', 'error');
        }
    };
    // check if all employees fill the status
    const checkStudentStatus = async (studentId: number) => {
        try {
            const year = await getYearForSystem();
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId, year);
            const numbersOfValues = responseFromDB.numbersOfValues[0][0];
            if (numbersOfValues.totalExpectedValues === numbersOfValues.totalFilledValues) {
                return true;
            }
            else {
                return false;
            }
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
        }
    }
    // update all values to final
    const updateReadyStatus = async (studentId: number, year: string) => {
        try {
            const studentReadyRes = await studentStatusService.upsertStudentStatusReady(String(studentId), year);
            if (studentReadyRes[0].studentStatusReady) {
                console.log("status updated");
            }
        } catch (error) {
            console.error('Error fetching student status:', error);
        }
    }
    // Find the educator's employee id
    const findEmployeeIdByJobId = (conflictsList: any[]): number | undefined => {
        const employee = conflictsList.find(conflict => conflict.jobId === 10);
        return employee ? employee.employeeId : undefined;
    };
    // Map the processed conflict data to the ConflictChoice model for saving
    const mapProcessedConflictDataToConflictChoice = async (data: ProcessedConflictData[]): Promise<ConflictChoice[]> => {
        const studentID = Number(studentId);
        const employeeId = findEmployeeIdByJobId(conflictsList);
        const correctYear= await getYearForSystem();
        return data.map(item => ({
            valueId: item.key,
            studentId: studentID!,
            year: correctYear,
            strength: item.choice === 'חוזקה' ? true : false,
            weakness: item.choice === 'חולשה' ? true : false,
            notes: item.comment,
            employeeId: employeeId!,
        }));
    };
    // Handle pagination change
    const handleTableChange = (pagination: TablePaginationConfig) => {
        setPagination(pagination);  // Update pagination state
    };
    // Navigate back to the previous component
    const navigateBack = () => {
        navigate(from);
    };
    const paginationLocale = {
        items_per_page: 'פריטים / עמוד',
        jump_to: 'עבור אל',
        jump_to_confirm: 'אישור',
        page: 'עמוד',
        prev_page: 'העמוד הקודם',
        next_page: 'העמוד הבא',
        prev_5: '5 עמודים אחורה',
        next_5: '5 עמודים קדימה',
        prev_3: '3 עמודים אחורה',
        next_3: '3 עמודים קדימה',
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
                    <Title level={2}>קונפליקטי התלמיד: {studentDetails?.studentName}</Title>
                    <Button onClick={navigateBack} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                        חזרה
                    </Button>
                </div>
                {/* Wrap the table in a container with 80% width */}
                <div style={{ width: '80%', margin: '0 auto' }}>
                    <Table
                        columns={columns}
                        dataSource={tableData}
                        pagination={{ ...pagination, locale: paginationLocale }}
                        bordered
                        onChange={handleTableChange}
                        style={{ direction: 'rtl' }}
                    />
                </div>
                <div>
                    {employeeDet.permission === 2 && (
                        <Button onClick={handleSave}>שמור</Button>
                    )}
                </div>
            </div>
        </>
    );
}

export default ConflictHandling;
