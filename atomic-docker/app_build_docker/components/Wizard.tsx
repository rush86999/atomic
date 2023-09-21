import React, { ReactElement } from 'react'

import cls from 'classnames'
import { WizardItemDisplayPropsType, WizardItemPropsType, WizardPropsType } from './wizard/types'
import { getStepState, WizardState } from './wizard/wizard-helper'

function WizardItem(props: WizardItemDisplayPropsType) {
    const state = props?.state
    const label = props?.label
    const index = props?.index

    if (state === WizardState.COMPLETED) {
        
        return (
            <li className="flex">
                <span className="rounded bg-green-50 p-1.5 text-green-600">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                        />
                    </svg>
                </span>
            </li>
        )
    }

    if (state === WizardState.ENABLED) {
        return (
            <li className="flex items-center justify-center gap-2 text-purple-600">
                <span
                className="h-6 w-6 rounded bg-purple-50 text-center text-[10px] font-bold leading-6"
                >
                {index + 1}
                </span>

                <span> {label} </span>
            </li>
        )
    }

    return <div />
}


export default function Wizard(props: WizardPropsType) {
    const items = props?.items
    const activeIndex = props?.activeIndex
    const completed = props?.completed

    // getStepState

    

    return (
        <div>
            <h2 className="sr-only">Steps</h2>

            <div>
                <ol
                className="flex items-center gap-2 text-xs font-medium text-gray-500 sm:gap-4"
                >
                    {items?.map((item) => <WizardItem key={item?.label} state={getStepState(item?.index, completed, activeIndex)} index={item?.index} label={item?.label} />)}
                </ol>
            </div>
        </div>
    )


}
