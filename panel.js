
document.addEventListener("DOMContentLoaded", async () => {
    const sesion = await window.verificarSesion();

    if (!sesion) return;

    const botonCerrarSesion = document.getElementById("boton-cerrar-sesion");

    if (botonCerrarSesion) {
        botonCerrarSesion.addEventListener("click", window.cerrarSesion);
    }
});
