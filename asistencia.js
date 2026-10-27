
const formularioBusqueda = document.getElementById("formulario-busqueda");
const campoCodigo = document.getElementById("codigo");
const mensajeBusqueda = document.getElementById("mensaje-busqueda");
const resultadoEstudiante = document.getElementById("resultado-estudiante");
const datosEstudiante = document.getElementById("datos-estudiante");
const botonRegistrar = document.getElementById("boton-registrar");
const mensajeRegistro = document.getElementById("mensaje-registro");

const botonCamara = document.getElementById("boton-camara");
const botonDetenerCamara = document.getElementById("boton-detener-camara");
const mensajeCamara = document.getElementById("mensaje-camara");

let estudianteActual = null;
let lectorQR = null;
let procesandoQR = false;

async function buscarEstudiante(codigo) {
    codigo = codigo.trim();

    if (!codigo) return;

    mensajeBusqueda.textContent = "Buscando estudiante...";
    mensajeRegistro.textContent = "";
    resultadoEstudiante.hidden = true;
    estudianteActual = null;

    const { data, error } = await window.supabaseClient
        .from("estudiantes")
        .select("id, codigo, nombres, apellidos, grado, seccion, estado_matricula")
        .eq("codigo", codigo)
        .maybeSingle();

    if (error) {
        mensajeBusqueda.textContent = `Error: ${error.message}`;
        return;
    }

    if (!data) {
        mensajeBusqueda.textContent = `No se encontró el código ${codigo}.`;
        return;
    }

    estudianteActual = data;
    datosEstudiante.replaceChildren();

    [
        ["Código", data.codigo],
        ["Nombre", `${data.nombres ?? ""} ${data.apellidos ?? ""}`.trim()],
        ["Grado", data.grado],
        ["Sección", data.seccion],
        ["Estado", data.estado_matricula]
    ].forEach(([etiqueta, valor]) => {
        const parrafo = document.createElement("p");
        const fuerte = document.createElement("strong");

        fuerte.textContent = `${etiqueta}: `;
        parrafo.append(fuerte, document.createTextNode(valor ?? "—"));
        datosEstudiante.appendChild(parrafo);
    });

    resultadoEstudiante.hidden = false;
    mensajeBusqueda.textContent = "Estudiante encontrado.";
}

formularioBusqueda.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    await buscarEstudiante(campoCodigo.value);
});

async function activarCamara() {
    if (lectorQR) return;

    if (!window.Html5Qrcode) {
        mensajeCamara.textContent = "No se pudo cargar el lector QR. Comprueba tu conexión a internet.";
        return;
    }

    try {
        lectorQR = new Html5Qrcode("lector-qr");
        mensajeCamara.textContent = "Solicitando acceso a la cámara...";

        await lectorQR.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 230, height: 230 }
            },
            async (textoQR) => {
                if (procesandoQR) return;

                const codigo = textoQR.trim();

                // Solo aceptar códigos del formato NEW-000001.
                if (!/^NEW-\d{6}$/.test(codigo)) {
                    mensajeCamara.textContent = "El QR no contiene un código válido de estudiante.";
                    return;
                }

                procesandoQR = true;
                campoCodigo.value = codigo;
                mensajeCamara.textContent = `QR leído: ${codigo}`;

                try {
                    await detenerCamara();
                    await buscarEstudiante(codigo);
                } finally {
                    procesandoQR = false;
                }
            },
            () => {}
        );

        mensajeCamara.textContent = "Cámara activa. Apunta al QR del fotocheck.";
        botonCamara.disabled = true;
    } catch (error) {
        console.error("Error al activar cámara:", error);
        mensajeCamara.textContent =
            "No se pudo abrir la cámara. Verifica los permisos del navegador y usa HTTPS o localhost.";

        if (lectorQR) {
            try {
                await lectorQR.clear();
            } catch (_) {}
            lectorQR = null;
        }
    }
}

async function detenerCamara() {
    if (lectorQR) {
        try {
            if (lectorQR.isScanning) {
                await lectorQR.stop();
            }
            await lectorQR.clear();
        } catch (error) {
            console.error("Error al detener cámara:", error);
        }

        lectorQR = null;
    }

    if (botonCamara) botonCamara.disabled = false;
}

botonCamara?.addEventListener("click", activarCamara);

botonDetenerCamara?.addEventListener("click", async () => {
    await detenerCamara();
    mensajeCamara.textContent = "Cámara detenida.";
});

botonRegistrar.addEventListener("click", async () => {
    if (!estudianteActual) return;

    botonRegistrar.disabled = true;
    mensajeRegistro.textContent = "Registrando asistencia...";

    try {
        const ahora = new Date();

        // Fecha local del dispositivo.
        const fecha = [
            ahora.getFullYear(),
            String(ahora.getMonth() + 1).padStart(2, "0"),
            String(ahora.getDate()).padStart(2, "0")
        ].join("-");

        const { data: existente, error: errorConsulta } =
            await window.supabaseClient
                .from("asistencias")
                .select("id")
                .eq("estudiante_id", estudianteActual.id)
                .eq("fecha", fecha)
                .maybeSingle();

        if (errorConsulta) throw errorConsulta;

        if (existente) {
            mensajeRegistro.textContent =
                "Este estudiante ya tiene asistencia registrada hoy.";
            return;
        }

        const horaLimite = new Date(ahora);
        horaLimite.setHours(7, 45, 0, 0);

        const estado = ahora < horaLimite ? "a_tiempo" : "tarde";

        const { error } = await window.supabaseClient
            .from("asistencias")
            .insert({
                estudiante_id: estudianteActual.id,
                fecha,
                hora_entrada: ahora.toISOString(),
                estado
            });

        if (error) throw error;

        mensajeRegistro.textContent =
            `Asistencia registrada: ${estado === "a_tiempo" ? "A tiempo" : "Tarde"}.`;
    } catch (error) {
        console.error("Error al registrar asistencia:", error);
        mensajeRegistro.textContent = `No se pudo registrar: ${error.message}`;
    } finally {
        botonRegistrar.disabled = false;
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    await window.verificarSesion();
});
