import React from 'react';

import css from './dotsLoader.module.scss';

const Loader = () => (
  <div className={css.dot_loader}>
    <div className={css.dot} />
  </div>
);

export default Loader;
