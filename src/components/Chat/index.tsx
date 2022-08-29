import LayoutSingleColumn from 'components/LayoutSingleColumn'
import LayoutWrapperMain from 'components/LayoutWrapperMain'
import { DocumentData, Unsubscribe } from 'firebase/firestore'
import UserModel from 'firestore/usersModel'
import { User } from 'interfaces/firestore'
import Cookies from 'js-cookie'
import React, { useEffect, useRef, useState } from 'react'
import ChatContainer from './ChatContainer'

const Chat = () => {
    const uid = Cookies.get('st-uid');
    const [usersInDb, setUserInDb] = useState<{ [userId: string]: User } | null>(null);
    const [currentUserInfo, setCurrentUserInfo] = useState<User | null>(null);

    const usersListener = useRef<Unsubscribe | null>(null);

    const handleToastMessage = () => {
        //
    }

    useEffect(() => {
        let unsubscribeUsersListener = usersListener.current;
        const updateUsersData = (d: DocumentData | undefined) => {
            if (d) {
                if (uid && d[uid]) {
                    setCurrentUserInfo(d[uid]);
                    delete d[uid];
                }
                setUserInDb((prevData) => prevData ? { ...prevData, d } : d);
            }
        }

        if (!usersInDb && uid) {
            if (unsubscribeUsersListener) {
                unsubscribeUsersListener();
            }
            const UserModelObject = new UserModel();
            unsubscribeUsersListener = UserModelObject.addsUserListener(updateUsersData);
            usersListener.current = unsubscribeUsersListener;
        }

        return () => {
            if (unsubscribeUsersListener) {
                unsubscribeUsersListener();
            }
        }
    }, [usersInDb, uid]);

    return (
        <LayoutSingleColumn>
            <LayoutWrapperMain>
                <ChatContainer usersInDb={usersInDb} currentUserInfo={currentUserInfo} handleToastMessage={handleToastMessage} />
            </LayoutWrapperMain>
        </LayoutSingleColumn>

    )
}

export default Chat