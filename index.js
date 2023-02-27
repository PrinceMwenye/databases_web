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





  app.post('/loggingin', async (req,res) => {
    var email = req.body.email;
    var password = req.body.password;


    var results = await db_users.getUser({ user: email, hashedPassword: password });

    if (results) {
        if (results.length == 1) { //there should only be 1 user in the db that matches
            if (bcrypt.compareSync(password, results[0].password)) {
                req.session.authenticated = true;
                req.session.email = email;
                req.session.cookie.maxAge = expireTime;
        
                res.redirect('/todo');
                return;
            }
            else {
                console.log("invalid password");
            }
        }
        else {
            console.log('invalid number of users matched: '+results.length+" (expected 1).");
            res.redirect('/login');
            return;            
        }
    }

    console.log('user not found');
    //user and password combination not found
    res.redirect("/login");
});

app.get('/todo', async (req, res) => {
    if (!req.session.authenticated) {
      res.redirect('/login');
    } else {
      const userEmail = req.session.email;
      const userTodos = await db_users.getTodos(userEmail);
      console.log(userTodos);
      console.log(userEmail);

      res.render("todo", { userEmail, todos:userTodos });
    }
  });


//   app.post('/todo', async (req, res) => {
//     // Extract the todo information from the request body
//     // const { title, description } = req.body;
//     const user_id = req.session.user_id;
//     const todoData = {
//         description: req.body.description,
//         user_id: user_id
//       };
//     // Get the user's email address from the session
//     const userEmail = req.session.email;
  
//     // Insert the new todo item into the database
//     try {
//       await db_users.createTodo({
//         title,
//         description,
//         email: userEmail
//       });
  
//       // Redirect the user back to the todo page
//       res.redirect('/todo');
//     } catch (error) {
//       console.log(error);
//       res.status(500).send('Internal server error');
//     }
//   });
  
app.post('/todo', async (req, res) => {

    const userEmail = req.session.email;
    var description = req.body.description;


    var result = await db_users.createTodo({ user: userEmail,  description:description });
    if (result) {
      res.redirect('/todo');
    } else {
      res.send('Error creating todo');
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