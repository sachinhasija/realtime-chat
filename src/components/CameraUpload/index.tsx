import React, { useState, useEffect } from 'react';
import ModalComponent from 'components/Modal';
import ReactCrop from 'react-image-crop';
import cameraIcon from 'assets/images/camera.png';
import classNames from 'classnames';

interface Props {
  className?: string
  open: boolean,
  resetState: boolean
  handleCameraModalClose: () => null,
  onImageLoaded: any
  onCropComplete: any
  onCropChange: any
  cropState: any
  setCropState: any
  setResetState: any
  saveCroppedImage: () => null
  handleImageClick: () => null
}

const CameraUpload = (props: Props) => {
  const {
    className, open, resetState, handleCameraModalClose, handleImageClick, setCropState, onImageLoaded, onCropComplete, cropState, setResetState, onCropChange, saveCroppedImage,
  } = props;
  let newFileUrl: any = null;
  const [state, setState] = useState<{ showModal: boolean, cameraPermissions: boolean, newImage: any, modalType: string, stream: null | MediaStream }>({
    showModal: false,
    cameraPermissions: false,
    newImage: null,
    modalType: '',
    stream: null,
  });
  const [videoRef, setVideoRef] = useState<any>(null);
  const classes = classNames(className);

  const handleModalClose = () => {
    setState({ ...state, showModal: false });
    handleCameraModalClose();
    if (state.stream) {
      try {
        state.stream.getTracks().forEach((track: any) => track.stop());
        if (videoRef?.srcObject) {
          videoRef.srcObject = null;
        }
      } catch (err: any) {
        //
      }
    }
  };

  const handleCanPlay = () => {
    videoRef.play();
  };

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      setState({ ...state, modalType: 'permissionsGiven', stream });
    } catch (err) {
      setState({ ...state, modalType: 'permissionsDenied' });
    }
  };

  const takePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef, 0, 0, 360, 360);
      canvas.toBlob((b: any) => {
        const blob = b;
        if (!blob) {
          // reject(new Error('Canvas is empty'));
          console.error('Canvas is empty');
          return;
        }
        blob.name = `${+new Date()}.jpg`;
        if (newFileUrl) window.URL.revokeObjectURL(newFileUrl);
        newFileUrl = window.URL.createObjectURL(blob);
        const newFile: any = new File([blob], blob.name);
        setCropState(newFileUrl, newFile, blob.name);
        setState({ ...state, newImage: newFileUrl, modalType: 'imageClicked' });
      }, 'image/jpeg');
    }
  };

  useEffect(() => {
    if (state.showModal) {
      checkPermissions();
    }
  }, [state.showModal]);

  useEffect(() => {
    if (resetState) {
      setState({
        showModal: false,
        cameraPermissions: false,
        newImage: null,
        modalType: '',
        stream: null,
      });
      handleCameraModalClose();
    }
  }, [resetState]);

  useEffect(() => {
    if (videoRef && !videoRef?.srcObject && state.stream) {
      videoRef.srcObject = state.stream;
    }
  }, [videoRef, state.stream]);

  useEffect(() => {
    setState({ ...state, showModal: open });
    setResetState(false);
  }, [open]);

  const modalContent = () => {
    if (state.modalType === 'allowAccess') {
      return (
        <>
          <div className="sm_popup">
            <span className="xs_title m_title">
              Allow Access
            </span>
            <p className="common_para">
              To take photos, click 'Allow' to give Avatus access to your computer's camera.
            </p>
            <button type="button" className="fill_red_btn btn-effect" onClick={handleModalClose} aria-label="Allow camera access and close the popup">
              Ok
            </button>
          </div>
        </>
      );
    } if (state.modalType === 'permissionsDenied') {
      return (
        <>
          <div className="sm_popup">
            <span className="xs_title m_title">
              Allow Camera
            </span>
            <p className="common_para">
              Camera permissions denied. To take photos, Avatus needs access to your computer's camera.
            </p>
            <button type="button" className="fill_red_btn btn-effect" onClick={handleModalClose} aria-label="You have denied the camera permissions. Click to close this modal">
              Ok
            </button>
          </div>
        </>
      );
    } if (state.modalType === 'permissionsGiven') {
      return (
        <>
          <span className="xs_title m_title">
            Take a photo
          </span>
          <div className="web_cam">
            <figure className="cam">
              <video
                ref={(newRef) => setVideoRef(newRef)}
                autoPlay
                onCanPlay={handleCanPlay}
                playsInline
                muted
              />
            </figure>
            <button type="button" className="capture_btn" onClick={takePhoto} aria-label="Click to capture your photo">
              <img src={cameraIcon} alt="camera" />
            </button>
          </div>
        </>
      );
    } if (state.modalType === 'imageClicked') {
      return (
        <>
          <div className="sm_popup">
            <span className="xs_title m_title">
              Take a photo
            </span>
            <div className="img_cropper">
              <ReactCrop
                src={typeof state.newImage === 'string' ? state.newImage : ''}
                crop={cropState.crop}
                ruleOfThirds
                onImageLoaded={onImageLoaded}
                onComplete={onCropComplete}
                onChange={onCropChange}
              />
            </div>
            <div className="f_center">
              <button
                type="button"
                className="fill_red_btn btn-effect"
                onClick={() => {
                  if (state.stream) {
                    try {
                      state.stream.getTracks().forEach((track: any) => track.stop());
                      if (videoRef?.srcObject) {
                        videoRef.srcObject = null;
                      }
                    } catch (err: any) {
                      //
                    }
                  }
                  saveCroppedImage();
                }}
                aria-label="Click to upload your photo"
              >
                Done
              </button>
              <button
                type="button"
                className="outline_btn btn-effect"
                onClick={() => {
                  setState({ ...state, modalType: 'permissionsGiven' });
                }}
                aria-label="Click to retake your photo"
              >
                Retake
              </button>
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className={classes}>
      <ModalComponent
        id="camera-photo-upload"
        isOpen={state.showModal && state.modalType !== ''}
        onClose={handleModalClose}
        onManageDisableScrolling={() => null}
        lightCloseButton={false}
        showCloseBtn={!(state.modalType === 'allowAccess' || state.modalType === 'permissionsDenied')}
      >
        {modalContent()}
      </ModalComponent>
    </div>
  );
};

CameraUpload.defaultProps = {
  className: undefined,
};

export default CameraUpload;
