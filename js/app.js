// app.js - Funciones globales y utilidades

const App = {
    // Configuración global
    config: {
        appName: 'Mi Biblioteca de Sermones',
        version: '1.0.0',
        storageKeys: {
            userName: 'usuarioNombre',
            userFolder: 'usuarioCarpeta'
        }
    },

    // Inicialización
    init() {
        console.log(`${this.config.appName} v${this.config.version}`);
        this.registerServiceWorker();
    },

    // Registrar Service Worker
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('./service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registrado:', registration.scope);
                    })
                    .catch(error => {
                        console.error('Error al registrar Service Worker:', error);
                    });
            });
        }
    },

    // Obtener nombre de usuario
    getUserName() {
        return localStorage.getItem(this.config.storageKeys.userName) || 'Usuario';
    },

    // Guardar nombre de usuario
    setUserName(name) {
        localStorage.setItem(this.config.storageKeys.userName, name);
    },

    // Formatear fecha
    formatDate(date = new Date()) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('es-ES', options);
    },

    // Generar ID único
    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Navegar a una página
    navigateTo(url) {
        window.location.href = url;
    },

    // Obtener carpeta seleccionada
    getSelectedFolder() {
        return localStorage.getItem(this.config.storageKeys.userFolder);
    },

    // Guardar carpeta seleccionada
    setSelectedFolder(folderId) {
        localStorage.setItem(this.config.storageKeys.userFolder, folderId);
    }
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});