// inicio.js - Lógica de la página principal

document.addEventListener('DOMContentLoaded', async () => {
    // Esperar a que IndexedDB termine de abrirse antes de leer/escribir datos.
    // Sin esto, loadCarpetas() podía dispararse antes de que Database.db
    // existiera, provocando "Error al cargar carpetas" en la recarga.
    try {
        await Database.ready;
    } catch (error) {
        Toast.show('No se pudo conectar con la base de datos', 'error');
        return;
    }

    // Mostrar nombre de usuario
    const userNameElement = document.getElementById('userName');
    userNameElement.textContent = App.getUserName();

    // Cargar carpetas
    await loadCarpetas();

    // Event listeners
    document.getElementById('createFolderBtn').addEventListener('click', showCreateFolderModal);
    document.getElementById('createSermonBtn').addEventListener('click', showCreateSermonModal);
    document.getElementById('searchSermon').addEventListener('input', handleSearch);
    document.getElementById('backToFoldersBtn').addEventListener('click', closeFolderDetail);
});

// Cargar carpetas desde IndexedDB
async function loadCarpetas() {
    try {
        const carpetas = await Database.getCarpetas();
        const foldersGrid = document.getElementById('foldersGrid');
        foldersGrid.innerHTML = '';

        if (carpetas.length === 0) {
            foldersGrid.innerHTML = '<p class="empty-message">No hay carpetas creadas</p>';
            return;
        }

        for (const carpeta of carpetas) {
            const sermonesCount = await Database.getSermonesByCarpeta(carpeta.id);
            const folderCard = createFolderCard(carpeta, sermonesCount.length);
            foldersGrid.appendChild(folderCard);
        }
    } catch (error) {
        console.error('Error al cargar carpetas:', error);
        Toast.show('Error al cargar carpetas', 'error');
    }
}

// Crear tarjeta de carpeta
function createFolderCard(carpeta, sermonCount) {
    const card = document.createElement('div');
    card.className = 'folder-card';
    card.style.borderColor = carpeta.color;

    card.innerHTML = `
        <button type="button" class="folder-menu-btn" aria-haspopup="true" aria-expanded="false" aria-label="Opciones de ${carpeta.nombre}">⋮</button>
        <div class="folder-menu" hidden>
            <button type="button" class="folder-menu-item folder-menu-delete">🗑️ Eliminar carpeta</button>
        </div>
        <div class="folder-icon">${carpeta.icono || '📁'}</div>
        <div class="folder-name">${carpeta.nombre}</div>
        <div class="folder-count">${sermonCount} sermones</div>
    `;

    card.addEventListener('click', () => openFolder(carpeta));

    const menuBtn = card.querySelector('.folder-menu-btn');
    const menu = card.querySelector('.folder-menu');

    menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const willOpen = menu.hidden;
        closeAllFolderMenus();
        if (willOpen) {
            menu.hidden = false;
            menuBtn.setAttribute('aria-expanded', 'true');
        }
    });

    menu.querySelector('.folder-menu-delete').addEventListener('click', (event) => {
        event.stopPropagation();
        closeAllFolderMenus();
        confirmDeleteFolder(carpeta, sermonCount);
    });

    return card;
}

// Cerrar todos los menús de opciones (de carpeta y de sermón) abiertos
function closeAllFolderMenus() {
    document.querySelectorAll('.folder-menu, .sermon-menu').forEach(m => { m.hidden = true; });
    document.querySelectorAll('.folder-menu-btn, .sermon-menu-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

// Cerrar los menús al hacer clic en cualquier otra parte de la página
document.addEventListener('click', closeAllFolderMenus);

// Confirmar antes de eliminar una carpeta
function confirmDeleteFolder(carpeta, sermonCount) {
    const aviso = sermonCount > 0
        ? `Esta carpeta tiene ${sermonCount} sermón${sermonCount === 1 ? '' : 'es'}. También se eliminarán.`
        : 'Esta carpeta está vacía.';

    const modalContent = `
        <div class="modal">
            <div class="modal-content">
                <h2>Eliminar "${carpeta.nombre}"</h2>
                <p>${aviso} Esta acción no se puede deshacer.</p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="Modal.close()">Cancelar</button>
                    <button class="btn-danger" onclick="deleteFolder('${carpeta.id}')">Eliminar carpeta</button>
                </div>
            </div>
        </div>
    `;

    Modal.show(modalContent);
}

// Eliminar carpeta y sus sermones
async function deleteFolder(carpetaId) {
    try {
        const sermones = await Database.getSermonesByCarpeta(carpetaId);
        for (const sermon of sermones) {
            await Database.deleteSermon(sermon.id);
        }
        await Database.deleteCarpeta(carpetaId);

        Modal.close();
        Toast.show('Carpeta eliminada correctamente', 'success');
        await loadCarpetas();
    } catch (error) {
        console.error('Error al eliminar la carpeta:', error);
        Toast.show('Error al eliminar la carpeta', 'error');
    }
}

// Abrir carpeta (mostrar sus prédicas)
async function openFolder(carpeta) {
    App.setSelectedFolder(carpeta.id);

    document.querySelector('.folders-section').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';

    const detailView = document.getElementById('folderDetailView');
    document.getElementById('folderDetailTitle').textContent = `${carpeta.icono || '📁'} ${carpeta.nombre}`;
    detailView.style.display = 'block';

    await loadFolderSermons(carpeta);
}

// Cargar las prédicas de la carpeta abierta
async function loadFolderSermons(carpeta) {
    const listEl = document.getElementById('folderSermonsList');
    listEl.innerHTML = '';

    try {
        const sermones = await Database.getSermonesByCarpeta(carpeta.id);

        if (sermones.length === 0) {
            listEl.innerHTML = '<p class="empty-message">No hay prédicas en esta carpeta todavía</p>';
            return;
        }

        for (const sermon of sermones) {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <button type="button" class="sermon-menu-btn" aria-haspopup="true" aria-expanded="false" aria-label="Opciones de ${sermon.titulo}">⋮</button>
                <div class="sermon-menu" hidden>
                    <button type="button" class="sermon-menu-item sermon-menu-delete">🗑️ Eliminar sermón</button>
                </div>
                <h4>${sermon.titulo}</h4>
                <p>${sermon.textoBiblico || ''}</p>
            `;

            item.addEventListener('click', () => {
                localStorage.setItem('sermonToEdit', sermon.id);
                window.location.href = 'sermon.html';
            });

            const menuBtn = item.querySelector('.sermon-menu-btn');
            const menu = item.querySelector('.sermon-menu');

            menuBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const willOpen = menu.hidden;
                closeAllFolderMenus();
                if (willOpen) {
                    menu.hidden = false;
                    menuBtn.setAttribute('aria-expanded', 'true');
                }
            });

            menu.querySelector('.sermon-menu-delete').addEventListener('click', (event) => {
                event.stopPropagation();
                closeAllFolderMenus();
                confirmDeleteSermon(sermon, carpeta);
            });

            listEl.appendChild(item);
        }
    } catch (error) {
        console.error('Error al cargar las prédicas de la carpeta:', error);
        listEl.innerHTML = '<p class="empty-message">Error al cargar las prédicas</p>';
        Toast.show('Error al cargar las prédicas de la carpeta', 'error');
    }
}

// Confirmar antes de eliminar un sermón
function confirmDeleteSermon(sermon, carpeta) {
    const modalContent = `
        <div class="modal">
            <div class="modal-content">
                <h2>Eliminar "${sermon.titulo}"</h2>
                <p>Esta acción no se puede deshacer.</p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="Modal.close()">Cancelar</button>
                    <button class="btn-danger" onclick="deleteSermonFromFolder('${sermon.id}', '${carpeta.id}')">Eliminar sermón</button>
                </div>
            </div>
        </div>
    `;

    Modal.show(modalContent);
}

// Eliminar un sermón y refrescar la lista de la carpeta abierta
async function deleteSermonFromFolder(sermonId, carpetaId) {
    try {
        await Database.deleteSermon(sermonId);
        Modal.close();
        Toast.show('Sermón eliminado correctamente', 'success');

        const carpeta = await Database.getCarpeta(carpetaId);
        if (carpeta) {
            await loadFolderSermons(carpeta);
        }
    } catch (error) {
        console.error('Error al eliminar el sermón:', error);
        Toast.show('Error al eliminar el sermón', 'error');
    }
}

// Volver de la vista de detalle a la lista de carpetas
function closeFolderDetail() {
    document.getElementById('folderDetailView').style.display = 'none';
    document.querySelector('.folders-section').style.display = '';
}

// Mostrar modal para crear carpeta
function showCreateFolderModal() {
    const modalContent = `
        <div class="modal">
            <div class="modal-content">
                <h2>Crear nueva carpeta</h2>
                
                <div class="form-group">
                    <label for="folderName">Nombre</label>
                    <input type="text" id="folderName" placeholder="Nombre de la carpeta">
                </div>
                
                <div class="form-group">
                    <label for="folderDescription">Descripción</label>
                    <textarea id="folderDescription" rows="3" placeholder="Descripción de la carpeta"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Color</label>
                    <div class="color-picker">
                        <button class="color-option" style="background: #4F46E5" data-color="#4F46E5"></button>
                        <button class="color-option" style="background: #10B981" data-color="#10B981"></button>
                        <button class="color-option" style="background: #F59E0B" data-color="#F59E0B"></button>
                        <button class="color-option" style="background: #EF4444" data-color="#EF4444"></button>
                        <button class="color-option" style="background: #8B5CF6" data-color="#8B5CF6"></button>
                        <button class="color-option" style="background: #F97316" data-color="#F97316"></button>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="Modal.close()">Cancelar</button>
                    <button class="btn-primary" onclick="createFolder()">Crear</button>
                </div>
            </div>
        </div>
    `;
    
    Modal.show(modalContent);
    
    // Seleccionar color por defecto
    let selectedColor = '#4F46E5';
    
    // Event listeners para los colores
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedColor = btn.dataset.color;
            document.querySelectorAll('.color-option').forEach(b => b.style.border = 'none');
            btn.style.border = '3px solid #000';
        });
    });
    
    // Guardar referencia al color seleccionado
    window.selectedFolderColor = selectedColor;
}

// Crear carpeta
async function createFolder() {
    const nombre = document.getElementById('folderName').value.trim();
    const descripcion = document.getElementById('folderDescription').value.trim();
    const color = window.selectedFolderColor || '#4F46E5';
    
    if (!nombre) {
        Toast.show('El nombre es obligatorio', 'error');
        return;
    }
    
    const carpeta = {
        id: App.generateId('folder'),
        nombre,
        descripcion,
        color,
        icono: '📁',
        fechaCreacion: App.formatDate()
    };
    
    try {
        await Database.createCarpeta(carpeta);
        Modal.close();
        Toast.show('Carpeta creada correctamente', 'success');
        await loadCarpetas();
    } catch (error) {
        console.error('Error al crear carpeta:', error);
        Toast.show('Error al crear la carpeta', 'error');
    }
}

// Mostrar modal para seleccionar carpeta
function showCreateSermonModal() {
    const modalContent = `
        <div class="modal">
            <div class="modal-content">
                <h2>Seleccionar carpeta</h2>
                <p>¿Dónde quieres guardar tu sermón?</p>
                
                <div class="folder-select" id="folderSelect">
                    ${window.foldersList ? window.foldersList.map(folder => `
                        <div class="folder-option" data-folder-id="${folder.id}">
                            <span>${folder.icono} ${folder.nombre}</span>
                        </div>
                    `).join('') : '<p>No hay carpetas disponibles</p>'}
                </div>
                
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="Modal.close()">Cancelar</button>
                    <button class="btn-primary" onclick="selectFolderAndContinue()">Continuar</button>
                </div>
            </div>
        </div>
    `;
    
    Modal.show(modalContent);
    
    // Cargar carpetas para selección
    loadFoldersForSelection();
    
    // Event listeners para selección
    document.querySelectorAll('.folder-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.folder-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            window.selectedFolderId = option.dataset.folderId;
        });
    });
}

// Cargar carpetas para selección
async function loadFoldersForSelection() {
    try {
        const carpetas = await Database.getCarpetas();
        window.foldersList = carpetas;
        
        const folderSelect = document.getElementById('folderSelect');
        if (folderSelect && carpetas.length > 0) {
            folderSelect.innerHTML = carpetas.map(folder => `
                <div class="folder-option" data-folder-id="${folder.id}">
                    <span>${folder.icono} ${folder.nombre}</span>
                </div>
            `).join('');
            
            // Re-asignar event listeners
            document.querySelectorAll('.folder-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.folder-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    window.selectedFolderId = option.dataset.folderId;
                });
            });
        }
    } catch (error) {
        console.error('Error al cargar carpetas:', error);
    }
}

// Seleccionar carpeta y continuar
function selectFolderAndContinue() {
    if (!window.selectedFolderId) {
        Toast.show('Selecciona una carpeta primero', 'error');
        return;
    }
    
    App.setSelectedFolder(window.selectedFolderId);

    // Importante: este es un sermón NUEVO. Si había quedado una sesión de
    // edición/creación interrumpida (la app se cerró de golpe sin pasar por
    // el botón "atrás" del editor), hay que descartarla aquí; si no,
    // sermon.html podría reabrir por error ese sermón viejo en vez de
    // empezar uno en blanco.
    localStorage.removeItem('sermonActiveSession');

    Modal.close();
    window.location.href = 'sermon.html';
}

// Manejar búsqueda
async function handleSearch(event) {
    const query = event.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }
    
    try {
        const resultados = await Database.searchSermones(query);
        const searchResults = document.getElementById('searchResults');
        const resultsList = document.getElementById('resultsList');
        const resultCount = document.getElementById('resultCount');
        
        resultCount.textContent = resultados.length;
        resultsList.innerHTML = '';
        
        if (resultados.length > 0) {
            searchResults.style.display = 'block';
            
            for (const sermon of resultados) {
                const carpeta = await Database.getCarpeta(sermon.carpetaId);
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `
                    <h4>${sermon.titulo}</h4>
                    <p>${sermon.textoBiblico}</p>
                    <small>📁 ${carpeta ? carpeta.nombre : 'Sin carpeta'}</small>
                `;
                
                resultItem.addEventListener('click', () => {
                    // Abrir el sermón en modo edición
                    localStorage.setItem('sermonToEdit', sermon.id);
                    window.location.href = 'sermon.html';
                });
                
                resultsList.appendChild(resultItem);
            }
        } else {
            searchResults.style.display = 'block';
            resultsList.innerHTML = '<p>No se encontraron resultados</p>';
        }
    } catch (error) {
        console.error('Error en la búsqueda:', error);
    }
}
