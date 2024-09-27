import { useState } from 'react';
import { Form, Input, Button, Typography, Spin, Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import Message from '../Message';
import logo from '../../assets/logo.png';
import './login.css';
// import loginService from '../../services/loginService';
import { BaseUser } from '../../models/BaseUser';
import { MySingletonService } from '../../services/MySingletonService';

const { Title } = Typography;

export const Login = () => {
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [loading, setLoading] = useState(false);
    // const [permission, setPermission] = useState(0);
    const [user, setUser] = useState<BaseUser>();
    const navigate = useNavigate();

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // login to the system
    const login = async (values: any) => {
        setLoading(true);
        try {
            // const permissionFromDb = await loginService.login(values);
            // const permission = permissionFromDb.employeeData[0][0].permission_id;
            // setPermission(permission);
            const user = await MySingletonService.getInstance().getBaseUser();
            if (user) {
                setUser(user);
                if (user.permission === 1 || user.permission === 2) {
                    navigate(`menu/students-for-update/${user.identityNumber}`);
                }
                else {
                    navigate(`menu/all-students/`);
                }
            }
            else {
                addMessage('אופס, שגיאה בקבלת הנתונים- לא נמצא עובד', 'error');
            }
        } catch (error) {
            addMessage(`אוי לא! משהו השתבש בעת שליפת הנתונים. בבקשה נסה שוב מאוחר יותר`, 'error')
        }
        setLoading(false);
    };
    // add user details
    if (user) {
        return (
            <div className="loading-overlay">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            <div className="login-container">
                <div style={{ position: 'relative' }}>
                    <Message messages={messages} duration={5000} />
                    {loading && (
                        <div className="loading-overlay">
                            <Spin size="large" />
                        </div>
                    )}
                    <Card className="login-card">
                        <div className="logo-container">
                            <img src={logo} alt="Logo" className="logo-image" />
                        </div>
                        <Title level={2} className="form-title">כניסה למערכת</Title>
                        <Form
                            name="login-form"
                            initialValues={{ remember: true }}
                            onFinish={login}
                            size="large"
                            className="form-container">
                            <Form.Item
                                name="identityNumber"
                                rules={[{ required: true, message: 'אנא הזן תעודת זהות' }]}>
                                <Input prefix={<UserOutlined />} placeholder="תעודת זהות" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>כניסה</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </div>
        </>
    );
};
