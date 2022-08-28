/* eslint-disable jsx-a11y/label-has-associated-control */
import React, {
  useState, useEffect, useRef,
} from 'react';
import CameraUpload from 'components/CameraUpload';
import ReactCrop from 'react-image-crop';
import ModalComponent from 'components/Modal';
import { getVideoCover } from 'utils/mediaUpload';
import 'react-image-crop/dist/ReactCrop.css';

interface Props {
  formProps?: any
  shouldCrop?: boolean
  showModalType: string
  currentFiles: File[] | undefined
  multiple?: boolean
  isVideo?: boolean
  handleModalTypeChange: (type: string) => void
  handleFileChange: (data: File[]) => void
  handleThumbnailChange?: (data: File) => void
  handleCurrentImageChange: (data: string[]) => void
  handleButtonClick: () => void
}

enum ButtonTypes {
  'button',
  'submit',
  'reset',
  undefined
}

interface CropState {
  crop: {
    unit: 'px' | '%' | undefined;
    width: number;
    height: number;
    x: number;
    y: number;
    aspect: number;
  },
  cropComplete: {
    aspect: number;
    width: number;
    height: number;
    unit: 'px' | '%' | undefined;
    x: number;
    y: number;
  },
  fileName: string,
  image: string | ArrayBuffer | null,
  file: null,
}

const ImageUpload = (props: Props) => {
  const {
    formProps, isVideo, shouldCrop, multiple, showModalType, currentFiles, handleModalTypeChange, handleFileChange, handleThumbnailChange, handleCurrentImageChange, handleButtonClick,
  } = props;
  const [showModal, setShowModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [totalFiles, setTotalFiles] = useState<File[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [resetState, setResetState] = useState(false);

  // terms
  const [readTerms, setReadTerms] = useState(false);

  const imageRef: any = useRef(null);

  let fileURL: any = null;

  const [cropState, setCropState] = useState<CropState>({
    crop: {
      unit: 'px',
      width: 50,
      height: 50,
      x: 25,
      y: 25,
      aspect: 1 / 1,
    },
    cropComplete: {
      aspect: 1,
      width: 50,
      height: 50,
      unit: 'px',
      x: 25,
      y: 25,
    },
    fileName: 'newImage.jpg',
    image: '',
    file: null,
  });

  const handleModalClose = () => {
    setShowModal(false);
    handleModalTypeChange('');
  };

  // crop functions
  const onCropComplete = (crop: any) => {
    let cropped: any = { ...crop };
    if (cropped.height === 0 && cropped.width === 0) {
      cropped = {
        unit: 'px',
        width: 50,
        height: 50,
        x: 25,
        y: 25,
        aspect: 1 / 1,
      };
    }
    setCropState({ ...cropState, cropComplete: cropped });
  };

  const onImageLoaded = (image: any) => {
    imageRef.current = image;
  };

  const onCropChange = (crop: any) => {
    setCropState({ ...cropState, crop });
  };

  const getCroppedImg = (image: any, crop: any, fileName: any) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx: any = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise<{ fileURL: string; newFile: File }>((resolve, reject) => {
      canvas.toBlob((b: any) => {
        const blob = b;
        if (!blob) {
          // reject(new Error('Canvas is empty'));
          console.error('Canvas is empty');
          return;
        }
        const fileNameSplit = fileName?.split('.');
        blob.name = `${fileNameSplit[0] ?? 'newImage'}`;
        if (fileURL) window.URL.revokeObjectURL(fileURL);
        fileURL = window.URL.createObjectURL(blob);
        const newFile: any = new File([blob], blob.name, {
          type: `image/${fileNameSplit[fileNameSplit.length - 1] ?? 'jpeg'}`,
        });
        resolve({ fileURL, newFile });
      }, 'image/jpeg');
    });
  };

  const makeClientCrop = async (crop: any) => {
    if (imageRef?.current && crop.width && crop.height) {
      const { fileURL: croppedImageUrl, newFile } = await getCroppedImg(
        imageRef.current,
        crop,
        cropState.fileName,
      );

      if (cropState?.file) {
        setImages((prevImages) => {
          handleCurrentImageChange(multiple && prevImages.length > 0 ? [...prevImages, croppedImageUrl] : [croppedImageUrl]);
          return multiple && prevImages.length > 0 ? [...prevImages, croppedImageUrl] : [croppedImageUrl];
        });
        if (handleFileChange) {
          setTotalFiles((prevFiles) => {
            handleFileChange(multiple && prevFiles.length > 0 ? [...prevFiles, newFile] : [newFile]);
            return multiple && prevFiles.length > 0 ? [...prevFiles, newFile] : [newFile];
          });
        }
        setShowModal(false);
        setModalType('');
        handleModalTypeChange('');
        setResetState(true);
      }
    }
  };

  const saveCroppedImage = () => {
    if (cropState.cropComplete) {
      makeClientCrop(cropState.cropComplete);
      formProps.setValue('channelIconImage', 'added', { shouldDirty: true });
    }
    return null;
  };

  // upload photo
  const setTakePhotoCropState = (image: any, file: any, fileName: any) => {
    setCropState({
      ...cropState, image, file, fileName: fileName ?? 'newImage.jpg',
    });
  };

  // TERMS MODAL FUNCTIONS
  const isBottom = (el: EventTarget & HTMLDivElement) => {
    const bottom = el.scrollHeight - el.scrollTop === el.clientHeight || Math.abs(el.scrollHeight - (el.scrollTop + el.clientHeight)) <= 1;
    return bottom;
  };
  const handleElementScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const wrappedElement: EventTarget & HTMLDivElement = e?.currentTarget;
    if (wrappedElement && isBottom(wrappedElement)) {
      setReadTerms(true);
    }
  };

  const modalContent = () => {
    if (modalType === 'crop') {
      return (
        <div>
          <span className="xs_title m_title">
            Update Picture
          </span>
          {cropState?.image && (
            <div className="img_cropper">
              <ReactCrop
                src={typeof cropState.image === 'string' ? cropState.image : ''}
                crop={cropState.crop}
                ruleOfThirds
                onImageLoaded={onImageLoaded}
                onComplete={onCropComplete}
                onChange={onCropChange}
              />
            </div>
          )}
          <div className="f_center">
            <button type="button" className="fill_red_btn btn-effect btn" onClick={saveCroppedImage}>
              Save
            </button>
            <button type="button" className="outline_btn btn-effect btn" onClick={handleModalClose}>
              Cancel
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const setCurrentPreview = (file: any) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropState((prevCropState: CropState) => ({
          ...prevCropState, image: reader.result, file, fileName: file.name ?? 'newImage.jpg',
        }));
      }, false);
      if (file) {
        reader.readAsDataURL(file);
      }
    };

    const handleImageChange = (files: File[]) => {
      if (files?.length === 1 && shouldCrop) {
        setCurrentPreview(files[0]);
        setShowModal(true);
        setModalType('crop');
      } else if (files?.length > 0) {
        if (isVideo && files.length === 1) {
          getVideoCover(files[0]).then((response: File) => {
            const localUrl = URL.createObjectURL(response);
            handleCurrentImageChange([localUrl]);
            if (handleThumbnailChange) {
              handleThumbnailChange(response);
            }
            handleFileChange(files);
            //
          }).catch((err: string) => console.error(err));
        } else {
          handleFileChange(files);
          const fileImages = files.map((file: File) => URL.createObjectURL(file));
          handleCurrentImageChange(fileImages);
        }
      }
    };

    if (currentFiles) {
      handleImageChange(currentFiles);
    }
  }, [currentFiles]);

  useEffect(() => {
    if (showModalType === 'camera') {
      setShowCameraModal(true);
    } else if (showModalType) {
      setShowModal(true);
      setModalType(showModalType);
    } else {
      setShowModal(false);
    }
  }, [showModalType]);

  return (
    <>
      <ModalComponent
        id="channel-creation-image-crop"
        className={modalType === 'crop' ? 'image-crop' : ''}
        isOpen={showModal}
        onClose={handleModalClose}
        onManageDisableScrolling={() => null}
        lightCloseButton={false}
      >
        {modalContent()}
      </ModalComponent>
      <CameraUpload
        open={showCameraModal}
        handleCameraModalClose={() => {
          setShowCameraModal(false);
          setCropState({
            crop: {
              unit: '%',
              width: 25,
              height: 25,
              x: 25,
              y: 25,
              aspect: 1 / 1,
            },
            cropComplete: {
              unit: '%',
              width: 25,
              height: 25,
              x: 25,
              y: 25,
              aspect: 1 / 1,
            },
            fileName: 'newImage.jpg',
            image: '',
            file: null,
          });
          return null;
        }}
        onImageLoaded={onImageLoaded}
        onCropComplete={onCropComplete}
        onCropChange={onCropChange}
        saveCroppedImage={saveCroppedImage}
        cropState={cropState}
        setCropState={setTakePhotoCropState}
        resetState={resetState}
        setResetState={setResetState}
        handleImageClick={() => null}
      />
    </>
  );
};

ImageUpload.defaultProps = {
  handleThumbnailChange: null,
  formProps: undefined,
  multiple: false,
  shouldCrop: false,
  isVideo: false,
};

export default ImageUpload;
