/* eslint-disable no-undef */
const foldersService = {
    getAllFolders(knex){
        return knex
            .select('*')
            .from('folders');
    },
    insertFolders(knex, newFolder){
        return knex
            .insert(newFolder)
            .into('folders')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getFolderById(knex, id){
        return knex
            .from('folders')
            .where('folder_id' , id)
            .first()
    },
    deleteFolder(knex, id){
        return knex('folders')
            .where('folder_id', id)
            .delete()
    },
    updateFolder(knex, id, updateFolder){
        return knex('folders')
            .where('folder_id' , id)
            .update(updateFolder)
    }
}

module.exports = foldersService;