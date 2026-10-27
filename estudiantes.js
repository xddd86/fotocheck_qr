
const listaEstudiantes = document.getElementById("lista-estudiantes");
const formularioEstudiantes = document.getElementById("formulario-estudiantes");
const campoBusqueda = document.getElementById("buscar-estudiante");
const mensajeEstudiantes = document.getElementById("mensaje-estudiantes");
const botonVerMas = document.getElementById("boton-ver-mas");

let estudiantes = [];
let estudiantesFiltrados = [];
let cantidadVisible = 10;

function imprimirQR(estudiante, imagenQR) {
    const ventana = window.open("", "_blank", "width=450,height=550");

    if (!ventana) {
        alert("Permite las ventanas emergentes para imprimir el QR.");
        return;
    }

    const documento = ventana.document;
    documento.open();
    documento.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Fotocheck - ${estudiante.codigo}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 24px;
                    color: #10152b;
                }
                .fotocheck {
                    width: 280px;
                    margin: auto;
                    padding: 20px;
                    border: 2px solid #10152b;
                    border-radius: 16px;
                }
                img {
                    display: block;
                    width: 180px;
                    height: 180px;
                    margin: 16px auto;
                }
                h2 { margin-bottom: 8px; }
                p { margin: 6px 0; }
                .codigo { font-weight: bold; font-size: 18px; }
                @media print {
                    body { padding: 0; }
                    .fotocheck { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="fotocheck">
                <h2>COLEGIO NEWTON</h2>
                <p>${estudiante.nombres ?? ""} ${estudiante.apellidos ?? ""}</p>
                <p>${estudiante.grado ?? ""} ${estudiante.seccion ?? ""}</p>
                <img src="${imagenQR}" alt="QR del estudiante">
                <p class="codigo">${estudiante.codigo}</p>
            </div>
        </body>
        </html>
    `);
    documento.close();

    const imagen = documento.querySelector("img");
    imagen.addEventListener("load", () => {
        ventana.focus();
        ventana.print();
    });
}

function mostrarEstudiantes(lista) {
    listaEstudiantes.replaceChildren();

    const visibles = lista.slice(0, cantidadVisible);

    if (visibles.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.textContent = "No se encontraron estudiantes.";
        fila.appendChild(celda);
        listaEstudiantes.appendChild(fila);
    } else {
        visibles.forEach((estudiante, indice) => {
            const fila = document.createElement("tr");

            const valores = [
                estudiante.codigo,
                `${estudiante.nombres ?? ""} ${estudiante.apellidos ?? ""}`.trim(),
                estudiante.grado,
                estudiante.seccion,
                estudiante.estado_matricula
            ];

            valores.forEach((valor) => {
                const celda = document.createElement("td");
                celda.textContent = valor ?? "—";
                fila.appendChild(celda);
            });

            // Generar el QR con el código real del estudiante.
            const celdaQR = document.createElement("td");
            const contenedorQR = document.createElement("div");
            const botonImprimir = document.createElement("button");

            contenedorQR.style.width = "100px";
            contenedorQR.style.margin = "0 auto";

            if (window.QRCode && estudiante.codigo) {
                new QRCode(contenedorQR, {
                    text: estudiante.codigo,
                    width: 100,
                    height: 100,
                    correctLevel: QRCode.CorrectLevel.M
                });
            } else {
                contenedorQR.textContent = "QR no disponible";
            }

            botonImprimir.type = "button";
            botonImprimir.textContent = "Imprimir QR";
            botonImprimir.style.fontSize = "11px";
botonImprimir.style.padding = "5px 8px";
botonImprimir.style.margin = "2px";
botonImprimir.style.whiteSpace = "nowrap";

            botonImprimir.addEventListener("click", () => {
                const imagen = contenedorQR.querySelector("img");
                const canvas = contenedorQR.querySelector("canvas");

                const imagenQR = imagen?.src ??
                    (canvas ? canvas.toDataURL("image/png") : null);

                if (!imagenQR) {
                    alert("No se pudo generar el QR. Comprueba tu conexión a internet.");
                    return;
                }

                imprimirQR(estudiante, imagenQR);
            });

            celdaQR.appendChild(contenedorQR);
            celdaQR.appendChild(botonImprimir);
            fila.appendChild(celdaQR);

            listaEstudiantes.appendChild(fila);
        });
    }

    if (botonVerMas) {
        botonVerMas.hidden = visibles.length >= lista.length;
    }
}

async function cargarEstudiantes() {
    mensajeEstudiantes.textContent = "Cargando estudiantes...";

    const { data, error } = await window.supabaseClient
        .from("estudiantes")
        .select("id, codigo, nombres, apellidos, grado, seccion, foto_url, estado_matricula")
        .order("apellidos");

    if (error) {
        console.error("Error de Supabase:", error);
        mensajeEstudiantes.textContent = `Error: ${error.message}`;
        return;
    }

    estudiantes = data ?? [];
    estudiantesFiltrados = estudiantes;
    cantidadVisible = 10;

    mostrarEstudiantes(estudiantesFiltrados);

    mensajeEstudiantes.textContent =
        `Mostrando ${Math.min(10, estudiantes.length)} de ${estudiantes.length} estudiantes`;
}

formularioEstudiantes.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const busqueda = campoBusqueda.value.trim().toLowerCase();

    estudiantesFiltrados = estudiantes.filter((estudiante) => {
        const texto = [
            estudiante.codigo,
            estudiante.nombres,
            estudiante.apellidos
        ].join(" ").toLowerCase();

        return texto.includes(busqueda);
    });

    cantidadVisible = 10;
    mostrarEstudiantes(estudiantesFiltrados);

    mensajeEstudiantes.textContent =
        `Mostrando ${Math.min(10, estudiantesFiltrados.length)} de ${estudiantesFiltrados.length} resultados`;
});

if (botonVerMas) {
    botonVerMas.addEventListener("click", () => {
        cantidadVisible += 10;
        mostrarEstudiantes(estudiantesFiltrados);

        mensajeEstudiantes.textContent =
            `Mostrando ${Math.min(cantidadVisible, estudiantesFiltrados.length)} de ${estudiantesFiltrados.length} resultados`;
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const sesion = await window.verificarSesion();

    if (!sesion) return;

    await cargarEstudiantes();
});
