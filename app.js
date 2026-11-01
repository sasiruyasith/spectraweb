const express = require('express');
const path = require('path');

const scanRoutes = require('./routes/scans');
const deviceRoutes = require('./routes/devices');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// pass flash-style messages from the query string to every view
app.use((req, res, next) => {
  res.locals.msg = req.query.msg || null;
  res.locals.path = req.path;
  next();
});

app.get('/', (req, res) => res.redirect('/scans'));
app.use('/scans', scanRoutes);
app.use('/devices', deviceRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: 'Not found', message: 'That page does not exist.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Error', message: 'Something went wrong on the server.' });
});

app.listen(PORT, () => console.log(`SpectraWeb running on http://localhost:${PORT}`));
