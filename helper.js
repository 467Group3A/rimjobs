// This file contains the helper functions for the application
// it gets the offset for the pagination
function getOffset(currentPage = 1, listPerPage) {
    return (currentPage - 1) * [listPerPage];
}

// it returns empty array if the rows is empty
function emptyOrRows(rows) {
    if (!rows) {
        return [];
    }
    return rows;
}

module.exports = {
    getOffset,
    emptyOrRows
}