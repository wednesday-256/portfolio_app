var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const db_clean = require('./extensions/db_clean')

//compresssion middleware 
const compression = require('compression')
var app = express();

//secret for signing cookies
const secret = "your cookie secret here"

var mongoose = require('mongoose');
var mongoDB = "your mongodb url here" //"mongodb://localhost:27017/gameapp"

mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
var db = mongoose.connection; 
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(secret));
app.use(express.static(path.join(__dirname, 'public')));

//custome middleware for compressing payload
app.use(compression())

//custom middleware for authentication handling
app.use((req, res, next)=>{
  req.user = req.signedCookies['AuthToken'] || null
  next()
})

//custom middleware for database clean up 
app.use(db_clean.clean_up)

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
