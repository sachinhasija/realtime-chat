/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import FieldTextInput from 'components/FieldTextInput';
import DotsLoader from 'components/Loaders/DotsLoader';
import { storage } from '../../firebase.js';
import ImageUpload from 'components/ImageUpload';
import { Menu, MenuItem, Button as MenuButton } from '@mui/material';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import addImg from 'assets/images/add.svg';
import takePhoto from 'assets/images/take-a-photo.svg';
import choosePhoto from 'assets/images/choose-a-file.svg';
import placeholder from 'assets/images/image-placeholder-black.svg';
import common from '../../components/Chat/Chat.module.scss';
import scss from './NewGroupChatForm.module.scss';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

interface Props {
  defaultData?: { name: string, image: string }
  edit?: boolean
  handleFormSubmit: (data: Data) => void
  handleBack: (type: string) => void
}

interface Data {
  channelIconImage: string,
  groupName: string
}

const NewGroupChatForm: React.FC<Props> = (props: Props) => {
  const {
    defaultData, edit, handleFormSubmit, handleBack,
  } = props;

  const [errorMsg, setErrorMsg] = useState('');
  const [loader, setLoader] = useState(false);
  const [fileError, setFileError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState(defaultData?.image ?? '');
  const [textareaLength, setTextareaLength] = useState(defaultData?.name?.length ?? 0);

  // image upload
  const [openFile, setOpenFile] = useState(false);
  const [showModalType, setShowModalType] = useState('');
  const [currentFiles, setCurrentFiles] = useState<File[]>();
  const [fileNode, setFileNode] = useState<null | HTMLInputElement>(null);
  const buttonRef = useRef<any>();
  const onFileRefChange = useCallback((node: null | HTMLInputElement) => {
    if (node != null) {
      setFileNode(node);
    }
  }, [fileNode]);

  const NewGroupChatFormSchema = yup.object().shape({
    groupName: yup.string().required('Please enter the required field').default(defaultData?.name),
    channelIconImage: yup.mixed().required('Please add an image').default(defaultData?.image),
  });

  const open = Boolean(anchorEl);

  const handleClick = (e: any) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onImageUploadHandler = async (file: any, values: any) => {
    if (file) {
      try {
        const fileName = `${+new Date()}_${file.name}`;
        const fileNameWithoutSpecialChars = fileName.replace(
          /[`~!@#$%^&*()_|+\-=?;:\s'",.<>\\{\\}\\[\]\\\\/]/gi,
          '',
        );

        if (file.name.match(/.(jpg|jpeg|png|gif)$/i) || file.type.match(/.(jpg|jpeg|png|gif)$/i)) {
          const imageRef = ref(storage, `${`media/${fileNameWithoutSpecialChars}`}`)
          const uploadTask = uploadBytesResumable(imageRef, file);
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload is ' + progress + '% done');
              switch (snapshot.state) {
                case 'paused':
                  console.log('Upload is paused');
                  break;
                case 'running':
                  console.log('Upload is running');
                  break;
              }
            },
            (error) => {
              switch (error.code) {
                case 'storage/unauthorized':
                  break;
                case 'storage/canceled':
                  break;
                case 'storage/unknown':
                  break;
              }
            },
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((thumbnailUrl) => {
                const data = { ...values };
                data.channelIconImage = thumbnailUrl;
                handleFormSubmit(data);
                setLoader(false);
              })
            })
        } else {
          setFileError('File is not a valid image. Image format allowed - jpg | jpeg | png | gif');
        }
      } catch (err: any) {
        //
      }
    }
  };

  const handleModalTypeChange = (type: string) => {
    setShowModalType(type);
  };

  const mainFormSubmit = (values: any) => {
    if (values) {
      if (currentImage !== defaultData?.image) {
        setLoader(true);
        onImageUploadHandler(currentFile, values);
      } else {
        handleFormSubmit(values);
      }
    }
  };

  const formProps = useForm({
    resolver: yupResolver(NewGroupChatFormSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (currentImage) {
      const image = currentImage?.replace('.com//', '.com/');
      setCurrentImage(image);
    }
  }, [currentImage]);

  useEffect(() => {
    if (fileNode && typeof fileNode.click === 'function' && openFile) {
      setOpenFile(false);
      fileNode.click();
    }
  }, [fileNode, openFile]);

  return (
    <>
      {(
        <div className={`${common.new_chat}`}>
          <h1 className={`xs_title ${common.chat_title}  ${edit ? common.edit_group : ''}`}>
            <button
              type="button"
              className="back_btn m0 pseudo_invert"
              onClick={() => handleBack('members')}
              aria-label="Back"
            >
              &nbsp;
            </button>
            {edit ? 'Edit Group' : 'New Group'}
          </h1>

          <div className={scss.create_group_form}>
            <form onSubmit={formProps.handleSubmit(mainFormSubmit)}>
              <figure className={scss.upload_img}>
                <img src={currentImage || placeholder} className={!currentImage ? 'invert' : ''} alt="placeholder-img" />
                <MenuButton
                  id="image-upload-button"
                  aria-controls="image-upload-options"
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  ref={buttonRef}
                  onClick={handleClick}
                  className={scss.add_remove}
                >
                  <img className="invert" src={addImg} alt="add" />
                </MenuButton>
                <Menu
                  id="card-more-menu"
                  anchorEl={anchorEl}
                  open={open}
                  disableScrollLock
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': 'image-upload-button',
                  }}
                  anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                  }}
                >
                  <MenuItem onClick={() => {
                    handleClose();
                    setShowModalType('camera');
                  }}
                  >
                    <img src={takePhoto} className="dark_hover_img" alt="camera" />
                    <button type="button" className="btn pointer">
                      Take Photo
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <>
                      <label htmlFor="channelIconImage" className={scss.browse}>
                        <img src={choosePhoto} className="dark_hover_img" alt="browse" />
                        Upload
                      </label>
                      <input
                        id="channelIconImage"
                        type="file"
                        accept="image/*"
                        className="hide"
                        ref={onFileRefChange}
                        onChange={(e: any) => {
                          const files = e.target?.files && Array.from(e.target.files);
                          setCurrentFiles(files);
                          handleClose();
                        }}
                      />
                    </>
                  </MenuItem>
                </Menu>
              </figure>

              <div className="flex_row">
                <div className="flex_col_sm_12">
                  <FieldTextInput
                    id="groupName"
                    name="groupName"
                    formName="channel"
                    defaultValue={defaultData?.name}
                    className="textInput"
                    type="text"
                    setTextareaLength={setTextareaLength}
                    formProps={formProps}
                    row={1}
                    label="Group Name*"
                    placeholder=""
                    showError={false}
                  />
                  <span className={`char_count ${scss.char_space}`}>
                    {`${textareaLength}/50 `}
                    {' '}
                    Characters
                  </span>
                </div>
              </div>
              {/* <p className={scss.note}>Specify the number of Avatcoin to subscribe to channel (1 Avatcoin = $0.0040)</p> */}
              <div className="text_field">
                <p>{errorMsg || fileError || ''}</p>
              </div>

              <div className="form_field text-center">
                <button type='submit' disabled={!formProps.formState.isValid} className={classNames('fill_red_btn', 'btn-effect', scss.btn_create,)}>{loader ? <DotsLoader /> : edit ? 'Save' : 'Create'}</button>
              </div>
            </form>
            <ImageUpload
              formProps={formProps}
              currentFiles={currentFiles}
              showModalType={showModalType}
              shouldCrop
              handleModalTypeChange={handleModalTypeChange}
              handleFileChange={(data: File[]) => {
                if (data?.[0]) {
                  setCurrentFile(data[0]);
                }
              }}
              handleCurrentImageChange={(data: string[]) => {
                if (data?.[0]) {
                  setCurrentImage(data[0]);
                }
              }}
              handleButtonClick={() => {
                if (buttonRef && buttonRef.current) {
                  buttonRef.current.click();
                  setOpenFile(true);
                  localStorage.setItem('site-terms', '1');
                  setShowModalType('');
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

NewGroupChatForm.defaultProps = {
  edit: false,
  defaultData: undefined,
};

export default NewGroupChatForm;
