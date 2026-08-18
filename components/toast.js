// components/toast.js - Componente de notificaciones

class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        
        if (!toastContainer) {
            console.error('No se encontró el contenedor de toasts');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-eliminar después del tiempo especificado
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
    
    static success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    static info(message, duration) {
        this.show(message, 'info', duration);
    }
    
    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }
}

// Estilos para toasts
const toastStyles = `
    #toastContainer {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        pointer-events: none;
    }
    
    .toast {
        background-color: white;
        border-radius: var(--border-radius-md);
        padding: 1rem;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 250px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        pointer-events: auto;
    }
    
    .toast.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .toast-success {
        border-left: 4px solid var(--success-color);
    }
    
    .toast-error {
        border-left: 4px solid var(--danger-color);
    }
    
    .toast-info {
        border-left: 4px solid var(--primary-color);
    }
    
    .toast-warning {
        border-left: 4px solid var(--warning-color);
    }
    
    .toast-icon {
        font-size: 1.25rem;
    }
    
    .toast-message {
        flex: 1;
        font-size: 0.875rem;
        color: var(--text-primary);
    }
    
    .toast-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        color: var(--text-secondary);
        padding: 0.25rem;
    }
    
    .toast-close:hover {
        color: var(--text-primary);
    }
`;

// Agregar estilos al head
const toastStyleSheet = document.createElement('style');
toastStyleSheet.textContent = toastStyles;
document.head.appendChild(toastStyleSheet);