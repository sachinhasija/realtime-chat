import React from 'react';

import placeholder from 'assets/images/ic_avatar_placeholder.svg';
import scss from './ForwardUser.module.scss';

interface Props {
    name: string,
    id: string,
    handleRemoveUser: (userId: string) => null
}

const ForwardSelectedUser = ({ name, id, handleRemoveUser }: Props) => (
  <div className={scss.forward_user_wrapper}>
    <figure className={scss.img_wrapper}>
      <img src={placeholder} alt="img" className="invert placeholder_img" />
      <button type="button" aria-label="Remove this user" className={scss.remove} onClick={() => handleRemoveUser(id)}>&nbsp;</button>
    </figure>
    <span className={scss.name}>{name}</span>
  </div>
);

export default ForwardSelectedUser;
