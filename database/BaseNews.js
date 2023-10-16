import { useAppContext } from '../utils/AppContext';

// SQLite
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('PapillonDatabase.db')

const GetNews = () => {
  InitNews();
  
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM news',
        null,
        async (txObj, resultSet) => {
          const news = resultSet.rows;
          let newsArray = [];

          for (let i = 0; i < news.length; i++) {
            const info = news.item(i);

            newsArray.push({
              ...info,
              id: info.pronote_id,
              date: new Date(info.date),
              html_content: JSON.parse(info.html_content || '{}'),
              attachments: JSON.parse(info.attachments || '[]'),
              read: info.read === 1,
              survey: info.survey === 1,
            });
          };

          resolve(newsArray);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  });
}

const SyncNews = async (news) => {
  InitNews();

  const promises = [];

  ResetNews();

  for (const info of news) {
    // Assuming BaseSubjects.SyncSubjects, BaseSubjects.GetSubjects, and InsertCourse are asynchronous functions that return Promises
    promises.push(
      InsertNews(info)
    );
  }

  try {
    await Promise.all(promises);
    console.log('All news inserted!');
  } catch (error) {
    console.error('Error inserting news:', error);
  }
};

const InsertNews = (news) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO news (pronote_id, local_id, author, title, category, content, date, html_content, read, survey, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          news.id,
          news.local_id,
          news.author,
          news.title,
          news.category,
          news.content,
          news.date,
          JSON.stringify(news.html_content),
          news.read,
          news.survey,
          JSON.stringify(news.attachments),
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

const ResetNews = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM news',
        null,
        (txObj, resultSet) => {
          console.log('News deleted!');
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

const InitNews = () => {
  let sql = `
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pronote_id TEXT,
      local_id TEXT,
      author TEXT,
      title TEXT,
      category TEXT,
      content TEXT,
      date TIMESTAMP,
      html_content JSON,
      read BOOLEAN,
      survey BOOLEAN,
      attachments JSON
    )
  `.trim().replace(/\s+/g, ' ');

  db.transaction(tx => {
    tx.executeSql(sql, null, (txObj, resultSet) => {
      console.log('News : table created !');
    }, (txObj, error) => {
      console.log('Error: ', error);
    })
  })
}

export { GetNews, SyncNews };