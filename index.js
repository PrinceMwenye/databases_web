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
    var userEmail = req.body.email;

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    var success = await db_users.createUser({ user: username, email:userEmail, hashedPassword: hashedPassword });

    if (success) {
      req.session.authenticated = true;
      req.session.email = userEmail;
      // req.session.user_id = results[0].user_id;
      req.session.cookie.maxAge = expireTime;

      const userTodos = await db_users.getTodos({user:userEmail});
      res.render("todo", { userEmail, todos:userTodos });
        // res.render("todo", {userEmail:results[0].user});
    }
    else {
        res.render("errorMessage", {error: "Failed to create user."} );
    }

});


  app.get('/contact', (req, res) => {
    const missingEmail = req.query.missing;
    res.render('contact', { title: 'Contact', missingEmail });
    
  });





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


          if (results[0].frn_user_type_id == 1){
            // hash admin user's password
            results[0].password = bcrypt.hashSync( results[0].password, saltRounds);

          }
             if (bcrypt.compareSync(password, results[0].password)) {
                req.session.authenticated = true;
                req.session.email = email;
                req.session.user_id = results[0].user_id;
                req.session.cookie.maxAge = expireTime;
                console.log("Logging in" +  results[0].user_id)

                // check if admin
                if (results[0].frn_user_type_id == 1) {
                  res.redirect('/admin');
                  return;
                }

              else{
                res.redirect('/todo');
                return;
              }
                
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
      const userDetails = await db_users.getUser({user:userEmail});
      const userName = userDetails[0].username
      const userTypeID = userDetails[0].frn_user_type_id
      const userTodos = await db_users.getTodos({user:userEmail});
      const isAdmin = (userTypeID == 1)
      // console.log(userName[0].username);
      res.render("todo", { userName, isAdmin, todos:userTodos });
    }
  });

  app.get('/admin', async (req, res) => {

    if (!req.session.authenticated) {
      // if not authenticated then redirect to login
      res.redirect('/login');
    } else {
      const userEmail = req.session.email;
      const userDetails = await db_users.getUser({user:userEmail});
      const userTypeID = userDetails[0].frn_user_type_id
      // check if admin
      if (userTypeID == 1){
        const userNames = await db_users.getUsers();
        // console.log(userEmail);
        res.render("admin", {userNames});
      } else{
        res.redirect('/todo');

      }
    }
  });
  

  app.get('/user/:id', async (req, res) => {
    if (!req.session.authenticated) {
      res.redirect('/login');
    } else {
      const id = req.params.id;
      console.log("CURRENT ID" + id);
      const userDetails = await db_users.getUser({user:id});
      const userTypeID = userDetails[0].frn_user_type_id;
      console.log("Redirected user" + userTypeID)
      const isAdmin = (userTypeID != 1);
      const userName = userDetails[0].username;
      const userTodos = await db_users.getTodoAdmin({userid: id});
      res.render("todo", { userName, isAdmin, todos:userTodos });
    }
  });

  
app.post('/todo', async (req, res) => {

    const userEmail = req.session.email;
    var description = req.body.todo;

    console.log("ERROR EMAIL" + userEmail)
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