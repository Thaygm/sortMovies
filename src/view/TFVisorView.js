import { View } from './View.js';

export class TFVisorView extends View {
    // Mantemos a lógica de pontos para Loss e Accuracy
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
            { name: 'Precisão (Gêneros/Rating)', tab: 'Treinamento', style: { width: '49%' } },
            { values: this.#accPoints, series: ['precisão'] },
            { xLabel: 'Época', yLabel: 'Precisão', height: 300 }
        );

        tfvis.render.linechart(
            { name: 'Erro de Recomendação', tab: 'Treinamento', style: { width: '49%' } },
            { values: this.#lossPoints, series: ['erro'] },
            { xLabel: 'Época', yLabel: 'Loss', height: 300 }
        );
    }
}