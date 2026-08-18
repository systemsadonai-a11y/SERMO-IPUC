// index.js - Lógica de la pantalla de bienvenida

document.addEventListener('DOMContentLoaded', () => {
    // Si ya existe un usuario guardado, saltar la bienvenida
    // y entrar directo a la app (no se vuelve a pedir el nombre).
    const existingUser = App.getUserName();
    if (existingUser && existingUser !== 'Usuario') {
        window.location.href = 'inicio.html';
        return;
    }

    const welcomeForm = document.getElementById('welcomeForm');
    const nombreInput = document.getElementById('nombreUsuario');
    const welcomeCard = document.getElementById('welcomeCard');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const enfocarInput = () => nombreInput.focus();

    if (prefersReducedMotion) {
        // Sin animación de por medio: se enfoca de inmediato
        enfocarInput();
    } else {
        // Se enfoca justo cuando la tarjeta termina de aparecer,
        // al final de la escena del lector abriendo la Biblia.
        welcomeCard.addEventListener('animationend', enfocarInput, { once: true });
    }

    welcomeForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const nombre = nombreInput.value.trim();

        if (nombre) {
            // Guardar nombre en localStorage
            App.setUserName(nombre);

            // Redirigir a la página principal
            window.location.href = 'inicio.html';
        }
    });
});