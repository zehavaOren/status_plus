import React, { useEffect, useState } from 'react';
import { Button, Select, Row, Col, Typography } from 'antd';
import { Student } from '../../models/Student';
import { studentService } from '../../services/studentService';

const { Title } = Typography;
const { Option } = Select;

const UploadYearComponent = () => {

    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);

    useEffect(() => {
        getAllStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // Function to handle selection change in dropdowns
    const handleSelectChange = (value: string) => {
        console.log(`selected ${value}`);
    };
    const getAllStudents = async () => {
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
    const saveAllStatuses = () => {

    }
    return (
        <div style={{ padding: '20px', textAlign: 'center', direction: 'rtl' }}>
            {/* Header Title */}
            <Title level={2}>העלאת שנה</Title>

            {/* Step A Button */}
            <Row justify="center" style={{ marginBottom: '20px' }}>
                <Button type="primary" size="large">העלאת שנה</Button>
            </Row>

            {/* Step B Button */}
            <Row justify="center" style={{ marginBottom: '40px' }}>
                <Button type="primary" size="large">ייבוא תלמידי כיתה א</Button>
            </Row>

            {/* Step B Dropdowns */}
            <Row justify="center" gutter={[16, 16]}>
                <Col span={4}>
                    <Select defaultValue="בחר כיתה" style={{ width: '100%' }} onChange={handleSelectChange}>
                        <Option value="1">כיתה א</Option>
                        <Option value="2">כיתה ב</Option>
                        <Option value="3">כיתה ג</Option>
                        <Option value="4">כיתה ד</Option>
                        <Option value="5">כיתה ה</Option>
                        <Option value="6">כיתה ו</Option>
                    </Select>
                </Col>
                <Col span={4}>
                    <Select defaultValue="מורת בוקר" style={{ width: '100%' }} onChange={handleSelectChange}>
                        <Option value="teacher1">מורה 1</Option>
                        <Option value="teacher2">מורה 2</Option>
                        <Option value="teacher3">מורה 3</Option>
                    </Select>
                </Col>
                <Col span={4}>
                    <Select defaultValue="מורת צהרים" style={{ width: '100%' }} onChange={handleSelectChange}>
                        <Option value="teacher1">מורה 1</Option>
                        <Option value="teacher2">מורה 2</Option>
                        <Option value="teacher3">מורה 3</Option>
                    </Select>
                </Col>
            </Row>

            {/* More Dropdowns for other classes */}
            <Row justify="center" gutter={[16, 16]} style={{ marginTop: '20px' }}>
                <Col span={4}>
                    <Select defaultValue="בחר כיתה" style={{ width: '100%' }} onChange={handleSelectChange}>
                        <Option value="1">כיתה א</Option>
                        <Option value="2">כיתה ב</Option>
                        <Option value="3">כיתה ג</Option>
                        <Option value="4">כיתה ד</Option>
                        <Option value="5">כיתה ה</Option>
                        <Option value="6">כיתה ו</Option>
                    </Select>
                </Col>
                <Col span={4}>
                    <Select defaultValue="מורת בוקר" style={{ width: '100%' }} onChange={handleSelectChange}>
                        <Option value="teacher1">מורה 1</Option>
                        <Option value="teacher2">מורה 2</Option>
                        <Option value="teacher3">מורה 3</Option>
                    </Select>
                </Col>
                <Col span={4}>
                    <Select defaultValue="מורת צהרים" style={{ width: '100%' }} onChange={handleSelectChange}>
                        <Option value="teacher1">מורה 1</Option>
                        <Option value="teacher2">מורה 2</Option>
                        <Option value="teacher3">מורה 3</Option>
                    </Select>
                </Col>
            </Row>

            {/* Save Button */}
            <Row justify="center" style={{ marginTop: '40px' }}>
                <Button type="primary" size="large">שמירה</Button>
            </Row>
        </div>
    );
};

export default UploadYearComponent;
