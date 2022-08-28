import { FirebaseUser } from 'interfaces/firestore.js';
import React from 'react'
import { signInWithGoogle } from '../firebase.js';
import GoogleIcon from '../assets/images/google_icon.svg';
import '../App.scss';

const Login = ({ handleSignIn }: { handleSignIn: (token: string, user: FirebaseUser) => void }) => {
    return (
        <div className='login_container'>
            <h2>Welcome!</h2>
            <h4>Please login to continue</h4>
            <button type="button" className='sign_in_btn' onClick={() => signInWithGoogle(handleSignIn)}>
                <img src={GoogleIcon} alt="Google icon" />
                <span>Sign In with Google</span>
            </button>
        </div>
    )
}

export default Login