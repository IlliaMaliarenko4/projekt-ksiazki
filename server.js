const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const db = new sqlite3.Database('./books.db', (err) => {
  if (err) console.error('Błąd SQLite:', err);
  else console.log('✅ Połączono z SQLite - books.db');
});

db.run(`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  cover_url TEXT
)`);

// ====================== STRONA GŁÓWNA ======================
app.get('/', (req, res) => {
  db.all("SELECT * FROM books ORDER BY id DESC", [], (err, books) => {
    if (err) return res.send('<h1>Błąd bazy</h1>');

    let listHTML = '';
    if (books.length === 0) {
      listHTML = `<p class="text-muted fs-5">Brak książek jeszcze... Dodaj pierwszą!</p>`;
    } else {
      books.forEach(book => {
        listHTML += `
          <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm">
              ${book.cover_url ? `<img src="${book.cover_url}" class="card-img-top" style="height: 260px; object-fit: cover;" alt="Okładka">` : ''}
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${book.title}</h5>
                <p class="card-text text-primary fw-bold">${book.author}</p>
                ${book.year ? `<p class="card-text"><small class="text-muted">Rok: ${book.year}</small></p>` : ''}
                ${book.description ? `<p class="card-text">${book.description.substring(0, 130)}...</p>` : ''}
                <a href="/book/${book.id}" class="btn btn-primary mt-auto">Szczegóły →</a>
              </div>
            </div>
          </div>`;
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Katalog Książek</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            font-family: 'Segoe UI', system-ui, sans-serif;
          }
          .container {
            max-width: 1200px;
          }
          h1 {
            color: #1a1a2e;
            font-weight: 700;
          }
          .card {
            border: none;
            border-radius: 16px;
            transition: all 0.3s ease;
            background: white;
          }
          .card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
          }
          .btn-primary {
            background: #4e54c8;
            border: none;
            border-radius: 50px;
            padding: 10px 25px;
          }
          .btn-success {
            background: #00c48c;
            border: none;
            border-radius: 50px;
          }
          .form-control {
            border-radius: 12px;
            padding: 12px;
          }
          .card-img-top {
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
          }
        </style>
      </head>
      <body class="py-5">
        <div class="container">
          <h1 class="text-center mb-5">📚 Katalog Książek</h1>
          
          <!-- Formularz -->
          <div class="card p-4 mb-5 shadow">
            <h3 class="mb-4 text-center">Dodaj nową książkę</h3>
            <form action="/add" method="POST">
              <div class="row g-3">
                <div class="col-md-6">
                  <input type="text" name="title" class="form-control" placeholder="Tytuł książki" required>
                </div>
                <div class="col-md-6">
                  <input type="text" name="author" class="form-control" placeholder="Autor" required>
                </div>
                <div class="col-md-6">
                  <input type="number" name="year" class="form-control" placeholder="Rok wydania">
                </div>
                <div class="col-md-6">
                  <input type="url" name="cover_url" class="form-control" placeholder="Link do okładki">
                </div>
                <div class="col-12">
                  <textarea name="description" class="form-control" rows="4" placeholder="Opis książki..."></textarea>
                </div>
              </div>
              <button type="submit" class="btn btn-success btn-lg w-100 mt-4">Dodaj książkę</button>
            </form>
          </div>

          <h3 class="mb-4">Lista książek (${books.length})</h3>
          <div class="row">
            ${listHTML}
          </div>
        </div>
      </body>
      </html>
    `);
  });
});

// Dodawanie
app.post('/add', (req, res) => {
  const { title, author, description, year, cover_url } = req.body;
  db.run(`INSERT INTO books (title, author, description, year, cover_url) VALUES (?, ?, ?, ?, ?)`,
    [title, author, description, year || null, cover_url || null],
    (err) => {
      if (err) console.error(err);
      res.redirect('/');
    });
});

// Szczegóły książki
app.get('/book/:id', (req, res) => {
  db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, book) => {
    if (err || !book) return res.send("<h1>Książka nie znaleziona</h1>");

    res.send(`
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${book.title}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
          .card { background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body class="py-5">
        <div class="container">
          <a href="/" class="btn btn-outline-primary mb-4">← Powrót do katalogu</a>
          <div class="card p-5">
            ${book.cover_url ? `<img src="${book.cover_url}" class="img-fluid rounded mb-4" style="max-height: 550px; width: 100%; object-fit: contain;">` : ''}
            <h1>${book.title}</h1>
            <h3 class="text-primary">${book.author}</h3>
            ${book.year ? `<p><strong>Rok wydania:</strong> ${book.year}</p>` : ''}
            ${book.description ? `<div class="mt-4"><h5>Opis</h5><p style="font-size: 1.1rem; line-height: 1.8;">${book.description}</p></div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `);
  });
});

app.listen(port, () => {
  console.log(`✅ Serwer działa na http://localhost:${port}`);
});
