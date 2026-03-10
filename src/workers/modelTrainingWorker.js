import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

let _globalCtx = {};
let _model = null;

const WEIGHTS = {
    genre: 0.5,
    type: 0.2,
    rating: 0.2,
    age: 0.1,
};

const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

function oneHotWeighted(index, length, weight) {
    const safeIndex = (index === undefined || index === null || index < 0) ? 0 : index;
    return tf.oneHot(safeIndex, length).cast('float32').mul(weight);
}

function makeContext(mediaList, users) {
    const ages = users.map(u => u.age);
    const ratings = mediaList.map(m => m.rating || 0);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);

    const genres = [...new Set(mediaList.map(m => m.genre))];
    const types = [...new Set(mediaList.map(m => m.type))];

    const genresIndex = Object.fromEntries(genres.map((g, i) => [g, i]));
    const typesIndex = Object.fromEntries(types.map((t, i) => [t, i]));

    const midAge = (minAge + maxAge) / 2;
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        (user.watched || []).forEach(m => {
            const title = m.title || m.name;
            ageSums[title] = (ageSums[title] || 0) + user.age;
            ageCounts[title] = (ageCounts[title] || 0) + 1;
        });
    });

    const mediaAvgAgeNorm = Object.fromEntries(
        mediaList.map(m => {
            const avg = ageCounts[m.title] ? ageSums[m.title] / ageCounts[m.title] : midAge;
            return [m.title, normalize(avg, minAge, maxAge)];
        })
    );

    return {
        mediaList, users, genresIndex, typesIndex, mediaAvgAgeNorm,
        minAge, maxAge, minRating, maxRating,
        numGenres: genres.length, numTypes: types.length,
        dimensions: 2 + genres.length + types.length
    };
}

function encodeMedia(item, context) {
    const genreIdx = context.genresIndex[item.genre];
    const typeIdx = context.typesIndex[item.type];

    const rating = tf.tensor1d([normalize(item.rating || 0, context.minRating, context.maxRating) * WEIGHTS.rating]);
    const age = tf.tensor1d([(context.mediaAvgAgeNorm[item.title] ?? 0.5) * WEIGHTS.age]);
    
    const genre = oneHotWeighted(genreIdx, context.numGenres, WEIGHTS.genre);
    const type = oneHotWeighted(typeIdx, context.numTypes, WEIGHTS.type);

    return tf.concat1d([rating, age, genre, type]);
}

function encodeUser(user, context) {
    const history = user.watched || user.purchases || [];
    if (history.length) {
        return tf.stack(history.map(m => encodeMedia(m, context)))
            .mean(0)
            .reshape([1, context.dimensions]);
    }
    return tf.concat1d([
        tf.zeros([1]),
        tf.tensor1d([normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age]),
        tf.zeros([context.numGenres]),
        tf.zeros([context.numTypes]),
    ]).reshape([1, context.dimensions]);
}

function createTrainingData(context) {
    const inputs = [];
    const labels = [];
    context.users.filter(u => (u.watched && u.watched.length)).forEach(user => {
        const userVector = encodeUser(user, context).dataSync();
        context.mediaList.forEach(media => {
            const mediaVector = encodeMedia(media, context).dataSync();
            const hasWatched = user.watched.some(m => m.title === media.title);
            inputs.push([...userVector, ...mediaVector]);
            labels.push(hasWatched ? 1 : 0);
        });
    });
    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        inputDimension: context.dimensions * 2
    };
}

async function configureNeuralNetAndTrain(trainData) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [trainData.inputDimension], units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({ optimizer: tf.train.adam(0.01), loss: 'binaryCrossentropy', metrics: ['acc'] });

    await model.fit(trainData.xs, trainData.ys, {
        epochs: 30,
        batchSize: 16,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                postMessage({ 
                    type: workerEvents.trainingLog, 
                    epoch, 
                    loss: logs.loss, 
                    accuracy: logs.acc
                });
            }
        }
    });
    return model;
}

async function trainModel({ users }) {
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });
    const response = await fetch('/data/media.json');
    const mediaList = await response.json();

    const context = makeContext(mediaList, users);
    context.mediaVectors = mediaList.map(m => ({
        title: m.title, meta: { ...m },
        vector: encodeMedia(m, context).dataSync()
    }));

    _globalCtx = context;
    const trainData = createTrainingData(context);
    _model = await configureNeuralNetAndTrain(trainData);

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}

function recommend({ user }) {
    if (!_model) return;
    const context = _globalCtx;
    const userVector = encodeUser(user, context).dataSync();
    const inputs = context.mediaVectors.map(({ vector }) => [...userVector, ...vector]);
    const predictions = _model.predict(tf.tensor2d(inputs));
    const scores = predictions.dataSync();

    const recommendations = context.mediaVectors.map((item, index) => ({
        ...item.meta, score: scores[index]
    })).sort((a, b) => b.score - a.score);

    postMessage({ type: workerEvents.recommend, user, recommendations });
}

self.onmessage = e => {
    const { action, ...data } = e.data;
    const handlers = { [workerEvents.trainModel]: trainModel, [workerEvents.recommend]: recommend };
    if (handlers[action]) handlers[action](data);
};