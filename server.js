const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to SQLite.');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      year TEXT,
      cover_url TEXT,
      description TEXT
    )
  `);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/books', (req, res) => {
  const { title, author, year, cover_url, description } = req.body;
  db.run(
    'INSERT INTO books (title, author, year, cover_url, description) VALUES (?, ?, ?, ?, ?)',
    [title, author, year, cover_url, description],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, title, author, year, cover_url, description });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
