/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const {makeFolderArray} = require('./folder.fixture');



describe('Folders Endpoints', ()=> {
    let db;

    before('make knex instance', ()=>{
        db = knex({
            client : 'pg',
            connection : process.env.TEST_DB_URL,
        });
        app.set('db', db)
    });

    after('disconnect from db', () => db.destroy())
    before('clean the table', ()=> db.raw(`TRUNCATE folders, notes RESTART IDENTITY CASCADE`))
    afterEach('cleanup',()=> db.raw(`TRUNCATE folders, notes RESTART IDENTITY CASCADE`))

    describe(`GET /api/folders` , ()=> {
        context('Given no folders', ()=> {
            it(`responds with 200 and an empty list` , ()=> {
                return supertest(app)
                    .get(`/api/folders`)
                    .expect(200, [])
            })
        })
        context(`Given there are folders in the database` , ()=> {
            const testFolder = makeFolderArray();

            beforeEach('insert folders', ()=>{
                return db
                    .into('folders')
                    .insert(testFolder)
            })
        it('responds with 200 and all of the folders' , ()=>{
            return supertest(app)
            .get('/api/folders')
            .expect(200, testFolder)
        });
        it('GET /api/folders/folder_id responds with 200 and the specified folder' , ()=> {
            const folderId = 2;
            const expectedFolder= testFolder[folderId -1]
            return supertest(app)
                .get(`/api/folders/${folderId}`)
                .expect(200, expectedFolder)
        })

      });
    });
    describe('POST /api/folders' , () => {
        it('create a folder, respondig with 201 and the new folder' , () => {
            const newFolder={
                folder_name : 'D'
            }
            
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.folder_name).to.eql(newFolder.folder_name)
                })
                .then(postRes => 
                    supertest(app)
                    .get(`/api/folders/${postRes.body.id}`)
                    )
        })
    /*    const requiredField = ['folder_name'];

        requiredField.forEach(field=>{
            const newFolder = {
                folder_name : 'D'
            }
           it(`responds with 400 and an error message when the '${field}' is missing`, ()=>{
               delete newFolder[field]
               return supertest(app)
                    .post(`/api/folders`)
                    .send(newFolder)
                    .expect(400, {
                        error: {message : `Missing '${field}' in request body`}
                    })
           })
        })*/
    })
    describe(`Delete /api/folders/:folder_id`, () => {
        context(`Given no folders` , () => {
            it('responds with 404' , ()=> {
                const folderId = 123456;
                return supertest(app)
                        .delete(`/api/folders/${folderId}`)
                        .expect(404, {error : {message: `Folder doesn't exist`}})
            });
        });
        context(`Given there are folders in the database` , () => {
            const testFolder = makeFolderArray();
            beforeEach('insert folders', ()=>{
                return db
                    .into('folders')
                    .insert(testFolder)
            });
        it(`Responds with 204 and removes the folder` , ()=>{
            const idToRemove = 2;
            const expectedFolder = testFolder.filter(folder => folder.folder_id !==idToRemove)
            return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .expect(204)
                    .then(res => supertest(app)
                                .get('/api/folders')
                                .expect(expectedFolder)
                                )
        })    
        })
    })
    describe(`PATCH /api/folders/:folder_id` , () => {
        context(`Given no folder` , () => {
            it(`responds with 404` , () => {
                const folderId = 123456;
                return supertest(app)
                        .patch(`/api/folders/${folderId}`)
                        .expect(404, {
                            error: {message : `Folder doesn't exist`}
                        })
            })
        })
        context(`Given there are folders in the database` , ()=> {
            const testFolder = makeFolderArray();
            beforeEach('insert folders', ()=>{
                return db
                    .into('folders')
                    .insert(testFolder)
            });
        it(`Responds with 204 and update the folder` , () => {
            const idToUpdate = 1;
            const updateFolder = {
                folder_name : 'a'
            }
            const expectedFolder = {
                ...testFolder[idToUpdate -1],
                ...updateFolder
            }
            return supertest(app)
                .patch(`/api/folders/${idToUpdate}`)
                .send(updateFolder)
                .expect(204)
                .then(res => 
                    supertest(app)
                    .get(`/api/folders/${idToUpdate}`)
                    .expect(expectedFolder)
                    )
            })
        it(`Responds with 400 when no required fields supplied` , () => {
            const idToUpdate = 1;
            return supertest(app)  
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({irrelevantField : 'foo'})
                    .expect(400, {
                        error : {message: `Request body must contain folder_name`}
                    })
            })
        it(`Responds with 204 when updating only a subset of fields` , ()=>{
            const idToUpdate = 1;
            const updateFolder ={
                folder_name : 'Z'
            }
            const expectedFolder = {
                ...testFolder[idToUpdate -1]
                , ...updateFolder
            }

            return supertest(app)  
                .patch(`/api/folders/${idToUpdate}`)
                .send({
                    ...updateFolder,
                    fieldToIgnore : `Should not be in GET response`
                })
                .expect(204)
                .then(res => 
                    supertest(app)
                    .get(`/api/folders/${idToUpdate}`)
                    .expect(expectedFolder)
                    )
        })
        })
    })
})