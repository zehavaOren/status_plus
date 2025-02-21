import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../models/User';

interface UserContextValue {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { identityNumber: '', userName: '' };
  });

  useEffect(() => {
    // const existUser = localStorage.getItem('user');
    // const convertUser = existUser ? JSON.parse(existUser) : { identityNumber: '', userName: '' };
    // if ((convertUser && convertUser.identityNumber === "") || existUser === '{}') {
    //   localStorage.setItem('user', JSON.stringify(user));
    // }
    // if(user){
      localStorage.setItem('user', JSON.stringify(user));
    // }
  }, [user]);

  const setItem = async (user: User) => {
    const existUser = await localStorage.getItem('user');
    const convertUser = existUser ? JSON.parse(existUser) : { identityNumber: '', userName: '' };
    if ((convertUser && convertUser.identityNumber === "") || existUser === '{}') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};