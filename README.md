AI Movie Recommendation System 🍿
Um sistema de recomendação de filmes e séries de ponta a ponta que utiliza TensorFlow.js para aprender as preferências dos usuários em tempo real. A aplicação utiliza uma rede neural densa para analisar gêneros, tipos de mídia e avaliações, reordenando o catálogo dinamicamente para cada perfil.

🚀 Estrutura do Projeto
index.html - Interface principal (Dark Mode) baseada em Bootstrap.

src/index.js - Ponto de entrada e orquestração dos controladores.

src/workers/ - Contém o Web Worker de treinamento da IA, permitindo processamento pesado fora da thread principal da UI.

src/view/ - Gerenciamento do DOM e renderização de templates dinâmicos.

src/controller/ - Ponte entre a lógica de negócio e a interface.

src/service/ - Persistência de dados (SessionStorage) e consumo de APIs/JSON.

data/ - Base de dados sintética com catálogos de mídia e perfis de usuários.

🧠 Tecnologias Utilizadas
TensorFlow.js: Treinamento e inferência da rede neural no navegador.

TFJS Vis: Visualização em tempo real das métricas de treinamento (Loss e Accuracy).

Web Workers: Treinamento assíncrono para evitar travamentos na interface.

Bootstrap & Icons: UI responsiva com tema Dark customizado.

🛠️ Como Rodar
Instale as dependências:

Bash
npm install
Inicie o servidor local:

Bash
npm start
Acesse no navegador:
http://localhost:8080

✨ Funcionalidades
Treinamento On-the-fly: Clique em "Treinar Rede Neural" para que a IA processe o histórico global de todos os usuários.

Personalização Dinâmica: Selecione um usuário e veja o catálogo ser reordenado instantaneamente com base no "Score de Relevância" calculado pela IA.

Feedback Visual: Gráficos em tempo real mostram o modelo aprendendo as correlações entre gêneros e perfis.

Simulação de Histórico: Adicione novos filmes ao perfil para ver a IA se adaptar às suas novas escolhas.

📊 O Modelo de IA
O modelo utiliza uma arquitetura de rede neural profunda (Deep Neural Network) que processa:

Vetores de Usuário: Baseados na média das características (Gênero, Tipo) dos filmes já assistidos.

Vetores de Mídia: Codificação One-Hot de gêneros e normalização de ratings.

Saída: Uma camada Sigmoid que prevê a probabilidade (0 a 1) do usuário gostar de um título específico.