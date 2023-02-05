const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 5000;

const app = express();

const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)


//Users and Passwords (in memory 'database')
var users = []; 

/* secret information section */
const mongodb_user = "MwenyeIce12";
const mongodb_password = "manchester12";
const mongodb_session_secret = "3ce72a05-c5b6-4bbe-9517-e2f5c8e8e8a2";

const node_session_secret = "2ec62a80-7111-4ca6-9a89-af20d800e0ef";
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
	resave: true
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
    var html = `
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
      return res.redirect('/createUser?message=' + errorMessage)    }
      
      else {
      var hashedPassword = bcrypt.hashSync(password, saltRounds);
  
      users.push({ username: username, email: email, password: hashedPassword });
  
      console.log(users);
  
      var usershtml = "";
      for (i = 0; i < users.length; i++) {
        usershtml += `<li>Username: ${users[i].username} Email: ${users[i].email} Password: ${users[i].password}</li>`;
      }
  
      var html = "<ul>" + usershtml + "</ul>";
      res.send(html);
    }
  });
  
  
  
app.get('/about', (req,res) => {
    var color = req.query.color;

    res.send("<h1 style='color:"+color+";'>Patrick Guichon</h1>");
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



// app.get('/login', (req,res) => {
//     var html = `
//     log in
//     <form action='/loggingin' method='post'>
//     <input name='email' type='email' placeholder='email'>
//     <input name='password' type='password' placeholder='password'>
//     <button>Submit</button>
//     </form>
//     `;
//     res.send(html);
// });

app.post('/loggingin', (req,res) => {
    var username = req.body.username;
    var password = req.body.password;


    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        if (users[i].username == username) {
            if (bcrypt.compareSync(password, users[i].password)) {
                req.session.authenticated = true;
                req.session.username = username;
                req.session.cookie.maxAge = expireTime;
        
                res.redirect('/loggedIn');
                return;
            }
        }
    }

    //user and password combination not found
    res.redirect("/login?error=User and password not found");});


app.get('/loggedin', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }
    var html = `
    You are logged in!
    `;
    res.send(html);
});






app.get('/cat/:id', (req,res) => {

    var cat = req.params.id;

    if (cat == 1) {
        res.send("Fluffy: <img src='/fluffy.gif' style='width:250px;'>");
    }
    else if (cat == 2) {
        res.send("Socks: <img src='/socks.gif' style='width:250px;'>");
    }
    else {
        res.send("Invalid cat id: "+cat);
    }
});


app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 