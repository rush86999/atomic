import React, { useCallback, useEffect } from "react"
import { debounce } from 'lodash'
import Box from '@components/common/Box'




 type Props = {
   updateTaskNotes: (index: number, notes: string) => void,
   notesArray: string[],
 }

const DEBOUNCE_SAVE_DELAY_MS = 1000


export default function Autosave(props: Props) {
  const {
    updateTaskNotes,
    notesArray,
  } = props

  const saveData = useCallback(async (newData: string[]) => {
    const promises = newData.map(async (notes, i) => updateTaskNotes(i, notes))

    await Promise.all(promises)
  }, [])

  const debouncedSave = useCallback(
    debounce(async (newData: string[]) => saveData(newData), DEBOUNCE_SAVE_DELAY_MS)
  , [])

  useEffect(() => {
    if (notesArray?.[0]) {
      debouncedSave(notesArray)
    }
  }, [debouncedSave])

  return <Box />
}
