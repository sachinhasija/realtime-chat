import React from 'react'

import '../App.scss';

const Header = ({ isLoggedIn, handleLogout }: { isLoggedIn: boolean, handleLogout: () => void }) => {
    return (
        <header id="header" className={isLoggedIn ? 'loggedin_header' : ''}>
            <div className='flex_headrow header_inner'>
                <p>Chat App</p>
                {isLoggedIn ? <button type="button" onClick={handleLogout}>Logout</button> : null}
            </div>
        </header>
    )
}

export default Header