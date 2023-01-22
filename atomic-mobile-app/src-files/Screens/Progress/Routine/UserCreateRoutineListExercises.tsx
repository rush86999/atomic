import React from 'react';
import {
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Appearance,
} from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { ListItem, Overlay, SearchBar } from 'react-native-elements/src'
import { TextField } from 'react-native-ui-lib'
import {Picker} from '@react-native-picker/picker'
import { palette } from '@theme/theme'
import {
  Exercise, ExerciseType,

} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import PrimaryCard from '@components/PrimaryCard'



const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ');

const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

const getExerciseType = (value: ExerciseType) => {
  switch(value) {
    case ExerciseType.REPS:
      return 'Reps'
    case ExerciseType.MINUTES:
      return 'Minutes'
    case ExerciseType.DISTANCE:
      return 'Miles'
    case ExerciseType.POUNDS:
      return 'Pounds'
    case ExerciseType.KILOS:
      return 'Kilos'
    default:
      return 'exercise measure typ is not defined'
  }
}

const exerciseType = {
  'reps': ExerciseType.REPS,
  'minutes': ExerciseType.MINUTES,
  'miles': ExerciseType.DISTANCE,
  'kg': ExerciseType.KILOS,
  'lbs': ExerciseType.POUNDS,
}

type SelectExercise = {
  exercise: Exercise
  checked: boolean,
}

type item = 'reps' | 'miles' | 'minutes' | 'kg' | 'lbs'

type Props = {
  searchInputChanged: (text: string) => void,
  openOverlay: () => void,
  isOverlay: boolean,
  exercises: SelectExercise[],
  searchResults: SelectExercise[],
  onNewExerciseName: (text: string) => void,
  // selectionExerciseType: (newSelectedStat: item) => void,
  error: string | null,
  searchInput: string | null,
  onCancelSearch: () => void,
  onClearSearch: () => void,
  onSelectExercise: (index: number) => void,
  toggleOverlay: () => void,
  newExerciseName: string | null,
  description: string | null,
  selectedStat: item | null,
  onExerciseType: (newType: ExerciseType) => void,
  onSelectedStat: (newSelectedStat: item) => void,
  onDescriptionChange: (text: string) => void,
  createExercise: () => void,
  addMoreToExerciseList: () => void,
  renderNextButton: () => JSX.Element,
  renderPrevButton: () => JSX.Element,
}

/** <CheckBox
  checkedIcon={<Image source={require('../checked.png')} />}
  uncheckedIcon={<Image source={require('../unchecked.png')} />}
  checkedIcon='dot-circle-o'
  uncheckedIcon='circle-o'
  checked={this.state.checked}
  onPress={() => this.setState({checked: !this.state.checked})}
/> */

type itemProps = {
  item: SelectExercise,
  index: number,
}

// const KeyboardAwareInsetsView = Keyboard.KeyboardAwareInsetsView;

function UserCreateRoutineListExercises(props: Props) {
  const {
    searchInputChanged,
    openOverlay,
    isOverlay,
    exercises,
    searchResults,
    onNewExerciseName,
    // selectionExerciseType,
    error,
    searchInput,
    onCancelSearch,
    onClearSearch,
    onSelectExercise,
    toggleOverlay,
    newExerciseName,
    selectedStat,
    onExerciseType,
    onSelectedStat,
    description,
    onDescriptionChange,
    createExercise,
    addMoreToExerciseList,
    renderNextButton,
    renderPrevButton,
  } = props

  const renderItem = ({ item, index }: itemProps) => (
    <TouchableWithoutFeedback>
      <Box>
        <ListItem key={index} bottomDivider>
          <ListItem.Content>
            <ListItem.Title>{item.exercise.name}</ListItem.Title>
            <ListItem.Subtitle>{getExerciseType((item.exercise.type) as ExerciseType)}</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.CheckBox
            iconRight
            iconType='feather'
            checkedIcon='check-circle'
            uncheckedIcon='circle'
            checked={item.checked}
            onPress={() => onSelectExercise(index)}
           />
        </ListItem>
      </Box>
    </TouchableWithoutFeedback>
  )

  const height = useHeaderHeight()

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Box flex={1}>
          <Box ml={{ phone: 'm', tablet: 'l' }} mr={{ phone: 'm', tablet: 'l' }}>
            <SearchBar
              placeholder="Type Here..."
              onChangeText={searchInputChanged}
              value={searchInput || ''}
              onCancel={onCancelSearch}
              onClear={onClearSearch}
              platform={Platform.OS === 'ios' ? 'ios' : 'android'}
            />
          </Box>
          <Box flex={1} ml={{ phone: 'm', tablet: 'l' }} mr={{ phone: 'm', tablet: 'l' }}>
          {
            searchResults?.[0]?.exercise?.id
            ? (
              <Box>
                <FlatList
                  data={searchResults}
                  renderItem={renderItem}
                  keyExtractor={item => item.exercise.id}
                />
              </Box>
            ) : (
            <Box>
              <FlatList
                data={exercises}
                renderItem={renderItem}
                keyExtractor={item => item.exercise.id}
                onEndReachedThreshold={0.3}
                onEndReached={addMoreToExerciseList}
              />
            </Box>
            )
          }
          </Box>
          <Box my={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
            <Box>
              <Button onPress={openOverlay}>
                Create Exercise
              </Button>
            </Box>
          </Box>
          <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between">
            {renderPrevButton()}
            {renderNextButton()}
          </Box>
        </Box>
        <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isOverlay} onBackdropPress={toggleOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              keyboardVerticalOffset={height + 64}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                <Box style={{ width: '100%' }} my={{ phone: 's', tablet: 'm' }}>
                  {newExerciseName ? (
                    <PrimaryCard>
                      <Text variant="primarySecondaryHeader">
                        {`${rescapeUnsafe(newExerciseName)}`}
                      </Text>
                    </PrimaryCard>
                  ) : null}
                </Box>
                <Box style={{ width: '100%' }} my={{ phone: 's', tablet: 'm' }}>
                  <Box justifyContent="center" alignItems="center">
                    <TextField
                      title="name"
                      error={error}
                      onChangeText={(text: string) => onNewExerciseName(text)}
                      value={newExerciseName}
                      style={{ width: '85%' }}
                      placehold="exercise name"
                    />
                  </Box>
                  <Box>
                    <Picker
                      style={{ color: dark ? palette.white : palette.textBlack }}
                      selectedValue={selectedStat}
                      onValueChange={(newSelectedStat: item) => { onExerciseType(exerciseType[newSelectedStat]); onSelectedStat(newSelectedStat); }}
                    >
                      <Picker.Item color={dark ? palette.white : palette.textBlack} key="reps" value="reps" label="reps" />
                      <Picker.Item color={dark ? palette.white : palette.textBlack} key="miles" value="miles" label="miles" />
                      <Picker.Item color={dark ? palette.white : palette.textBlack} key="minutes" value="minutes" label="minutes" />
                      <Picker.Item color={dark ? palette.white : palette.textBlack} key="kg" value="kg" label="kg" />
                      <Picker.Item color={dark ? palette.white : palette.textBlack} key="lbs" value="lbs" label="lbs" />
                    </Picker>
                  </Box>
                  <Box justifyContent="center" alignItems="center">
                    <TextField
                      title="description"
                      onChangeText={onDescriptionChange}
                      value={description}
                      multiline
                      style={{ width: '85%' }}
                      placeholder="push ups"
                    />
                  </Box>
                  <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                    <Button onPress={createExercise}>
                      Create
                    </Button>
                  </Box>
                  <Box justifyContent="center" alignItems="center">
                    <Button disabled onPress={toggleOverlay}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Box>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Overlay>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

export default UserCreateRoutineListExercises
