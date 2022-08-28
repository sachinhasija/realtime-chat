import React from 'react';
import {
  Room, NewChatData, User,
} from 'interfaces/firestore';
import Image from 'components/Image';

interface Props {
    name: string
    img: string
    id: string
    handleNewChat: (data: NewChatData) => null
    inboxData: Map<string, string> | null,
    roomData: { [roomId: string]: Room; } | null
    chatData: {[userId: string]: User} | null
}

const NewChatUserCard = ({
  name, img, id, handleNewChat, inboxData, roomData, chatData,
}: Props) => {
  const startNewChat = () => {
    const newChatData : NewChatData = {
      name,
      chatId: id,
    };
    if (inboxData) {
      const inboxDataArray: [string, string] | undefined = Array.from(inboxData).find((inboxArray: string[]) => inboxArray[1] === id);
      const roomId = inboxDataArray?.[0] ?? null;
      if (roomId && roomData?.[roomId] && chatData?.[id]) {
        const isGroup = roomData?.[roomId].chatRoomType === 'group';
        newChatData.roomId = roomData?.[roomId].chatRoomId;
        if (!isGroup && chatData[id].showOnline) {
          newChatData.isOnline = chatData[id].isOnline;
        }
      }
    }
    handleNewChat(newChatData);
    return null;
  };

  return (
    <li role="presentation" onClick={startNewChat}>
      <div className="by_wrap m0">
        <figure className="u_img">
          <Image src={img} fallbackSrc="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" alt="user-img" />
        </figure>
        <span className="capitalize">{name ?? ''}</span>
      </div>
    </li>
  );
};

export default NewChatUserCard;
