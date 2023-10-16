import { useAppContext } from '../utils/AppContext';

// SQLite
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('PapillonDatabase.db')

// Other database
import * as BaseSubjects from './BaseSubjects';

const GetGrades = () => {
  InitGrades();
  InitAverages();
  
  return new Promise((resolve, reject) => {
    return GetAllGrades().then((grades) => {
      return GetAverages().then((averages) => {
        let overall = averages[0];
        let newAverages = averages;
        newAverages.shift();

        resolve({
          grades: grades,
          averages: averages,
          overall_average: overall.average,
          class_overall_average: overall.class_average,
        });
      });
    })
  });
}

const GetAllGrades = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM grades',
        null,
        async (txObj, resultSet) => {
          const grades = resultSet.rows;
          let gradesArray = [];

          for (let i = 0; i < grades.length; i++) {
            const grade = grades.item(i);

            let subject = await BaseSubjects.GetSubjects(grade.subject);

            gradesArray.push({
              ...grade,
              date: new Date(grade.date),
              is_bonus: grade.bonus === 1,
              is_optional: grade.optional === 1,
              is_out_of_20: grade.out_twenty === 1,
              subject: subject,
            });
          };

          resolve(gradesArray);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  })
}

const GetAverages = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM averages',
        null,
        async (txObj, resultSet) => {
          const averages = resultSet.rows;
          let averagesArray = [];

          for (let i = 0; i < averages.length; i++) {
            const average = averages.item(i);

            let subject = await BaseSubjects.GetSubjects(average.subject);

            averagesArray.push({
              ...average,
              subject: subject,
              color: subject.color,
            });
          };

          resolve(averagesArray);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  })
}

const SyncGrades = async (gradesObject) => {
  InitGrades();
  InitAverages();

  const promises = [];

  await ResetGrades();
  await ResetAverages();

  promises.push(
    SyncAllGrades(
      gradesObject.grades
    )
  );
  promises.push(
    SyncAverages(
      gradesObject.averages,
      {
        overall_average: gradesObject.overall_average,
        class_overall_average: gradesObject.class_overall_average,
      }
    )
  );

  try {
    await Promise.all(promises);
    console.log('All data inserted!');
  } catch (error) {
    console.error('Error inserting grade data:', error);
  }
};

const SyncAllGrades = async (grades) => {
  const promises = [];

  for (const grade of grades) {
    // Assuming BaseSubjects.SyncSubjects, BaseSubjects.GetSubjects, and InsertCourse are asynchronous functions that return Promises
    promises.push(
      BaseSubjects.SyncSubjects(grade.subject).then(() => {
        return BaseSubjects.GetSubjects(grade.subject.name).then((subject) => {
          return InsertGrade(grade, subject);
        });
      })
    );
  }

  try {
    await Promise.all(promises);
    console.log('All grades inserted!');
  } catch (error) {
    console.error('Error inserting grades:', error);
  }
};

const SyncAverages = async (averages, overall) => {
  const promises = [];

  // add overall average as first average
  averages.unshift({
    average: overall.overall_average,
    class_average: overall.class_overall_average,
    max: 0,
    min: 0,
    out_of: 0,
    significant: 0,
    subject: {
      id: 'moy',
      name: 'Moyenne générale',
      color: '#000000',
    },
  });

  for (const average of averages) {
    // Assuming BaseSubjects.SyncSubjects, BaseSubjects.GetSubjects, and InsertCourse are asynchronous functions that return Promises
    promises.push(
      BaseSubjects.SyncSubjects(average.subject).then(() => {
        return BaseSubjects.GetSubjects(average.subject.name).then((subject) => {
          return InsertAverage(average, subject);
        });
      })
    );
  }

  try {
    await Promise.all(promises);
    console.log('All averages inserted!');
  } catch (error) {
    console.error('Error inserting averages:', error);
  }
};

const ResetGrades = () => {
  // delete all grades
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM grades',
        null,
        (txObj, resultSet) => {
          console.log('Grades deleted!');
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

const ResetAverages = () => {
  // delete all averages
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM averages',
        null,
        (txObj, resultSet) => {
          console.log('Averages deleted!');
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

const InsertGrade = (grade, subject) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO grades (pronote_id, date, description, bonus, optional, out_twenty, subject, average, coefficient, max, min, out_of, significant, value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          grade.id,
          new Date(grade.date).getTime(),
          grade.description,
          grade.is_bonus,
          grade.is_optional,
          grade.is_out_of_20,
          subject.name,
          grade.grade.average,
          grade.grade.coefficient,
          grade.grade.max,
          grade.grade.min,
          grade.grade.out_of,
          grade.grade.significant,
          grade.grade.value,
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

const InsertAverage = (average, subject) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO averages (average, class_average, max, min, out_of, significant, subject) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          average.average,
          average.class_average,
          average.max,
          average.min,
          average.out_of,
          average.significant,
          subject.name,
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
}

const InitGrades = () => {
  let sql = `
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pronote_id INTEGER,
      date TIMESTAMP,
      description TEXT,
      bonus BOOLEAN,
      optional BOOLEAN,
      out_twenty BOOLEAN,
      subject TEXT,
      average FLOAT,
      coefficient FLOAT,
      max FLOAT,
      min FLOAT,
      out_of FLOAT,
      significant INT,
      value FLOAT
    )
  `.trim().replace(/\s+/g, ' ');

  db.transaction(tx => {
    tx.executeSql(sql, null, (txObj, resultSet) => {
      console.log('Grades : table created !');
    }, (txObj, error) => {
      console.log('Error: ', error);
    })
  })
}

const InitAverages = () => {
    let sql = `
      CREATE TABLE IF NOT EXISTS averages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        average FLOAT,
        class_average FLOAT,
        max FLOAT,
        min FLOAT,
        out_of FLOAT,
        significant INT,
        subject TEXT
      )
    `.trim().replace(/\s+/g, ' ');
  
    db.transaction(tx => {
      tx.executeSql(sql, null, (txObj, resultSet) => {
        console.log('Averages : table created !');
      }, (txObj, error) => {
        console.log('Error: ', error);
      })
    })
  }

export { GetGrades, SyncGrades };