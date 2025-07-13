const { invalidPathRouter } = require("../controllers/404");
const { homeRouter } = require("../controllers/home");
const { userRouter } = require("../controllers/user");
//TODO import routers

function configRoutes(app) {
    try {
        app.use(homeRouter);
        app.use(userRouter);
        //TODO register routers
        app.use(invalidPathRouter);
    } catch (err) {
        console.log("Route config error:", err);
        throw err;
    }

};

module.exports = { configRoutes };