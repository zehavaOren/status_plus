import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Input, Select, Spin, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { studentStatusService } from "../../services/studentStatusService";
import { ConflictData } from "../../models/ConflictData";
import { ProcessedConflictData } from "../../models/ProcessedConflictData";
import { EmployeeChoice } from "../../models/EmployeeChoice";
import { ConflictChoice } from "../../models/ConflictChoice";
import Message from "../Message";

const { Title } = Typography;
const { Option } = Select;


const ConflictHandling = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/menu';
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [conflictsList, setConflictsList] = useState<ConflictData[]>([]);
    const [columns, setColumns] = useState<ColumnsType<ProcessedConflictData>>([]);
    const [tableData, setTableData] = useState<ProcessedConflictData[]>([]);
    const [studentDetails, setstudentDetails] = useState<{ id: number, studentName: string }>();

    useEffect(() => {
        getConflictsList();
    }, [studentId]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get the conflicts list
    const getConflictsList = async () => {
        setLoading(true);
        const employeeNumber = Number(studentId);
        try {
            const studentConflictsResponse = await studentStatusService.getConflictsList(employeeNumber);
            setConflictsList(studentConflictsResponse.conflictsList[0]);
            setstudentDetails(studentConflictsResponse.conflictsList[1][0].studentDetails);
            processConflictsData(studentConflictsResponse.conflictsList[0]);
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            console.error('Error fetching student status:', error);
        }
        setLoading(false);
    }
    // map the data to the table
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
            },
        ];

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
        setTableData(data);
    };
    // when choose strength or weakness
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
    //when insert comments
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
    // save data
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
    // find the educator id
    const findEmployeeIdByJobId = (conflictsList: any[]): number | undefined => {
        const employee = conflictsList.find(conflict => conflict.jobId === 10);
        return employee ? employee.employeeId : undefined;
    };
    // map data to save
    const mapProcessedConflictDataToConflictChoice = (data: ProcessedConflictData[]): ConflictChoice[] => {
        const studentID = Number(studentId);
        const employeeId = findEmployeeIdByJobId(conflictsList);
        return data.map(item => ({
            valueId: item.key,
            studentId: studentID!,
            year: 'תשפד',
            strength: item.choice === 'חוזקה' ? true : false,
            weakness: item.choice === 'חולשה' ? true : false,
            notes: item.comment,
            employeeId: employeeId!,
        }));
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
                    <Title level={2}>קונפליקטי התלמיד: {studentDetails?.studentName}</Title>
                    <Button onClick={navigateBack} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                        חזרה
                    </Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    pagination={false}
                    bordered
                    style={{ direction: 'rtl' }}
                />
                <Button onClick={handleSave}>שמור</Button>
            </div>
        </>
    );
}

export default ConflictHandling;