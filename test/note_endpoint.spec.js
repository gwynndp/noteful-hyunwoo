/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const {expect} = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { post } = require('../src/app');
const app = require('../src/app');
const { makeFolderArray } = require('./folder.fixture');
const {makeNoteArray}  = require('./note.fixture');

describe('Notes Endpoints', ()=> {
    let db ;

    before('make knex instance' , ()=>{
        db = knex({
            client: 'pg',
            connection : process.env.TEST_DB_URL,
        });
        app.set('db', db)
    });
    after('disconnect from db', () => db.destroy())
    before('clean the table', ()=> db.raw(`TRUNCATE folders, notes RESTART IDENTITY CASCADE`))
    afterEach('cleanup',()=> db.raw(`TRUNCATE folders, notes RESTART IDENTITY CASCADE`))

    describe(`GET /api/notes`, ()=> {
        context(`Given no notes` , () => {
            it(`Responds with 200 and an empty list`, ()=>{
                return supertest(app)
                    .get(`/api/notes`)
                    .expect(200, [])
            })
        })
        context(`Given there are notes in the database` , () => {
            const testNote = makeNoteArray();
            const testFolder = makeFolderArray();

            beforeEach('insert notes' , ()=> {
                return db
                    .into('folders')
                    .insert(testFolder)
                    .then(()=> {
                    return db
                    .into('notes')
                    .insert(testNote)
                })
            });
            it(`Responds with 200 and all of the notes` , () => {
                return supertest(app)
                    .get(`/api/notes`)
                    .expect(200, testNote)
            });
            it(`GET api/notes/:note_id responds with 200 and the specified note` , () => {
                const noteId = 2;
                const expectedNote = testNote[noteId-1]
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(200, expectedNote)
            })
        });
    });
    describe(`POST /api/notes` , ()=> {
        const testFolder = makeFolderArray();
        beforeEach(`insert malicious folder` , () => {
            return db
                .into('folders')
                .insert(testFolder)
        })

        it(`Create a note, responding with 201 and the new note` , function(){
            this.retries(3)
            const newNote = {
            note_name : 'z',
            content : 'z',
            folder_id : 2
            }
            return supertest(app)
                .post(`/api/notes`)
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.note_name).to.eql(newNote.note_name)
                    expect(res.body.content).to.eql(newNote.content)
                    expect(res.body.folder_id).to.eql(newNote.folder_id)
                })
                .then(postRes =>
                    supertest(app)
                    .get(`/api/notes/${postRes.body.id}`)
                    )
        })
    })
    describe(`DETELE /api/notes/:note_id` , () => {
        context('Given no notes' , () => {
            it('Responds with 404' , () => {
                const noteId = 123456;
                return supertest(app)
                .delete(`/api/notes/${noteId}`)
                .expect(404,
                    {
                        error: {message: `Note doesn't exist`}});
            });
        })
        context(`Given there are notes in the database` , () => {
            const testNote = makeNoteArray();
            const testFolder = makeFolderArray();

            beforeEach('insert notes' , ()=> {
                return db
                    .into('folders')
                    .insert(testFolder)
                    .then(()=> {
                    return db
                    .into('notes')
                    .insert(testNote)
                })
            });
            it(`Responds with 204 and removes the notes` , ()=> {
                const idToRemove = 2;
                const expectedNote = testNote.filter(note => note.note_id !==idToRemove)
                return supertest(app)
                .delete(`/api/notes/${idToRemove}`)
                .expect(204)
                .then(res => supertest(app)
                            .get(`/api/notes`)
                            .expect(expectedNote)
                )
            })
        })
    })
    describe(`PATCH /api/notes/:note_id` , ()=> {
        context(`Given no notes` , () => {
            it(`Responds with 404` , () => {
                const noteId = 123456;
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .expect(404, {
                        error : {message : `Note doesn't exist`}
                    })
            })
        })
        context(`Given there are notes in the database` , () => {
            const testNote = makeNoteArray();
            const testFolder = makeFolderArray();

            beforeEach('insert notes' , ()=> {
                return db
                    .into('folders')
                    .insert(testFolder)
                    .then(()=> {
                    return db
                    .into('notes')
                    .insert(testNote)
                })
            });
            it(`Responds with 204 and update the note` , () => {
                const idToUpdate = 1;
                const updateNote = {
                    note_name : 'z',
                    content : 'z',
                    folder_id : 2
                }
                const expectedNote = {
                    ...testNote[idToUpdate -1],
                    ...updateNote
                }
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send(updateNote)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/notes/${idToUpdate}`)
                        .expect(expectedNote)
                    )
            })
            it(`Responds with 400 when no required fields supplied` , () => {
                const idToUpdate = 1;
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({irrelevantField : 'foo'})
                    .expect(400, {
                        error : {message : `Request body must contain either 'note_name' , 'contet' or 'folder_id'`}
                    })
            })
            it(`Responds with 204 when updating only a subset of fields` , () => {
                const idToUpdate = 1;
                const updateNote = {
                    note_name : 'z',
                    content : 'z',
                    folder_id : 2
                }
                const expectedNote = {
                    ...testNote[idToUpdate -1]
                    , ... updateNote
                }
                return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .send({
                        ...updateNote,
                        fieldToIgnore : `Should not be in GET response`
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                        .get(`/api/notes/${idToUpdate}`)
                        .expect(expectedNote)
                        )
            })
        })
    })


})