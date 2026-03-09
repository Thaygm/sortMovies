import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

let _globalCtx = {};
let _model = null;

// 1. Novos pesos: Gênero e Tipo (Filme/Série) costumam ser mais decisivos que "preço"
const WEIGHTS = {
    genre: 0.5,      // Equivalente a category
    type: 0.2,       // Filme ou Série
    rating: 0.2,     // Substitui price (Nota do IMDb/Rotten)
    age: 0.1,        // Idade recomendada
};

const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

function makeContext(mediaList, users) {
    const ages = users.map(u => u.age);
    const ratings = mediaList.map(m => m.rating);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);

    // Mapeamos Gêneros e Tipos em vez de Cores e Categorias
    const genres = [...new Set(mediaList.map(m => m.genre))];
    const types = [...new Set(mediaList.map(m => m.type))];

    const genresIndex = Object.fromEntries(genres.map((g, i) => [g, i]));
    const typesIndex = Object.fromEntries(types.map((t, i) => [t, i]));

    // Média de idade de quem assistiu cada título
    const midAge = (minAge + maxAge) / 2;
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        user.watched.forEach(m => { // De 'purchases' para 'watched'
            ageSums[m.title] = (ageSums[m.title] || 0) + user.age;
            ageCounts[m.title] = (ageCounts[m.title] || 0) + 1;
        });
    });

    const mediaAvgAgeNorm = Object.fromEntries(
        mediaList.map(m => {
            const avg = ageCounts[m.title] ? ageSums[m.title] / ageCounts[m.title] : midAge;
            return [m.title, normalize(avg, minAge, maxAge)];
        })
    );

    return {
        mediaList,
        users,
        genresIndex,
        typesIndex,
        mediaAvgAgeNorm,
        minAge, maxAge,
        minRating, maxRating,
        numGenres: genres.length,
        numTypes: types.length,
        dimensions: 2 + genres.length + types.length
    };
}

const oneHotWeighted = (index, length, weight) =>
    tf.oneHot(index, length).cast('float32').mul(weight);

function encodeMedia(item, context) {
    const rating = tf.tensor1d([
        normalize(item.rating, context.minRating, context.maxRating) * WEIGHTS.rating
    ]);

    const age = tf.tensor1d([
        (context.mediaAvgAgeNorm[item.title] ?? 0.5) * WEIGHTS.age
    ]);

    const genre = oneHotWeighted(
        context.genresIndex[item.genre],
        context.numGenres,
        WEIGHTS.genre
    );

    const type = oneHotWeighted(
        context.typesIndex[item.type],
        context.numTypes,
        WEIGHTS.type
    );

    return tf.concat1d([rating, age, genre, type]);
}

function encodeUser(user, context) {
    if (user.watched && user.watched.length) {
        return tf.stack(user.watched.map(m => encodeMedia(m, context)))
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

// ... (createTrainingData e configureNeuralNetAndTrain seguem a mesma lógica, 
// trocando referências de 'product' para 'media' e 'purchases' para 'watched')

async function trainModel({ users }) {
    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });
    const mediaList = await (await fetch('/data/media.json')).json();

    const context = makeContext(mediaList, users);
    context.mediaVectors = mediaList.map(m => ({
        title: m.title,
        meta: { ...m },
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
    const inputTensor = tf.tensor2d(inputs);
    const predictions = _model.predict(inputTensor);
    const scores = predictions.dataSync();

    const recommendations = context.mediaVectors.map((item, index) => ({
        ...item.meta,
        score: scores[index]
    })).sort((a, b) => b.score - a.score);

    postMessage({
        type: workerEvents.recommend,
        user,
        recommendations
    });
}

const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: recommend,
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};