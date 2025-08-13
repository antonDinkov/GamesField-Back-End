const { getById, getByIdKey } = require("../services/data");

function isUser() {
    return function (req, res, next) {
        if (!req.user) {
            res.redirect('/login');
        } else {
            next();
        }
    }
};

function isGuest() {
    return function (req, res, next) {
        if (req.user) {
            res.redirect('/');
        } else {
            next();
        }
    }
};

function isOwner() {
    return async function (req, res, next) {
        try {
            if (!req.user) {
                return res.redirect('/login');
            }

            const post = await getById(req.params.id);
            if (!post) {
                return res.redirect('/404');
            }

            const ownerId = post.owner.toString();

            if (req.user._id == ownerId) {
                return next();
            } else {
                return res.redirect(`/catalog/${req.params.id}`);
            }
        } catch (err) {
            console.error('Middleware error:', err);
            return res.redirect('/500');
        }
    }
};

function hasInteracted() {
    return async function (req, res, next) {
        try {
            if (req.body.interaction === 'views' || req.body.interaction === 'played') {
                next();
            } else {
                if (!req.user._id) {
                    throw new Error("You need to be logged in");
                };

                const post = await getById(req.params.id);//тази проверка не я бях направил
                if (req.user._id === post.owner.toString() && req.body.interaction !== 'lastPlayed') {
                    throw new Error("You can not like your own post");
                }

                //по погрешка getByIdKey го бях направил винаги да ми връща масив ако не намери ключа и затова не ми хвърляше грешка при грешен ключ и не съм се усетил да актуализирам името на ключа!
                const allInteractors = await getByIdKey(req.params.id, 'likes');//бях забравил да актуализирам името на ключа

                const allInteractorsArray = allInteractors.map(int => int.toString());

                const hasInteracted = allInteractorsArray.includes(req.user._id.toString());

                if (!hasInteracted) {
                    next();
                } else {
                    throw new Error("You have already interacted");
                }
            }

        } catch (err) {
            console.error('Interaction guard error: ', err.message);

            res.redirect(`/catalog/${req.params.id}`);
        }
    }
}

module.exports = {
    isUser,
    isGuest,
    isOwner,
    hasInteracted
}
