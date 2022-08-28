import React from 'react';
import classNames from 'classnames';
import {
  RadioGroup, FormControl,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import css from './FieldRadioInput.module.scss';

interface Props {
  rootClassName?: string,
  className?: string,
  inputRootClass?: string,
  children?: any,

  // Label is optional, but if it is given, an id is also required so
  // the label can reference the input in the `for` attribute
  id: string,
  name: string,
  defaultValue?: any,
  showError?: boolean,
  formProps: any,
  label?: string
}

const FieldRadioInput = (props: Props) => {
  /* eslint-disable no-unused-vars */
  const {
    rootClassName,
    className,
    inputRootClass,
    children,
    id,
    name,
    showError,
    defaultValue,
    label,
    formProps: { formState: { errors }, control },
  } = props;

  const errorText = errors && errors[id]?.message;

  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue || null}
        render={({
          field,
        }) => (
          <FormControl component="fieldset" className={inputRootClass}>
            <RadioGroup
              aria-label={label}
              defaultValue={defaultValue}
              {...field}
            >
              {children}
            </RadioGroup>
          </FormControl>
        )}
      />
      {showError ? (
        <p className='error'>{errorText}</p>
      ) : null}
    </div>
  );
};

FieldRadioInput.defaultProps = {
  rootClassName: null,
  className: null,
  inputRootClass: null,
  children: null,
  defaultValue: null,
  showError: true,
  label: '',
};

export default FieldRadioInput;
