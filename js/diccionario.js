// diccionario.js - Lógica del diccionario bíblico

document.addEventListener('DOMContentLoaded', () => {
    // Portal de búsqueda: no se muestra ninguna palabra hasta que se escriba algo
    showEmptyState();

    // Event listeners
    document.getElementById('searchDiccionario').addEventListener('input', searchDictionary);
    document.getElementById('backToList').addEventListener('click', showDictionaryList);
});

// Mostrar el estado vacío (portal de búsqueda con ilustración)
function showEmptyState() {
    document.getElementById('dictionaryEmpty').hidden = false;
    document.getElementById('dictionaryList').hidden = true;
    document.getElementById('dictionaryList').innerHTML = '';
}

// Renderizar los resultados de una búsqueda
function renderResults(resultados, query) {
    const dictionaryEmpty = document.getElementById('dictionaryEmpty');
    const dictionaryList = document.getElementById('dictionaryList');

    dictionaryEmpty.hidden = true;
    dictionaryList.hidden = false;
    dictionaryList.innerHTML = '';

    if (resultados.length === 0) {
        dictionaryList.innerHTML = `<p class="empty-message">No se encontraron resultados para "${query}"</p>`;
        return;
    }

    resultados.forEach(entrada => {
        const dictionaryItem = document.createElement('div');
        dictionaryItem.className = 'dictionary-item';
        dictionaryItem.innerHTML = `
            <h3>${entrada.palabra}</h3>
            <p>${entrada.definicion.substring(0, 100)}...</p>
        `;

        dictionaryItem.addEventListener('click', () => showWordDetail(entrada));
        dictionaryList.appendChild(dictionaryItem);
    });
}

// Mostrar detalle de palabra
function showWordDetail(entrada) {
    document.getElementById('dictionaryEmpty').hidden = true;
    document.getElementById('dictionaryList').hidden = true;
    document.getElementById('dictionaryDetail').hidden = false;

    document.getElementById('palabraTitulo').textContent = entrada.palabra;
    document.getElementById('palabraDefinicion').textContent = entrada.definicion;
    document.getElementById('palabraReferencia').textContent = entrada.referencia || 'No disponible';
}

// Volver desde el detalle: si había una búsqueda activa, la restaura; si no, vuelve al portal vacío
function showDictionaryList() {
    document.getElementById('dictionaryDetail').hidden = true;

    const query = document.getElementById('searchDiccionario').value.trim();
    if (query.length >= 2) {
        searchDictionary({ target: { value: query } });
    } else {
        showEmptyState();
    }
}

// Buscar en diccionario
function searchDictionary(event) {
    const query = event.target.value.toLowerCase().trim();

    if (query.length < 2) {
        showEmptyState();
        return;
    }

    const resultados = DiccionarioData.filter(entrada =>
        entrada.palabra.toLowerCase().includes(query) ||
        entrada.definicion.toLowerCase().includes(query)
    );

    renderResults(resultados, event.target.value.trim());
}