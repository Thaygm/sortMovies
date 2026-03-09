import { View } from './View.js';

export class UserView extends View {
    #userSelect = document.querySelector('#userSelect');
    #userAge = document.querySelector('#userAge');
    #watchedList = document.querySelector('#watchedList');

    #mediaTemplate;
    #onUserSelect;
    #onWatchRemove;
    #watchedElements = [];

    constructor() {
        super();
        this.init();
    }

    async init() {
        this.#mediaTemplate = await this.loadTemplate('./src/view/templates/past-watch.html');
        this.attachUserSelectListener();
    }

    registerUserSelectCallback(callback) {
        this.#onUserSelect = callback;
    }

    registerWatchRemoveCallback(callback) {
        this.#onWatchRemove = callback;
    }

    renderUserOptions(users) {
        const options = users.map(user => {
            return `<option value="${user.id}">${user.name}</option>`;
        }).join('');

        this.#userSelect.innerHTML += options;
    }

    renderUserDetails(user) {
        this.#userAge.value = user.age;
    }

    renderPastWatches(watchedHistory) {
        if (!this.#mediaTemplate) return;

        if (!watchedHistory || watchedHistory.length === 0) {
            this.#watchedList.innerHTML = '<p class="text-muted">Nenhum filme assistido ainda.</p>';
            return;
        }

        const html = watchedHistory.map(media => {
            return this.replaceTemplate(this.#mediaTemplate, {
                ...media,
                media: JSON.stringify(media)
            });
        }).join('');

        this.#watchedList.innerHTML = html;
        this.attachWatchClickHandlers();
    }

    addPastWatch(media) {
        
        if (this.#watchedList.innerHTML.includes('Nenhum filme assistido')) {
            this.#watchedList.innerHTML = '';
        }

        const watchHtml = this.replaceTemplate(this.#mediaTemplate, {
            ...media,
            media: JSON.stringify(media)
        });

        this.#watchedList.insertAdjacentHTML('afterbegin', watchHtml);

        const newWatch = this.#watchedList.firstElementChild.querySelector('.past-watch');
        newWatch.classList.add('watch-highlight');

        setTimeout(() => {
            newWatch.classList.remove('watch-highlight');
        }, 1000);

        this.attachWatchClickHandlers();
    }

    attachUserSelectListener() {
        this.#userSelect.addEventListener('change', (event) => {
            const userId = event.target.value ? Number(event.target.value) : null;

            if (userId) {
                if (this.#onUserSelect) {
                    this.#onUserSelect(userId);
                }
            } else {
                this.#userAge.value = '';
                this.#watchedList.innerHTML = '';
            }
        });
    }

    attachWatchClickHandlers() {
        this.#watchedElements = [];
        const watchElements = document.querySelectorAll('.past-watch');

        watchElements.forEach(watchElement => {
            this.#watchedElements.push(watchElement);

            watchElement.onclick = (event) => {
                const media = JSON.parse(watchElement.dataset.media);
                const userId = this.getSelectedUserId();
                const element = watchElement.closest('.col-md-6') || watchElement;

                if (this.#onWatchRemove) {
                    this.#onWatchRemove({ element, userId, media });
                }

                element.style.transition = 'opacity 0.5s ease';
                element.style.opacity = '0';

                setTimeout(() => {
                    element.remove();
                    if (document.querySelectorAll('.past-watch').length === 0) {
                        this.renderPastWatches([]);
                    }
                }, 500);
            }
        });
    }

    getSelectedUserId() {
        return this.#userSelect.value ? Number(this.#userSelect.value) : null;
    }
}