import React from 'react';
import {
  Checkbox,
} from '@mui/material';

import placeholder from 'assets/images/ic-avatar-placeholder.svg';
import scss from './ForwardUser.module.scss';

interface Props {
  name: string,
  userId: string,
  isGroup: boolean
  selectedForwardMessageUser: { [userId: string]: { userId: string, name: string } } | null
  handleUserSelect: (data: { userId: string, name: string, isGroup: boolean }, value: boolean) => null
}

const ForwardUser = ({
  name, userId, isGroup, selectedForwardMessageUser, handleUserSelect,
}: Props) => (
  <div className={`f_spacebw ${scss.forward_msgs}`}>
    <div className={scss.img_cover}>
      <figure>
        <img src={placeholder} alt="img" className="invert placeholder_img" />
      </figure>
      <span className={scss.name}>{name}</span>
    </div>
    <Checkbox className="checkbox" {...{ inputProps: { 'aria-label': `Checkbox for user ${name}` } }} checked={!!(selectedForwardMessageUser && selectedForwardMessageUser[userId])} id={userId} name={userId} onChange={(e) => handleUserSelect({ userId, name, isGroup }, e.currentTarget.checked)} />
  </div>
  // <div className="no_data no_data_for_events">
  //   <div className="empty_box">
  //     <figure className="empty_img">
  //       <img src={connect} role="presentation" alt="" />
  //     </figure>
  //     <p className="empty_txt">
  //       <FormattedMessage id="Participants.connect" />
  //     </p>
  //   </div>
  // </div>
);

export default ForwardUser;
