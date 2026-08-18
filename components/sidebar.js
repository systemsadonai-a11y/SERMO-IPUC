// components/sidebar.js - Componente de menú lateral

class Sidebar {
    static create() {
        const sidebarHTML = `
            <div class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <span class="sidebar-icon">📖</span>
                    <h2>Mi Biblioteca</h2>
                </div>
                
                <nav class="sidebar-nav">
                    <a href="inicio.html" class="sidebar-link ${this.isActive('inicio.html')}">
                        <span class="link-icon">🏠</span>
                        <span>Inicio</span>
                    </a>
                    
                    <a href="biblia.html" class="sidebar-link ${this.isActive('biblia.html')}">
                        <span class="link-icon">📖</span>
                        <span>Biblia</span>
                    </a>
                    
                    <a href="diccionario.html" class="sidebar-link ${this.isActive('diccionario.html')}">
                        <span class="link-icon">📚</span>
                        <span>Diccionario</span>
                    </a>
                    
                    <a href="inicio.html#buscar" class="sidebar-link">
                        <span class="link-icon">🔎</span>
                        <span>Buscar sermones</span>
                    </a>
                </nav>
                
                <div class="sidebar-footer">
                    <div class="sidebar-divider"></div>
                    
                    <a href="#" class="sidebar-link" onclick="alert('Configuración próximamente')">
                        <span class="link-icon">⚙️</span>
                        <span>Configuración</span>
                    </a>
                    
                    <a href="#" class="sidebar-link" onclick="showUserProfile()">
                        <span class="link-icon">👤</span>
                        <span id="sidebarUserName">Mi perfil</span>
                    </a>
                </div>
            </div>
        `;
        
        return sidebarHTML;
    }
    
    static isActive(page) {
        const currentPage = window.location.pathname.split('/').pop();
        return currentPage === page ? 'active' : '';
    }
    
    static init() {
        const sidebarContainer = document.getElementById('sidebarContainer');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebarContainer) {
            sidebarContainer.innerHTML = this.create();
            
            // Actualizar nombre de usuario
            const userName = App.getUserName();
            const sidebarUserName = document.getElementById('sidebarUserName');
            if (sidebarUserName && userName) {
                sidebarUserName.textContent = userName;
            }
            
            // Configurar toggle del menú
            const menuToggle = document.getElementById('menuToggle');
            if (menuToggle) {
                menuToggle.addEventListener('click', () => {
                    document.getElementById('sidebar').classList.add('open');
                    if (sidebarOverlay) sidebarOverlay.classList.add('open');
                });
            }
            
            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', () => {
                    document.getElementById('sidebar').classList.remove('open');
                    sidebarOverlay.classList.remove('open');
                });
            }
        }
    }
}

// Mostrar perfil de usuario
function showUserProfile() {
    const userName = App.getUserName();
    Modal.show(`
        <div class="modal">
            <div class="modal-content">
                <h2>Mi Perfil</h2>
                <div class="profile-info">
                    <div class="profile-avatar">👤</div>
                    <h3>${userName}</h3>
                    <p>Usuario de Mi Biblioteca de Sermones</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="Modal.close()">Cerrar</button>
                </div>
            </div>
        </div>
    `);
}

// Inicializar sidebar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Sidebar.init();
});