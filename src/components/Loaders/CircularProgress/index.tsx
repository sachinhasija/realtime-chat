import React from 'react';
import { CircularProgress } from '@mui/material';

interface Props {
  className?: string
}

export default function Loading(props: Props) {
  const { className } = props;
  return (
    <div className={className}>
      <CircularProgress role="progressbar" id="progress" title="Progress" aria-label="progress" aria-labelledby="progress" />
    </div>
  );
}

Loading.defaultProps = {
  className: undefined,
};
