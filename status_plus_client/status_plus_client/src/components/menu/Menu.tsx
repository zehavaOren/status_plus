import React, { useContext, useEffect, useState } from 'react';
import { Layout, Menu as AntdMenu, Dropdown, Image } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { Link, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import './menu.css';
import logo from '../../assets/clear_logo.png';
import StudentsForUpdate from '../studentsForUpdate/StudentsForUpdate';
import { UserContext } from '../../context/UserContext';
import StudentsStatuses from '../studentsStatuses/StudentsStatuses';
import StudentsList from '../studentsStatuses/statusesList/StatusesList';
import StudentDetailsForm from '../studentDetailsForm/StudentDetailsForm';
import AllStudents from '../allStudents/AllStudents';
import StatusForm from '../statusForm/StatusForm';
import StudentStatus from '../studentStatus/StudentStatus';
import StudentStatusTable from '../studentStatus/StudentStatusTable';
import StudentConflictsList from '../studentConflictsList/StudentConflictsList';
import ConflictHandling from '../conflictHandling/ConflictHandling';

const { Header, Content } = Layout;

const Menu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  
  if (!userContext) {
    throw new Error('UserContext must be used within a UserProvider');
  }

  const { state } = location;
  const { user, setUser } = userContext;
  const [selectedComponent, setSelectedComponent] = useState('');


  useEffect(() => {
    if (location.state) {
      const { identityNumber, userName } = location.state;
      const newUser = { identityNumber, userName };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      setSelectedComponent(`/menu/students-for-update/${identityNumber}`);
    }
  }, [location.state, setUser]);

  useEffect(() => {
    if (location.pathname !== selectedComponent) {
      setSelectedComponent(location.pathname);
    }
  }, [location]);
  // log out from the system
  const handleLogout = () => {
    setSelectedComponent('');
    setUser({ identityNumber: '', userName: '' });
    localStorage.removeItem('user');
    navigate('/');
  };
  // menu items list
  const menuItems = [
    { key: 'students-for-update', label: 'תלמידים לעדכון סטטוס תלמיד', path: `/menu/students-for-update/${user.identityNumber}` },
    // { key: 'students-statuses', label: 'סטטוסי התלמידים', path: '/menu/students-statuses' },
    // { key: 'another-component2', label: 'תלמידים לעדכון סטטוס תלמיד', path: `/menu/students-for-update2/${user.identityNumber}` },
    { key: 'another-component3', label: 'נוספת קומפוננטה', path: '/menu/another-component3' },
    { key: 'students-statuses', label: 'סטטוס כל התלמידים', path: 'students-statuses' },
    { key: 'all-students', label: 'כל התלמידים', path: 'all-students' },
    { key: 'status-form', label: 'טופס סטטוס תלמיד', path: 'status-form' },
    { key: 'student-status', label: 'סטטוס תלמיד', path: 'student-status' },
    { key: 'student-conflicts-list', label: 'טיפול בקונפליטים', path: `/menu/student-conflicts-list/${user.identityNumber}` },

  ];

  const userMenu = (
    <AntdMenu>
      <AntdMenu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> יציאה
      </AntdMenu.Item>
    </AntdMenu>
  );
  
  return (
    <Layout className="navigation-layout">
      <Header className="navigation-header">
        <div className="navigation-left">
          <Image src={logo} alt="User" className="user-image" />
          <Dropdown overlay={userMenu}>
            <span className="user-name">{user.userName}</span>
          </Dropdown>
        </div>
        <div className="navigation-right">
          <AntdMenu theme="dark" mode="horizontal" selectedKeys={[selectedComponent]}>
            {[...menuItems].reverse().map((item) => (
              <AntdMenu.Item key={item.key} className={selectedComponent === item.path ? 'selected-menu-item' : ''}>
                <Link to={item.path} onClick={() => setSelectedComponent(item.path)}>
                  {item.label}
                </Link>
              </AntdMenu.Item>
            ))}
          </AntdMenu>
        </div>
      </Header>
      <Content className="navigation-content">
        <Routes>
          <Route path="students-for-update/:identityNumber" element={<StudentsForUpdate />} />
          <Route path="students-for-update" element={<StudentsForUpdate />} />
          <Route path="students-statuses" element={<StudentsStatuses />} />
          <Route path="students-statuses/statuses-list/:student_id" element={<StudentsList />} />
          <Route path="statuses-list/:student_id" element={<StudentsList />} />
          <Route path="student-details/:studentId" element={<StudentDetailsForm componentUrl={selectedComponent} />} />
          <Route path="student-details/" element={<StudentDetailsForm componentUrl={selectedComponent} />} />
          <Route path="all-students/" element={<AllStudents />} />
          <Route path="status-form/:studentId" element={<StatusForm />} />
          <Route path="student-status/:studentId" element={<StudentStatus />} />
          <Route path="student-status-table/:studentId" element={<StudentStatusTable />} />
          <Route path="student-conflicts-list/:employeeId" element={<StudentConflictsList />} />
          <Route path="conflicts-list/:studentId" element={<ConflictHandling />} />

          {/* <Route path="another-component" element={<AnotherComponent />} /> */}
        </Routes>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default Menu;
