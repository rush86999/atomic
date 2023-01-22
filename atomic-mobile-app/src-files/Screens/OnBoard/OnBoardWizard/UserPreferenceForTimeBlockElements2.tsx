import React, {
    useState,
    Dispatch,
    SetStateAction,
  } from 'react'
  import { Colors, Switch, TextField } from 'react-native-ui-lib'
  
  import Box from '@components/common/Box'
  import Text from '@components/common/Text'
import { ScrollView } from 'react-native'
  
  type Props = {
      copyCategories: boolean,
      copyIsBreak: boolean,
      maxWorkLoadPercent: number,
      minNumberOfBreaks: number,
      breakLength: number,
      setParentCopyCategories: Dispatch<SetStateAction<boolean>>,
      setParentCopyIsBreak: Dispatch<SetStateAction<boolean>>,
      setParentMaxWorkLoadPercent: Dispatch<SetStateAction<number>>,
      setParentMinNumberOfBreaks: Dispatch<SetStateAction<number>>,
      setParentBreakLength: Dispatch<SetStateAction<number>>,
  }
  
  function user_preferenceForTimeBlockElements2(props: Props) {
      const [copyCategories, setCopyCategories] = useState<boolean>(props?.copyCategories)
      const [copyIsBreak, setCopyIsBreak] = useState<boolean>(props?.copyIsBreak)
      const [maxWorkLoadPercent, setMaxWorkLoadPercent] = useState<number>(props?.maxWorkLoadPercent)
      const [minNumberOfBreaks, setMinNumberOfBreaks] = useState<number>(props?.minNumberOfBreaks)
      const [breakLength, setBreakLength] = useState<number>(props?.breakLength)
  
      const setParentCopyCategories = props?.setParentCopyCategories
      const setParentCopyIsBreak = props?.setParentCopyIsBreak
      const setParentMaxWorkLoadPercent = props?.setParentMaxWorkLoadPercent
      const setParentMinNumberOfBreaks = props?.setParentMinNumberOfBreaks
      const setParentBreakLength = props?.setParentBreakLength
  
      const changeCopyCategories = (value: boolean) => {
          setCopyCategories(value)
          setParentCopyCategories(value)
      }
  
      const changeCopyIsBreak = (value: boolean) => {
          setCopyIsBreak(value)
          setParentCopyIsBreak(value)
      }
  
      const changeMaxWorkLoadPercent = (value: number) => {
          setMaxWorkLoadPercent(value)
          setParentMaxWorkLoadPercent(value)
      }
  
      const changeMinNumberOfBreaks = (value: number) => {
          setMinNumberOfBreaks(value)
          setParentMinNumberOfBreaks(value)
      }
  
      const changeBreakLength = (value: number) => {
          setBreakLength(value)
          setParentBreakLength(value)
      }
  
      return (
          <Box flex={1} justifyContent="center" alignItems="center">
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center"  style={{ width: '100%' }}>  
                        <Text variant="optionHeader">Copy over tags to any new events whose details are similar? </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}  style={{ width: '100%' }}>
                        <Switch
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            value={copyCategories}
                            onValueChange={changeCopyCategories}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center"  style={{ width: '100%' }}>   
                        <Text variant="optionHeader">Classify as a break type event for any new events whose details are similar for scheduling assists? </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}  style={{ width: '100%' }}>
                        <Switch
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            value={copyIsBreak}
                            onValueChange={changeCopyIsBreak}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}> 
                        <Text variant="optionHeader">
                            Max work load percent for a typical work day for scheduling assists?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}  style={{ width: '100%' }}>
                        <TextField
                            type="numeric"
                            onChangeText={(text: string) => changeMaxWorkLoadPercent(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
                            value={`${maxWorkLoadPercent}`}
                            placeholder="0"
                            style={{ width: '15%' }}
                        />
                        <Text variant="cardTitle">%</Text>
                    </Box>
                </Box>
                <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center"  style={{ width: '100%' }}>
                        <Text variant="optionHeader">
                            Min number of breaks for a typical work day for scheduling assists?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end"  style={{ width: '100%' }}>
                        <TextField
                            type="numeric"
                            onChangeText={(text: string) => changeMinNumberOfBreaks(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
                            value={`${minNumberOfBreaks}`}
                            placeholder="0"
                            style={{ width: '15%' }}
                        />
                    </Box>  
                </Box>
                <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center"  style={{ width: '100%' }}> 
                        <Text variant="optionHeader">
                            Break length for a typical work day for scheduling assists?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}  style={{ width: '100%' }}>
                        <TextField
                            type="numeric"
                            onChangeText={(text: string) => changeBreakLength(parseInt(text.replace(/[^0-9.]/g, ''), 10))}
                            value={`${breakLength}`}
                            placeholder="0"
                            style={{ width: '15%' }}
                        />
                        <Text variant="body">minutes</Text>
                    </Box>
                </Box>
            </ScrollView>
          </Box>
      )
  }
  
  export default user_preferenceForTimeBlockElements2
  