import { View } from './View.js';

export class MediaView extends View {
    #mediaList = document.querySelector('#mediaList'); 
    #buttons;
    #mediaTemplate;
    #onWatchMedia;

    constructor() {
        super();
        this.init();
    }

    async init() {
        this.#mediaTemplate = await this.loadTemplate('./src/view/templates/media-card.html');
    }

    onUserSelected(user) {
        this.setButtonsState(!user.id);
    }

    registerWatchMediaCallback(callback) {
        this.#onWatchMedia = callback;
    }

    render(mediaItems, disableButtons = true) {
        if (!this.#mediaTemplate) return;

        const html = mediaItems.map(item => {
            return this.replaceTemplate(this.#mediaTemplate, {
                id: item.id,
                title: item.title,
                category: item.category,
                rating: item.rating,    
                type: item.type,   
                media: JSON.stringify(item)
            });
        }).join('');

        this.#mediaList.innerHTML = html;
        this.attachWatchButtonListeners();
        this.setButtonsState(disableButtons);
    }

    setButtonsState(disabled) {
        this.#buttons = document.querySelectorAll('.watch-now-btn');
        this.#buttons.forEach(button => {
            button.disabled = disabled;
        });
    }

    attachWatchButtonListeners() {
        this.#buttons = document.querySelectorAll('.watch-now-btn');
        this.#buttons.forEach(button => {
            button.addEventListener('click', () => {
                const media = JSON.parse(button.dataset.media);
                const originalText = button.innerHTML;

                button.innerHTML = '<i class="bi bi-play-fill"></i> Assistindo...';
                button.classList.replace('btn-primary', 'btn-danger');

                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.replace('btn-danger', 'btn-primary');
                }, 800);

                if (this.#onWatchMedia) {
                    this.#onWatchMedia(media);
                }
            });
        });
    }
}