import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, StyleSheet, RefreshControl, Modal, Platform, TouchableOpacity, Pressable } from 'react-native';
import InfinitePager from 'react-native-infinite-pager';
import DateTimePicker from '@react-native-community/datetimepicker';
import GetUIColors from '../utils/GetUIColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../utils/AppContext';
import * as BaseTimetable from '../database/BaseTimetable';

import { Text, useTheme } from 'react-native-paper';
import { X } from 'lucide-react-native';

import NetInfo from '@react-native-community/netinfo';

import PapillonLoading from '../components/PapillonLoading';

import {
  DoorOpen,
  User2,
  Info,
  Calendar as IconCalendar,
  Users,
} from 'lucide-react-native';

import formatCoursName from '../utils/FormatCoursName';
import getClosestGradeEmoji from '../utils/EmojiCoursName';

import { ContextMenuView } from 'react-native-ios-context-menu';
import { ScrollView } from 'react-native-gesture-handler';
import { PressableScale } from 'react-native-pressable-scale';

const CoursScreen = ({ navigation }) => {
  const UIColors = GetUIColors();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [calendarDateStr, setCalendarDateStr] = useState('');

  const [courses, setCourses] = useState({});

  const appctx = useAppContext();

  // button to show the date picker in the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={[styles.daySelectTouchable, { backgroundColor: UIColors.text + '15' }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.daySelectText}>
            {calendarDateStr}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, setCalendarDateStr, UIColors.text]);

  const LoadCourses = async (date) => {
    date = new Date(date);
    return BaseTimetable.GetTimetable(date).then((data) => {
      // Create a new copy of the courses object
      const updatedCourses = { ...courses };
      updatedCourses[date.toISOString()] = data;

      // Set the updated courses as the state
      setCourses(updatedCourses);
      return data;
    });
  };

  const ForceLoadCourses = async (date) => {
    return appctx.dataprovider.getTimetable(date, true).then((data) => {
      return BaseTimetable.SyncTimetable(data).then(() => {
        return BaseTimetable.GetTimetable(date).then((data) => {
          const updatedCourses = { ...courses };
          updatedCourses[date.toISOString()] = data;

          setCourses(updatedCourses);
          return data;
        });
      });
    });
  };

  const LoadAndForceCourses = async (date) => {
    date = new Date(date);
    return BaseTimetable.GetTimetable(date).then((data) => {
      // Create a new copy of the courses object
      const updatedCourses = { ...courses };
      updatedCourses[date.toISOString()] = data;

      // Set the updated courses as the state
      setCourses(updatedCourses);

      // if data is empty, force refresh
      if (data.length === 0) {
        return ForceLoadCourses(date);
      }
      else {
        return data;
      }
    });
  };

  const handleDateChange = (event, selected) => {
    if (event.type === 'set' && selected) {
      const newDate = new Date(selected);
      newDate.setDate(selected.getDate() - currentIndex);

      setSelectedDate(newDate);
      setShowDatePicker(false);
      setCalendarDateStr(newDate.toLocaleDateString('fr-FR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }));

      LoadAndForceCourses(newDate);
    } else {
      setShowDatePicker(false);
    }
  };

  const handleScroll = (index) => {
    setCurrentIndex(index);

    const currentDate = new Date(selectedDate);
    currentDate.setDate(selectedDate.getDate() + index);
    LoadAndForceCourses(currentDate);
    setCalendarDateStr(currentDate.toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }));
  };

  return (
    <View style={styles.container}>
      <InfinitePager
        style={[styles.viewPager]}
        pageWrapperStyle={[styles.pageWrapper]}
        horizontal
        data={[
          { key: 'page1' },
          { key: 'page2' },
          { key: 'page3' },
          // Add more pages as needed
        ]}
        renderPage={({ index }) => (
          <CoursPage
            index={index}
            selectedDate={selectedDate}
            setShowDatePicker={setShowDatePicker}
            courses={courses}
            navigation={navigation}
            theme={theme}
            forceRefresh={() => ForceLoadCourses(selectedDate)}
          />
        )}
        onPageChange={(index) => handleScroll(index)}
      />

      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setShowDatePicker(false)}
        />
        <View style={[
          Platform.OS === 'ios' ? styles.modalIos : styles.modalAndroid,
          { backgroundColor: UIColors.element }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Sélectionnez la date</Text>
            <Text style={styles.modalHeaderDate}>
              {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity
              style={{ position: 'absolute', right: 20, top: 16, backgroundColor: '#ffffff22', padding: 6, borderRadius: 20 }}
              onPress={() => setShowDatePicker(false)}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <DatePicker
            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
            currentIndex={currentIndex}
          />
          { Platform.OS === 'ios' && (
            <View style={{ height: insets.bottom * 1.5 }} />
          )}
        </View>
      </Modal>
    </View>
  );
};

function DatePicker({ selectedDate, handleDateChange, currentIndex }) {
  const newDate = new Date(selectedDate);
  newDate.setDate(selectedDate.getDate() + currentIndex);

  return (
    <DateTimePicker
      value={newDate}
      mode="date"
      display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
      onChange={handleDateChange}
      accentColor="#29947a"
    />
  );
}

function CoursPage({ index, selectedDate, setShowDatePicker, courses, navigation, theme, forceRefresh }) {
  const calculatedDate = new Date(selectedDate);
  calculatedDate.setDate(selectedDate.getDate() + index);

  return (
    <CoursView
      cours={courses[calculatedDate.toISOString()] || []}
      navigation={navigation}
      theme={theme}
      forceRefresh={forceRefresh}
    />
  );
}

function CoursView({ cours, navigation, theme, forceRefresh }) {
  const CoursPressed = useCallback(
    (_cours) => {
      navigation.navigate('Lesson', { event: _cours });
    },
    [navigation]
  );

  const [isHeadLoading, setIsHeadLoading] = useState(false);

  const onRefresh = React.useCallback(() => {
    setIsHeadLoading(true);

    forceRefresh().then(() => {
      setIsHeadLoading(false);
    });
  }, []);

  function lz(nb) {
    return nb < 10 ? `0${nb}` : nb;
  }

  const UIColors = GetUIColors();

  return (
    <ScrollView
      style={[styles.coursContainer]}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl
          refreshing={isHeadLoading}
          onRefresh={onRefresh}
          colors={[Platform.OS === 'android' ? '#29947A' : null]}
        />
      }
    >
      {cours.length === 0 ? (
        <PapillonLoading
          icon={<IconCalendar size={26} color={UIColors.text} />}
          title="Aucun cours"
          subtitle="Vous n'avez aucun cours aujourd'hui"
          style={{ marginTop: 36 }}
        />
      ) : null}

      {cours.map((_cours, index) => (
        <View key={index}>
          {/* si le cours précédent était il y a + de 30 min du cours actuel */}
          {index !== 0 &&
          new Date(_cours.start) - new Date(cours[index - 1].end) > 1800000 ? (
            <View style={styles.coursSeparator}>
              <View
                style={[
                  styles.coursSeparatorLine,
                  { backgroundColor: `${UIColors.text}15` },
                ]}
              />

              <Text style={{ color: `${UIColors.text}30` }}>
                {`${Math.floor(
                  (new Date(_cours.start) - new Date(cours[index - 1].end)) /
                    3600000
                )} h ${lz(
                  Math.floor(
                    ((new Date(_cours.start) - new Date(cours[index - 1].end)) %
                      3600000) /
                      60000
                  )
                )} min`}
              </Text>

              <View
                style={[
                  styles.coursSeparatorLine,
                  { backgroundColor: `${UIColors.text}15` },
                ]}
              />
            </View>
          ) : null}

          <CoursItem
            key={index}
            cours={_cours}
            theme={theme}
            navigation={navigation}
            CoursPressed={CoursPressed}
          />
        </View>
      ))}

      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

const CoursItem = React.memo(({ cours, theme, CoursPressed, navigation }) => {
  const formattedStartTime = useCallback(
    () =>
      new Date(cours.start).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [cours.start]
  );

  const formattedEndTime = useCallback(
    () =>
      new Date(cours.end).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [cours.end]
  );

  const start = new Date(cours.start);
  const end = new Date(cours.end);

  function lz(num) {
    return num < 10 ? `0${num}` : num;
  }

  const length = Math.floor((end - start) / 60000);
  let lengthString = `${Math.floor(length / 60)}h ${lz(
    Math.floor(length % 60)
  )}min`;

  if (Math.floor(length / 60) === 0) {
    lengthString = `${lz(Math.floor(length % 60))} min`;
  }

  const handleCoursPressed = useCallback(() => {
    CoursPressed(cours);
  }, [CoursPressed, cours]);

  const UIColors = GetUIColors();
  const mainColor = theme.dark ? '#ffffff' : '#444444';

  return (
    <View style={[styles.fullCours]}>
      <View style={[styles.coursTimeContainer]}>
        <Text numberOfLines={1} style={[styles.ctStart]}>
          {formattedStartTime()}
        </Text>
        <Text numberOfLines={1} style={[styles.ctEnd]}>
          {formattedEndTime()}
        </Text>
      </View>
      <ContextMenuView
        style={{ flex: 1 }}
        borderRadius={14}
        previewConfig={{
          borderRadius: 14,
          previewType: 'CUSTOM',
          previewSize: 'INHERIT',
          backgroundColor: 'rgba(255,255,255,0)',
          preferredCommitStyle: 'pop',
        }}
        menuConfig={{
          menuTitle: cours.subject.name,
          menuItems: [
            {
              actionKey: 'open',
              actionTitle: 'Voir le cours en détail',
              actionSubtitle: 'Ouvrir la page détaillée du cours',
              icon: {
                type: 'IMAGE_SYSTEM',
                imageValue: {
                  systemName: 'book.pages',
                },
              },
            },
          ],
        }}
        onPressMenuItem={({ nativeEvent }) => {
          if (nativeEvent.actionKey === 'open') {
            navigation.navigate('Lesson', { event: cours });
          }
        }}
        onPressMenuPreview={() => {
          navigation.navigate('Lesson', { event: cours });
        }}
        renderPreview={() => (
          <View
            style={{
              flex: 1,
              backgroundColor: `${UIColors.background}99`,
              width: 350,
            }}
          >
            <View style={styles.coursPreviewList}>
              {cours.rooms.length > 0 ? (
                <ListItem
                  title="Salle de cours"
                  subtitle={cours.rooms.join(', ')}
                  color={mainColor}
                  left={<DoorOpen size={24} color={mainColor} />}
                  width
                  center
                />
              ) : null}
              {cours.teachers.length > 0 ? (
                <ListItem
                  title={`Professeur${cours.teachers.length > 1 ? 's' : ''}`}
                  subtitle={cours.teachers.join(', ')}
                  color={mainColor}
                  left={<User2 size={24} color={mainColor} />}
                  width
                  center
                />
              ) : null}
              {cours.group_names.length > 0 ? (
                <ListItem
                  title={`Groupe${cours.group_names.length > 1 ? 's' : ''}`}
                  subtitle={cours.group_names.join(', ')}
                  color={mainColor}
                  left={<Users size={24} color={mainColor} />}
                  width
                  center
                />
              ) : null}
              {cours.status !== null ? (
                <ListItem
                  title="Statut du cours"
                  subtitle={cours.status}
                  color={!cours.is_cancelled ? mainColor : '#B42828'}
                  left={
                    <Info
                      size={24}
                      color={!cours.is_cancelled ? mainColor : '#ffffff'}
                    />
                  }
                  fill={!!cours.is_cancelled}
                  width
                  center
                />
              ) : null}
            </View>
          </View>
        )}
      >
        <PressableScale
          weight="light"
          delayLongPress={100}
          style={[
            styles.coursItemContainer,
            { backgroundColor: theme.dark ? '#111111' : '#ffffff' },
          ]}
          onPress={handleCoursPressed}
        >
          <View
            style={[
              styles.coursItem,
              {
                backgroundColor: `${cours.subject.color}22`,
              },
            ]}
          >
            <View
              style={[
                styles.coursColor,
                {
                  backgroundColor: cours.subject.color,
                },
              ]}
            />
            <View style={[styles.coursInfo]}>
              <Text style={[styles.coursTime]}>{lengthString}</Text>
              <Text style={[styles.coursMatiere]}>
                {formatCoursName(cours.subject.name)}
              </Text>

              {length / 60 > 1.4 ? <View style={{ height: 25 }} /> : null}

              {cours.rooms.length > 0 ? (
                <Text style={[styles.coursSalle]}>
                  Salle {cours.rooms.join(', ')}
                </Text>
              ) : (
                <Text style={[styles.coursSalle]}>Aucune salle</Text>
              )}
              {cours.teachers.length > 0 ? (
                <Text style={[styles.coursProf]}>
                  {cours.teachers.join(', ')}
                </Text>
              ) : (
                <Text style={[styles.coursProf]}>Aucun professeur</Text>
              )}

              {cours.status && (
                <View
                  style={[
                    styles.coursStatus,
                    {
                      backgroundColor: `${cours.subject.color}22`,
                    },
                    cours.is_cancelled ? styles.coursStatusCancelled : null,
                  ]}
                >
                  {cours.is_cancelled ? (
                    <Info size={20} color="#ffffff" />
                  ) : (
                    <Info
                      size={20}
                      color={theme.dark ? '#ffffff' : '#000000'}
                    />
                  )}

                  <Text
                    style={[
                      styles.coursStatusText,
                      { color: theme.dark ? '#ffffff' : '#000000' },
                      cours.is_cancelled
                        ? styles.coursStatusCancelledText
                        : null,
                    ]}
                  >
                    {cours.status}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </PressableScale>
      </ContextMenuView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewPager: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },

  coursContainer: {
    flex: 1,
    padding: 12,
  },

  fullCours: {
    width: '100%',
    marginBottom: 10,
    flexDirection: 'row',
  },
  coursTimeContainer: {
    width: 56,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  ctStart: {
    fontSize: 18,
    fontWeight: 600,
    fontFamily: 'Papillon-Semibold',
  },
  ctEnd: {
    fontSize: 15,
    fontWeight: 400,
    opacity: 0.5,
    fontFamily: 'Papillon-Regular',
  },

  coursItemContainer: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    elevation: 1,
  },
  coursItem: {
    flex: 1,
    flexDirection: 'row',
  },
  coursColor: {
    width: 4,
    height: '100%',
  },
  coursInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 1,
  },
  coursTime: {
    fontSize: 14,
    opacity: 0.5,
  },
  coursLength: {
    position: 'absolute',
    right: 12,
    top: 10,
    opacity: 0.3,
  },
  coursMatiere: {
    fontSize: 18,
    fontFamily: 'Papillon-Semibold',
    marginBottom: 10,
  },
  coursSalle: {
    fontSize: 15,
    fontWeight: 500,
  },
  coursProf: {
    fontSize: 15,
    fontWeight: 400,
    opacity: 0.5,
  },

  coursStatus: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,

    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  coursStatusText: {
    fontSize: 15,
    fontWeight: 500,
  },

  coursStatusCancelled: {
    backgroundColor: '#B42828',
  },
  coursStatusCancelledText: {
    color: '#fff',
  },

  noCourses: {
    fontSize: 17,
    fontWeight: 400,
    fontFamily: 'Papillon-Medium',
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 12,
  },

  coursSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,

    gap: 12,
  },
  coursSeparatorLine: {
    flex: 1,
    height: 2,
    borderRadius: 3,
  },

  coursPreviewList: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
  },

  modalIos: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalAndroid: {
    flex: 1,
  },

  modalHeader: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: '#29947a',
  },

  modalHeaderText: {
    fontSize: 15,
    fontWeight: 500,
    color: '#ffffff99',
  },

  modalHeaderDate: {
    fontSize: 17,
    fontWeight: 600,
    color: '#fff',
    fontFamily: 'Papillon-Semibold',
  },

  daySelectTouchable: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    borderCurve: 'continuous',
  },
  daySelectText: {
    fontSize: 17,
  },
});

export default CoursScreen;
