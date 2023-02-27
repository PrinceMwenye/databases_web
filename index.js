require('./utils');

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;



const database = include('databaseConnection');
const db_utils = include('database/db_utils');
const db_users = include('database/users');

const success = db_utils.printMySQLVersion();

const port = process.env.PORT || 3000;

const app = express();

const expireTime = 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)


//Users and Passwords (in memory 'database')
var users = []; 

/* secret information section */
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;;
const mongodb_session_secret =process.env.MONGODB_SESSION_SECRET;;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */


// set view engine to ejs
app.set('view engine', 'ejs');

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
    res.render("index");
});

app.get('/createUser', (req, res) => {
    const errorMessage = req.query.error;
    res.render('createUser', { title: 'Create User', errorMessage });
  });

// app.get('/createUser', (req,res) => {
//     var errorMessage = req.query.error;

//     var html = `
//     ${errorMessage ? '<p style="color:red">' + errorMessage + '</p>' : ''}
//     create user
//     <form action='/submitUser' method='post'>
//     <input name='username' type='text' placeholder='username'>
//     <input name='email' type='email' placeholder='email'>
//     <input name='password' type='password' placeholder='password'>
//     <button>Submit</button>
//     </form>
//     `;
//     res.send(html);
// });

app.post('/submitUser', async (req,res) => {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    var success = await db_users.createUser({ user: username, email:email, hashedPassword: hashedPassword });

    if (success) {
        var results = await db_users.getUsers();

        res.render("todo",{users:results});
    }
    else {
        res.render("errorMessage", {error: "Failed to create user."} );
    }

});


  app.get('/contact', (req, res) => {
    const missingEmail = req.query.missing;
    res.render('contact', { title: 'Contact', missingEmail });
    
  });

// app.get('/contact', (req,res) => {
//     var missingEmail = req.query.missing;
//     var html = `
//         email address:
//         <form action='/submitEmail' method='post'>
//             <input name='email' type='text' placeholder='email'>
//             <button>Submit</button>
//         </form>
//     `;
//     if (missingEmail) {
//         html += "<br> email is required";
//     }
//     res.send(html);
// });

// app.post('/submitEmail', (req,res) => {
//     var email = req.body.email;
//     if (!email) {
//         res.redirect('/contact?missing=1');
//     }
//     else {
//         res.send("Thanks for subscribing with your email: "+email);
//     }
// });


app.get('/createTables', async (req,res) => {

    const create_tables = include('database/create_tables');
    var success = create_tables.createTables();
    if (success) {
        res.render("successMessage", {message: "Created tables."} );
    }
    else {
        res.render("errorMessage", {error: "Failed to create tables."} );
    }
});

app.get('/login', (req, res) => {
    const errorMessage = req.query.error;
    res.render('login', { title: 'Login', errorMessage });
  });

// app.get('/login', (req,res) => {
//     var errorMessage = req.query.error;
//     var html = `
//     <h1>Login</h1>
//     ${errorMessage ? '<p style="color:red">' + errorMessage + '</p>' : ''}
//     <form action='/loggingin' method='post'>
//     <input name='email' type='email' placeholder='email'>
//     <input name='password' type='password' placeholder='password'>
//     <button>Submit</button>
//     </form>
//     `;
//     res.send(html);
// });



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


    app.get('/members', function(req, res) {
        if (!req.session.authenticated) {
            res.redirect('/');
        } else {
            res.render('members', {username: req.session.username, image: req.session.image, session: req.session});
        }
    });
    
      
app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.render("404");
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 