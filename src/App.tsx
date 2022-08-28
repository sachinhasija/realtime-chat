import React, { useState } from 'react';
import Chat from 'components/Chat';
import Cookies from 'js-cookie';
import UserModel from './firestore/usersModel';
import { FirebaseUser } from './interfaces/firestore';
import Header from 'components/Header';
import Login from 'components/Login';

import './App.scss';


function App() {
  const uid = Cookies.get('st-uid');
  const [isLoggedIn, setIsLoggedIn] = useState(!!uid);

  const handleSignIn = (token: string, user: FirebaseUser) => {
    const { uid, email, displayName } = user;
    Cookies.set('st-uid', uid);
    const UserModelObject = new UserModel();
    const userData = {
      email,
      id: uid,
      image: '',
      isOnline: false,
      lastSeen: `${+new Date()}`,
      name: displayName,
      showOnline: true,
    };
    UserModelObject.addUser(uid, userData);
    setIsLoggedIn(true);
  }

  const handleLogout = () => {
    Cookies.remove('st-uid');
    setIsLoggedIn(false);
  }

  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <div
        className="custom_container"
      >
        {isLoggedIn ? <Chat /> : (
          <Login handleSignIn={handleSignIn} />
        )}
      </div>
    </div>
  );
}

export default App;
