import React from 'react';
import noMessageLight from 'assets/images/no-message-light.svg';
import noMessage from 'assets/images/no-message.png';
import noMsgImg from 'assets/images/no_msg.svg';

import scss from '../Chat.module.scss';

const NoMessages = ({ dataPresent }: { dataPresent: boolean }) => (
  <div className={scss.no_message_wrap}>
    {!dataPresent ? (
      <div className={`no_data ${scss.empty_chat}`}>
        <div className="empty_box">
          <figure className="empty_img">
            <img src={noMsgImg} role="presentation" alt="" />
          </figure>
          <p className="empty_txt">
            NO MESSAGES YET
          </p>
        </div>
      </div>
    ) : (
      <div className={`no_data ${scss.no_message}`}>
        <figure className="no_img">
          <img src={noMessage} className="dark_theme_img" alt="No message" />
          <img src={noMessageLight} className="light_theme_img" alt="No message" />
        </figure>
        <div>
          <span>
            No Conversation Open
          </span>
          <span className="show_label">
            Please select a conversation from left menu.
          </span>
        </div>
      </div>
    )}
  </div>
);

export default React.memo(NoMessages);
