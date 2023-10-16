import { useAppContext } from '../utils/AppContext';

// SQLite
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('PapillonDatabase.db')

const GetUser = () => {
  InitUser();
  // Renvoie le premier utilisateur de la base de données

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM users WHERE id = 1',
        null,
        (txObj, resultSet) => {
          const user = resultSet.rows.item(0);
          resolve(user);
        },
        (txObj, error) => {
          reject(error);
        }
      );
    });
  });
}

const SyncUser = (user) => {
  InitUser();
  
  // Fonction pour insérer ou mettre à jour un utilisateur dans la base de données
  const upsertUser = (user) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT OR REPLACE INTO users (id, name, class, profile_picture, email, establishment, ine, phone, delegue, periods) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            1, // Assuming the user ID is always 1 for this example
            user.name,
            user.class,
            user.profile_picture,
            user.email,
            user.establishment,
            user.ine,
            user.phone,
            user.delegue,
            JSON.stringify(user.periods),
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

  // Insérer ou mettre à jour l'utilisateur dans la base de données
  return upsertUser(user)
    .then(() => {
    })
    .catch((error) => {
      console.error('Erreur lors de l\'insertion ou mise à jour de l\'utilisateur :', error);
    });
};

const InitUser = () => {
  let sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      class TEXT,
      profile_picture TEXT,
      email TEXT,
      establishment TEXT,
      ine TEXT,
      phone TEXT,
      delegue BOOLEAN,
      periods JSON
    )
  `.trim().replace(/\s+/g, ' ');

  db.transaction(tx => {
    tx.executeSql(sql, null, (txObj, resultSet) => {
    }, (txObj, error) => {
      console.log('Error: ', error);
    })
  })
}

export { GetUser, SyncUser };