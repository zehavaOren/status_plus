import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Checkbox, Col, Form, Input, Row, Card, Steps, Spin, Badge } from "antd";

import './StatusForm.css';
import { studentStatusService } from "../../services/studentStatusService";
import { ValueSelected } from "../../models/ValueSelected";
import { Category } from "../../models/Category";
import { Value } from "../../models/Value";
import Message from "../Message";
import { BaseUser } from "../../models/BaseUser";
import { MySingletonService } from "../../services/MySingletonService";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Step } = Steps;

const StatusForm = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<BaseUser>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [values, setValues] = useState<Value[]>([]);
    const [formValues, setFormValues] = useState<ValueSelected[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [isSaving, setIsSaving] = useState(false);
    const [studentName, setStudentName] = useState("");
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
    const [unfilledFields, setUnfilledFields] = useState<Record<string, boolean>>({});
    const [unfilledCategories, setUnfilledCategories] = useState<Set<number>>(new Set());

    useEffect(() => {
        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    useEffect(() => {
        if (formValues.length > 0) {
            const initialValues: Record<string, any> = formValues.reduce((acc: Record<string, any>, value: ValueSelected) => {
                acc[`strength_${value.valueId}`] = value.strength || false;
                acc[`weakness_${value.valueId}`] = value.weakness || false;
                acc[`notes_${value.valueId}`] = value.notes || '';
                acc[`notRelevant_${value.valueId}`] = value.isNotRelevant || false;
                return acc;
            }, {});
            form.setFieldsValue(initialValues);
        }
    }, [formValues, form]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get correct year
    const getYearForSystem = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const year = currentMonth >= 12 ? currentYear + 1 : currentYear;
        return year.toString();
    };
    // get form data
    const getData = async () => {
        const user = await MySingletonService.getInstance().getBaseUser();
        if (user) {
            setUser(user);
            setLoading(true);
            try {
                const categories = await studentStatusService.getCategoriesByEmployee(user.identityNumber);
                const valuesRes = await studentStatusService.getValues(user.identityNumber);
                const year = await getYearForSystem();
                const studentValuesRes = await studentStatusService.getValuesByStudentId({ studentId: studentId!, employeeId: user.identityNumber, year: year });
                if (categories.categories[0].length === 0) {
                    addMessage('אין קטגוריות עבורך', 'error');
                }
                else {
                    setCategories(categories.categories[0]);
                    setValues(valuesRes.valuesList[0]);
                    setFormValues(studentValuesRes.valuesList[0]);
                    setStudentName(studentValuesRes.valuesList[1][0].name);

                    const isStudentValuesFull = studentValuesRes.valuesList[0].length > 0;
                    const studentValueIds = new Set(studentValuesRes.valuesList[0].map((v: ValueSelected) => v.valueId));
                    const unfilled = isStudentValuesFull
                        ? valuesRes.valuesList[0].reduce((acc: Record<string, boolean>, value: ValueSelected) => {
                            const isUnfilled = !studentValueIds.has(value.valueId);
                            if (isUnfilled) {
                                acc[`value_${value.valueId}`] = true;
                            }
                            return acc;
                        }, {})
                        : {};

                    setUnfilledFields(unfilled);
                    const unfilledCatIds = new Set<number>();
                    categories.categories[0].forEach((category: { categoryId: number; }) => {
                        const categoryValues = valuesRes.valuesList[0].filter((value: { categoryId: number; }) => value.categoryId === category.categoryId);
                        if (categoryValues.some((value: { valueId: any; }) => unfilled[`value_${value.valueId}`])) {
                            unfilledCatIds.add(category.categoryId);
                        }
                    });

                    setUnfilledCategories(unfilledCatIds);
                }

            } catch (error) {
                addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            } finally {
                setIsSaving(false);
                setLoading(false);
            }
        } else {
            addMessage('אופס, שגיאה בקבלת הנתונים- לא נמצא עובד', 'error');
        }
        setLoading(false);
    };
    // disable values
    const getIsFinalChoice = (valueId: number) => {
        const selectedValue = formValues.find(v => v.valueId === valueId);
        return selectedValue ? selectedValue.isFinalChoice : false;
    };
    // check if toocheckboxes choosed
    const handleCheckboxChange = (valueId: number, changedField: 'strength' | 'weakness' | 'notRelevant') => {
        const strength = form.getFieldValue(`strength_${valueId}`);
        const weakness = form.getFieldValue(`weakness_${valueId}`);
        const notRelevant = form.getFieldValue(`notRelevant_${valueId}`)
        if (changedField === 'notRelevant' && notRelevant) {
            form.setFieldsValue({
                [`strength_${valueId}`]: false,
                [`weakness_${valueId}`]: false,
            });
        }
        if ((changedField === 'strength' && strength) || (changedField === 'weakness' && weakness)) {
            form.setFieldsValue({
                [`notRelevant_${valueId}`]: false,
            });
        }
        form.setFields([
            {
                name: `strength_${valueId}`,
                errors: strength && weakness ? ['אין אפשרות לבחור עבור ערך חוזקה חולשה ביחד'] : [],
            },
        ]);
    };
    // save the form
    const onFinish = useCallback(async (currentFormValues: any) => {
        if (isSaving) return;
        setIsSaving(true);

        if (!user) {
            console.error('User context is not available');
            return;
        }

        const employeeId = user.identityNumber;
        const year = await getYearForSystem();
        const changedValues: ValueSelected[] = [];
        let hasValidationError = false;

        // Process all values from all categories
        values.forEach((value) => {
            const strength = currentFormValues[`strength_${value.valueId}`];
            const weakness = currentFormValues[`weakness_${value.valueId}`];
            const notes = currentFormValues[`notes_${value.valueId}`];
            const isNotRelevant = currentFormValues[`notRelevant_${value.valueId}`];

            // Validate strength and weakness combination
            if (strength && weakness) {
                form.setFields([{
                    name: `strength_${value.valueId}`,
                    errors: ['אין אפשרות לבחור עבור ערך חוזקה חולשה ביחד']
                }]);
                hasValidationError = true;
                return;
            }

            const originalValue = formValues.find(v => v.valueId === value.valueId);
            let isChanged = false;

            // Check if there are any changes
            if (isNotRelevant) {
                isChanged = true;
            } else {
                if (notes !== undefined && notes !== (originalValue?.notes ?? '')) {
                    isChanged = true;
                }
                if (strength !== undefined && strength !== (originalValue?.strength ?? false)) {
                    isChanged = true;
                }
                if (weakness !== undefined && weakness !== (originalValue?.weakness ?? false)) {
                    isChanged = true;
                }
            }

            if (isChanged) {
                changedValues.push({
                    studentId: studentId!,
                    employeeId,
                    valueId: value.valueId,
                    year,
                    strength: isNotRelevant ? false : strength || false,
                    weakness: isNotRelevant ? false : weakness || false,
                    notes: notes || '',
                    isFinalChoice: originalValue?.isFinalChoice || false,
                    isNotRelevant: isNotRelevant || false,
                });
            }
        });

        if (hasValidationError) {
            addMessage('אופס, יש ערך שנבחרו לו חוזקה חולשה ביחד', 'error');
            setIsSaving(false);
            return;
        }

        if (changedValues.length > 0) {
            try {
                const saveRes = await studentStatusService.upsertStudentStatus(changedValues);
                const allSuccessful = saveRes.every(res => res.status === 'success');
                if (allSuccessful) {
                    addMessage('כל השינויים נשמרו בהצלחה', 'success');
                } else {
                    addMessage('חלק מהשינויים לא נשמרו בהצלחה', 'warning');
                }
                await getData();
            } catch (error) {
                addMessage('שגיאה בשמירת השינויים', 'error');
            }
        } else {
            addMessage('לא בוצעו שינויים', 'info');
        }

        setIsSaving(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, formValues, values, studentId, isSaving]);
    // get hidden values
    const renderCategoryValues = (categoryId: number) => {
        const categoryValues = values.filter(value => value.categoryId === categoryId);

        return categoryValues.length > 0 ? (
            <div>
                {categoryValues.map(value => {
                    const isNotRelevant = form.getFieldValue(`notRelevant_${value.valueId}`);
                    return (
                        <Form.Item key={`value_${value.valueId}`}>
                            <Row gutter={16} style={{ textDecoration: isNotRelevant ? 'line-through' : 'none' }}>
                                <Col span={6}>
                                    {unfilledFields[`value_${value.valueId}`] && (
                                        <Badge
                                            count={<ExclamationCircleOutlined style={{ color: '#f5222d', fontSize: '18px', lineHeight: '18px' }} />}
                                            style={{ backgroundColor: 'transparent', marginLeft: '5px' }}
                                            title="This value is not yet filled"
                                        />
                                    )}
                                    <span>{value.valueDescription}</span>
                                </Col>
                                <Col span={4}>
                                    <Form.Item name={`strength_${value.valueId}`} valuePropName="checked" noStyle>
                                        <Checkbox
                                            disabled={getIsFinalChoice(value.valueId) || isNotRelevant}
                                            onChange={() => handleCheckboxChange(value.valueId, 'strength')}
                                        >
                                            חוזקה
                                        </Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item name={`weakness_${value.valueId}`} valuePropName="checked" noStyle>
                                        <Checkbox
                                            disabled={getIsFinalChoice(value.valueId) || isNotRelevant}
                                            onChange={() => handleCheckboxChange(value.valueId, 'weakness')}
                                        >
                                            חולשה
                                        </Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item name={`notRelevant_${value.valueId}`} valuePropName="checked" noStyle>
                                        <Checkbox
                                            disabled={getIsFinalChoice(value.valueId)}
                                            checked={isNotRelevant}
                                            onChange={() => handleCheckboxChange(value.valueId, 'notRelevant')}
                                        >
                                            לא רלוונטי
                                        </Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item name={`notes_${value.valueId}`} noStyle>
                                        <TextArea
                                            placeholder="הערה"
                                            disabled={getIsFinalChoice(value.valueId) || isNotRelevant}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>
                    );
                })}
            </div>
        ) : (
            <p>אין ערכים זמינים עבור הקטגוריה הזו.</p>
        );
    };
    // save all the form
    const handleSaveAll = () => {
        const allValues = form.getFieldsValue(true);
        onFinish(allValues);
    };
    // render categories with the values
    const renderAllCategoryValues = () => {
        return categories.map((category) => {
            const categoryValues = values.filter(value => value.categoryId === category.categoryId);

            return (
                <div key={category.categoryId} style={{ display: 'none' }}>
                    {categoryValues.map(value => (
                        <div key={`value_${value.valueId}`}>
                            <Form.Item name={`strength_${value.valueId}`} valuePropName="checked">
                                <Checkbox disabled={getIsFinalChoice(value.valueId)} />
                            </Form.Item>
                            <Form.Item name={`weakness_${value.valueId}`} valuePropName="checked">
                                <Checkbox disabled={getIsFinalChoice(value.valueId)} />
                            </Form.Item>
                            <Form.Item name={`notes_${value.valueId}`}>
                                <TextArea disabled={getIsFinalChoice(value.valueId)} />
                            </Form.Item>
                        </div>
                    ))}
                </div>
            );
        });

    };
    // move categories
    const handleStepChange = (current: number) => {
        setCurrentStep(current);
    };
    // scrolling
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // Handle back navigation to the previous page
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div>
            <Message messages={messages} duration={5000} />
            {loading && (
                <div className="loading-overlay">
                    <Spin size="large" />
                </div>
            )}

            {/* Display student's name */}
            <h1 style={{ textAlign: 'center', margin: '20px 0' }}>טופס סטטוס התלמיד: {studentName}</h1>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button type="primary" onClick={handleSaveAll} loading={isSaving}>
                    שמור הכל
                </Button>
            </div>

            <div className="steps-container">
                <Steps current={currentStep} onChange={handleStepChange}>
                    {categories.map((category) => (
                        <Step
                            key={category.categoryId}
                            title={
                                <span title={category.categoryDesc}>
                                    {category.categoryDesc}
                                </span>
                            }
                            status={unfilledCategories.has(category.categoryId) ? "error" : "process"}
                        />
                    ))}
                </Steps>
            </div>


            <Card className="card-container">
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {/* Hidden form fields for all categories */}
                    {renderAllCategoryValues()}

                    {/* Visible form fields for current category */}
                    <h2>{categories[currentStep]?.categoryDesc}</h2>
                    {categories[currentStep] && renderCategoryValues(categories[currentStep].categoryId)}

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        {currentStep > 0 && (
                            <Button onClick={() => setCurrentStep(currentStep - 1)} style={{ marginRight: '10px' }}>
                                קטגוריה קודמת
                            </Button>
                        )}
                        {currentStep < categories.length - 1 && (
                            <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                                קטגוריה הבאה
                            </Button>
                        )}
                    </div>
                </Form>
            </Card>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button type="primary" onClick={handleSaveAll} loading={isSaving}>
                    שמור הכל
                </Button>
            </div>

            {/* Back button */}
            <Button
                type="default"
                onClick={handleBack}
                style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '20px',
                    zIndex: 1000
                }}
            >
                חזור
            </Button>

            {/* Scroll to top button */}
            <Button
                type="primary"
                onClick={scrollToTop}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000
                }}
            >
                לראש הדף
            </Button>
        </div>
    );
};

export default StatusForm;
