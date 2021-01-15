/* eslint-disable no-undef */
require('dotenv').config();

module.exports = {
    "migrationsDirectory" : "migrations",
    "driver" : "pg",
    "ssl": process.env.NODE_ENV === 'production',
    "connectionString" : (process.env.NODE_ENV === 'test')
                        ?process.env.TEST_DATABASE_URL
                        :process.env.DATABASE_URL,
    
                    

}