import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, ScrollView, Pressable, Modal, StyleSheet, Appearance} from 'react-native';
import min from 'lodash/min';
import map from 'lodash/map';

import constants from '@screens/Calendar/Event/constants';
import {Theme} from '@screens/Calendar/Event/types';
import styleConstructor, {HOURS_SIDEBAR_WIDTH} from '@screens/Calendar/Event/styles';
import populateEvents, {HOUR_BLOCK_HEIGHT} from '@screens/Calendar/Event/Packer';
import {calcTimeOffset} from '@screens/Calendar/Timeline/presenter';
import TimelineHours, {TimelineHoursProps} from '@screens/Calendar/Timeline/TimelineHours';
import EventBlock, {Event, PackedEvent} from '@screens/Calendar/Event/EventBlock';
import NowIndicator from '@screens/Calendar/Timeline/NowIndicator';
import useTimelineOffset from '@screens/Calendar/Timeline/useTimelineOffset';
import { TimelineEventExtendedProps } from '../UserViewCalendar';
import { Divider, Menu } from 'react-native-paper';
import Box from '@components/common/Box';
import _ from 'lodash';
import { Dialog } from 'react-native-ui-lib'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { palette } from '@theme/theme';
import Text from '@components/common/Text';

const dark = Appearance.getColorScheme() === 'dark'

const styles2 = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: dark ? palette.black : palette.white,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  scrollView: {
    alignItems: 'center',
  }
})

export interface TimelineProps {
    navigateToTimeRangePreferences: (event: TimelineEventExtendedProps) => void,
    editEvent: (event: TimelineEventExtendedProps) => void,
    trainEvent: (event: TimelineEventExtendedProps) => void,
    enableTag: (event: TimelineEventExtendedProps) => void,
    enableRate: (event: TimelineEventExtendedProps) => void,
    enablePrepAndReview: (event: TimelineEventExtendedProps) => void,
    addFollowUp: (event: TimelineEventExtendedProps) => void,
    enablePriority: (event: TimelineEventExtendedProps) => Promise<void>,
    submitForPlan: (event: TimelineEventExtendedProps) => Promise<void>,
    changedModifiable: (event: TimelineEventExtendedProps) => Promise<void>,
    changeLink: (event: TimelineEventExtendedProps) => Promise<void>,
    enableDelete: (event: TimelineEventExtendedProps) => void,
  date?: string;
  events: Event[];
  start?: number;
  end?: number;
  eventTapped?: (event: Event) => void;
  onEventPress?: (event: Event) => void;
  onBackgroundLongPress?: TimelineHoursProps['onBackgroundLongPress'];
  onBackgroundLongPressOut?: TimelineHoursProps['onBackgroundLongPressOut'];
  styles?: Theme;
  theme?: Theme;
  scrollToFirst?: boolean;
  scrollToNow?: boolean;
  initialTime?: {hour: number; minutes: number};
  format24h?: boolean;
  renderEvent?: (event: PackedEvent) => JSX.Element;
  showNowIndicator?: boolean;
  scrollOffset?: number;
  onChangeOffset?: (offset: number) => void;
  overlapEventsSpacing?: number;
  rightEdgeSpacing?: number;
}

const Timeline = (props: TimelineProps) => {
  const [isMenu, setIsMenu] = useState<boolean>(false)
  const [menuIndex, setMenuIndex] = useState<number>()

  const {
    format24h = true,
    start = 0,
    end = 24,
    date,
    events = [],
    onEventPress,
    onBackgroundLongPress,
    onBackgroundLongPressOut,
    renderEvent,
    theme,
    scrollToFirst,
    scrollToNow,
    initialTime,
    showNowIndicator,
    scrollOffset,
    onChangeOffset,
    overlapEventsSpacing,
    rightEdgeSpacing,
    editEvent,
    trainEvent,
    enableTag,
    enableRate,
    enablePrepAndReview,
    addFollowUp,
    enablePriority,
    submitForPlan,
    changedModifiable,
    changeLink,
    enableDelete,
    navigateToTimeRangePreferences,
  } = props;

  const scrollView = useRef<ScrollView>();
  const calendarHeight = useRef((end - start) * HOUR_BLOCK_HEIGHT);
  const styles = useRef(styleConstructor(theme || props.styles, calendarHeight.current));

  const {scrollEvents} = useTimelineOffset({onChangeOffset, scrollOffset, scrollViewRef: scrollView});

  const packedEvents = useMemo(() => {
    const width = constants.screenWidth - HOURS_SIDEBAR_WIDTH;
    return populateEvents(events, {screenWidth: width, dayStart: start, overlapEventsSpacing, rightEdgeSpacing});
  }, [events, start]);

  useEffect(() => {
    let initialPosition = 0;
    if (scrollToNow) {
      initialPosition = calcTimeOffset(HOUR_BLOCK_HEIGHT);
    } else if (scrollToFirst && packedEvents.length > 0) {
      initialPosition = min(map(packedEvents, 'top')) ?? 0;
    } else if (initialTime) {
      initialPosition = calcTimeOffset(HOUR_BLOCK_HEIGHT, initialTime.hour, initialTime.minutes);
    }

    if (initialPosition) {
      setTimeout(() => {
        scrollView?.current?.scrollTo({
          y: Math.max(0, initialPosition - HOUR_BLOCK_HEIGHT),
          animated: true
        });
      }, 0);
    }
  }, []);

  const _onEventPress = useCallback(
    (eventIndex: number) => {
      const openMenu2 = (index: number) => {
        setMenuIndex(index)
        setIsMenu(true)
      }
      const event = packedEvents[eventIndex];
      if (onEventPress) {
        onEventPress(event);
        openMenu2(eventIndex)
      } else {
        openMenu2(eventIndex)
      }
    },
    [packedEvents, onEventPress, onEventPress]
  );
  
  const openMenu = (index: number) => {
    setMenuIndex(index)
    setIsMenu(true)
  }
  
  const closeMenu = () => {
    setMenuIndex(-1)
    setIsMenu(false)
  }

  const editEventChild = (index: number) => {
    closeMenu()
    editEvent(packedEvents[index])
  }

  const trainEventChild = (index: number) => {
    closeMenu()
    trainEvent(packedEvents[index])
  }

  const enableTagChild = (index: number) => {
    closeMenu()
    enableTag(packedEvents[index])
  }

  const enableRateChild = (index: number) => {
    closeMenu()
    enableRate(packedEvents[index])
  }

  const enablePrepAndReviewChild = (index: number) => {
    closeMenu()
    enablePrepAndReview(packedEvents[index])
  }

  const addFollowUpChild = (index: number) => {
    closeMenu()
    addFollowUp(packedEvents[index])
  }
    

  const enablePriorityChild = (index: number) => {
    closeMenu()
    enablePriority(packedEvents[index])
  }

  const submitForPlanChild = async (index: number) => {
    closeMenu()
    return submitForPlan(packedEvents[index])
  }

  const changedModifiableChild = async (index: number) => {
    closeMenu()
    await changedModifiable(packedEvents[index])
     
  }

  const changeLinkChild = async (index: number) => {
    closeMenu()
    return changeLink(packedEvents[index])
  }

  const enableDeleteChild = (index: number) => {
    closeMenu()
    enableDelete(packedEvents[index])
  }

  const navigateToTimeRangePreferencesChild = (index: number) => {
    closeMenu()
    navigateToTimeRangePreferences(packedEvents[index])
  }

  const renderEvents = () => {
    const events = packedEvents.map((event: PackedEvent, i: number) => (
      <Box key={i}>
        <EventBlock
          key={i}
          index={i}
          event={event}
          styles={styles.current}
          format24h={format24h}
          renderEvent={renderEvent}
          onPress={_onEventPress}
        />
      </Box>
    ));

    return (
      <View>
        <View style={{marginLeft: HOURS_SIDEBAR_WIDTH}}>{events}</View>
      </View>
    );
  };

  return (
    <Box style={[{width: constants.screenWidth}]}>
      <ScrollView
        ref={scrollView}
        contentContainerStyle={[styles.current.contentStyle, {width: constants.screenWidth}]}
        {...scrollEvents}
      >
        <TimelineHours
          start={start}
          end={end}
          date={date}
          format24h={format24h}
          styles={styles.current}
          onBackgroundLongPress={onBackgroundLongPress}
          onBackgroundLongPressOut={onBackgroundLongPressOut}
        />
        {renderEvents()}
        {showNowIndicator && <NowIndicator styles={styles.current} />}
      </ScrollView>
      <Modal
        animationType="slide"
        visible={isMenu}
        onDismiss={closeMenu}
        transparent={true}
      >
        <Box style={styles2.centeredView}>
          <Box style={styles2.modalView}>
            <ScrollView contentContainerStyle={styles2.scrollView}>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => editEventChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="calendar-edit" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Edit</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => trainEventChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="state-machine" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Train</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => navigateToTimeRangePreferencesChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="timetable" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Time Preferences</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => enableTagChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="tag" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Tags</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => enableRateChild( menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="star-box" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Rate</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => enablePrepAndReviewChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="calendar-multiple" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Buffer</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => addFollowUpChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="calendar-plus" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Add Follow Up</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => enablePriorityChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="priority-high" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Priority</Text>
                </Box>
              </Pressable>
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => submitForPlanChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="clock-outline" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Schedule Assist</Text>
                </Box>
              </Pressable>
              {packedEvents[menuIndex]?.modifiable
                ? <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => changedModifiableChild(menuIndex)}>
                    <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                      <MaterialCommunityIcons name="lock-open" size={24} color={dark ? palette.white : palette.purplePrimary} />
                      <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Time Modifiable</Text>
                    </Box>
                  </Pressable>
                : <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => changedModifiableChild(menuIndex)}>
                    <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                      <MaterialCommunityIcons name="lock" size={24} color={dark ? palette.white : palette.purplePrimary} />
                      <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Time Not Modifiable</Text>
                    </Box>
                  </Pressable>
              }
              {packedEvents[menuIndex]?.unlink
                ? <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => changeLinkChild(menuIndex)}>
                  <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <MaterialCommunityIcons name="link-off" size={24} color={dark ? palette.white : palette.purplePrimary} />
                    <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Link Off</Text>
                  </Box>
                </Pressable>
                : <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => changeLinkChild(menuIndex)}>
                  <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <MaterialCommunityIcons name="link" size={24} color={dark ? palette.white : palette.purplePrimary} />
                    <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Link On</Text>
                  </Box>
                </Pressable>
              }
              <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={() => enableDeleteChild(menuIndex)}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                  <MaterialCommunityIcons name="calendar-remove" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Delete</Text>
                </Box>
              </Pressable>
            </ScrollView>
            <Pressable style={{ width: 220, elevation: 2, height: 45 }} onPress={closeMenu}>
              <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                <MaterialCommunityIcons name="close" size={24} color={dark ? palette.white : palette.purplePrimary} />
                <Text variant="buttonLink" ml={{ phone: 's', tablet: 'm' }}>Close</Text>
              </Box>
            </Pressable>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export type {Event as TimelineEventProps, PackedEvent as TimelinePackedEventProps};
export default React.memo(Timeline);
