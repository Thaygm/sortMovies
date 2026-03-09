import { View } from './View.js';

export class ModelView extends View {
    #trainModelBtn = document.querySelector('#trainModelBtn');
    #historyArrow = document.querySelector('#historyArrow'); 
    #historyDiv = document.querySelector('#historyDiv');     
    #allUsersWatchList = document.querySelector('#allUsersWatchList'); 
    #runRecommendationBtn = document.querySelector('#runRecommendationBtn');
    
    #onTrainModel;
    #onRunRecommendation;

    constructor() {
        super();
        this.attachEventListeners();
    }

    registerTrainModelCallback(callback) {
        this.#onTrainModel = callback;
    }
    
    registerRunRecommendationCallback(callback) {
        this.#onRunRecommendation = callback;
    }

    attachEventListeners() {
        this.#trainModelBtn.addEventListener('click', () => {
            this.#onTrainModel();
        });
        
        this.#runRecommendationBtn.addEventListener('click', () => {
            this.#onRunRecommendation();
        });

        this.#historyDiv.addEventListener('click', () => {
            const historyList = this.#allUsersWatchList;
            const isHidden = window.getComputedStyle(historyList).display === 'none';

            if (isHidden) {
                historyList.style.display = 'block';
                this.#historyArrow.classList.replace('bi-chevron-down', 'bi-chevron-up');
            } else {
                historyList.style.display = 'none';
                this.#historyArrow.classList.replace('bi-chevron-up', 'bi-chevron-down');
            }
        });
    }

    enableRecommendButton() {
        this.#runRecommendationBtn.disabled = false;
    }

    updateTrainingProgress(progress) {
        this.#trainModelBtn.disabled = true;
        this.#trainModelBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status"></span> 
            Treinando IA...
        `;

        if (progress.progress === 100) {
            this.#trainModelBtn.disabled = false;
            this.#trainModelBtn.innerHTML = 'Treinar Modelo de Recomendação';
        }
    }

    renderAllUsersWatchHistory(users) {
        const html = users.map(user => {
            const watchHtml = user.watched.map(item => {
                return `<span class="badge bg-dark text-light me-1 mb-1">${item.title}</span>`;
            }).join('');

            return `
                <div class="user-watch-summary mb-3">
                    <h6>${user.name} (Idade: ${user.age})</h6>
                    <div class="watch-badges">
                        ${watchHtml || '<span class="text-muted">Nenhum histórico</span>'}
                    </div>
                </div>
            `;
        }).join('');

        this.#allUsersWatchList.innerHTML = html;
    }
}