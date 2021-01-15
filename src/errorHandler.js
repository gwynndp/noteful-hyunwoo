/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
      response = { message: error.message, error }
      // response = { error: { message: 'server error' } }
    } else {
      console.error(error)
      response = { message: error.message, error }
    }
    res.status(500).json(response)
  }

  module.exports = errorHandler;