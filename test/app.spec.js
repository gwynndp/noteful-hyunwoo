/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const app = require('../src/app')

describe('App', () => {
  it('GET / responds with 200 containing "Hello, boilerplate!"', () => {
    return supertest(app)
      .get('/')
      .expect(200, 'Hello, boilerplate!')
  })
})