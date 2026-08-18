// biblia.js - Lógica de la Biblia

let testamentoActual = 'Antiguo';
let libroActual = null;
let capituloActual = 1;

// Controla a dónde vuelve el botón "Volver" de la vista de lectura:
// 'verses' -> viene de la cuadrícula de versículos (flujo normal)
// 'search' -> viene de un resultado de búsqueda
let readingOrigin = 'verses';

document.addEventListener('DOMContentLoaded', () => {
    // Pestañas de testamento
    document.querySelectorAll('.testament-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.testament-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            testamentoActual = tab.dataset.testamento;
            showBooksView();
            renderBooks();
        });
    });

    document.getElementById('backToBooksBtn').addEventListener('click', showBooksView);
    document.getElementById('backToChaptersBtn').addEventListener('click', showChaptersView);
    document.getElementById('backFromReadingBtn').addEventListener('click', () => {
        if (readingOrigin === 'search') {
            showSearchResultsView();
        } else {
            renderVerseSelector();
            showVersesView();
        }
    });
    document.getElementById('backFromSearchBtn').addEventListener('click', showBooksView);

    document.getElementById('readFullChapterBtn').addEventListener('click', () => {
        readingOrigin = 'verses';
        renderVersiculos();
        showReadingView();
    });

    document.getElementById('prevChapter').addEventListener('click', () => changeChapter(-1));
    document.getElementById('nextChapter').addEventListener('click', () => changeChapter(1));

    document.getElementById('searchBiblia').addEventListener('input', handleSearchInput);

    renderBooks();
});

// ===== Utilidad: obtener la lista de libros del testamento activo =====
function getLibrosTestamento(testamento) {
    return testamento === 'Antiguo' ? BibliaData.antiguoTestamento : BibliaData.nuevoTestamento;
}

// ===== Navegación entre vistas =====
function ocultarTodasLasVistas() {
    document.getElementById('testamentTabs').hidden = true;
    document.getElementById('booksView').hidden = true;
    document.getElementById('chaptersView').hidden = true;
    document.getElementById('versesView').hidden = true;
    document.getElementById('readingView').hidden = true;
    document.getElementById('searchResultsView').hidden = true;
}

function showBooksView() {
    ocultarTodasLasVistas();
    document.getElementById('testamentTabs').hidden = false;
    document.getElementById('booksView').hidden = false;
}

function showChaptersView() {
    ocultarTodasLasVistas();
    document.getElementById('chaptersView').hidden = false;
}

function showVersesView() {
    ocultarTodasLasVistas();
    document.getElementById('versesView').hidden = false;
}

function showReadingView() {
    ocultarTodasLasVistas();
    document.getElementById('readingView').hidden = false;
}

function showSearchResultsView() {
    ocultarTodasLasVistas();
    document.getElementById('searchResultsView').hidden = false;
}

// ===== Render: cuadrícula de libros =====
function renderBooks() {
    const libros = getLibrosTestamento(testamentoActual);
    const booksGrid = document.getElementById('booksGrid');
    booksGrid.innerHTML = '';

    libros.forEach(libro => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="book-name">${libro.nombre}</div>
            <div class="book-chapters">${libro.capitulos} cap.</div>
        `;
        card.addEventListener('click', () => {
            libroActual = libro;
            renderChapters();
            showChaptersView();
        });
        booksGrid.appendChild(card);
    });
}

// ===== Render: cuadrícula de capítulos =====
function renderChapters() {
    document.getElementById('chaptersBookTitle').textContent = libroActual.nombre;

    const chaptersGrid = document.getElementById('chaptersGrid');
    chaptersGrid.innerHTML = '';

    for (let i = 1; i <= libroActual.capitulos; i++) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chapter-chip';
        chip.textContent = i;
        chip.addEventListener('click', () => {
            capituloActual = i;
            renderVerseSelector();
            showVersesView();
        });
        chaptersGrid.appendChild(chip);
    }
}

// ===== Render: cuadrícula de versículos (selección) =====
function renderVerseSelector() {
    const capitulo = String(capituloActual);
    const versiculos = libroActual.versiculos[capitulo];

    document.getElementById('versesBookTitle').textContent = `${libroActual.nombre} ${capitulo}`;

    const versesGrid = document.getElementById('versesGrid');
    versesGrid.innerHTML = '';

    if (!versiculos) return;

    versiculos.forEach((_, index) => {
        const numeroVersiculo = index + 1;
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'verse-chip';
        chip.textContent = numeroVersiculo;
        chip.addEventListener('click', () => {
            readingOrigin = 'verses';
            renderVersiculos(numeroVersiculo);
            showReadingView();
        });
        versesGrid.appendChild(chip);
    });
}

// ===== Render: versículos del capítulo actual =====
// Si se pasa "versiculoDestacado", la vista se abre desplazada y
// resaltada directamente en ese versículo (sin tener que buscarlo a mano).
function renderVersiculos(versiculoDestacado) {
    const capitulo = String(capituloActual);
    const versiculos = libroActual.versiculos[capitulo];
    const titulosCapitulo = libroActual.titulos[capitulo] || {};

    if (!versiculos) return;

    document.getElementById('capituloTitulo').textContent = `${libroActual.nombre} ${capitulo}`;
    document.getElementById('currentChapter').textContent = capitulo;

    const versiculosContainer = document.getElementById('versiculosContainer');
    versiculosContainer.innerHTML = '';

    versiculos.forEach((texto, index) => {
        const numeroVersiculo = index + 1;

        // Título de sección, si este versículo inicia una nueva sección
        if (titulosCapitulo[String(numeroVersiculo)]) {
            const tituloEl = document.createElement('h3');
            tituloEl.className = 'section-title';
            tituloEl.textContent = titulosCapitulo[String(numeroVersiculo)];
            versiculosContainer.appendChild(tituloEl);
        }

        const versiculoItem = document.createElement('div');
        versiculoItem.className = 'versiculo-item';
        versiculoItem.dataset.verse = numeroVersiculo;
        if (versiculoDestacado && numeroVersiculo === versiculoDestacado) {
            versiculoItem.classList.add('versiculo-destacado');
        }
        versiculoItem.innerHTML = `
            <span class="versiculo-numero">${numeroVersiculo}</span>
            <span class="versiculo-texto">${texto}</span>
        `;
        versiculosContainer.appendChild(versiculoItem);
    });

    document.getElementById('prevChapter').disabled = capituloActual <= 1;
    document.getElementById('nextChapter').disabled = capituloActual >= libroActual.capitulos;

    if (versiculoDestacado) {
        // Esperar a que el DOM pinte el capítulo completo antes de medir
        // posiciones, para que el scroll caiga exactamente sobre el versículo.
        requestAnimationFrame(() => {
            setTimeout(() => {
                const targetEl = versiculosContainer.querySelector(`[data-verse="${versiculoDestacado}"]`);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 60);
        });
    } else {
        versiculosContainer.scrollTop = 0;
    }
}

// ===== Cambiar de capítulo (anterior / siguiente) =====
function changeChapter(direction) {
    const nuevoCapitulo = capituloActual + direction;

    if (libroActual && nuevoCapitulo >= 1 && nuevoCapitulo <= libroActual.capitulos) {
        capituloActual = nuevoCapitulo;
        renderVersiculos();
    }
}

// ===== Búsqueda =====
let searchDebounceTimer = null;

function handleSearchInput(event) {
    const query = event.target.value.trim();

    clearTimeout(searchDebounceTimer);

    if (query.length < 3) {
        if (!document.getElementById('searchResultsView').hidden) {
            showBooksView();
        }
        return;
    }

    // Pequeño debounce: la Biblia completa son ~31,000 versículos,
    // esto evita filtrar en cada tecla mientras se escribe rápido.
    searchDebounceTimer = setTimeout(() => searchBiblia(query), 200);
}

function searchBiblia(query) {
    const queryLower = query.toLowerCase();
    const resultados = [];
    const todosLibros = [...BibliaData.antiguoTestamento, ...BibliaData.nuevoTestamento];

    for (const libro of todosLibros) {
        for (const capitulo of Object.keys(libro.versiculos)) {
            const versos = libro.versiculos[capitulo];
            for (let i = 0; i < versos.length; i++) {
                if (versos[i].toLowerCase().includes(queryLower)) {
                    resultados.push({
                        libro,
                        capitulo,
                        versiculo: i + 1,
                        texto: versos[i]
                    });
                    if (resultados.length >= 200) break; // límite razonable de resultados
                }
            }
            if (resultados.length >= 200) break;
        }
        if (resultados.length >= 200) break;
    }

    mostrarResultadosBusqueda(resultados, query);
}

function mostrarResultadosBusqueda(resultados, query) {
    document.getElementById('searchResultsTitle').textContent =
        `"${query}" — ${resultados.length}${resultados.length >= 200 ? '+' : ''} resultado${resultados.length === 1 ? '' : 's'}`;

    const listEl = document.getElementById('searchResultsList');
    listEl.innerHTML = '';

    if (resultados.length === 0) {
        listEl.innerHTML = '<p class="empty-message">No se encontraron resultados</p>';
        showSearchResultsView();
        return;
    }

    resultados.forEach(resultado => {
        const item = document.createElement('div');
        item.className = 'versiculo-item search-result-item';
        item.innerHTML = `
            <div>
                <div class="search-result-ref">${resultado.libro.nombre} ${resultado.capitulo}:${resultado.versiculo}</div>
                <p class="search-result-texto">${resultado.texto}</p>
            </div>
        `;
        item.addEventListener('click', () => {
            const tabTestamento = resultado.libro.numero <= 39 ? 'Antiguo' : 'Nuevo';
            testamentoActual = tabTestamento;
            document.querySelectorAll('.testament-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.testamento === tabTestamento);
            });

            libroActual = resultado.libro;
            capituloActual = parseInt(resultado.capitulo, 10);
            readingOrigin = 'search';
            // Va directo al capítulo y hace scroll + resalta el versículo del resultado
            renderVersiculos(resultado.versiculo);
            showReadingView();
        });
        listEl.appendChild(item);
    });

    showSearchResultsView();
}