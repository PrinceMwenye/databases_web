const database = include('databaseConnection');

async function createUser(postData) {
	let createUserSQL = `
		INSERT INTO user
		(username,email, password, frn_user_type_id)
		VALUES
		(:user, :email, :passwordHash, 2);
	`;

	let params = {
		user: postData.user,
		passwordHash: postData.hashedPassword,
        email:postData.email
	}
	
	try {
		const results = await database.query(createUserSQL, params);

        console.log("Successfully created user");
		console.log(results[0]);
		return true;
	}
	catch(err) {
		console.log("Error inserting user");
        console.log(err);
		return false;
	}
}

async function getUsers() {
	let getUsersSQL = `
		SELECT user_id, username
		FROM user;
	`;
	
	try {
		const results = await database.query(getUsersSQL);

        console.log("Successfully retrieved users");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error getting users");
        console.log(err);
		return false;
	}
}


async function getUser(postData) {
	let getUserSQL = `
		SELECT user_id, email, password, frn_user_type_id
		FROM user
		WHERE email = :user;
	`;

	let params = {
		user: postData.user
	}
	
	try {
		const results = await database.query(getUserSQL, params);

        console.log("Successfully found user");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error trying to find user");
        console.log(err);
		return false;
	}
}


async function getTodoAdmin(postData){
	let getTodosSQL = `


	SELECT description FROM todo 
	WHERE frn_user_id = :userid;
	`;
  
	let params = {
		userid: postData.userid
	}
  
	try {
	  const results = await database.query(getTodosSQL, params);
  
	  console.log("Successfully retrieved todos");
	  console.log(results[0]);
	  return results[0];
	} catch (err) {
	  console.log("Error getting todos");
	  console.log(err);
	  return false;
	}
  }


async function getTodos(postData) {
	let getTodosSQL = `


	SELECT td.description FROM user us
	INNER JOIN todo td
	 ON
	us.user_id = td.frn_user_id
	WHERE email = :user;
	`;
  
	let params = {
		user: postData.user
	}
  
	try {
	  const results = await database.query(getTodosSQL, params);
  
	  console.log("Successfully retrieved todos");
	  console.log(results[0]);
	  return results[0];
	} catch (err) {
	  console.log("Error getting todos");
	  console.log(err);
	  return false;
	}
  }
  

  async function createTodo(postData) {
	let createTodoSQL = `
	  INSERT INTO todo
	  (description, frn_user_id)
	  VALUES
	  (:description, (
		SELECT user_id
		FROM user
		WHERE email = :user
	  ));
	`;
	
	let params = {
	  description: postData.description,
	  user: postData.user
	}
	
	try {
	  const results = await database.query(createTodoSQL, params);
	
	  console.log("Successfully created todo");
	  console.log(results[0]);
	  return true;
	} catch (err) {
	  console.log("Error inserting todo");
	  console.log(err);
	  return false;
	}
  }
  
  
  
  
module.exports = {createUser, getUsers, getUser, getTodos,  createTodo, getTodoAdmin};