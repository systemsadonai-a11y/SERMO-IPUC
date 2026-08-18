// components/modal.js - Componente de modales

class Modal {
    static show(content) {
        const modalContainer = document.getElementById('modalContainer');
        
        if (!modalContainer) {
            console.error('No se encontró el contenedor de modales');
            return;
        }
        
        modalContainer.innerHTML = `
            <div class="modal-overlay" id="modalOverlay">
                ${content}
            </div>
        `;
        
        // Agregar evento para cerrar con Escape
        document.addEventListener('keydown', this.handleEscape);
        
        // Agregar evento para cerrar haciendo clic fuera
        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.close();
            }
        });
    }
    
    static close() {
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
        
        // Remover evento de Escape
        document.removeEventListener('keydown', this.handleEscape);
    }
    
    static handleEscape(event) {
        if (event.key === 'Escape') {
            Modal.close();
        }
    }
}

// Estilos para modales (se agregan dinámicamente)
const modalStyles = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }
    
    .modal {
        background-color: white;
        border-radius: var(--border-radius-xl);
        padding: 2rem;
        max-width: 500px;
        width: 100%;
        box-shadow: var(--shadow-xl);
        animation: modalFadeIn 0.3s ease;
    }
    
    .modal-content {
        position: relative;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        justify-content: flex-end;
    }
    
    .modal-actions .btn-primary,
    .modal-actions .btn-secondary {
        min-width: 100px;
        justify-content: center;
    }
    
    .color-picker {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    
    .color-option {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .color-option:hover {
        transform: scale(1.1);
    }
    
    .folder-select {
        margin: 1rem 0;
        max-height: 300px;
        overflow-y: auto;
    }
    
    .folder-option {
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .folder-option:hover {
        background-color: var(--bg-secondary);
    }
    
    .folder-option.selected {
        border-color: var(--primary-color);
        background-color: rgba(79, 70, 229, 0.1);
    }
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// Agregar estilos al head
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);