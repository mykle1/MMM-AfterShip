const path = require('path');
const express = require('express');
const layout = require('express-layout');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const favicon = require('serve-favicon');

const routes = require('./routes');
const bodyParser = require('body-parser');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('title','MMM-Parcel');

const middlewares = [
  layout(),
  express.static(path.join(__dirname, 'public')),
  favicon(path.join(__dirname,'public','parcel.ico')),
  bodyParser.urlencoded({ extended: true }),
  cookieParser(),
  session({
    secret: 'super-secret-key',
    key: 'super-secret-cookie',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }
  }),
  flash(),
];
app.use(middlewares);

app.use('/', routes);

app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('App running at http://xxx.yyy.zzz.aaa:3000 (local IP address of MagicMirror)');
});
