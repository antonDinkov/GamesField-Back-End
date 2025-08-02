const { Router } = require('express');
const { register, login, getUserById } = require('../services/user');
const { isGuest, isUser } = require('../middlewares/guards');
const { createToken } = require('../services/jwt');
const { body, validationResult } = require('express-validator');
const { parseError } = require('../util');

const userRouter = Router();

userRouter.get('/register', isGuest(), (req, res) => {
    res.render('register', { title: 'Register' });
});
userRouter.post('/register', isGuest(),
    body('firstName').trim().isLength({ min: 3 }).withMessage('Firstname must be atleast 3 characters long'),
    body('lastName').trim().isLength({ min: 3 }).withMessage('Lastname must be atleast 3 characters long'),
    body('email').trim().isEmail().isLength({ min: 10 }).withMessage('Email must be atleast 10 characters long'),
    body('password').trim().isLength({ min: 4 }).withMessage('Password must be atleast 4 characters long'),
    body('repass').trim().custom((value, { req }) => value == req.body.password).withMessage('Password don\'t match'),
    async (req, res) => {
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                console.log('Validation errors:', validation.array());
                throw validation.array();
            };

            const userData = await register(req.body.email, req.body.firstName, req.body.lastName, req.body.password);

            const token = createToken(userData);
            res.cookie('token', token);

            res.status(201).json({ message: 'User registered successfully', user: userData });
        } catch (err) {
            console.error('Error in /register:', err);
            res.status(500).json({ errors: parseError(err).errors });
        }

    });

userRouter.get('/login', isGuest(), (req, res) => {
    res.render('login', { title: 'Login' });
});
userRouter.post('/login', isGuest(),
    body('email').trim().isLength({ min: 10 }).withMessage('Email must be atleast 10 characters long'),
    body('password').trim().isLength({ min: 4 }).withMessage('Password must be atleast 4 characters long'),
    async (req, res) => {
        try {
            const validation = validationResult(req);
            if (!validation.isEmpty()) {
                throw validation.array();
            }

            const userData = await login(req.body.email, req.body.password);

            const token = createToken(userData);

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,        // задължително за https
                sameSite: 'none'
            });

            res.status(200).json({ message: 'User logged in successfully', user: userData });
        } catch (err) {
            res.status(500).json({ errors: parseError(err).errors });
        }
    });


userRouter.get('/logout', isUser(), (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    res.status(200).json({ message: 'Logout successful' });
});

userRouter.get('/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const userData = getUserById(req.user._id)
        res.json({ user: userData });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
})

module.exports = { userRouter };