import { palette } from '@lib/theme/theme';
import React, { ChangeEventHandler, DetailedHTMLProps, RefAttributes, TextareaHTMLAttributes, LegacyRef } from 'react';
import cls from 'classnames'
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize'
import {
    Appearance,
  StyleSheet,
} from 'react-native'
 
import { TextInputProps } from './textfield/types';
import {
  validate as _validate,
  getRelevantValidationMessage,
} from './textfield/Presenter'
import _ from 'lodash';

function TextField({
  hint,
  label,
  labelStyle,
  labelColor,
  leadingAccessory,
  trailingAccessory,
  validate,
  validationMessage,
  value,
  onChange,
  fieldStyle,
  containerStyle,
  style,
  multiline,
  numberOfLines,
  labelClassNames,
  className,
  containerClassNames,
  hintClassNames,
  innerRef,
  ...rest }: TextInputProps & (React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> | React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> | TextareaAutosizeProps)) {
  const _value: string = typeof value === 'number' ? `${value}` : _.isArray(value) ? value?.reduce((prev, curr) => `${prev}, ${curr}`, '')  : value

  const [_isValid, _failingValidatorIndex] = _validate(_value, validate)

  const _validationMessage1 = getRelevantValidationMessage(validationMessage, _failingValidatorIndex)
  const _validationMessage: string = _.isArray(_validationMessage1) ? _validationMessage1?.reduce((prev, curr) => `${prev}, ${curr}`, '') : _validationMessage1

  if (multiline) {
    return (
        <div style={{ ...((!!containerStyle && containerStyle) ?? {})}} className="">
        {leadingAccessory && (
          <div>
            {typeof leadingAccessory === 'string' ? (
              <span className="label-text">{leadingAccessory}</span>)
              : (
                leadingAccessory
            )}
          </div>
            
          )}
          <div className={cls("form-control w-full max-w-xs", { [`${containerClassNames ?? 'atomic-placeholder'}`]: !!containerClassNames })}>
            <label className="label">
              {label && (
                <span
                  style={{ ...((!!labelStyle && labelStyle) ?? {}) }}
                  className={cls("label-text", {[`${labelClassNames ?? 'atomic-placeholder'}`]: !!labelClassNames })}
                >
                  {label}
                </span>
              )}
            </label>

            <TextareaAutosize ref={innerRef as React.Ref<HTMLTextAreaElement>} minRows={((!!numberOfLines && numberOfLines) ?? 3)} maxRows={6} style={{ ...(style as TextareaAutosizeProps ?? {}), ...((!!fieldStyle && fieldStyle) ?? {})}} {...rest as TextareaAutosizeProps} placeholder="Type here" className={cls("textarea textarea-primary z-0", {[`${className ?? 'atomic-placeholder'}`]: !!className})} onChange={onChange as ChangeEventHandler<HTMLTextAreaElement>} value={value} />


            <label className="label">
              {hint && (<span className={cls("label-text-alt dark:text-slate-400 text-slate-600", {[`${hintClassNames ?? 'atomic-placehoder'}`]: !!hintClassNames})}>{hint}</span>)}
              {_validationMessage && (<span className="label-text-alt input-error  text-red-600">{_validationMessage}</span>)}
            </label>
        </div>
        {trailingAccessory && (
          <div>
            {typeof trailingAccessory === 'string' ? (
              <span className="label-text">{trailingAccessory}</span>)
              : (
                trailingAccessory
            )}
          </div>
            
          )}
        </div>
    )
  }
  
  return (
    <div style={{ ...((!!containerStyle && containerStyle) ?? {})}} className="flex items-center justify-center">
       {leadingAccessory && (
          <div>
            {typeof leadingAccessory === 'string' ? (
              <span className="label-text">{leadingAccessory}</span>)
              : (
                leadingAccessory
            )}
          </div>
            
          )}
      <div className={cls("form-control w-full max-w-xs", { [`${containerClassNames ?? 'atomic-placeholder'}`]: !!containerClassNames })}>
        <label className="label">
          {label && (
            <span
              style={{ ...((!!labelStyle && labelStyle) ?? {})}}
              className={cls("label-text", {[`${labelClassNames ?? 'atomic-placeholder'}`]: !!labelClassNames })}
            >
              {label}
            </span>
          )}
        </label>


        <input ref={innerRef as LegacyRef<HTMLInputElement>} style={{ ...style, ...((!!fieldStyle && fieldStyle) ?? {})}} {...rest as ChangeEventHandler<HTMLInputElement>} placeholder="Type here" className={cls("input input-bordered input-primary w-full max-w-xs z-0", {[`${className ?? 'atomic-placeholder'}`]: !!className})} onChange={onChange as ChangeEventHandler<HTMLInputElement>} value={value} />


        <label className="label">
          {hint && (<span className={cls("label-text-alt dark:text-slate-400 text-slate-600", {[`${hintClassNames ?? 'atomic-placehoder'}`]: !!hintClassNames})}>{hint}</span>)}
          {_validationMessage && (<span className="label-text-alt input-error text-red-600">{_validationMessage}</span>)}
        </label>
      </div>
      {trailingAccessory && (
          <div>
            {typeof trailingAccessory === 'string' ? (
              <span className="label-text">{trailingAccessory}</span>)
              : (
                trailingAccessory
            )}
          </div>
            
          )}
    </div>
    )
}

export default TextField

