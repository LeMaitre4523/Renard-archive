import { useAppContext } from '../utils/AppContext';
import { getRandomColor } from '../utils/ColorCoursName';

// SQLite
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('PapillonDatabase.db')

const GetSubjects = (name) => {
  InitSubjects();
  
  // if name is set, return the subject with this name
  if (name) {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM subjects WHERE name = ?',
          [name],
          (txObj, resultSet) => {
            const subject = resultSet.rows.item(0);
            resolve({
              ...subject,
              groups: subject.groups === 1,
              id: subject.pronote_id,
            });
          },
          (txObj, error) => {
            reject(error);
          }
        );
      });
    });
  }
  else {
    // else return all subjects

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM subjects',
          null,
          (txObj, resultSet) => {
            const subjects = resultSet.rows;
            resolve(subjects);
          },
          (txObj, error) => {
            reject(error);
          }
        );
      });
    });
  }
}

const SyncSubjects = (subject) => {
  InitSubjects();

  // 3 first letters of the subject id + random int
  local_id = subject.id.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);

  // Get color
  color = getRandomColor();

  // Add subject to database
  const upsertSubject = (subject) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT OR REPLACE INTO subjects (local_id, pronote_id, name, groups, color) VALUES (?, ?, ?, ?, ?)',
          [
            local_id,
            subject.id,
            subject.name,
            subject.groups,
            color
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

  // Insert or update subject in database
  return upsertSubject(subject)
    .then(() => {
    })
    .catch((error) => {
      console.error('Error while inserting or updating subject in database :', error);
    });
};


const InitSubjects = () => {
  let sql = `
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT,
      pronote_id TEXT,
      name TEXT,
      groups BOOLEAN,
      color TEXT
    )
  `.trim().replace(/\s+/g, ' ');

  db.transaction(tx => {
    tx.executeSql(sql, null, (txObj, resultSet) => {
    }, (txObj, error) => {
      console.log('Error: ', error);
    })
  })
}

export { GetSubjects, SyncSubjects };