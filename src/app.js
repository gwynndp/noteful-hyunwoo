/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {NODE_ENV} = require('./config');
const errorHandler = require('./errorHandler')
//const validateBearerToken = require('./validateBearerToken')
const logger = require('./logger');
const folderRouter = require('./folders/folder-route')
const NoteRoute = require('./notes/note-route')

const app = express()
//pipeline begins
//standard middleware
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
//route
app.get('/', (req, res) => {
    res.send('Hello, boilerplate!');
})

app.use('/api/folders' , folderRouter);
app.use('/api/notes', NoteRoute);
//app.use(validateBearerToken);

//error handler
//app.use(errorHandler);

module.exports = app