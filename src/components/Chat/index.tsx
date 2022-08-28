import LayoutSingleColumn from 'components/LayoutSingleColumn'
import LayoutWrapperMain from 'components/LayoutWrapperMain'
import React from 'react'
import ChatContainer from './ChatContainer'

const Chat = () => {
    const handleToastMessage = () => {
        //
    }
    return (
        <LayoutSingleColumn>
            <LayoutWrapperMain>
                <ChatContainer handleToastMessage={handleToastMessage} />
            </LayoutWrapperMain>
        </LayoutSingleColumn>

    )
}

export default Chat