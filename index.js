require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 8080;

const app = express();

const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)


//Users and Passwords (in memory 'database')
var users = []; 

/* secret information section */
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;;
const mongodb_session_secret =process.env.MONGODB_SESSION_SECRET;;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.nbfzg7h.mongodb.net/?retryWrites=true&w=majority`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true,
    cookie: {
        maxAge: 1000 * 60 * 60 // 1 hour
      }
}
));

app.get('/', (req,res) => {
    var html = `
    <button onclick="window.location.href='/createUser'">Sign Up</button>
    <button onclick="window.location.href='/login'">Log In</button>
    `;
    res.send(html);
});


app.get('/createUser', (req,res) => {
    var errorMessage = req.query.error;

    var html = `
    ${errorMessage ? '<p style="color:red">' + errorMessage + '</p>' : ''}
    create user
    <form action='/submitUser' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='email' type='email' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

app.post('/submitUser', (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
  
    if (!username || !email || !password) {
      var errorMessage = "";
      if (!username) {
        errorMessage += "Please provide a username. ";
      }
       if (!email) {
        errorMessage += "Please provide an email. ";
      }
       if (!password) {
        errorMessage += "Please provide a password. ";
      }
      res.redirect('/createUser?message=' + errorMessage) 
      
       }
      
      else {
      var hashedPassword = bcrypt.hashSync(password, saltRounds);
  
      users.push({ username: username, email: email, password: hashedPassword });
  
      console.log(users);
  
  
    req.session.authenticated = true;
    req.session.username = username;
  
    res.redirect('/members');
    }
  });




app.get('/contact', (req,res) => {
    var missingEmail = req.query.missing;
    var html = `
        email address:
        <form action='/submitEmail' method='post'>
            <input name='email' type='text' placeholder='email'>
            <button>Submit</button>
        </form>
    `;
    if (missingEmail) {
        html += "<br> email is required";
    }
    res.send(html);
});

app.post('/submitEmail', (req,res) => {
    var email = req.body.email;
    if (!email) {
        res.redirect('/contact?missing=1');
    }
    else {
        res.send("Thanks for subscribing with your email: "+email);
    }
});

app.get('/login', (req,res) => {
    var errorMessage = req.query.error;
    var html = `
    <h1>Login</h1>
    ${errorMessage ? '<p style="color:red">' + errorMessage + '</p>' : ''}
    <form action='/loggingin' method='post'>
    <input name='email' type='email' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});



app.post('/loggingin', (req,res) => {
    var email = req.body.email;
    var password = req.body.password;


    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        if (users[i].email == email) {
            if (bcrypt.compareSync(password, users[i].password)) {
                req.session.authenticated = true;
                req.session.email = email;
                req.session.cookie.maxAge = expireTime;
        
                res.redirect('/members');
                return;
            }
        }
    }

    //user and password combination not found
    res.redirect("/login?error=User and password not found");});


app.get('/members', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/');
    }
    var images = ['matopos.jpg', 'sahara.jpg', 'vicfalls.jpg'];
    var randomIndex = Math.floor(Math.random() * images.length);
    var html = `
    <h1>Hello, ${req.session.username}</h1>
    <img src="${images[randomIndex]}" />
    <br><br>
    <button onclick="window.location.href='/'">Sign Out</button>
    `;
    res.send(html);
});


app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 