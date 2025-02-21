import React, { useState } from 'react';
import { Button, Select, Input, Row, Col, Typography } from 'antd';

const { Title } = Typography;
const { Option } = Select;

const DataManagementComponent = () => {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [additionalValue, setAdditionalValue] = useState<string>('');

  // Handle select change
  const handleSelectChange = (value: string) => {
    setSelectedList(value);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalValue(e.target.value);
  };

  // Handle display data button
  const handleDisplayData = () => {
    console.log('Displaying data for:', selectedList);
  };

  // Handle add value button
  const handleAddValue = () => {
    console.log('Adding value:', additionalValue);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', direction: 'rtl' }}>
      {/* Header Title */}
      <Title level={2}>ניהול נתונים</Title>

      {/* Select and Display Button */}
      <Row justify="center" align="middle" style={{ marginBottom: '20px' }}>
        <Col>
          <Button type="primary" onClick={handleDisplayData}>
            הצג נתונים
          </Button>
        </Col>
        <Col style={{ marginLeft: '10px' }}>
          <Select
            placeholder="בחרי רשימת נתונים"
            style={{ width: 200 }}
            onChange={handleSelectChange}
            value={selectedList}
          >
            <Option value="list1">רשימה 1</Option>
            <Option value="list2">רשימה 2</Option>
            <Option value="list3">רשימה 3</Option>
          </Select>
        </Col>
      </Row>

      {/* Input and Add Button */}
      <Row justify="center" align="middle" style={{ marginBottom: '20px' }}>
        <Col>
          <Button type="primary" onClick={handleAddValue}>
            הוסף
          </Button>
        </Col>
        <Col style={{ marginLeft: '10px' }}>
          <Input
            placeholder="הזיני ערך נוסף"
            style={{ width: 200 }}
            value={additionalValue}
            onChange={handleInputChange}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DataManagementComponent;
