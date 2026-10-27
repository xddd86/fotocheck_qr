
const formulario = document.getElementById("formulario-login");
const campoCorreo = document.getElementById("correo");
const campoContrasena = document.getElementById("contrasena");
const botonLogin = document.getElementById("boton-login");
const mensajeLogin = document.getElementById("mensaje-login");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    botonLogin.disabled = true;
    mensajeLogin.textContent = "";
    botonLogin.textContent = "Ingresando...";

    try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({
            email: campoCorreo.value.trim(),
            password: campoContrasena.value
        });

        if (error) {
            mensajeLogin.textContent = "Correo o contraseña incorrectos.";
            return;
        }

        window.location.replace("panel.html");
    } catch {
        mensajeLogin.textContent = "No se pudo conectar con el servidor.";
    } finally {
        botonLogin.disabled = false;
        botonLogin.textContent = "Iniciar sesión";
    }
});
