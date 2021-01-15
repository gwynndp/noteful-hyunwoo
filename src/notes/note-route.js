/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const path = require('path');
const express = require('express');
const xss = require('xss');
const notesService = require('./note-service');

const NoteRoute = express.Router();
const jsonParser = express.json();

const serializedNote = note => ({
    note_id : note.note_id,
    note_name : xss(note.note_name),
    content : xss(note.content),
    folder_id : note.folder_id,
    modified : note.modified,
});

NoteRoute
.route('/')
.get((req, res, next) => {
    const db = req.app.get('db');
    notesService.getAllNotes(db)
        .then(notes => {
            res.json(notes.map(serializedNote))
        })
        .catch(next)
})
.post(jsonParser, (req, res, next) => {
    const {note_name, content, folder_id} = req.body;
    const newNote = {note_name, content, folder_id};
    for(const [key, value] of Object.entries(newNote))
    if(value ===null)
    return res.status(400).json({
        error : {message : `Missing '${key}' in requset body`}
    })
    //newNote.modified  = modified;

    notesService.insertNote(
        req.app.get('db'),
        newNote
    )
    .then(note => {
        res.status(201)
            .location(path.posix.join(req.originalUrl, `/${note.id}`))
            .json(serializedNote(note))
    })
    .catch(next)
})

NoteRoute
.route('/:note_id')
.all((req, res, next) => {
    notesService.getNoteById(
        req.app.get('db'),
        req.params.note_id
    )
    .then(note => {
        if(!note){
            return res.status(404).json({
                error : {message : `Note doesn't exist`}
            })
        }
        res.note = note;
        next()
    })
    .catch(next)
})
.get((req, res, next) => {
    res.json(serializedNote(res.note))
})
.delete((req, res, next) => {
    notesService.deleteNote(
        req.app.get('db'),
        req.params.note_id
    )
    .then(() => {
        res.status(204).end()
    })
    .catch(next)
})
.patch(jsonParser, (req, res, next) => {
    const {note_name, content, folder_id} = req.body;
    const noteToUpdate = {note_name, content, folder_id};


    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if(numberOfValues === 0)
    return res.status(400).json({
        error : {message: `Request body must contain either 'note_name' , 'contet' or 'folder_id'` }
    })
    notesService.updateNote(
        req.app.get('db'),
        req.params.note_id,
        noteToUpdate
    )
    .then(() => {
        res.status(204).end()
    })
    .catch(next)
})

module.exports = NoteRoute;