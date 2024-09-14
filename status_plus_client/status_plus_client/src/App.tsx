import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import './App.css';
import { Login } from './components/login/Login';
import Menu from './components/menu/Menu';
import { UserProvider } from './context/UserContext';


function App() {

  // const id = "15719347";

  return (
    <UserProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/menu/*" element={<Menu />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
