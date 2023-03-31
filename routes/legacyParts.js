const express = require('express');
const router = express.Router();
const programmingLanguages = require('../services/queryLegacy');

// GET legacy parts
router.get('/', async function (req, res, next) {
    try {
        res.json(await programmingLanguages.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting legacy parts`, err.message);
        next(err);
    }
});

module.exports = router;