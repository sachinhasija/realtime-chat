/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import MainCarousel from 'components/MainCarousel';
import Image from 'components/Image';
import {
  MessageData,
} from 'interfaces/firestore';
import { formatDate } from 'utils/common.js';
import channelImage from 'assets/images/image-placeholder.svg';
import moment from 'moment';

interface Props {
  data: [string, MessageData][]
  selectedIndex?: number
}

const PostViewerComponent = (props: Props) => {
  const {
    data,
    selectedIndex,
  } = props;
  const [index, setIndex] = useState(selectedIndex ?? 0);
  const formatMediaTime = (timestamp: number) => {
    try {
      return `${formatDate(timestamp)}, ${moment(timestamp)?.local().format('hh:mm A')}`;
    } catch (err) {
      //
    }
    return null;
  };

  return data && Array.isArray(data) ? (
    <div className="media_detail_wrap">
      {typeof index !== 'undefined' && data[index]?.[1]?.senderName ? (
        <div className="user_detail_wrap">
          <h1>{data[index]?.[1]?.senderName}</h1>
          {data[index]?.[1].timestamp ? (
            <span className="date">{formatMediaTime(Number(data[index]?.[1].timestamp))}</span>
          ) : null}
        </div>
      ) : null}
      <MainCarousel
        className="carousel"
        autoPlay={false}
        indicators={false}
        index={index}
        handleChange={(i: number) => {
          if (typeof i === 'number') {
            setIndex(i);
          }
        }}
        navButtonsAlwaysVisible={data.length > 1}
      >
        {data.map((message: [string, MessageData]) => (message[1].mediaUrl ? (
          <figure className="media_content" key={message[1].messageId}>
            {message[1].type === 'image' ? (
              <Image
                src={message[1].type === 'image' ? message[1].mediaUrl : message[1].type === 'video' && message[1].thumbnail ? message[1].thumbnail : ''}
                fallbackSrc={channelImage}
                alt={`from user ${message[1].senderName}`}
              />
            ) : message[1].type === 'video' ? (
              <video src={message[1].mediaUrl} muted autoPlay />
            ) : null}
          </figure>
        ) : null))}
      </MainCarousel>
    </div>
  ) : null;
};

PostViewerComponent.defaultProps = {
  selectedIndex: 0,
};

export default React.memo(PostViewerComponent);
