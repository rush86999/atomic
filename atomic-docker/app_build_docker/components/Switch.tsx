import React, { ChangeEventHandler, DetailedHTMLProps } from 'react';
import cls from 'classnames'
import { SwitchProps } from './checkbox/types';
import { Switch } from '@chakra-ui/react'
export default function Switch1({
    style,
    label,
    className,
    checked,
    onValueChange,
    ...rest
}: SwitchProps & (React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>)): JSX.Element {

    return (
    <div>
        {
            label ? (
            <div className = "form-control w-52" >
                <label className="cursor-pointer label">
                    {label && (<span className="label-text">{label}</span> )}
                    <Switch colorScheme='purple' style={style} isChecked={checked} onChange={(e) => onValueChange(e?.target?.checked)}  className={cls({ [`${className ?? 'atomic-placeholder'}`]: !!className })} />
                </label>
            </div>
            ) : (
            <Switch colorScheme='purple' style={style} isChecked={checked} onChange={(e) => onValueChange(e?.target?.checked)}  className={cls({ [`${className ?? 'atomic-placeholder'}`]: !!className })} />
        )
    }
    </div>
    )
}



