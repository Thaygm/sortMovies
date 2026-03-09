import { UserController } from './controller/UserController.js';
import { MediaController } from './controller/MediaController.js';
import { ModelController } from './controller/ModelTrainingController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { TFVisorView } from './view/TFVisorView.js';
import { UserService } from './service/UserService.js';
import { MediaService } from './service/MediaService.js'; 
import { UserView } from './view/UserView.js';
import { MediaView } from './view/MediaView.js';      
import { ModelView } from './view/ModelTrainingView.js';
import Events from './events/events.js';
import { WorkerController } from './controller/WorkerController.js';

const userService = new UserService();
const mediaService = new MediaService();

const userView = new UserView();
const mediaView = new MediaView();
const modelView = new ModelView();
const tfVisorView = new TFVisorView();

const mlWorker = new Worker('/src/workers/modelTrainingWorker.js', { type: 'module' });

const w = WorkerController.init({
    worker: mlWorker,
    events: Events
});

const users = await userService.getDefaultUsers();
w.triggerTrain(users);

ModelController.init({
    modelView,
    userService,
    events: Events,
});

TFVisorController.init({
    tfVisorView,
    events: Events,
});

MediaController.init({
    mediaView,
    userService,
    mediaService,
    events: Events,
});

const userController = UserController.init({
    userView,
    userService,
    mediaService,
    events: Events,
});

userController.renderUsers({
    "id": 99,
    "name": "Xuão Cinefilo",
    "age": 30,
    "watched": [] 
});