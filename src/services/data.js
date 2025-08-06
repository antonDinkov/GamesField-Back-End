const { Data } = require('../models/Data');

//TODO replace with real data service according to exam description

async function getAll() {
    return Data.find().lean();
};

/* async function getLastThree() {
    return Data.find().sort({ _id: -1 }).limit(3).lean(); //последните три регистрирани продукта
}; */

async function getTopFivePlayed() {
  return Data.find()
    .sort({ played: -1 })
    .limit(5)
    .lean();
}

async function getById(id) {
    return Data.findById(id).lean();
};

async function getByIdKey(id, key) {
    const result = await Data.findById(id).select(key).lean();
    return result?.[key];
};

async function create(data, authorId) {
    const record = new Data({
        name: data.name,
        manufacturer: data.manufacturer,
        genre: data.genre,
        image: data.image,
        iframeUrl: data.iframeUrl,
        instructions: data.instructions,
        description: data.description,
        likes: [],
        views: 0,
        played: 0,
        owner: authorId
    });

    await record.save();

    return record;
};

async function update(id, userId, newData) {
    const record = await Data.findById(id);

    if (!record) {
        throw new Error("Record not found " + id);
    };

    if (record.owner.toString() != userId) {
        throw new Error("Access denied");
    }

    //TODO replace with real properties
        record.name = newData.name,
        record.manufacturer = newData.manufacturer,
        record.genre = newData.genre,
        record.image = newData.image,
        record.iframeUrl = newData.iframeUrl,
        record.instructions = newData.instructions,
        record.description = newData.description,

    await record.save();

    return record;
};

async function interact(id, userId, interactorsListName) {
    const record = await Data.findById(id);

    if (!record) {
        throw new Error("Record not found " + id);
    };

    //TODO replace with real properties
    record[interactorsListName].push(userId);
    
    await record.save();

    return record;
}

async function deleteById(id, userId) {
    const record = await Data.findById(id);
    if (!record) {
        throw new Error("Record not found " + id);
    };

    if (record.owner.toString() != userId) {
        throw new Error("Access denied");
    };

    await Data.findByIdAndDelete(id);
};

async function searchByKeyword(keyword) {
    try {
        const regex = new RegExp(keyword, 'i'); // 'i' прави търсенето case-insensitive
        const results = await Data.find({ name: { $regex: regex } });
        return results;
    } catch (err) {
        console.error('Error during search:', err);
        throw err;
    }
}

async function getMostViewed() {
    try {
        const results = await Data.find().sort({ views: -1 });
        return results;
    } catch (err) {
        console.error('Error getting most viewed:', err);
        throw err;
    }
}

async function getMostPlayed() {
    try {
        const results = await Data.find().sort({ played: -1 });
        return results;
    } catch (err) {
        console.error('Error getting most played:', err);
        throw err;
    }
}

async function getMostLiked() {
    try {
        const results = await Data.aggregate([
            {
                $addFields: {
                    likesCount: { $size: '$likes' }
                }
            },
            {
                $sort: { likesCount: -1 }
            }
        ]);
        return results;
    } catch (err) {
        console.error('Error getting most liked:', err);
        throw err;
    }
}

module.exports = {
    getAll,
    /* getLastThree, */
    getTopFivePlayed,
    getById,
    getByIdKey,
    create,
    update,
    interact,
    deleteById,
    searchByKeyword,
    getMostViewed,
    getMostPlayed,
    getMostLiked
}