import formatCoursName from '../utils/FormatCoursName';
import getClosestColor from '../utils/ColorCoursName';
import getClosestGradeEmoji from '../utils/EmojiCoursName';



import { getIsPaired, getIsWatchAppInstalled, sendMessage } from 'react-native-watch-connectivity';


// This function is called when the user refreshes the home screen or when the app is launched
// It sends the timetable formated data to the Apple Watch
// --------------------------------------------------
// Idea : Send homeworks data
// Idea : Send user data
async function sendToAppleWatch(timetableData, homeworksData) {
  

  const coursSharedTable = [];

  // for each cours in timetableData
  for (let i = 0; i < timetableData.length; i++) {
    const cours = timetableData[i];

    coursSharedTable.push({
      subject: formatCoursName(cours.subject.name),
      teacher: cours.teachers.join(', '),
      room: cours.rooms.join(', '),
      start: new Date(cours.start).getTime(),
      end: new Date(cours.end).getTime(),
      background_color: getClosestColor(cours.background_color),
      emoji: getClosestGradeEmoji(cours.subject.name),
      is_cancelled: cours.is_cancelled,
    });
  }

  const stringifiedData = JSON.stringify(coursSharedTable);

  const isPaired = await getIsPaired();
  const isWatchAppInstalled = await getIsWatchAppInstalled();

  // Verify that the watch is paired and the watch app is installed
  if (isPaired && isWatchAppInstalled) {
    console.log('Sending to Apple Watch');
    //Send Timetable data
    sendMessage(
      {getEdtF: stringifiedData}, 
      reply => {console.log(reply)},
      error => { 
          if (error) { 
            console.log(error)
          }
      }
    )
    console.log("Timetable data sent");

    // Send Homeworks data
    homeworksData.sort ((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    sendMessage(
      {getHomework: JSON.stringify(homeworksData)},
      reply => {console.log(reply)},
      error => {
        if (error) {
          console.log(error)
        }
      }
    )
    console.log('Homework :' + JSON.stringify(homeworksData));
  } else {
    console.log('Watch is not paired or watch app is not installed');
  }

  
}


export default sendToAppleWatch;