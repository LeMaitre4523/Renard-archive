import { useAppContext } from '../utils/AppContext';

// SQLite
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('PapillonDatabase.db')

// Other database
import * as BaseSubjects from './BaseSubjects';

const GetHomeworks = (date, date2) => {
  InitHomeworks();
  
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
        'SELECT * FROM homeworks WHERE date >= ? AND date <= ?',
        [startDate.getTime(), endDate.getTime()],
        async (txObj, resultSet) => {
          const homeworks = resultSet.rows;
          let homeworksArray = [];
          
          for (let i = 0; i < homeworks.length; i++) {
            const homework = homeworks.item(i);

            let subject = await BaseSubjects.GetSubjects(homework.subject);

            homeworksArray.push({
              ...homework,
              subject: subject,
              files: JSON.parse(homework.files || '[]'),
              background_color: subject.color,
              done: homework.done === 1,
              date: new Date(homework.date).toISOString().split('T')[0],
            });
          };

          resolve(homeworksArray);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  });
}

const SyncHomeworks = async (homeworks) => {
  InitHomeworks();

  const promises = [];
  const resettedDays = [];

  for (const homework of homeworks) {
    // Reset the day if it hasn't been resetted yet
    if (!resettedDays.includes(new Date(homework.date).getTime())) {
      promises.push(ResetDay(homework.date));
      resettedDays.push(new Date(homework.date).getTime());
    }

    // Assuming BaseSubjects.SyncSubjects, BaseSubjects.GetSubjects, and InsertCourse are asynchronous functions that return Promises
    promises.push(
      BaseSubjects.SyncSubjects(homework.subject).then(() => {
        return BaseSubjects.GetSubjects(homework.subject.name).then((subject) => {
          return InsertHomework(homework, subject);
        });
      })
    );
  }

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Error inserting homeworks:', error);
  }
};

const InsertHomework = (homework, subject) => {
  return new Promise ((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO homeworks (local_id, pronote_id, subject, done, description, date, files) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          homework.local_id,
          homework.id,
          subject.name,
          homework.done,
          homework.description,
          new Date(homework.date).getTime(),
          JSON.stringify(homework.files),
        ],
        (txObj, resultSet) => {
          resolve(resultSet);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  });
};

const EditHomework = (homework) => {
  // edit homework with same local_id
  return new Promise ((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE homeworks SET pronote_id = ?, subject = ?, done = ?, description = ?, date = ?, files = ? WHERE local_id = ?',
        [
          homework.id,
          homework.subject,
          homework.done,
          homework.description,
          new Date(homework.date).getTime(),
          JSON.stringify(homework.files),
          homework.local_id,
        ],
        (txObj, resultSet) => {
          resolve(resultSet);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  });
};

const ResetDay = (date) => {
  // Supprime tous les devoirs du jour
  let startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  let endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM homeworks WHERE date >= ? AND date <= ?',
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

const InitHomeworks = () => {
  let sql = `
    CREATE TABLE IF NOT EXISTS homeworks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT,
      pronote_id TEXT,
      subject TEXT,
      done BOOLEAN,
      description TEXT,
      date TIMESTAMP,
      files JSON
    )
  `.trim().replace(/\s+/g, ' ');

  db.transaction(tx => {
    tx.executeSql(sql, null, (txObj, resultSet) => {
    }, (txObj, error) => {
      console.log('Error: ', error);
    })
  })
}

export { GetHomeworks, SyncHomeworks, ResetDay, EditHomework };