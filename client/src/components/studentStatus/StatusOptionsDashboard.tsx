import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Button } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import image1 from '../../assets/1.png';
import image2 from '../../assets/2.png';
import image3 from '../../assets/3.png';
import { MySingletonService } from '../../services/MySingletonService';

const { Title } = Typography;

const StatusOptionsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { studentId } = useParams<{ studentId: string }>();
    const location = useLocation();
    const employeeDet = useMemo(() => MySingletonService.getInstance().getBaseUser(), []);

    // Images for the options (replace with correct imports of your images)
    const images = {
        simple: image3,
        tableau: image2,
        list: image1,
    };

    // Navigate to the respective status view
    const handleNavigate = (path: string) => {
        navigate(path);
    };
    // navigate
    // Ensure consistent absolute path when navigating back
    const from = useMemo(() => {
        if (location.state?.from) {
            return location.state.from;
        }
        if (employeeDet.permission === 1 || employeeDet.permission === 2) {
            return `/menu/students-for-update/${employeeDet.identityNumber}`;
        } else if (employeeDet.permission === 3) {
            return `/menu/all-students`;
        } else {
            return '/menu';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeDet, location.state?.from]);
    // navigate to privious component
    const navigateBack = () => {
        navigate(from);
    };
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <Title level={2}>בחר את סוג הצגת הסטטוס</Title>
            <Button onClick={navigateBack} style={{ backgroundColor: '#d6e7f6' }}>
                חזרה
            </Button>
            <Row gutter={[16, 16]} justify="center">
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        cover={<img alt="Simple Status" src={images.simple} style={{ height: '200px', objectFit: 'cover' }} />}
                        onClick={() => handleNavigate(`/menu/simple-student-status/${studentId}`)}
                    >
                        <Card.Meta title="סטטוס תלמיד פשוט" description="הצגה פשוטה של סטטוס התלמיד" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        cover={<img alt="Tableau Status" src={images.tableau} style={{ height: '200px', objectFit: 'cover' }} />}
                        onClick={() => handleNavigate(`/menu/student-status-table/${studentId}`)}
                    >
                        <Card.Meta title="סטטוס תלמיד טבלאי + גרף" description="סטטוס תלמיד טבלאי עם גרף חולשות" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        cover={<img alt="List Status" src={images.list} style={{ height: '200px', objectFit: 'cover' }} />}
                        onClick={() => handleNavigate(`/menu/student-status/${studentId}`)}
                    >
                        <Card.Meta title="סטטוס תלמיד ברשימה" description="הצגה ברשימה של סטטוס התלמיד" />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default StatusOptionsDashboard;
