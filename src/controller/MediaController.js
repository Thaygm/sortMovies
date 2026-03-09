export class MediaController {
    #mediaView; 
    #currentUser = null;
    #events;
    #mediaService; 

    constructor({
        mediaView,
        events,
        mediaService
    }) {
        this.#mediaView = mediaView;
        this.#mediaService = mediaService;
        this.#events = events;
        this.init();
    }

    static init(deps) {
        return new MediaController(deps);
    }

    async init() {
        this.setupCallbacks();
        this.setupEventListeners();
        
        const mediaList = await this.#mediaService.getMedia();
        this.#mediaView.render(mediaList, true);
    }

    setupEventListeners() {
        this.#events.onUserSelected((user) => {
            this.#currentUser = user;
            this.#mediaView.onUserSelected(user);
            
            this.#events.dispatchRecommend(user);
        });

        this.#events.onRecommendationsReady(({ recommendations }) => {
            this.#mediaView.render(recommendations, false);
        });
    }

    setupCallbacks() {
        this.#mediaView.registerWatchMediaCallback(this.handleWatchMedia.bind(this));
    }

    async handleWatchMedia(media) {
        const user = this.#currentUser;
        if (!user) return alert('Selecione um perfil primeiro!');

        this.#events.dispatchWatchAdded({ user, media });
    }
}