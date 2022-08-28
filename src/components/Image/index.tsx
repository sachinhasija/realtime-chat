/* eslint-disable react/destructuring-assignment */
import React from 'react';

type Props = {
    src: string,
    fallbackSrc: string,
    placeholderColor?: string,
    className?: string,
    alt: string
}

type State = {
    src: string,
    errored: boolean,
    loaded: boolean
}

export default class Image extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      src: props.src,
      errored: false,
      loaded: false,
    };
  }

  static getDerivedStateFromProps(props: any, state: any) {
    if (!state.errored) {
      return {
        src: props.src,
      };
    }
    return null;
  }

  onError = () => {
    if (!this.state.errored) {
      this.setState({
        src: this.props.fallbackSrc,
        errored: true,
      });
    }
  }

  onLoad = () => {
    if (!this.state.loaded) {
      this.setState({ loaded: true });
    }
  }

  render() {
    const style = {
      backgroundColor: this.props?.placeholderColor || 'white',
    };

    if (this.state.loaded) {
      style.backgroundColor = 'transparent';
    }

    return (
      <img
        style={style}
        className={this.props?.className ?? undefined}
        onLoad={this.onLoad}
        onError={this.onError}
        alt={this.props.alt ?? null}
        src={this.state.src ?? null}
      />
    );
  }
}
