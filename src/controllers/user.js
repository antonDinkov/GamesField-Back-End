const { Router } = require('express');
const { register, login } = require('../services/user');
const { isGuest, isUser } = require('../middlewares/guards');
const { createToken } = require('../services/jwt');
const { body, validationResult } = require('express-validator');
const { parseError } = require('../util');

const userRouter = Router();

userRouter.get('/register', isGuest(), (req, res) => {
    res.render('register', { title: 'Register'});
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
                throw validation.array();
            };
            
            const userData = await register(req.body.email, req.body.firstName, req.body.lastName, req.body.password);

            
            const token = createToken(userData);
            res.cookie('token', token);

            res.redirect('/');
        } catch (err) {
            res.render('register', { data: { firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email }, errors: parseError(err).errors });
        }

    });

userRouter.get('/login', isGuest(), (req, res) => {
    res.render('login', { title: 'Login'});
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

            res.cookie('token', token);

            res.redirect('/');
        } catch (err) {
            res.render('login', { data: { email: req.body.email }, errors: parseError(err).errors });
        }
    });


userRouter.get('/logout', isUser(), (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = { userRouter };