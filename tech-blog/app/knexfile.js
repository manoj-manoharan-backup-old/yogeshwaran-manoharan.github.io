// Update with your config settings.

require('dotenv').config({ path: './.env' });

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host     : process.env.DB_MYSQL_SERVER,
      port     : process.env.DB_MYSQL_DB_PORT,
      user     : process.env.DB_MYSQL_USER_NAME,
      password : process.env.DB_MYSQL_PASSWORD,
      database : process.env.DB_MYSQL_DB_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migration',
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'mysql',
    connection: {
      host     : process.env.STAGE_DB_MYSQL_SERVER,
      port     : process.env.STAGE_DB_MYSQL_DB_PORT,
      user     : process.env.STAGE_DB_MYSQL_USER_NAME,
      password : process.env.STAGE_DB_MYSQL_PASSWORD,
      database : process.env.STAGE_DB_MYSQL_DB_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migration',
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'mysql',
    connection: {
      host     : process.env.LIVE_DB_MYSQL_SERVER,
      port     : process.env.LIVE_DB_MYSQL_DB_PORT,
      user     : process.env.LIVE_DB_MYSQL_USER_NAME,
      password : process.env.LIVE_DB_MYSQL_PASSWORD,
      database : process.env.LIVE_DB_MYSQL_DB_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migration',
      tableName: 'knex_migrations'
    }
  }

};
