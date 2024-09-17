import React, { useContext, useEffect, useState } from 'react';
import { Layout, Menu as AntdMenu, Dropdown, Image, ConfigProvider } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { Link, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import './menu.css';
import logo from '../../assets/clear_logo.png';
import StudentsForUpdate from '../studentsForUpdate/StudentsForUpdate';
// import { UserContext } from '../../context/UserContext';
import StudentsStatuses from '../studentsStatuses/StudentsStatuses';
import StudentsList from '../studentsStatuses/statusesList/StatusesList';
import StudentDetailsForm from '../studentDetailsForm/StudentDetailsForm';
import AllStudents from '../allStudents/AllStudents';
import StatusForm from '../statusForm/StatusForm';
import StudentStatus from '../studentStatus/StudentStatus';
import StudentStatusTable from '../studentStatus/StudentStatusTable';
import StudentConflictsList from '../studentConflictsList/StudentConflictsList';
import ConflictHandling from '../conflictHandling/ConflictHandling';
import { MySingletonService } from '../../services/MySingletonService';
import { BaseUser } from '../../models/BaseUser';
import EmployeeManagement from '../employeeManagement/EmployeeManagement';

const { Header, Content } = Layout;

const Menu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const [user, setUser] = useState<BaseUser | null>(null);
  const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState('');
  const [menuItems, setMenuItems] = useState<Array<{ key: string, label: string, path: string, permissions: Array<number> }>>([]);

  useEffect(() => {
    getBaseUser();
  }, []);
  // useEffect(() => {
  //   // if (location.state) {
  //   // const { identityNumber, userName } = location.state;
  //   // const newUser = { identityNumber, userName };
  //   // setUser(newUser);
  //   // localStorage.setItem('user', JSON.stringify(newUser));
  //   // setSelectedComponent(`/menu/students-for-update/${identityNumber}`);
  //   // }
  //   debugger
  //   getBaseUser();
  // }, []);

  // useEffect(() => {
  //   // if (location.pathname !== selectedComponent) {
  //   //   setSelectedComponent(location.pathname);
  //   // }
  // }, [location]);

  // client message
  const addMessage = (message: string, type: any) => {
    setMessages([{ message, type, id: Date.now() }]);
  };
  // get user data from singelton
  const getBaseUser = async () => {
    try {
      const user = await MySingletonService.getInstance().getBaseUser();
      if (user) {
        setUser(user);
        setMenuItems(generateMenuItems(user));
        setSelectedComponent(`/menu/students-for-update/${user.identityNumber}`);
      } else {
        addMessage('אופס, שגיאה בקבלת הנתונים- לא נמצא עובד', 'error');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
    }
  }
  const generateMenuItems = (user: BaseUser) => [
    // const menuItems = [
    { key: 'students-for-update', label: 'תלמידים לעדכון סטטוס תלמיד', path: `/menu/students-for-update/${user!.identityNumber}`, permissions: [1, 2] },
    // { key: 'students-statuses', label: 'סטטוסי התלמידים', path: '/menu/students-statuses' },
    // { key: 'another-component2', label: 'תלמידים לעדכון סטטוס תלמיד', path: `/menu/students-for-update2/${user.identityNumber}` },
    // { key: 'another-component3', label: 'נוספת קומפוננטה', path: '/menu/another-component3' },
    { key: 'students-statuses', label: 'סטטוס כל התלמידים', path: 'students-statuses', permissions: [1, 2, 3] },
    { key: 'all-students', label: 'כל התלמידים', path: 'all-students', permissions: [3] },
    { key: 'status-form', label: 'טופס סטטוס תלמיד', path: 'status-form', permissions: [1, 2, 3] },
    { key: 'student-status', label: 'סטטוס תלמיד', path: 'student-status', permissions: [1, 2, 3] },
    { key: 'student-conflicts-list', label: 'טיפול בקונפליטים', path: `/menu/student-conflicts-list/${user!.identityNumber}`, permissions: [1, 2] },
    { key: 'employee-management', label: 'ניהול עובדים', path: `/menu/employee-management`, permissions: [3] },
    // ];
  ];
  // log out from the system
  const handleLogout = () => {
    setSelectedComponent('');
    setUser({ identityNumber: '', userName: '', permission: 0 });
    localStorage.removeItem('user');
    navigate('/');
  };
  // menu items list


  const userMenu = (
    <AntdMenu>
      <AntdMenu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> יציאה
      </AntdMenu.Item>
    </AntdMenu>
  );

  if (!user) {
    return <div>Loading...</div>; // Or any loading indicator you prefer
  }

  return (
    <ConfigProvider>
      <Layout className="navigation-layout">
        <Header className="navigation-header">
          <div className="navigation-left">
            <Image src={logo} alt="User" className="user-image" />
            <Dropdown overlay={userMenu} trigger={['click']}>
              <span className="user-name">{user.userName}</span>
            </Dropdown>
          </div>
          <div className="navigation-right">
            <AntdMenu mode="horizontal" selectedKeys={[selectedComponent]}>
              {menuItems.map((item) => (
                item.permissions.includes(user.permission) && (
                  <AntdMenu.Item key={item.key}>
                    <Link to={item.path} onClick={() => setSelectedComponent(item.path)}>
                      {item.label}
                    </Link>
                  </AntdMenu.Item>
                )
              ))}
            </AntdMenu>
            {/* <AntdMenu theme="dark" mode="horizontal" selectedKeys={[selectedComponent]}>
            {[...menuItems].reverse().map((item) => {
              if (item.permissions.includes(MySingletonService.getInstance().getBaseUser().permission)) {
                return (
                  <AntdMenu.Item key={item.key} className={selectedComponent === item.path ? 'selected-menu-item' : ''}>
                    <Link to={item.path} onClick={() => setSelectedComponent(item.path)}>
                      {item.label}
                    </Link>
                  </AntdMenu.Item>
                );
              } else {
                return null; // Do not render the menu item if the user does not have sufficient permission
              }
            })}
          </AntdMenu> */}
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
            <Route path="employee-management/" element={<EmployeeManagement />} />
            
            {/* <Route path="another-component" element={<AnotherComponent />} /> */}
          </Routes>
          <Outlet />
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default Menu;
