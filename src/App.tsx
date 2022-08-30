/* eslint-disable no-restricted-globals */
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

  const handleSignIn = async (token: string, user: FirebaseUser) => {
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
    console.log("uid, email, displayName", uid, email, displayName, userData);
    UserModelObject.addUser(uid, userData).then((response) => {
      location.reload()
      setIsLoggedIn(true);
    });

  }

  const handleLogout = () => {
    Cookies.remove('st-uid');
    setIsLoggedIn(false);
  }

  return (
    <div className="app">
      <div className='content'>
        <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
        {isLoggedIn ? <Chat isLoggedIn={isLoggedIn} /> : (
          <div
            className="custom_container"
          >
            <Login handleSignIn={handleSignIn} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
