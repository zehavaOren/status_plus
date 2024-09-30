import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Checkbox, Col, Form, Input, Row, Card, Steps, Spin } from "antd";

import './StatusForm.css';
import { studentStatusService } from "../../services/studentStatusService";
import { ValueSelected } from "../../models/ValueSelected";
import { Category } from "../../models/Category";
import { Value } from "../../models/Value";
import Message from "../Message";
import { BaseUser } from "../../models/BaseUser";
import { MySingletonService } from "../../services/MySingletonService";

const { TextArea } = Input;
const { Step } = Steps;

const StatusForm = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/menu';
    const [user, setUser] = useState<BaseUser>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [values, setValues] = useState<Value[]>([]);
    const [formValues, setFormValues] = useState<ValueSelected[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);  // Tracks current category index
    const [form] = Form.useForm();
    const [isFormChanged, setIsFormChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // const [studentName, setStudentName] = useState("");
    const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);

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
                return acc;
            }, {});
            form.setFieldsValue(initialValues);
        }
    }, [formValues, form]);

    const addMessage = (message: string, type: any) => {
        setMessages(prev => [...prev, { message, type, id: Date.now() }]);
    };
    // get the datat from the server
    const getData = async () => {
        const user = await MySingletonService.getInstance().getBaseUser();
        if (user) {
            setUser(user);
            setLoading(true);
            try {
                const categories = await studentStatusService.getCategoriesByEmployee(user.identityNumber);
                const valuesRes = await studentStatusService.getValues(user.identityNumber);
                const studentValuesRes = await studentStatusService.getValuesByStudentId({ studentId: studentId!, employeeId: user.identityNumber, year: 'תשפד' });
                setCategories(categories.categories[0]);
                setValues(valuesRes.valuesList[0]);
                setFormValues(studentValuesRes.valuesList[0]);
                // setStudentName(studentValuesRes.valuesList[1][0].name);
            } catch (error) {
                addMessage('אופס, שגיאה בקבלת הנתונים', 'error');
            } finally {
                setIsSaving(false);
                setLoading(false);
            }
        } else {
            addMessage('אופס, שגיאה בקבלת הנתונים- לא נמצא עובד', 'error');
        }
    };
    // when form change
    const onValuesChange = () => {
        setIsFormChanged(true);
    };
    // Get the corresponding `isFinalChoice` from `formValues`
    const getIsFinalChoice = (valueId: number) => {
        const selectedValue = formValues.find(v => v.valueId === valueId);
        return selectedValue ? selectedValue.isFinalChoice : false;
    };
    // Handle the validation manually
    const handleStrengthWeaknessChange = (valueId: number) => {
        const strength = form.getFieldValue(`strength_${valueId}`);
        const weakness = form.getFieldValue(`weakness_${valueId}`);

        // Clear all existing errors first
        form.setFields([
            {
                name: `strength_${valueId}`,
                errors: [],
            },
            {
                name: `weakness_${valueId}`,
                errors: [],
            },
        ]);

        // If both strength and weakness are selected, set a single validation error
        if (strength && weakness) {
            form.setFields([
                {
                    name: `strength_${valueId}`,
                    errors: ['אין אפשרות לבחור עבור ערך חוזקה חולשה ביחד'],
                }
            ]);
        }
    };
    // save the data
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

        // Validate that strength and weakness are not both selected
        let hasValidationError = false;

        Object.keys(values).forEach(key => {
            const [type, id] = key.split('_');
            const valueId = parseInt(id);

            // Skip processing if the valueId is not valid
            if (!groupedValues[valueId]) {
                groupedValues[valueId] = {
                    studentId,
                    employeeId,
                    valueId,
                    year,
                    isFinalChoice: false // Ensure isFinalChoice is set
                };
            }

            if (type === 'notes' && values[key] && values[key].trim() !== "") {
                groupedValues[valueId].notes = values[key];
            }
            if (type === 'strength' && values[key] !== undefined) {
                groupedValues[valueId].strength = values[key];
            }
            if (type === 'weakness' && values[key] !== undefined) {
                groupedValues[valueId].weakness = values[key];
            }

            // Check for validation errors: both strength and weakness are selected
            if (groupedValues[valueId].strength && groupedValues[valueId].weakness) {
                hasValidationError = true;
                form.setFields([
                    {
                        name: `strength_${valueId}`,
                        errors: ['אין אפשרות לבחור עבור ערך חוזקה חולשה ביחד'],
                    }
                ]);
            }
        });

        if (hasValidationError) {
            addMessage('אופס, יש ערך שנבחרו לו חוזקה וחולשה ביחד', 'error');
            setIsSaving(false);
            return;
        }

        // Now check which values have actually changed and filter out undefined ones
        Object.values(groupedValues).forEach(updatedValue => {
            const originalValue = formValues.find(v => v.valueId === updatedValue.valueId);
            let isChanged = false;

            // Check if notes are different or not empty
            if (updatedValue.notes !== undefined && updatedValue.notes !== (originalValue?.notes ?? '')) {
                isChanged = true;
            }
            // Check if strength has changed
            if (updatedValue.strength !== undefined && updatedValue.strength !== (originalValue?.strength ?? false)) {
                isChanged = true;
            }
            // Check if weakness has changed
            if (updatedValue.weakness !== undefined && updatedValue.weakness !== (originalValue?.weakness ?? false)) {
                isChanged = true;
            }

            // Only add values that have actually changed
            if (isChanged) {
                changedValues.push(updatedValue as ValueSelected);
            }
        });

        if (changedValues.length > 0) {
            setLoading(true);
            try {
                const saveRes = await studentStatusService.upsertStudentStatus(changedValues);
                const allSuccessful = saveRes.every(res => res.status === 'success');
                if (allSuccessful) {
                    addMessage('כל השינויים נשמרו בהצלחה', 'success');
                } else {
                    addMessage('חלק מהשינויים לא נשמרו בהצלחה', 'warning');
                }
                const isStatusReady = await checkStudentStatus(Number(studentId));
                if (isStatusReady) {
                    const conflictList = await getConflictsList();
                    if (conflictList.length === 0) {
                        const statusUpdateToReady = await studentStatusService.upsertStudentStatusReady(studentId!, 'תשפד');
                        if (statusUpdateToReady.studentStatusReady[0].status === 0) {
                            console.error("error update ready ststus");
                        }
                    }
                }
                await getData();
                setLoading(false);
            } catch (error) {
                addMessage('שגיאה בשמירת השינויים', 'error');
            }
        } else {
            addMessage('לא בוצעו שינויים', 'info');
        }
        setIsSaving(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, formValues, studentId]);
    // check if all employees fill the status
    const checkStudentStatus = async (studentId: number) => {
        try {
            const responseFromDB = await studentStatusService.checkStudentStatus(studentId, 'תשפד');
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
    // get the conflicts list
    const getConflictsList = async () => {
        const employeeNumber = Number(studentId);
        try {
            const studentConflictsResponse = await studentStatusService.getConflictsList(employeeNumber);
            const conflictsList = studentConflictsResponse.conflictsList[0];
            return conflictsList;
        } catch (error) {
            console.error('Error fetching student status:', error);
        }
    }
    // Updated renderCategoryValues to use getIsFinalChoice to check if value is final
    const renderCategoryValues = (categoryId: number) => {
        const categoryValues = values.filter(value => value.categoryId === categoryId);

        return categoryValues.length > 0 ? (
            <div>
                {categoryValues.map(value => (
                    <Form.Item key={`value_${value.valueId}`}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <span>{value.valueDescription}</span>
                            </Col>
                            <Col span={6}>
                                <Form.Item name={`strength_${value.valueId}`} valuePropName="checked" noStyle>
                                    <Checkbox
                                        disabled={getIsFinalChoice(value.valueId)}
                                        onChange={() => handleStrengthWeaknessChange(value.valueId)}
                                    >
                                        חוזקה
                                    </Checkbox>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name={`weakness_${value.valueId}`} valuePropName="checked" noStyle>
                                    <Checkbox
                                        disabled={getIsFinalChoice(value.valueId)}
                                        onChange={() => handleStrengthWeaknessChange(value.valueId)}
                                    >
                                        חולשה
                                    </Checkbox>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name={`notes_${value.valueId}`} noStyle>
                                    <TextArea placeholder="הערה" disabled={getIsFinalChoice(value.valueId)} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                ))}
            </div>
        ) : (
            <p>אין ערכים זמינים עבור הקטגוריה הזו.</p>
        );
    };
    // move to other category
    const handleStepChange = (current: number) => {
        setCurrentStep(current);
    };
    // save form
    const handleSaveAll = () => {
        form.submit();
    };
    // navigate to the privious component
    const navigateBack = () => {
        navigate(from);
    };
    return (
        <div>
            <Message messages={messages} duration={5000} />
            <div className="steps-container">
                {loading && (
                    <div className="loading-overlay">
                        <Spin size="large" />
                    </div>
                )}

                <Steps current={currentStep} onChange={handleStepChange}>
                    {categories.map((category) => (
                        <Step key={category.categoryId} title={category.categoryDesc} />
                    ))}
                </Steps>
            </div>
            <Button onClick={navigateBack} style={{ position: 'absolute', top: '120px', right: '50px', backgroundColor: '#d6e7f6' }}>
                חזרה
            </Button>
            <Card className="card-container">
                <Form form={form} layout="vertical" onValuesChange={onValuesChange} onFinish={onFinish}>
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
        </div>
    );
};

export default StatusForm;
