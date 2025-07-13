const { Router } = require('express');
const invalidPathRouter = Router();

invalidPathRouter.all('/*splat', (req, res) => {
    res.status(404).render('404', { title: 'Error' });
});

module.exports = { invalidPathRouter };