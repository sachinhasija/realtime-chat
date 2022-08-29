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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const userOnline = useRef(false);
    const usersListener = useRef<Unsubscribe | null>(null);

    const handleToastMessage = () => {
        // to be used to add toast messages
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

    useEffect(() => {
        const cleanUp = () => {
            if (userOnline.current && currentUserInfo?.id) {
                const userModelObject = new UserModel();
                userModelObject.updateUser(currentUserInfo?.id, { isOnline: false, lastSeen: `${+new Date()}` });
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', cleanUp);
        }
        return () => {
            cleanUp();
            if (typeof window !== 'undefined') {
                window.removeEventListener('beforeunload', cleanUp);
            }
        };
    }, [currentUserInfo]);

    useEffect(() => {
        const userModelObject = new UserModel();
        if (currentUserInfo?.id) {
            userModelObject.userExists(currentUserInfo?.id).then((response: boolean) => {
                if (response) {
                    userModelObject.updateUser(currentUserInfo?.id, { isOnline: true, lastSeen: `${+new Date()}` });
                    userOnline.current = true;
                    if (!intervalRef.current) {
                        intervalRef.current = setInterval(() => {
                            userModelObject.updateUser(currentUserInfo?.id, { lastSeen: `${+new Date()}` });
                        }, 4000);
                    }
                }
            });
        }
    }, [currentUserInfo]);

    return (
        <LayoutSingleColumn>
            <LayoutWrapperMain>
                <ChatContainer usersInDb={usersInDb} currentUserInfo={currentUserInfo} handleToastMessage={handleToastMessage} />
            </LayoutWrapperMain>
        </LayoutSingleColumn>

    )
}

export default Chat