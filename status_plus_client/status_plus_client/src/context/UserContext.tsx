import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../models/User';
import Cookies from 'js-cookie';

interface UserContextValue {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  
  const [user, setUser] = useState<User>(() => {
    const savedUser = Cookies.get('user');
    return savedUser ? JSON.parse(savedUser) : { identityNumber: '', userName: '' };
  });

  useEffect(() => {
    if (user.identityNumber && user.userName) {
      Cookies.set('user', JSON.stringify(user), { expires: 7 }); // Cookie expires in 7 days
    } else {
      Cookies.remove('user');
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
