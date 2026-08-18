// sermon.js - Lógica del editor de sermones (estilo blog, tema café/blanco)
// Guardado 100% automático en Database. Sin botón "Guardar".

let autosaveTimer = null;
let currentSermonId = null;
let currentFechaCreacion = null;
let isReadingMode = false;

document.addEventListener('DOMContentLoaded', async () => {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput && !fechaInput.value) {
        fechaInput.value = new Date().toISOString().slice(0, 10);
    }

    // Cargar carpeta seleccionada
    const folderId = App.getSelectedFolder();
    if (folderId) {
        try {
            const carpeta = await Database.getCarpeta(folderId);
            if (carpeta) {
                document.getElementById('selectedFolder').textContent = `${carpeta.icono} ${carpeta.nombre}`;
            }
        } catch (error) {
            console.error('Error al cargar carpeta:', error);
        }
    }

    // Verificar si hay un sermón para editar
    const sermonToEdit = localStorage.getItem('sermonToEdit');
    if (sermonToEdit) {
        await loadSermonForEdit(sermonToEdit);
        localStorage.removeItem('sermonToEdit');
    }

    setupAutoGrowTextarea(document.getElementById('textoBiblico'));
    setupContentPlaceholder();
    updateStats();
    setupFloatingToolbar();
    setupAutosaveListeners();

    document.getElementById('backBtn').addEventListener('click', async () => {
        await flushAutosave();
        window.location.href = 'inicio.html';
    });

    document.getElementById('previewBtn').addEventListener('click', toggleReadingMode);
    document.getElementById('pdfBtn').addEventListener('click', exportToPdf);
    document.getElementById('printBtn').addEventListener('click', exportToPdf);
});

// ---------- Utilidades ----------
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function setupAutoGrowTextarea(el) {
    if (!el) return;
    const grow = () => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    };
    el.addEventListener('input', grow);
    grow();
}

function setupContentPlaceholder() {
    const content = document.getElementById('contenido');
    const toggle = () => {
        const empty = content.textContent.trim().length === 0 && content.querySelectorAll('img').length === 0;
        content.classList.toggle('is-empty', empty);
    };
    content.addEventListener('input', toggle);
    toggle();
}

// ---------- Estadísticas ----------
function updateStats() {
    const content = document.getElementById('contenido');
    const text = content.innerText.trim();
    const words = text.length ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));

    document.getElementById('statWords').textContent = words;
    document.getElementById('statChars').textContent = chars;
    document.getElementById('statTime').textContent = minutes;
}

// ---------- Autoguardado real (Database) ----------
function setupAutosaveListeners() {
    const fields = ['titulo', 'tema', 'fecha', 'textoBiblico'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', scheduleAutosave);
    });

    const content = document.getElementById('contenido');
    content.addEventListener('input', () => {
        updateStats();
        scheduleAutosave();
    });
}

function collectSermonData() {
    return {
        titulo: document.getElementById('titulo').value.trim(),
        tema: document.getElementById('tema').value.trim(), // lema de la predicación
        fecha: document.getElementById('fecha').value,
        textoBiblico: document.getElementById('textoBiblico').value.trim(),
        contenido: document.getElementById('contenido').innerHTML.trim()
    };
}

function buildSermonObject(data, folderId) {
    return {
        id: currentSermonId || App.generateId('sermon'),
        carpetaId: folderId || 'default',
        titulo: data.titulo,
        textoBiblico: data.textoBiblico,
        referencia: '',
        tema: data.tema,
        fecha: data.fecha,
        // Campos de la estructura anterior, mantenidos vacíos por compatibilidad
        introduccion: '',
        puntos: [],
        conclusion: '',
        // Cuerpo del sermón, estilo blog
        contenido: data.contenido,
        fechaCreacion: currentFechaCreacion || App.formatDate(),
        fechaModificacion: App.formatDate()
    };
}

function scheduleAutosave() {
    const status = document.getElementById('autosaveStatus');
    status.textContent = 'Guardando...';
    status.classList.add('is-saving');

    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(performAutosave, 800);
}

async function performAutosave() {
    const status = document.getElementById('autosaveStatus');
    const data = collectSermonData();

    // Sin título todavía no hay nada que identifique el sermón: esperamos.
    if (!data.titulo) {
        status.textContent = 'Escribe un título...';
        status.classList.remove('is-saving');
        return;
    }

    try {
        const folderId = App.getSelectedFolder();
        const sermon = buildSermonObject(data, folderId);

        if (currentSermonId) {
            await Database.updateSermon(sermon);
        } else {
            await Database.createSermon(sermon);
            currentSermonId = sermon.id;
            currentFechaCreacion = sermon.fechaCreacion;
            localStorage.setItem('sermonEditingId', currentSermonId);
            localStorage.setItem('sermonFechaCreacion', currentFechaCreacion);
        }

        status.textContent = 'Guardado';
        status.classList.remove('is-saving');
    } catch (error) {
        console.error('Error al autoguardar sermón:', error);
        status.textContent = 'Error al guardar';
        status.classList.remove('is-saving');
        Toast.show('No se pudo guardar automáticamente', 'error');
    }
}

// Guarda de inmediato sin esperar el debounce (al salir o cambiar de modo)
async function flushAutosave() {
    clearTimeout(autosaveTimer);
    await performAutosave();
}

// ---------- Barra flotante de formato ----------
function setupFloatingToolbar() {
    const toolbar = document.getElementById('floatingToolbar');
    const content = document.getElementById('contenido');

    const hide = () => { toolbar.hidden = true; };

    const updatePosition = () => {
        if (isReadingMode) return hide();

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return hide();

        const range = sel.getRangeAt(0);
        if (!content.contains(range.commonAncestorContainer)) return hide();

        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return hide();

        toolbar.hidden = false;
        const top = rect.top + window.scrollY - toolbar.offsetHeight - 10;
        let left = rect.left + window.scrollX + rect.width / 2 - toolbar.offsetWidth / 2;
        left = Math.max(8, Math.min(left, window.scrollX + document.documentElement.clientWidth - toolbar.offsetWidth - 8));

        toolbar.style.top = Math.max(8, top) + 'px';
        toolbar.style.left = left + 'px';

        refreshActiveStates();
    };

    const refreshActiveStates = () => {
        toolbar.querySelectorAll('[data-cmd]').forEach(btn => {
            const cmd = btn.dataset.cmd;
            if (cmd === 'hilite') return;
            let active = false;
            try { active = document.queryCommandState(cmd); } catch (e) { /* noop */ }
            btn.classList.toggle('is-active', active);
        });
    };

    document.addEventListener('selectionchange', debounce(updatePosition, 120));
    document.addEventListener('mousedown', (e) => {
        if (!toolbar.contains(e.target) && !content.contains(e.target)) hide();
    });
    window.addEventListener('scroll', () => { if (!toolbar.hidden) updatePosition(); }, true);

    // Evitar que el botón robe el foco (y por tanto la selección) antes del click
    toolbar.addEventListener('mousedown', (e) => e.preventDefault());

    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.dataset.cmd) applyCommand(btn.dataset.cmd);
        if (btn.dataset.action) applyAction(btn.dataset.action);

        updateStats();
        scheduleAutosave();
        updatePosition();
    });
}

function applyCommand(cmd) {
    try { document.execCommand('styleWithCSS', false, true); } catch (e) { /* noop */ }

    if (cmd === 'hilite') {
        try {
            document.execCommand('hiliteColor', false, '#F5D97A');
        } catch (e) {
            wrapSelection(span => { span.style.backgroundColor = '#F5D97A'; });
        }
        return;
    }

    document.execCommand(cmd);
}

function applyAction(action) {
    if (action === 'inc') {
        const size = getSelectionFontSize();
        wrapSelection(span => { span.style.fontSize = (size + 2) + 'px'; });
    } else if (action === 'dec') {
        const size = getSelectionFontSize();
        wrapSelection(span => { span.style.fontSize = Math.max(10, size - 2) + 'px'; });
    } else if (action === 'clear') {
        document.execCommand('removeFormat');
    }
}

function getSelectionFontSize() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 16.8; // ~1.05rem
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentElement;
    return parseFloat(window.getComputedStyle(node).fontSize) || 16.8;
}

function wrapSelection(styleFn) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    styleFn(span);

    try {
        range.surroundContents(span);
    } catch (e) {
        // Selección que cruza varios elementos: extraer y envolver
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
    }

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
}

function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

// ---------- Cargar para edición (compatible con sermones antiguos) ----------
function buildLegacyContentHTML(sermon) {
    let html = '';
    if (sermon.introduccion) {
        html += `<h2>Introducción</h2><p>${escapeHtml(sermon.introduccion).replace(/\n/g, '<br>')}</p>`;
    }
    (sermon.puntos || []).forEach((punto, index) => {
        html += `<h2>${index + 1}. ${escapeHtml(punto.titulo || '')}</h2>`;
        if (punto.contenido) {
            html += `<p>${escapeHtml(punto.contenido).replace(/\n/g, '<br>')}</p>`;
        }
        if (punto.subpuntos && punto.subpuntos.length) {
            html += '<ul>' + punto.subpuntos.map(s => `<li>${escapeHtml(s)}</li>`).join('') + '</ul>';
        }
    });
    if (sermon.conclusion) {
        html += `<h2>Conclusión</h2><p>${escapeHtml(sermon.conclusion).replace(/\n/g, '<br>')}</p>`;
    }
    return html;
}

async function loadSermonForEdit(sermonId) {
    try {
        const sermon = await Database.getSermon(sermonId);
        if (sermon) {
            document.getElementById('titulo').value = sermon.titulo || '';
            document.getElementById('tema').value = sermon.tema || '';
            document.getElementById('textoBiblico').value = sermon.textoBiblico || '';

            const fechaInput = document.getElementById('fecha');
            fechaInput.value = sermon.fecha || (sermon.fechaCreacion ? sermon.fechaCreacion.slice(0, 10) : '');

            const content = document.getElementById('contenido');
            content.innerHTML = sermon.contenido && sermon.contenido.trim()
                ? sermon.contenido
                : buildLegacyContentHTML(sermon);

            // A partir de aquí, cualquier cambio actualiza este mismo sermón (no crea uno nuevo)
            currentSermonId = sermon.id;
            currentFechaCreacion = sermon.fechaCreacion;
            localStorage.setItem('sermonEditingId', currentSermonId);
            localStorage.setItem('sermonFechaCreacion', currentFechaCreacion);

            setupAutoGrowTextarea(document.getElementById('textoBiblico'));
            setupContentPlaceholder();
            updateStats();

            Toast.show('Sermón cargado para edición', 'info');
        }
    } catch (error) {
        console.error('Error al cargar sermón:', error);
    }
}

// ---------- Modo lectura (Vista previa in-place) ----------
function setFieldsReadOnly(readOnly) {
    ['titulo', 'tema', 'fecha', 'textoBiblico'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.readOnly = readOnly;
    });
    document.getElementById('contenido').setAttribute('contenteditable', readOnly ? 'false' : 'true');
}

async function toggleReadingMode() {
    const editor = document.querySelector('.sermon-editor');
    const btn = document.getElementById('previewBtn');

    if (!isReadingMode) {
        // Guardamos de inmediato lo que haya antes de pasar a solo lectura
        await flushAutosave();

        isReadingMode = true;
        document.body.classList.add('reading-mode');
        editor.classList.add('reading-mode');
        setFieldsReadOnly(true);
        document.getElementById('floatingToolbar').hidden = true;

        btn.textContent = '✏️ Editar';
        btn.blur(); // cierra el teclado si estaba abierto
    } else {
        isReadingMode = false;
        document.body.classList.remove('reading-mode');
        editor.classList.remove('reading-mode');
        setFieldsReadOnly(false);

        btn.textContent = '👁 Vista previa';
    }
}

// ---------- Exportar / imprimir ----------
function exportToPdf() {
    window.print();
}