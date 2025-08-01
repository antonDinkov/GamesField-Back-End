const { Router } = require("express");
const { isUser, isOwner, hasInteracted } = require("../middlewares/guards");
const { body, validationResult } = require("express-validator");
const { parseError } = require("../util");
const { create, getAll, getById, update, deleteById, getLastThree, interact, getTopFivePlayed } = require("../services/data");
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
    body('model').trim().isLength({ min: 2 }).withMessage('The Model should be atleast 2 characters'),
    body('manufacturer').trim().isLength({ min: 3 }).withMessage('The Manufacturer should be atleast 3 characters long'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https:// and must be a valid URL'),
    body('engine').trim().isLength({ min: 3 }).withMessage('The Engine should be atleast 3 characters long'),
    body('topSpeed').trim().notEmpty().withMessage('Topspeed is required').bail().isFloat({ min: 10 }).withMessage('Top Speed should be atleast 2 digit number'),
    body('description').trim().isLength({ min: 5, max: 500 }).withMessage('The Description should be between 5 and 500 characters long'),
    async (req, res) => {
        const { model, manufacturer, image, engine, topSpeed, description } = req.body;
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                throw validation.array();
            }

            const authorId = req.user._id;

            const result = await create(req.body, authorId);

            res.redirect('/catalog');
        } catch (err) {
            res.render('create', { data: { model, manufacturer, image, engine, topSpeed, description }, errors: parseError(err).errors })
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

        const hasInteracted = Boolean(post.likes.find(id => id.toString() == req.user?.email/* _id */.toString()));

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
    body('model').trim().isLength({ min: 2 }).withMessage('The Model should be atleast 2 characters'),
    body('manufacturer').trim().isLength({ min: 3 }).withMessage('The Manufacturer should be atleast 3 characters long'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https:// and must be a valid URL'),
    body('engine').trim().isLength({ min: 3 }).withMessage('The Engine should be atleast 3 characters long'),
    body('topSpeed').trim().notEmpty().withMessage('Topspeed is required').bail().isFloat({ min: 10 }).withMessage('Top Speed should be atleast 2 digit number'),
    body('description').trim().isLength({ min: 5, max: 500 }).withMessage('The Description should be between 5 and 500 characters long'),
    async (req, res) => {
        const post = await getById(req.params.id);
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                throw validation.array();
            }

            if (!post) {
                res.render('404');
                return;
            };

            const newRecord = await update(req.params.id, req.user._id, req.body);

            res.redirect(`/catalog/${req.params.id}`);
        } catch (err) {

            res.render('edit', { post, errors: parseError(err).errors });
        }
    });

homeRouter.get('/catalog/:id/delete', isOwner(), async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user._id;
        await deleteById(id, userId);
        res.redirect('/catalog');
    } catch (err) {
        res.render('404', { title: 'Error' });
    }
});

homeRouter.get('/catalog/:id/interact', hasInteracted(), async (req, res) => {
    try {
        await interact(req.params.id, req.user.email,/* req.user._id, */ "likes");
        res.redirect(`/catalog/${req.params.id}`);
    } catch (err) {
        res.render('404', { title: 'Error' });
    }
});

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

module.exports = { homeRouter }