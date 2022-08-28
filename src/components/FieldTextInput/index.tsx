import React from 'react';
import classNames from 'classnames';
import {
  TextField,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import css from './FieldTextInput.module.scss';

interface Props {
  rootClassName?: string,
  className?: string,
  inputRootClass?: string,
  formName: string,

  id: string,
  label?: string,
  placeholder?: string,
  name: string,
  type: string,
  valid?: boolean,
  showError?: boolean,
  row?: number
  onKeyDownHandler?: (e: React.KeyboardEvent<HTMLInputElement>) => null,
  onchange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  defaultValue?: string,
  defaultValueCc?: string,
  valueMain?: string | number,
  handleFocusBlur?: (status: boolean) => void,
  setTextareaLength?: any,
  hideCc?: boolean
  disabled?: boolean
  formProps?: any,

  handleMainInputChange?: (data: any) => null,
  showVisibilityIcon?: boolean,
}

const FieldTextInput = (props: Props) => {
  /* eslint-disable no-unused-vars */
  const {
    rootClassName,
    className,
    inputRootClass,
    id,
    label,
    placeholder,
    disabled,
    name,
    valueMain,
    type,
    hideCc,
    handleMainInputChange,
    onKeyDownHandler,
    defaultValue,
    setTextareaLength,
    handleFocusBlur,
    row,
    onchange,
    formProps: { formState: { errors }, control },
    valid,
    showVisibilityIcon,
    showError,
  } = props;
  /* eslint-enable no-unused-vars */

  const errorText = errors && errors[id]?.message;
  const isTextarea = type === 'textarea';

  const inputClasses = classNames(inputRootClass, css.input, {
    [css.inputSuccess]: valid,
  });

  const textareaProps = isTextarea ? { multiline: row !== 1, rows: row ?? 4 } : {};
  const classes = classNames(rootClassName || css.root, className ? css[className] : null);
  return (
    <div className={classes}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue || ''}
        render={({
          field: {
            onChange, onBlur, value, ref,
          },
        }) => (
          <>
            <div className="text_field">
              <TextField
                onChange={(e) => {
                  onChange(e);
                  if (setTextareaLength) { setTextareaLength(e?.target?.value?.length); }
                  handleMainInputChange?.(e);
                  if (onchange) {
                    onchange(e);
                  }
                }}
                onBlur={() => {
                  onBlur();
                  if (handleFocusBlur) {
                    handleFocusBlur(false);
                  }
                }}
                value={typeof valueMain !== 'undefined' ? valueMain : value}
                ref={ref}
                disabled={disabled}
                className={inputClasses}
                onFocus={() => {
                  if (handleFocusBlur) {
                    handleFocusBlur(true);
                  }
                }}
                InputProps={{
                  className: classNames(css.inputMainClass, { [css.phoneNumberPadding]: id === 'phoneNo' && !hideCc }),
                }}
                onKeyDown={onKeyDownHandler}
                // eslint-disable-next-line react/jsx-no-duplicate-props
                inputProps={{
                  maxLength: isTextarea ? 2000 : 100,
                }}
                autoComplete="new-password"
                id={id}
                label={label}
                name={name}
                placeholder={placeholder}
                type={type}
                variant="outlined"
                error={!!errors[id]}
                {...textareaProps}
              />
            </div>
          </>
        )}
      />
      {showError ? (
        <p className='error'>{errorText}</p>
      ) : null}
    </div>
  );
};

FieldTextInput.defaultProps = {
  rootClassName: null,
  className: null,
  inputRootClass: null,
  label: null,
  placeholder: null,
  defaultValue: '',
  defaultValueCc: '',
  row: undefined,
  handleMainInputChange: () => null,
  onchange: null,
  passwordTypeHandler: () => null,
  onKeyDownHandler: () => null,
  passwordTipsHandler: null,
  valueMain: undefined,
  setTextareaLength: null,
  showVisibilityIcon: null,
  showInfoIcon: false,
  hideCc: false,
  valid: null,
  showError: true,
  disabled: false,
  handleFocusBlur: undefined,
};

export default FieldTextInput;
