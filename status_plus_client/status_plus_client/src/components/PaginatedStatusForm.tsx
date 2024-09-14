import { useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Checkbox, Col, Form, Input, Row, Pagination, Card, Modal, Spin } from "antd";

import '../components/statusForm/StatusForm.css'
import { Category } from "../models/Category";
import { Value } from "../models/Value";
import { ValueSelected } from "../models/ValueSelected";
import { studentStatusService } from "../services/studentStatusService";
import Message from "./Message";
import { BaseUser } from "../models/BaseUser";
import { MySingletonService } from "../services/MySingletonService";

const { TextArea } = Input;

const PaginatedStatusForm = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/default-path';
    const [user, setUser] = useState<BaseUser>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [values, setValues] = useState<Value[]>([]);
    const [formValues, setFormValues] = useState<ValueSelected[]>([]);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]); const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(1);
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isFormChanged, setIsFormChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [studentName, setStudentName] = useState("");
    const next = "הבא>";
    const previos = "<הקודם";

    useEffect(() => {
        getData();
    }, [studentId]);
    // allow choose few inputs
    useEffect(() => {
        if (formValues.length > 0) {
            const initialValues: Record<string, any> = formValues.reduce((acc: Record<string, any>, value: ValueSelected) => {
                acc[`strength_${value.valueId}`] = value.strength || false;
                acc[`weakness_${value.valueId}`] = value.weakness || false;
                acc[`notes_${value.valueId}`] = value.notes || '';
                return acc;
            }, {});
            form.setFieldsValue(initialValues);
        }
    }, [formValues, form]);
    // client message
    const addMessage = (message: string, type: any) => {
        setMessages([{ message, type, id: Date.now() }]);
    };
    // get user data from singelton
    const getBaseUser = async () => {
        const user = await MySingletonService.getInstance().getBaseUser();
        if (user) {
            setUser(user);
        }
        else {
            addMessage('אופס, שגיאה בקבלת הנתונים- לא נמצא עובד', 'error');
        }
    }
    // get all the data from the DB
    const getData = async () => {
        await getBaseUser();
        setLoading(true);
        try {
            const categories = await studentStatusService.getCategoriesByEmployee(user!.identityNumber);
            const valuesRes = await studentStatusService.getValues(user!.identityNumber);
            const studentValuesRes = await studentStatusService.getValuesByStudentId({ studentId: studentId!, employeeId: user!.identityNumber, year: 'תשפד' });
            setCategories(categories.categories[0]);
            setValues(valuesRes.valuesList[0]);
            setFormValues(studentValuesRes.valuesList[0]);
            setStudentName(studentValuesRes.valuesList[1][0].name)
        } catch (error) {
            addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
        } finally {
            setIsSaving(false);
            setLoading(false);
        }
    };
    // check form changed
    const onValuesChange = () => {
        setIsFormChanged(true);
    };
    // save the form data
    const onFinish = useCallback(async (values: { [key: string]: any }) => {
        if (isSaving) return;
        setIsSaving(true);
        if (!user) {
            console.error('User context is not available');
            return;
        }
        const employeeId = user.identityNumber;
        const year = "תשפד";
        const changedValues: ValueSelected[] = [];
        const groupedValues: { [key: number]: Partial<ValueSelected> } = {};

        Object.keys(values).forEach(key => {
            const [type, id] = key.split('_');
            const valueId = parseInt(id);

            if (!groupedValues[valueId]) {
                groupedValues[valueId] = {
                    studentId,
                    employeeId,
                    valueId,
                    year
                };
            }

            if (type === 'notes') {
                groupedValues[valueId].notes = values[key] || '';
            } else if (type === 'strength') {
                groupedValues[valueId].strength = values[key] || false;
            } else if (type === 'weakness') {
                groupedValues[valueId].weakness = values[key] || false;
            }
        });

        // בדוק אילו ערכים השתנו
        Object.values(groupedValues).forEach(updatedValue => {
            const originalValue = formValues.find(v => v.valueId === updatedValue.valueId);
            let isChanged = false;

            if (updatedValue.notes !== undefined && updatedValue.notes !== (originalValue?.notes ?? '')) {
                isChanged = true;
            }
            if (updatedValue.strength !== undefined && updatedValue.strength !== (originalValue?.strength ?? false)) {
                isChanged = true;
            }
            if (updatedValue.weakness !== undefined && updatedValue.weakness !== (originalValue?.weakness ?? false)) {
                isChanged = true;
            }

            if (isChanged) {
                changedValues.push(updatedValue as ValueSelected);
            }
        });

        if (changedValues.length > 0) {
            try {
                const saveRes = await studentStatusService.upsertStudentStatus(changedValues);
                // בדיקה האם כל השמירות הצליחו
                const allSuccessful = saveRes.every(res => res.status === 'success');
                if (allSuccessful) {
                    addMessage('כל השינויים נשמרו בהצלחה', 'success');
                } else {
                    addMessage('חלק מהשינויים לא נשמרו בהצלחה', 'warning');
                }

                await getData();
                setIsFormChanged(false);
            } catch (error) {
                addMessage('שגיאה בשמירת השינויים', 'error');
            }
        } else {
            addMessage('לא בוצעו שינויים', 'info');
        }
    }, [user, formValues, studentId]);
    // when canceling the form
    const onCancel = () => {
        showModal();
    };
    // cancel returning
    const handleCancel = () => {
        setIsModalVisible(false);
    };
    // confirm returning
    const handleOk = () => {
        setIsModalVisible(false);
        navigateBack();
    };
    // navigate to the privious component
    const navigateBack = () => {
        navigate(from);
    };
    // set categories
    const renderCategoryForm = (categoryId: any) => {
        const categoryValues = values.filter(value => value.categoryId === categoryId);
        const categoryDesc = categories.find(category => category.categoryId === categoryId)?.categoryDesc;

        return (
            <div>
                <div style={{ textAlign: 'center', marginTop: '20px', borderBottom: '2px solid black', alignItems: 'center' }}>
                    <h2 >
                        {currentPage !== 1 && (
                            <Button type="link" onClick={handlePreviousPageChange} style={{ fontSize: '20px' }}>
                                {previos}
                            </Button>
                        )}
                        {categoryDesc}
                        {currentPage < categories.length && (
                            <Button type="link" onClick={() => handlePageChange(currentPage + 1)} style={{ marginLeft: 'auto', fontSize: '20px' }}>
                                {next}
                            </Button>
                        )}
                    </h2>
                </div>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={onValuesChange}>
                    {categoryValues.map(value => (
                        <Form.Item key={`value_${value.valueId}`}>
                            <Row gutter={16}>
                                <Col span={4}>{value.valueDescription}</Col>
                                <Col span={4}>
                                    <Form.Item name={`strength_${value.valueId}`} valuePropName="checked" noStyle>
                                        <Checkbox>חוזקה</Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item name={`weakness_${value.valueId}`} valuePropName="checked" noStyle>
                                        <Checkbox>חולשה</Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item name={`notes_${value.valueId}`} noStyle>
                                        <TextArea style={{ height: '30px' }} placeholder="הערה" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>
                    ))}
                    <Form.Item>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <Button type="primary" htmlType="submit">
                                שמירה
                            </Button>
                            <Button onClick={onCancel} style={{ marginLeft: '10px' }}>
                                ביטול
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </div>
        );
    };
    // move to another category
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo(0, 0); // Scroll to the top of the page
    }, []);
    // category
    const itemRender = (_: any, type: any, originalElement: any) => {
        if (type === 'page') {
            return <span style={{ minWidth: '200px', display: 'inline-block', textAlign: 'center' }}>{categories[_ - 1]?.categoryDesc}</span>;
        }
        return originalElement;
    };
    // confirm to leave the page
    const showModal = () => {
        if (isFormChanged) {
            setIsModalVisible(true);
        } else {
            navigateBack();
        }
    };
    const handlePreviousPageChange = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };
    return (
        <div style={{ direction: 'ltr' }}>
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}
            <div className='container'>
                <h1 style={{ textAlign: 'center' }}>סטטוס התלמיד {studentName}</h1>
                <Button onClick={showModal} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                    חזרה
                </Button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1px' }}>
                <Card
                    key={`category_${categories[currentPage - 1]?.categoryId}`}
                    style={{ borderRadius: '10px', width: '100%', maxWidth: '1200px', direction: 'rtl', backgroundColor: '#b4d3ef' }}>
                    <div style={{ marginTop: 24, direction: 'rtl' }}>
                        {categories[currentPage - 1] && renderCategoryForm(categories[currentPage - 1].categoryId)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        <Pagination
                            current={currentPage}
                            onChange={handlePageChange}
                            total={categories.length}
                            pageSize={pageSize}
                            itemRender={itemRender}
                            style={{ marginBottom: 24, direction: 'rtl' }} />
                    </div>
                </Card>
            </div>
            <Modal
                title="אזהרה"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="כן"
                cancelText="לא">
                <p>האם אתה בטוח שברצונך לעזוב את הטופס ללא שמירה?</p>
            </Modal>
        </div>
    );
};

export default PaginatedStatusForm;
