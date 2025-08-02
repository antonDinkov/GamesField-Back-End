const { Schema, model, Types } = require('mongoose');

//TODO replace with data model from exam description

const dataSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    manufacturer: {
        type: String,
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    views: {
        type: Number,
        required: true,
        default:0
    },
    played: {
        type: Number,
        required: true,
        default: 0
    },
    image: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^https?:\/\//.test(v),
            message: 'Image URL must start with http:// or https://'
        }
    },
    iframeUrl: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^https?:\/\//.test(v),
            message: 'The Game URL must start with http:// or https://'
        }
    },
    instructions: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    likes: {
        type: [{
                type: Types.ObjectId,
                ref: 'User'
            }]
    },
    owner: {
        type: Types.ObjectId,
        ref: 'User'
    }
});

const Data = model('Data', dataSchema);

module.exports = { Data };
