import SQLite from 'react-native-sqlite-storage';

class BibleDatabaseService {
  constructor() {
    this.db = null;
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      SQLite.openDatabase(
        {name: 'BibleDB.db', location: 'default'},
        (db) => {
          this.db = db;
          console.log('Database opened successfully');
          this.createTables().then(resolve).catch(reject);
        },
        (error) => {
          console.error('Error opening database', error);
          reject(error);
        }
      );
    });
  }

  async createTables() {
    const createVerseTable = `
      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        text TEXT,
        UNIQUE(book, chapter, verse)
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_book ON verses (book);
      CREATE INDEX IF NOT EXISTS idx_chapter ON verses (chapter);
      CREATE INDEX IF NOT EXISTS idx_verse ON verses (verse);
      CREATE INDEX IF NOT EXISTS idx_text ON verses (text);
    `;

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(createVerseTable, [], 
          () => {
            tx.executeSql(createIndexes, [],
              () => {
                console.log('Table and indexes created successfully');
                resolve();
              },
              (_, error) => {
                console.error('Error creating indexes', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error creating table', error);
            reject(error);
          }
        );
      });
    });
  }

  async insertVerse(book, chapter, verse, text) {
    const query = `INSERT OR IGNORE INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(query, [book, chapter, verse, text],
          (_, result) => {
            console.log('Verse inserted successfully');
            resolve(result);
          },
          (_, error) => {
            console.error('Error inserting verse', error);
            reject(error);
          }
        );
      });
    });
  }

  async getVerse(book, chapter, verse) {
    const query = `SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse = ?`;
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(query, [book, chapter, verse],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(result.rows.item(0));
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error getting verse', error);
            reject(error);
          }
        );
      });
    });
  }

  async getChapter(book, chapter, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const query = `SELECT * FROM verses WHERE book = ? AND chapter = ? ORDER BY verse LIMIT ? OFFSET ?`;
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(query, [book, chapter, pageSize, offset],
          (_, result) => {
            const verses = [];
            for (let i = 0; i < result.rows.length; i++) {
              verses.push(result.rows.item(i));
            }
            resolve(verses);
          },
          (_, error) => {
            console.error('Error getting chapter', error);
            reject(error);
          }
        );
      });
    });
  }

  async searchVerses(searchTerm, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const query = `SELECT * FROM verses WHERE text LIKE ? ORDER BY book, chapter, verse LIMIT ? OFFSET ?`;
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(query, [`%${searchTerm}%`, pageSize, offset],
          (_, result) => {
            const verses = [];
            for (let i = 0; i < result.rows.length; i++) {
              verses.push(result.rows.item(i));
            }
            resolve(verses);
          },
          (_, error) => {
            console.error('Error searching verses', error);
            reject(error);
          }
        );
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close(
          () => {
            console.log('Database closed successfully');
            resolve();
          },
          (error) => {
            console.error('Error closing database', error);
            reject(error);
          }
        );
      });
    }
  }

  async dropTable() {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql('DROP TABLE IF EXISTS verses', [],
          () => {
            console.log('Table dropped successfully');
            resolve();
          },
          (_, error) => {
            console.error('Error dropping table', error);
            reject(error);
          }
        );
      });
    });
  }
}

export default new BibleDatabaseService();