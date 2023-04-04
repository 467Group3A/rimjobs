const express = require('express');
const router = express.Router();
const queryLegacy = require('../services/queryLegacy');

// GET legacy parts
router.get('/', async function (req, res, next) {
    try {
        res.json(await queryLegacy.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting legacy parts`, err.message);
        next(err);
    }
});

module.exports = router;