// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      database: 'fcdb',
      user:     'postgres',
      password: '1234'
    },
    migrations:{
      directory: './src/database/migrations'
    },
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'fcdb',
      user:     'postgres',
      password: '1234'
    },
    migrations:{
      directory: './src/database/migrations'
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'fcdb',
      user:     'postgres',
      password: '1234'
    },
    migrations:{
      directory: './src/database/migrations'
    },
  },

};
