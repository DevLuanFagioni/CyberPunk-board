// Cyberpunk Trello JavaScript

class CyberpunkTrello {
    constructor() {
        this.cards = this.loadCards();
        this.currentCardId = this.getNextCardId();
        this.init();
    }

    init() {
        this.setupCustomCursor();
        this.setupEventListeners();
        this.renderCards();
    }

    // Configuração do cursor personalizado
    setupCustomCursor() {
        const cursor = document.getElementById('custom-cursor');
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        // Efeito de hover em elementos interativos
        const interactiveElements = document.querySelectorAll('button, .card, input, textarea');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
                cursor.style.background = 'radial-gradient(circle, #00ff00 0%, #ff00ff 50%, transparent 70%)';
            });
            
            element.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursor.style.background = 'radial-gradient(circle, #ff00ff 0%, #00ffff 50%, transparent 70%)';
            });
        });
    }

    // Configuração dos event listeners
    setupEventListeners() {
        // Botões de adicionar card
        const addCardBtns = document.querySelectorAll('.add-card-btn');
        addCardBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = e.target.closest('.column');
                const columnId = column.id.replace('-column', '');
                this.openCardModal(null, columnId);
            });
        });

        // Modal
        this.setupModal();
    }

    // Configuração do modal
    setupModal() {
        // Criar modal se não existir
        if (!document.getElementById('card-modal')) {
            this.createModal();
        }

        const modal = document.getElementById('card-modal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel');
        const saveBtn = modal.querySelector('.save');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        saveBtn.addEventListener('click', () => this.saveCard());

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    // Criar modal dinamicamente
    createModal() {
        const modalHTML = `
            <div id="card-modal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Card</h2>
                    <input type="text" id="card-title" placeholder="Título do card" maxlength="100">
                    <textarea id="card-description" placeholder="Descrição do card" maxlength="500"></textarea>
                    <div class="modal-buttons">
                        <button class="cancel">Cancelar</button>
                        <button class="save">Salvar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Abrir modal para criar/editar card
    openCardModal(cardId = null, columnId = 'todo') {
        const modal = document.getElementById('card-modal');
        const titleInput = document.getElementById('card-title');
        const descriptionInput = document.getElementById('card-description');

        if (cardId) {
            const card = this.cards.find(c => c.id === cardId);
            if (card) {
                titleInput.value = card.title;
                descriptionInput.value = card.description;
                modal.dataset.cardId = cardId;
                modal.dataset.columnId = card.column;
            }
        } else {
            titleInput.value = '';
            descriptionInput.value = '';
            modal.dataset.cardId = '';
            modal.dataset.columnId = columnId;
        }

        modal.style.display = 'block';
        titleInput.focus();

        // Adicionar efeito glitch ao abrir
        modal.querySelector('.modal-content').classList.add('glitch-effect');
        setTimeout(() => {
            modal.querySelector('.modal-content').classList.remove('glitch-effect');
        }, 300);
    }

    // Fechar modal
    closeModal() {
        const modal = document.getElementById('card-modal');
        modal.style.display = 'none';
    }

    // Salvar card
    saveCard() {
        const modal = document.getElementById('card-modal');
        const title = document.getElementById('card-title').value.trim();
        const description = document.getElementById('card-description').value.trim();
        const cardId = modal.dataset.cardId;
        const columnId = modal.dataset.columnId;

        if (!title) {
            alert('Por favor, insira um título para o card.');
            return;
        }

        if (cardId) {
            // Editar card existente
            const cardIndex = this.cards.findIndex(c => c.id === parseInt(cardId));
            if (cardIndex !== -1) {
                this.cards[cardIndex].title = title;
                this.cards[cardIndex].description = description;
            }
        } else {
            // Criar novo card
            const newCard = {
                id: this.currentCardId++,
                title: title,
                description: description,
                column: columnId,
                createdAt: new Date().toISOString()
            };
            this.cards.push(newCard);
        }

        this.saveCards();
        this.renderCards();
        this.closeModal();
    }

    // Excluir card
    deleteCard(cardId) {
        if (confirm('Tem certeza que deseja excluir este card?')) {
            this.cards = this.cards.filter(c => c.id !== cardId);
            this.saveCards();
            this.renderCards();
        }
    }

    // Mover card para outra coluna
    moveCard(cardId, newColumn) {
        const card = this.cards.find(c => c.id === cardId);
        if (card) {
            card.column = newColumn;
            this.saveCards();
            this.renderCards();
        }
    }

    // Renderizar todos os cards
    renderCards() {
        const columns = ['todo', 'in-progress', 'done'];
        
        columns.forEach(columnId => {
            const cardList = document.querySelector(`#${columnId}-column .card-list`);
            cardList.innerHTML = '';
            
            const columnCards = this.cards.filter(card => card.column === columnId);
            
            columnCards.forEach(card => {
                const cardElement = this.createCardElement(card);
                cardList.appendChild(cardElement);
            });
        });

        // Reconfigurar event listeners para novos elementos
        this.setupCardEventListeners();
    }

    // Criar elemento de card
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        
        cardDiv.innerHTML = `
            <div class="card-content">
                <div class="card-title">${this.escapeHtml(card.title)}</div>
                <div class="card-description">${this.escapeHtml(card.description)}</div>
                <div class="card-actions">
                    <button class="edit-btn" data-card-id="${card.id}">Editar</button>
                    <button class="delete-btn" data-card-id="${card.id}">Excluir</button>
                    <select class="move-select" data-card-id="${card.id}">
                        <option value="">Mover para...</option>
                        <option value="todo" ${card.column === 'todo' ? 'disabled' : ''}>A Fazer</option>
                        <option value="in-progress" ${card.column === 'in-progress' ? 'disabled' : ''}>Em Progresso</option>
                        <option value="done" ${card.column === 'done' ? 'disabled' : ''}>Concluído</option>
                    </select>
                </div>
            </div>
        `;

        return cardDiv;
    }

    // Configurar event listeners para cards
    setupCardEventListeners() {
        // Botões de editar
        const editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = parseInt(e.target.dataset.cardId);
                this.openCardModal(cardId);
            });
        });

        // Botões de excluir
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = parseInt(e.target.dataset.cardId);
                this.deleteCard(cardId);
            });
        });

        // Selects de mover
        const moveSelects = document.querySelectorAll('.move-select');
        moveSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const cardId = parseInt(e.target.dataset.cardId);
                const newColumn = e.target.value;
                if (newColumn) {
                    this.moveCard(cardId, newColumn);
                }
            });
        });

        // Efeito de hover nos cards
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // Salvar cards no localStorage
    saveCards() {
        localStorage.setItem('cyberpunk-trello-cards', JSON.stringify(this.cards));
        localStorage.setItem('cyberpunk-trello-next-id', this.currentCardId.toString());
    }

    // Carregar cards do localStorage
    loadCards() {
        const saved = localStorage.getItem('cyberpunk-trello-cards');
        return saved ? JSON.parse(saved) : [];
    }

    // Obter próximo ID de card
    getNextCardId() {
        const saved = localStorage.getItem('cyberpunk-trello-next-id');
        return saved ? parseInt(saved) : 1;
    }

    // Escapar HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new CyberpunkTrello();
});

// Efeitos adicionais
document.addEventListener('DOMContentLoaded', () => {
    // Efeito de glitch aleatório no título
    const title = document.querySelector('h1');
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% de chance a cada 3 segundos
            title.classList.add('glitch-effect');
            setTimeout(() => {
                title.classList.remove('glitch-effect');
            }, 300);
        }
    }, 3000);

    // Efeito de scan nas colunas
    const columns = document.querySelectorAll('.column');
    columns.forEach((column, index) => {
        setTimeout(() => {
            column.style.animation = 'none';
            column.offsetHeight; // Trigger reflow
            column.style.animation = null;
        }, index * 500);
    });
});

