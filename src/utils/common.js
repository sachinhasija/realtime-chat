import moment from 'moment';

const fallbackCopyTextToClipboard = (str, callback) => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  try {
    const selected = document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : false;
    el.select();
    document.execCommand('copy');
    callback(true);
    document.body.removeChild(el);
    if (selected) {
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(selected);
    }
  } catch (err) {
    // something went wrong
  }
};

const copyTextToClipboard = (text, callback) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text, callback);
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    callback(true);
  }, (err) => {
    console.error('Async: Could not copy text: ', err);
  });
};

const countdown = (ts, isOwn = false) => {
  const now = new Date().getTime();
  const timestamp = +new Date(ts);
  let delta = (timestamp - now) / 1000;
  if (timestamp < now) {
    return isOwn ? '' : 'Waiting for the host';
  }
  const days = Math.floor(delta / 86400);
  delta -= days * 86400;

  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;

  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;

  return `Event starts in ${days > 0 ? days : 0} days ${hours > 0 ? hours : 0} hours ${minutes > 0 ? minutes : 0} minutes`;
};

const formatTime = (timestamp, scheduled = false, short = false) => {
  if (scheduled) {
    // const currentTime = +new Date();
    // const scheduledTimestamp = +new Date(timestamp);
    const scheduledTime = moment(timestamp).format('hh:mm a');
    const scheduledDate = moment(timestamp).format('DD MMMM, YYYY');
    return `${scheduledDate} at ${scheduledTime}`;
  }
  if (timestamp) {
    if (!short) {
      return moment(timestamp).fromNow();
    }
    moment.locale('en', {
      relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: 'seconds',
        ss: '%ss',
        m: 'a minute',
        mm: '%dm',
        h: 'an hour',
        hh: '%dh',
        d: 'a day',
        dd: '%dd',
        M: 'a month',
        MM: '%dM',
        y: 'a year',
        yy: '%dY',
      },
    });
    return moment(timestamp).fromNow();
  }
  return '';
};

const formatDate = (timestamp) => {
  const REFERENCE = moment();
  const TODAY = REFERENCE.clone().startOf('day');
  const YESTERDAY = REFERENCE.clone().subtract(1, 'days').startOf('day');
  const A_WEEK_OLD = REFERENCE.clone().subtract(7, 'days').startOf('day');
  const messageDate = moment(timestamp);

  if (messageDate.isSame(TODAY, 'd')) {
    return 'Today';
  }
  if (messageDate.isSame(YESTERDAY, 'd')) {
    return 'Yesterday';
  }
  if (messageDate.isAfter(A_WEEK_OLD)) {
    return moment(timestamp).format('dddd');
  }

  return moment(timestamp).format('DD/MM/yyyy');
};

function connect(div1, div2) {
  function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.pageXOffset,
      top: rect.top + window.pageYOffset,
      width: rect.width || el.offsetWidth,
      height: rect.height || el.offsetHeight,
    };
  }
  const off1 = getOffset(div1);
  const off2 = getOffset(div2);

  const x1 = off1.left + off1.width;
  const y1 = off1.top + off1.height;

  const x2 = off2.left + off2.width;
  const y2 = off2.top;

  const length = Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
  const cx = ((x1 + x2) / 2) - (length / 2);
  const cy = ((y1 + y2) / 2) - (1 / 2);
  const angle = Math.atan2((y1 - y2), (x1 - x2)) * (180 / Math.PI);

  return {
    cx: `${cx}px`, cy: `${cy}px`, length: `${length}px`, angle: `${angle}deg`,
  };
}

function annotate(number, maxPlaces, forcePlaces, abbr) {
  let rounded = 0;
  switch (abbr) {
    case 'T':
      rounded = number / 1e12;
      break;
    case 'B':
      rounded = number / 1e9;
      break;
    case 'M':
      rounded = number / 1e6;
      break;
    case 'K':
      rounded = number / 1e3;
      break;
    case '':
      rounded = number;
      break;
    default:
      rounded = number;
      break;
  }
  if (maxPlaces !== false) {
    const test = new RegExp(`\\.\\d{${maxPlaces + 1},}$`);
    if (test.test((`${rounded}`))) {
      rounded = rounded.toFixed(maxPlaces);
    }
  }
  if (forcePlaces !== false) {
    rounded = Number(rounded).toFixed(forcePlaces);
  }
  return rounded + abbr;
}

function abbreviate(num, maxPlaces, forcePlaces, letterForced) {
  const number = Number(num);
  const forceLetter = letterForced || false;
  if (forceLetter !== false) {
    return annotate(number, maxPlaces, forcePlaces, forceLetter);
  }
  let abbr;
  if (number >= 1e12) {
    abbr = 'T';
  } else if (number >= 1e9) {
    abbr = 'B';
  } else if (number >= 1e6) {
    abbr = 'M';
  } else if (number >= 1e3) {
    abbr = 'K';
  } else {
    abbr = '';
  }
  return annotate(number, maxPlaces, forcePlaces, abbr);
}

export {
  connect,
  copyTextToClipboard,
  formatTime,
  formatDate,
  abbreviate,
  countdown,
};
