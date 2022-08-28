import React from 'react';
import DotsLoader from 'components/Loaders/DotsLoader';
import FieldRadioInput from 'components/FieldRadioInput';
import { FormControlLabel, Radio } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

interface Props {
  handleFormSubmit: (data: any) => null
  handleClose: () => null
  deleting: boolean
  errorMsg?: string
}

const deleteMessageSchema = yup.object().shape({
  deleteType: yup.string().required('Please select an option'),
});

const DeleteMessageForm: React.FC<Props> = (props: Props) => {
  const {
    handleFormSubmit, deleting, errorMsg, handleClose,
  } = props;
  const formProps = useForm({
    resolver: yupResolver(deleteMessageSchema),
    mode: 'onChange',
  });

  return (
    <form className="mt-sm" onSubmit={formProps.handleSubmit(handleFormSubmit)}>
      <div className="m_content radio_form p0">
        <FieldRadioInput
          id="deleteType"
          name="deleteType"
          className="textInput"
          formProps={formProps}
          label="Delete Message"
        >
          <FormControlLabel value="everyone" control={<Radio />} className="fs12" label="Delete for everyone" />
          <FormControlLabel value="user" control={<Radio />} className="fs12" label="Delete for me" />
        </FieldRadioInput>
      </div>
      {errorMsg ? (
        <p className='error'>{errorMsg}</p>
      ) : null}
      <div className="f_center mt-sm">
        <button type='submit' aria-label="Delete message" disabled={!formProps.formState.isValid} className="fill_red_btn btn-effect btn">{!deleting ? 'Delete' : <DotsLoader />}</button>
        <button type='button' className="outline_btn btn-effect btn" onClick={handleClose} aria-label="Click to close the delete message confirmation popup">
          Cancel
        </button>
      </div>
    </form>
  );
};

DeleteMessageForm.defaultProps = {
  errorMsg: undefined,
};

export default DeleteMessageForm;
