import React, { useEffect, useState } from 'react';
import { Alert } from 'antd';

interface MessageProps {
  messages: Array<{ message: string; type: any; id: number }>;
  duration: number;
}

const Message: React.FC<MessageProps> = ({ messages, duration }) => {
  const [visibleMessages, setVisibleMessages] = useState<Array<{ message: string; type: any; id: number }>>([]);
  // const [visible, setVisible] = useState(true);
  // const [key, setKey] = useState(0);

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setVisible(false);
  //   }, duration);

  //   return () => clearTimeout(timeout);
  // }, [duration]);

  // useEffect(() => {
  //   setKey(prevKey => prevKey + 1);
  //   setVisible(true);
  // }, [message, type]);
  useEffect(() => {
    setVisibleMessages(messages);
  }, [messages]);

  // useEffect(() => {
  //   const timeouts = messages.map(msg =>
  //     setTimeout(() => {
  //       setVisibleMessages(prev => prev.filter(m => m.id !== msg.id));
  //     }, duration)
  //   );

  //   return () => timeouts.forEach(clearTimeout);
  // }, [messages, duration]);
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setVisibleMessages([latestMessage]);

      const timeout = setTimeout(() => {
        setVisibleMessages([]);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [messages, duration]);

  return (
    <div style={{
      position: 'fixed',
      top: '20%',
      left: '37%',
      width: '50%',
      maxWidth: '400px',
      zIndex: 1000
    }}>
      {visibleMessages.map((msg) => (
        <Alert
          key={msg.id}
          style={{ direction: 'rtl', marginBottom: '10px' }}
          message={msg.message}
          type={msg.type}
          showIcon
          closable
          onClose={() => setVisibleMessages([])}
        />
      ))}
    </div>
  );
};

export default Message;
