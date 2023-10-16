import { useAppContext } from '../utils/AppContext';

// SQLite
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('PapillonDatabase.db')

// Other database
import * as BaseSubjects from './BaseSubjects';

const GetTimetable = (date, date2) => {
  InitTimetable();

  // Renvoie les cours du jour
  let startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  let endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  if (date2) {
    endDate = new Date(date2);
    endDate.setHours(23, 59, 59, 999);
  }
  
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM timetable WHERE start >= ? AND start <= ?',
        [startDate.getTime(), endDate.getTime()],
        async (txObj, resultSet) => {
          const courses = resultSet.rows;
          let coursesArray = [];
          
          for (let i = 0; i < courses.length; i++) {
            const course = courses.item(i);

            let subject = await BaseSubjects.GetSubjects(course.subject);

            coursesArray.push({
              ...course,
              teachers: JSON.parse(course.teachers || '[]'),
              rooms: JSON.parse(course.rooms || '[]'),
              group_names: JSON.parse(course.groupNames || '[]'),
              groupNames: JSON.parse(course.groupNames || '[]'),
              is_cancelled: course.cancelled === 1,
              is_detention: course.detention === 1,
              is_exempted: course.exempted === 1,
              is_outings: course.outings === 1,
              is_test: course.test === 1,
              subject: subject,
              background_color: subject.color,
              start: new Date(course.start).toISOString(),
              end: new Date(course.end).toISOString(),
            });
          };

          resolve(coursesArray);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  });
}

const SyncTimetable = async (courses) => {
  InitTimetable();
  
  const promises = [];
  const datesResetted = [];

  for (const course of courses) {
    // Reset the day if it hasn't been resetted yet
    if (!datesResetted.includes(new Date(course.start).getTime())) {
      promises.push(
        ResetDay(course.start).then(() => {
          datesResetted.push(new Date(course.start).getTime());
        })
      );
    }

    // Assuming BaseSubjects.SyncSubjects, BaseSubjects.GetSubjects, and InsertCourse are asynchronous functions that return Promises
    promises.push(
      BaseSubjects.SyncSubjects(course.subject).then(() => {
        return BaseSubjects.GetSubjects(course.subject.name).then((subject) => {
          return InsertCourse(course, subject);
        });
      })
    );
  }

  try {
    await Promise.all(promises);
  } catch (error) {
    console.log(error);
  }
};

const ResetDay = (date) => {
  // Supprime tous les cours du jour
  let startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  let endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM timetable WHERE start >= ? AND start <= ?',
        [startDate.getTime(), endDate.getTime()],
        (txObj, resultSet) => {
          resolve();
        },
        (txObj, error) => {
          console.log('Error: ', error);
          reject(error);
        }
      );
    });
  });
}

function InsertCourse(course, subject) {
  // 3 first letters of the subject name + start timestamp
  localID = subject.name.substring(0, 3).toUpperCase() + new Date(course.start).getTime();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT OR REPLACE INTO timetable (local_id, pronote_id, subject, teachers, rooms, start, end, cancelled, detention, exempted, outings, test, memo, num, status, groupNames) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          localID,
          course.id,
          subject.name,
          JSON.stringify(course.teachers),
          JSON.stringify(course.rooms),
          new Date(course.start).getTime(),
          new Date(course.end).getTime(),
          course.is_cancelled,
          course.is_detention,
          course.is_exempted,
          course.is_outings,
          course.is_test,
          course.memo,
          course.num,
          course.status,
          JSON.stringify(course.groupNames),
        ],
        (txObj, resultSet) => {
          resolve(); // Resolve the promise when the course is inserted
        },
        (txObj, error) => {
          console.log('Error: ', error);
          reject(error); // Reject the promise on error
        }
      );
    });
  });
}

const InitTimetable = () => {
  let sql = `
    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT,
      pronote_id TEXT,
      subject TEXT,
      teachers JSON,
      rooms JSON,
      start TIMESTAMP,
      end TIMESTAMP,
      cancelled BOOLEAN,
      detention BOOLEAN,
      exempted BOOLEAN,
      outings BOOLEAN,
      test BOOLEAN,
      memo TEXT,
      num INTEGER,
      status TEXT,
      groupNames JSON
    )
  `.trim().replace(/\s+/g, ' ');

  db.transaction(tx => {
    tx.executeSql(sql, null, (txObj, resultSet) => {
    }, (txObj, error) => {
      console.log('Error: ', error);
    })
  })
}

export { GetTimetable, SyncTimetable, ResetDay };