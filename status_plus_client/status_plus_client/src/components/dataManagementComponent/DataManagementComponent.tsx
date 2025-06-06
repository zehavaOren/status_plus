import React, { useEffect, useState } from 'react';
import { Button, Select, Input, Typography, Pagination, Spin } from 'antd';
import Message from '../Message';
import { commonService } from '../../services/commonService';

const { Title } = Typography;
const { Option } = Select;

type TableItem = {
  [key: string]: string | number;
  id: string;
  description: string;
};

const DataManagementComponent = () => {
  const tableNames = ['קטגוריות', 'ערכים', 'תפקידים', 'ערים'];
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [isValueTable, setIsValueTable] = useState<boolean>(false);
  const [details, setDetails] = useState<Array<TableItem>>([]);
  const [categoriesDetails, setCategoriesDetails] = useState<Array<TableItem>>([]);
  const [valuesDetails, setValuesDetails] = useState<Array<TableItem>>([]);
  const [jobsDetails, setJobsDetails] = useState<Array<TableItem>>([]);
  const [citiesDetails, setCitiesDetails] = useState<Array<TableItem>>([])
  const [selectedCategoryDescription, setSelectedCategoryDescription] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [additionalValue, setAdditionalValue] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    getCodeTableDetails()
  }, []);

  const getCodeTableDetails = async (isUpdateTable: boolean = false) => {
    setLoading(true);
    try {
      const responseFromDB = await commonService.getCodeTableDetails();
      setCategoriesDetails(responseFromDB.codeTableDetails[0]);
      setValuesDetails(responseFromDB.codeTableDetails[1]);
      setJobsDetails(responseFromDB.codeTableDetails[2]);
      setCitiesDetails(responseFromDB.codeTableDetails[3]);
      if (isUpdateTable) {
        setShowTable(true);
        resetAndCheckValueTable();
        switch (selectedList) {
          case 'קטגוריות':
            setDetails(responseFromDB.codeTableDetails[0]);
            break;
          case 'ערכים':
            setDetails(responseFromDB.codeTableDetails[1]);
            break;
          case 'תפקידים':
            setDetails(responseFromDB.codeTableDetails[2]);
            break;
          case 'ערים':
            setDetails(responseFromDB.codeTableDetails[3]);
            break;
          default:
            setDetails([]);
        }
      }
    } catch (error) {
      addMessage('אופס, שגיאה בקבלת הנתונים', 'error')
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (message: string, type: any) => {
    setMessages(prev => [...prev, { message, type, id: Date.now() }]);
  };

  // Handle select change
  const handleListSelectChange = (value: string) => {
    setSelectedList(value);
    setCurrentPage(1);
  };

  const handleCategorySelectChange = (value: string) => {
    const selectedCategory = categoriesDetails.find((category) => category.category_description === value);
    if (selectedCategory) {
      setSelectedCategoryId(String(selectedCategory.category_id));
      setSelectedCategoryDescription(value);
    }
    setCurrentPage(1);
  };

  const resetAndCheckValueTable = () => {
    if (selectedList === 'ערכים') {
      setIsValueTable(true);
    } else {
      setIsValueTable(false);
    }
    setSelectedCategoryDescription(null);
    setSelectedCategoryId(null);
    setAdditionalValue('');
  };

  const getTableDetails = (): Array<TableItem> => {
    switch (selectedList) {
      case 'קטגוריות':
        return categoriesDetails;
      case 'ערכים':
        return valuesDetails;
      case 'תפקידים':
        return jobsDetails;
      case 'ערים':
        return citiesDetails;
      default:
        return [];
    }
  };

  const handleShowData = () => {
    const tableDetails = getTableDetails();
    if (tableDetails.length === 0) {
      addMessage('לא נמצאו נתונים', 'warning');
    }
    setDetails(tableDetails);
    setShowTable(true);
    resetAndCheckValueTable();
  };

  const addCategoryValueConnection = async (valueId: string, categoryId: string) => {
    try {
      const responseFromDB = await commonService.addCategoryValueConnection(valueId, categoryId);
      if (responseFromDB.dataAddedConnectionTable[0][0]?.status === 1) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  // Handle add value button
  const handleAddValue = async () => {
    try {
      setLoading(true);
      if (selectedList && additionalValue) {
        const responseFromDB = await commonService.addDataCodeTable(selectedList, additionalValue);
        const status = responseFromDB.dataAddedCodeTable[0][0]?.status;
        const message = responseFromDB.dataAddedCodeTable[0][0]?.msg;

        if (status === 1) {
          if (selectedCategoryDescription) {
            const valueId = responseFromDB.dataAddedCodeTable[0][0]?.value_id;
            const categoryAdded = await addCategoryValueConnection(valueId, String(selectedCategoryId));
            if (categoryAdded) {
              setAdditionalValue("");
              setSelectedCategoryDescription("");
              addMessage(message, 'success');

            } else {
              addMessage('הייתה שגיאה בהוספת הנתונים', 'error');
            }
          } else {
            setAdditionalValue("");
            addMessage(message, 'success');
          }
          await getCodeTableDetails(true);
        } else {
          addMessage(message, 'error');
        }
      }
    } catch (error) {
      addMessage('שגיאה בהוספת הנתונים', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalValue(e.target.value);
  };

  const renderTable = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = details.slice(startIndex, endIndex);

    if (!data || data.length === 0) {
      return <p>לא נמצאו נתונים להצגה</p>;
    }

    const columns = Object.keys(data[0]);

    const translations: { [key: string]: string } = {
      'job_id': 'מזהה תפקיד',
      'job_description': 'תיאור תפקיד',
      'category_id': 'מזהה קטגוריה',
      'category_description': 'תיאור קטגוריה',
      'value_id': 'מזהה ערך',
      'value_description': 'תיאור ערך',
      'city_id': 'מזהה עיר',
      'city_description': 'תיאור עיר',
    };

    const translate = (key: string): string => translations[key] || key;

    return (
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '20px' }}> {/* גלילה לטבלה */}
        <table style={{ direction: 'rtl', width: '80%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    textAlign: 'right',
                    backgroundColor: '#f4f4f4',
                  }}
                >
                  {translate(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ border: '1px solid #ddd', textAlign: 'right' }}>
                {columns.map((column) => (
                  <td
                    key={column}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                    }}
                  >
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    );
  };

  const addButtonBeEnabled = (isValueTable && additionalValue && selectedCategoryDescription) || (!isValueTable && additionalValue);

  return (
    <div style={{
      padding: '20px', textAlign: 'center', direction: 'rtl', maxWidth: '1200px', margin: '0 auto'
    }}>
      <Message messages={messages} duration={5000} />
      {/* Header Title */}
      {loading && (
        <div className="loading-overlay">
          <Spin size="large" />
        </div>
      )}
      <Title level={2} style={{ marginBottom: '2rem' }}>ניהול נתונים</Title>

      {/* Select and Display Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '2rem'
      }}>
        <Select
          placeholder="בחרי רשימת נתונים"
          style={{ width: 200 }}
          onChange={handleListSelectChange}
          value={selectedList}
        >
          {tableNames.map((table, index) => (
            <Option key={index} value={table}>
              {table}
            </Option>
          ))}
        </Select>

        <Button
          type="primary"
          style={{ marginLeft: '10px' }}
          disabled={!selectedList}
          onClick={handleShowData}
        >
          הצג נתונים
        </Button>
      </div>
      {/* Render table only if the button was clicked and data exists */}
      {showTable && renderTable()}

      {/* Pagination */}
      {showTable && details.length > 0 && (
        <Pagination
          style={{ margin: '1rem 0' }}
          current={currentPage}
          pageSize={pageSize}
          total={details.length}
          onChange={(page, size) => {
            setCurrentPage(page); // עדכון העמוד הנוכחי
            setPageSize(size); // עדכון גודל העמוד
          }}
        />
      )}

      {/* Input and Add Button */}
      {showTable && <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '1rem'
      }}><Input
          placeholder="הזיני ערך נוסף"
          style={{ width: 200 }}
          value={additionalValue}
          onChange={handleInputChange}
        />
        <Button type="primary"
          disabled={!addButtonBeEnabled}
          onClick={handleAddValue}>
          הוסף
        </Button></div>}

      {isValueTable && <div>
        <Select
          placeholder="בחרי קטגוריה לערך"
          onChange={handleCategorySelectChange}
          value={selectedCategoryDescription}>
          {categoriesDetails.map((category, index) => (
            <Option key={index} value={category.category_description}>
              {category.category_description}
            </Option>))}
        </Select>
      </div>}
    </div>
  );
};

export default DataManagementComponent;