// TFVisorView.js
import { View } from './View.js';

export class TFVisorView extends View {
    #lossPoints = [];
    #accPoints = [];

    constructor() {
        super();
        tfvis.visor().open();
    }

    resetDashboard() {
        this.#lossPoints = [];
        this.#accPoints = [];
        tfvis.visor().setActiveTab('Treinamento');
    }

    handleTrainingLog(log) {
        const { epoch, loss, accuracy } = log;
        this.#lossPoints.push({ x: epoch, y: loss });
        this.#accPoints.push({ x: epoch, y: accuracy });

        tfvis.render.linechart(
            { name: 'Precisão (Accuracy)', tab: 'Treinamento' },
            { values: this.#accPoints, series: ['Acurácia'] },
            { xLabel: 'Época', yLabel: 'Precisão', height: 250 }
        );

        tfvis.render.linechart(
            { name: 'Erro de Recomendação (Loss)', tab: 'Treinamento' },
            { values: this.#lossPoints, series: ['Erro'] },
            { xLabel: 'Época', yLabel: 'Loss', height: 250 }
        );
    }
}