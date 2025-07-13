function parseError(err) {
    if (err instanceof Error) {
        if (!err.errors) {
            //generic error
            err.errors = [err.message];
        } else {
            //Mongoose validation error
            const error = new Error('Input validation error');
            error.errors = Object.fromEntries(Object.values(err.errors).map(e => [e.path, e.message]));

            return error;
        }
    } else if (Array.isArray(err)) {
        //Express-validator error array
        const error = new Error('Input validation error');
        error.errors = Object.fromEntries(err.map(e => [e.path, e.msg]));

        return error;
    }

    return err;

    /* if (err instanceof Error) {
        if (!err.errors) {
            // Generic error
            return [err.message];
        } else {
            // Mongoose validation error
            return Object.values(err.errors).map(e => e.message);
        }
    } else if (Array.isArray(err)) {
        // express-validator errors
        return err.map(e => e.msg);
    }

    return [err.toString()]; */
};

module.exports = { parseError };