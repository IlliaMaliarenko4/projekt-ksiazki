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

app.get('/', (req, res) => {
  db.all("SELECT * FROM books ORDER BY id DESC", [], (err, books) => {
    if (err) return res.send('<h1>Błąd bazy</h1>');

    let listHTML = '';
    if (books.length === 0) {
      listHTML = `<p style="color: #ffffff; font-size: 1.25rem;">Brak książek jeszcze... Dodaj pierwszą!</p>`;
    } else {
      books.forEach(book => {
        listHTML += `
          <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100" style="background: #2d2d2d; border: 1px solid #555;">
              ${book.cover_url ? `<img src="${book.cover_url}" class="card-img-top" style="height: 240px; object-fit: cover;" onerror="this.style.display='none';">` : ''}
              <div class="card-body d-flex flex-column">
                <h5 style="color: #ffffff; font-weight: bold; margin-bottom: 0.5rem;">${book.title}</h5>
                <p style="margin-bottom: 0.5rem;"><strong style="color: #00d2ff;">${book.author}</strong></p>
                ${book.year ? `<p style="margin-bottom: 0.5rem;"><small style="color: #ffca28;">Rok: ${book.year}</small></p>` : ''}
                ${book.description ? `<p style="color: #b0b3b8; font-size: 0.95rem;">${book.description.substring(0, 120)}...</p>` : ''}
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
            background: #1a1a1a; 
            color: #f8f9fa; 
          }
          .card { 
            background: #2d2d2d; 
            border: 1px solid #555; 
          }
          .card:hover { 
            transform: translateY(-8px); 
            box-shadow: 0 10px 25px rgba(0, 123, 255, 0.4); 
            transition: all 0.3s; 
          }
          .form-control {
            background: #333;
            color: #fff;
            border: 1px solid #666;
          }
          .form-control:focus {
            background: #3a3a3a;
            border-color: #0d6efd;
            color: white;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
          }
          .form-control::placeholder {
            color: #aaa;
          }
          .btn-primary { background-color: #0d6efd; border-color: #0d6efd; }
          .btn-success { background-color: #198754; border-color: #198754; }
        </style>
      </head>
      <body>
        <div class="container py-5">
          <h1 class="mb-5 text-center display-5" style="color: #ffffff; font-weight: bold;">📚 Katalog Książek</h1>
          
          <div class="card p-4 mb-5 shadow" style="background: #2d2d2d; border: 1px solid #555;">
            <h3 class="mb-4" style="color: #ffffff; font-weight: bold;">Dodaj książkę</h3>
            <form action="/add" method="POST">
              <div class="row g-3">
                <div class="col-md-6">
                  <input type="text" name="title" class="form-control" placeholder="Tytuł" required>
                </div>
                <div class="col-md-6">
                  <input type="text" name="author" class="form-control" placeholder="Autor" required>
                </div>
                <div class="col-12">
                  <input type="number" name="year" class="form-control" placeholder="Rok wydania">
                </div>
                <div class="col-12">
                  <input type="text" name="cover_url" class="form-control" placeholder="Link do okładki (np. https://strona.pl/obrazek.jpg)">
                </div>
                <div class="col-12">
                  <textarea name="description" class="form-control" rows="3" placeholder="Opis książki"></textarea>
                </div>
              </div>
              <button type="submit" class="btn btn-success btn-lg w-100 mt-4">Dodaj książkę</button>
            </form>
          </div>

          <h3 class="mb-4" style="color: #ffffff; font-weight: bold;">Lista książek (${books.length})</h3>
          <div class="row">
            ${listHTML}
          </div>
        </div>
      </body>
      </html>
    `);
  });
});

app.post('/add', (req, res) => {
  let { title, author, description, year, cover_url } = req.body;
  
  if (cover_url && cover_url.trim() !== '') {
    cover_url = cover_url.trim();
    if (!cover_url.startsWith('http://') && !cover_url.startsWith('https://')) {
      cover_url = 'https://' + cover_url;
    }
  } else {
    cover_url = null;
  }

  db.run(`INSERT INTO books (title, author, description, year, cover_url) VALUES (?, ?, ?, ?, ?)`,
    [title, author, description, year || null, cover_url],
    (err) => {
      if (err) console.error(err);
      res.redirect('/');
    });
});

app.get('/book/:id', (req, res) => {
  db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, book) => {
    if (err || !book) return res.send("<h1 style='color: #ffffff; text-center mt-5;'>Książka nie znaleziona</h1>");

    res.send(`
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${book.title}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { background: #1a1a1a; color: #f8f9fa; }
          .card { background: #2d2d2d; border: 1px solid #555; }
          .btn-secondary { background-color: #6c757d; border-color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container py-5">
          <a href="/" class="btn btn-secondary mb-4" style="color: #ffffff;">← Powrót do listy</a>
          <div class="card p-5 shadow">
            ${book.cover_url ? `
              <div class="text-center mb-4">
                <img src="${book.cover_url}" class="img-fluid rounded" style="max-height: 520px;" onerror="this.style.display='none';">
              </div>
            ` : ''}
            <h1 style="color: #ffffff; font-weight: bold; margin-bottom: 0.5rem;">${book.title}</h1>
            <h3 style="color: #00d2ff; margin-bottom: 1.5rem;">${book.author}</h3>
            ${book.year ? `<p style="color: #ffffff; font-size: 1.1rem;"><strong>Rok wydania:</strong> <span style="color: #ffca28;">${book.year}</span></p>` : ''}
            ${book.description ? `
              <div class="mt-4">
                <h5 style="color: #ffffff; font-weight: bold; margin-bottom: 0.5rem;">Opis:</h5>
                <p style="color: #e0e0e0; font-size: 1.15rem; line-height: 1.8;">${book.description}</p>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `);
  });
});

app.listen(port, () => {
  console.log(`Serwer działa na http://localhost:${port}`);
});
