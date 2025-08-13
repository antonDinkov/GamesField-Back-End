const { Router } = require("express");
const { isUser, isOwner, hasInteracted } = require("../middlewares/guards");
const { body, validationResult } = require("express-validator");
const { parseError } = require("../util");
const { create, getAll, getById, update, deleteById, getLastThree, interact, getTopFivePlayed, searchByKeyword } = require("../services/data");
const { getUserById } = require("../services/user");

//TODO replace with real router according to exam description
const homeRouter = Router();

homeRouter.get('/', async (req, res) => {
    //This code creates a token and saves it in a cookie
    //const result = await login('John', '123456');
    //const token = createToken(result);
    //res.cookie('token', token)

    const topFive = await getTopFivePlayed();

    res.json(topFive);
});

homeRouter.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
});

homeRouter.get('/create', isUser(), (req, res) => {
    res.render('create', { title: 'Create' });
});
homeRouter.post('/create', isUser(),
    body('name').trim().isLength({ min: 2 }).withMessage('The name should be at least 2 characters'),
    body('manufacturer').trim().isLength({ min: 3 }).withMessage('The manufacturer should be at least 3 characters'),
    body('genre').trim().notEmpty().withMessage('Genre is required'),
    body('image').trim().isURL({ require_protocol: true }).withMessage('Image must start with http:// or https://'),
    body('iframeUrl').trim().isURL({ require_protocol: true }).withMessage('Game URL must start with http:// or https://'),
    body('instructions').trim().isLength({ min: 5 }).withMessage('Instructions should be at least 5 characters'),
    body('description').trim().isLength({ min: 5, max: 500 }).withMessage('Description should be between 5 and 5000 characters'),
    async (req, res) => {
        const { name, manufacturer, genre, image, iframeUrl, instructions, description } = req.body;
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                throw validation.array();
            }

            const authorId = req.user._id;

            const result = await create(req.body, authorId);

            return res.status(201).json({ message: 'Game created successfully', game: result });
        } catch (err) {
            console.error('Create error:', err);
            return res.status(500).json({ errors: parseError(err).errors || ['Unexpected server error.'] });
        }
    });

homeRouter.get('/catalog', async (req, res) => {
    const posts = await getAll();
    res.json(posts);
});

homeRouter.get('/id/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const game = await getById(id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }


})

homeRouter.get('/catalog/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const post = await getById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        };
        const user = await getUserById(post.owner.toString());
        const username = user.firstName;
        const interactorsNames = post.likes.join(', ');
        let interactionCount = post.likes.length;


        const isLoggedIn = Boolean(req.user);

        const isAuthor = req.user?._id.toString() == post.owner.toString();

        const hasInteracted = Boolean(post.likes.find(id => id.toString() == req.user?._id/* _id */.toString()));

        res.json({ post, username, interactionCount, isLoggedIn, isAuthor, hasInteracted, interactorsNames, title: `Details ${post.name}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


homeRouter.get('/catalog/:id/edit', isOwner(), async (req, res) => {

    try {
        const post = await getById(req.params.id);

        if (!post) {
            console.log('Blocked');

            res.render('404');
            return;
        };

        res.render('edit', { post, title: `Edit ${post.brand}` });
    } catch (err) {
        console.error('Error loading edit form: ', err);
        res.redirect('/404');
    }
});
homeRouter.post('/catalog/:id/edit', isOwner(),
    body('name').trim().isLength({ min: 2 }).withMessage('The name should be at least 2 characters'),
    body('manufacturer').trim().isLength({ min: 3 }).withMessage('The manufacturer should be at least 3 characters'),
    body('genre').trim().notEmpty().withMessage('Genre is required'),
    body('image').trim().isURL({ require_protocol: true }).withMessage('Image must start with http:// or https://'),
    body('iframeUrl').trim().isURL({ require_protocol: true }).withMessage('Game URL must start with http:// or https://'),
    body('instructions').trim().isLength({ min: 5 }).withMessage('Instructions should be at least 5 characters'),
    body('description').trim().isLength({ min: 5, max: 500 }).withMessage('Description should be between 5 and 5000 characters'),
    async (req, res) => {
        const post = await getById(req.params.id);
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                throw validation.array();
            }

            if (!post) {
                return res.status(404).json({ error: 'Game not found'});
            };

            const newRecord = await update(req.params.id, req.user._id, req.body);

            return res.status(200).json({ message: 'Game updated successfully', game: newRecord });
        } catch (err) {
            console.error('Edit error:', err);
            return res.status(500).json({ errors: parseError(err).errors || ['Unexpected server error.'] });
        }
    });

homeRouter.delete('/catalog/:id', isOwner(), async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user._id;
        await deleteById(id, userId);
        res.status(200).json({ success: true, message: 'The game is successfully deleted' });
    } catch (err) {
        console.error('Error occurred: ', err);
        res.status(400).json({ success: false, error: err.message || 'Unknown error' });
    }
});

homeRouter.post('/catalog/:id/interact', hasInteracted(), async (req, res) => {
    try {
        const gameInfo = await interact(
            req.params.id, 
            req.user._id, 
            req.body.interaction
        );
        res.status(200).json(gameInfo);
    } catch (err) {
        console.error('Error occurred: ', err);
        res.status(400).json({ success: false, error: err.message || 'Unknown error' });
    }
});

/* homeRouter.post('/catalog/:id/interact', hasInteracted(), async (req, res) => {
    try {
        const gameInfo = await interact(req.params.id, req.body.interaction ==='likes' || req.body.interaction ==='lastPlayed' || req.body.interaction ==='played'? req.user._id : undefined , req.body.interaction);
        res.status(200).json(gameInfo);
    } catch (err) {
        console.error('Error occurred: ', err);
        res.status(400).json({ success: false, error: err.message || 'Unknown error' });
    }
}); */

homeRouter.get('/profile', isUser(), async (req, res) => {
    const { _id, firstName, email } = req.user;
    const posts = await getAll();
    const ownerTo = posts.filter(p => p.owner.toString() == _id.toString());
    console.log('User is owner to: ', ownerTo);
    const ownerToResult = ownerTo.length > 0 ? ownerTo : null;
    const ownerToCount = ownerTo.length;

    const interactedWith = posts.filter((p) => {
        const array = p.likes.map(p => p.toString());
        return array.includes(/* _id */firstName.toString())
    });
    console.log('User has interacted with: ', interactedWith);
    const interactedWithResult = interactedWith.length > 0 ? interactedWith : null;
    const inteactedWithCount = interactedWith.length;

    res.render('profile', { title: 'Profile', _id, firstName, email, ownerToResult, ownerToCount, interactedWithResult, inteactedWithCount });
});

homeRouter.get('/search', async (req, res) => {
    const { search = '', by = 'name' } = req.query;

    try {
        if (!['name', 'genre'].includes(by)) {
            return res.status(400).json({ error: 'Invalid search type. Use "name" or "genre".' });
        }

        const result = await searchByKeyword(search, by);
        res.status(200).json({ result, search, by });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = { homeRouter }