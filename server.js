const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin123@cluster0-shard-00-00.aldypx7.mongodb.net:27017,cluster0-shard-00-01.aldypx7.mongodb.net:27017,cluster0-shard-00-02.aldypx7.mongodb.net:27017/lubimy-czytac?ssl=true&replicaSet=atlas-aldypx7-shard-0&authSource=admin&retryWrites=true&w=majority';
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(MONGO_URI)
  .then(() => console.log('Połączono z bazą danych'))
  .catch(err => console.error('Błąd bazy:', err));

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String
});

const Book = mongoose.model('Book', bookSchema);

app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, description } = req.body;
    const newBook = new Book({ title, author, description });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Błąd zapisu' });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});