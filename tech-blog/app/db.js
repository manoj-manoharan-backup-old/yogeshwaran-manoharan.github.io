const knex = require('knex');
const connection = {
    host     : process.env.DB_MYSQL_SERVER,
    port     : process.env.DB_MYSQL_DB_PORT,
    user     : process.env.DB_MYSQL_USER_NAME,
    password : process.env.DB_MYSQL_PASSWORD,
    database : process.env.DB_MYSQL_DB_NAME,
    dateStrings : true
};

const pool = { min: 1, max: 20 };

const knexdb = knex({ client: 'mysql', connection, pool });

module.exports = {
    knex: knexdb
};