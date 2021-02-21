const express = require('express')
const path = require('path');
const bodyparser = require('body-parser')
const morgan = require('morgan')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const passport = require('passport');
const session = require('express-session')
const cookieSession = require('cookie-session');
const connectDB = require('./config/db');
const MongoStore = require('connect-mongo')(session)
const User = require('./model/User')


const port = process.env.PORT || 3000;

// load config
// require('dotenv').config()
const app = express();

connectDB()

//Configure Session Storage
/*app.use(cookieSession({
   name: 'session-name',
   keys: ['key1', 'key2'],
   // store: new MongoStore({ mongooseConnection: mongoose.connection })
 })) */
app.use(bodyparser.urlencoded({ extended: false }))
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}))

//passport config
require('./passport')



app.use(express.json())
//app.use(express.urlencoded({ extended: false }));




//Passport middleware
//app.use(express.cookieSession());
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

app.set('view engine', 'ejs')
//set the views directory
app.set('views', './views');


app.get('', (req, res) => {
  const params = {};

  res.render('login', params)
})



app.get('/failed', (req, res) => {
  res.send('<h1>Log in Failed :(</h1>')
});

// Middleware - Check user is Logged in
const checkUserLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
}


app.get('/index', checkUserLoggedIn, (req, res) => {
  const params = {};

  res.render('index', params)
})

app.get('/agora', checkUserLoggedIn, (req, res) => {
  const params = {};

  res.render('agora', params)
})

//global user
/*
app.use(function (req, res, next){
  res.locals.user = req.user || null
  next()
})
*/
// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
let udata = {}
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '' }),
  function (req, res) {
    // console.log("passport response", res.user)
    // console.log("passport request", req.user)
    res.locals.guser = req.user || null
    // console.log(res.guser)
    udata = req.user;
    //console.log(udata)
    res.redirect('/index');
  }
);
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})
//Logout
app.get('/logout', (req, res) => {
  req.session = null;
  req.logout();
  res.redirect('/');
})
app.get('/profile', (req, res) => {

  if (udata.googleId) {
    User.findOne({ googleId: udata.googleId }).then(userData => {
      if (userData) {
        res.render('profile', { userData })
      }
      else {
        return res.status(404).json("User not found");
      }
    })
  }
  else {
    res.status(404).json("failed to fetch info");
  }
  // res.render('profile',{params})
})


app.post('/profile', (req, res) => {
  console.log('working')
  useinfo = req.body
  //console.log(req)
  console.log("userInfo", useinfo)
  res.render('index', {});
})


app.listen(port, () => {
  console.log(`Running successfully on ${port}`);
})