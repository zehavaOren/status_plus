export interface Message{
    messageType: 'success' | 'error' | 'warning';
    messageText: string;
    duration:number;
  }
