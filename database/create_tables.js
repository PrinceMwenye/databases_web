const database = include('databaseConnection');

async function createTables() {
    let createUserTypeSQL = `
        CREATE TABLE IF NOT EXISTS user_type (
            user_type_id INT NOT NULL AUTO_INCREMENT,
            user_type_name VARCHAR(10) NOT NULL,
            PRIMARY KEY (user_type_id)
        );
    `;
    
    let createUserSQL = `
        CREATE TABLE IF NOT EXISTS user (
            user_id INT NOT NULL AUTO_INCREMENT,
            username VARCHAR(25) NOT NULL,
            email VARCHAR(30) NOT NULL,
            password VARCHAR(100) NOT NULL,
            frn_user_type_id INT NOT NULL,
            PRIMARY KEY (user_id),
            UNIQUE INDEX unique_username (username ASC) VISIBLE,
            FOREIGN KEY (frn_user_type_id) REFERENCES user_type (user_type_id)
        );
    `;
    
    let createTodoSQL = `
        CREATE TABLE IF NOT EXISTS todo (
            todo_id INT NOT NULL AUTO_INCREMENT,
            description VARCHAR(100) NOT NULL,
            frn_user_id INT NOT NULL,
            PRIMARY KEY (todo_id),
            FOREIGN KEY (frn_user_id) REFERENCES user (user_id)
        );
    `;

    try {
        const userTypeResults = await database.query(createUserTypeSQL);
        const userResults = await database.query(createUserSQL);
        const todoResults = await database.query(createTodoSQL);

        console.log("Successfully created tables");
        console.log(userResults[0]);
        console.log(userTypeResults[0]);
        console.log(todoResults[0]);

        return true;
    } catch (err) {
        console.log("Error Creating tables");
        console.log(err);
        return false;
    }
}

module.exports = { createTables };
