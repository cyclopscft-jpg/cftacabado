const SUPABASE_URL = "https://szugemossswdinahbxxc.supabase.co";

const SUPABASE_KEY = "sb_publishable_tkep6QjStpeMFZtGtSNEWA_0Zenuh5V";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function abrirFormulario() {

    const formulario =
        document.getElementById("formularioAlumno");

    formulario.style.display = "block";

    setTimeout(function() {

        const posicion =
            formulario.getBoundingClientRect().top +
            window.scrollY;

        window.scrollTo({
            top: posicion,
            behavior: "smooth"
        });

    }, 100);

}

function cerrarFormulario() {
    document.getElementById("formularioAlumno").style.display = "none";
}


async function crearAlumno() {

    const botonCrear =
        document.querySelector(
            'button[onclick="crearAlumno()"]'
        );

    if (!botonCrear) {

        console.error(
            "❌ No se encontró el botón Crear alumno."
        );

        return;
    }

    if (botonCrear.disabled) {

        console.log(
            "🚫 Guardado ya en proceso. Segundo clic ignorado."
        );

        return;
    }

    botonCrear.disabled = true;
    botonCrear.innerText = "⏳ Guardando...";

    try {

        // ==============================
        // OBTENER DATOS DEL FORMULARIO
        // ==============================

        const nombre =
            document.getElementById("nombre").value.trim();

        const dni =
            document.getElementById("dni").value.trim();

        const celular =
            document.getElementById("celular").value.trim();

        const correo =
            document.getElementById("correo").value.trim();

        const fechaNacimiento =
            document.getElementById("fechaNacimiento").value;

        const montoTexto =
            document.getElementById("plan").value.trim();

        const duracionTexto =
            document.getElementById("duracionPlan").value.trim();

        const fechaInicioTexto =
            document.getElementById("fechaInicio").value;

        const monto =
            montoTexto !== ""
                ? Number(montoTexto)
                : null;

        const duracionPlan =
            duracionTexto !== ""
                ? Number(duracionTexto)
                : null;

        const apoderado =
            document.getElementById("apoderado").value.trim();

        const telefonoApoderado =
            document
                .getElementById("telefonoApoderado")
                .value
                .trim();


        // ==============================
        // VALIDAR FECHA DE INICIO
        // ==============================

        let diaCiclo = null;

        let fechaInicioSQL = null;

        let fechaVencimientoSQL = null;

        if (fechaInicioTexto !== "") {

            const partesFecha =
                fechaInicioTexto.split("-");

            const anio =
                Number(partesFecha[0]);

            const mes =
                Number(partesFecha[1]);

            const dia =
                Number(partesFecha[2]);

            const fechaInicio =
                new Date(
                    anio,
                    mes - 1,
                    dia
                );

            if (
                fechaInicio.getFullYear() !== anio ||
                fechaInicio.getMonth() !== mes - 1 ||
                fechaInicio.getDate() !== dia
            ) {

                alert(
                    "⚠️ La fecha de inicio no es válida."
                );

                return;
            }


            // ==============================
            // DÍA DE CICLO
            // ==============================

            diaCiclo = dia;


            // ==============================
            // FECHA DE INICIO SQL
            // ==============================

            const mesInicio =
                String(mes).padStart(2, "0");

            const diaInicio =
                String(dia).padStart(2, "0");

            fechaInicioSQL =
                `${anio}-${mesInicio}-${diaInicio}`;


            // ==============================
            // FECHA DE VENCIMIENTO
            // ==============================

            if (duracionPlan !== null) {

                const fechaVencimiento =
                    new Date(fechaInicio);

                fechaVencimiento.setMonth(
                    fechaVencimiento.getMonth() +
                    duracionPlan
                );

                const anioVencimiento =
                    fechaVencimiento.getFullYear();

                const mesVencimiento =
                    String(
                        fechaVencimiento.getMonth() + 1
                    ).padStart(2, "0");

                const diaVencimiento =
                    String(
                        fechaVencimiento.getDate()
                    ).padStart(2, "0");

                fechaVencimientoSQL =
                    `${anioVencimiento}-${mesVencimiento}-${diaVencimiento}`;
            }
        }


        // ==============================
        // COMPROBAR DNI EN SUPABASE
        // ==============================

        if (dni !== "") {

            const {
                data: alumnoExistente,
                error: errorBusqueda
            } =
                await supabaseClient
                    .from("Alumnos")
                    .select("DNI")
                    .eq("DNI", dni)
                    .maybeSingle();

            if (errorBusqueda) {

                console.error(
                    "Error buscando DNI:",
                    errorBusqueda
                );

                alert(
                    "No se pudo comprobar si el DNI ya existe.\n\n" +
                    errorBusqueda.message
                );

                return;
            }

            if (alumnoExistente) {

                alert(
                    "Ya existe un alumno registrado con este DNI."
                );

                return;
            }
        }


        // ==============================
        // CREAR ALUMNO
        // ==============================

        const nuevoAlumno = {

            DNI:
                dni || null,

            NOMBRE:
                nombre || null,

            CELULAR:
                celular || null,

            CORREO:
                correo || null,

            "FECHA DE NACIMIENTO":
                fechaNacimiento || null,

            PLAN:
                monto,

            MONTO:
                monto,

            DURACIONPLAN:
                duracionPlan,

            "DIA CICLO":
                diaCiclo,

            "FECHA INICIO":
                fechaInicioSQL,

            "FECHA VENCIMIENTO":
                fechaVencimientoSQL,

            APODERADO:
                apoderado || null,

            "TELEFONO APODERADO":
                telefonoApoderado || null
        };


        console.log(
            "Alumno que se enviará a Supabase:",
            nuevoAlumno
        );

        console.log(
            "TODOS LOS CAMPOS:",
            JSON.stringify(
                nuevoAlumno,
                null,
                2
            )
        );


        // ==============================
        // GUARDAR ALUMNO EN SUPABASE
        // ==============================

        const {
            error
        } =
            await supabaseClient
                .from("Alumnos")
                .insert([
                    nuevoAlumno
                ]);


        if (error) {

            console.error(
                "ERROR AL CREAR ALUMNO:",
                error
            );

            alert(
                "No se pudo registrar el alumno.\n\n" +
                error.message
            );

            return;
        }


        // ==============================
        // REGISTRAR PAGO AUTOMÁTICAMENTE
        // ==============================

        if (
            monto !== null &&
            monto > 0
        ) {

            const hoy = new Date();

const fechaPago =
    hoy.getFullYear() +
    "-" +
    String(hoy.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(hoy.getDate()).padStart(2, "0");
            const pagoNuevoAlumno = {

                DNI:
                    dni || null,

                NOMBRE:
                    nombre || null,

                MONTO:
                    Number(monto),

                PLAN:
                    Number(monto),

                DURACIONPLAN:
                    duracionPlan,

                "DIA CICLO":
                    diaCiclo,

                FECHA:
                    fechaPago
            };


            console.log(
                "PAGO AUTOMÁTICO DEL ALUMNO NUEVO:",
                pagoNuevoAlumno
            );


            const {
                error: errorPagoNuevo
            } =
                await supabaseClient
                    .from("Pagos")
                    .insert([
                        pagoNuevoAlumno
                    ]);


            if (errorPagoNuevo) {

                console.error(
                    "ERROR REGISTRANDO PAGO DEL ALUMNO NUEVO:",
                    errorPagoNuevo
                );

                alert(
                    "⚠️ El alumno se creó correctamente, " +
                    "pero no se pudo registrar el pago.\n\n" +
                    errorPagoNuevo.message
                );

                return;
            }


            console.log(
                "✅ PAGO DEL ALUMNO NUEVO REGISTRADO:",
                pagoNuevoAlumno
            );
        }


        // ==============================
        // ACTUALIZAR DASHBOARD
        // ==============================

        await actualizarIngresosMes();

        console.log(
            "🔥 TERMINÓ DE ACTUALIZAR INGRESOS"
        );

        await actualizarTotalAlumnos();

        await actualizarAlumnosVencidos();

        await actualizarAlumnosPorVencer();

        await actualizarAlertasMembresias();

        await actualizarAlumnosSinAsistencia();


        // ==============================
        // MENSAJE DE ÉXITO
        // ==============================

        alert(
            "Alumno registrado correctamente en Supabase. ✅"
        );


        // ==============================
        // LIMPIAR FORMULARIO
        // ==============================

        document.getElementById("nombre").value = "";

        document.getElementById("dni").value = "";

        document.getElementById("celular").value = "";

        document.getElementById("correo").value = "";

        document.getElementById("fechaNacimiento").value = "";

        document.getElementById("plan").value = "";

        document.getElementById("duracionPlan").value = "";

        document.getElementById("fechaInicio").value = "";

        document.getElementById("apoderado").value = "";

        document.getElementById("telefonoApoderado").value = "";


        // ==============================
        // CERRAR FORMULARIO
        // ==============================

        if (
            typeof cerrarFormulario === "function"
        ) {

            cerrarFormulario();
        }

        abrirInicio();


    } finally {

        // ==============================
        // DESBLOQUEAR BOTÓN
        // ==============================

        const botonActual =
            document.querySelector(
                'button[onclick="crearAlumno()"]'
            );

        if (botonActual) {

            botonActual.disabled = false;

            botonActual.innerText =
                "🥊 Crear alumno";
        }

        console.log(
            "🔓 Proceso de creación de alumno terminado."
        );
    }
}


async function mostrarAlumnos() {

    const lista = document.getElementById("listaAlumnos");

    if (!lista) {
        console.error("No existe #listaAlumnos en el HTML.");
        return;
    }

    lista.innerHTML = "<p>Cargando alumnos...</p>";

    // ==============================
    // OBTENER ALUMNOS DESDE SUPABASE
    // ==============================

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select("*")
            .order("NOMBRE", { ascending: true });

    if (error) {

        console.error(
            "ERROR AL CARGAR ALUMNOS:",
            error
        );

        lista.innerHTML =
            "<p>No se pudieron cargar los alumnos.</p>";

        alert(
            "Error al cargar alumnos desde Supabase:\n\n" +
            error.message
        );

        return;
    }

    // ==============================
    // BUSCADOR
    // ==============================

    const buscador =
        document.getElementById("buscarAlumno");

    const textoBusqueda =
        buscador
            ? buscador.value.trim().toLowerCase()
            : "";

    let alumnosFiltrados =
        alumnos || [];

    if (textoBusqueda) {

        alumnosFiltrados =
            alumnosFiltrados.filter(function(alumno) {

                const nombre =
                    String(
                        alumno["NOMBRE"] || ""
                    ).toLowerCase();

                const dni =
                    String(
                        alumno["DNI"] || ""
                    ).toLowerCase();

                const celular =
                    String(
                        alumno["CELULAR"] || ""
                    ).toLowerCase();

                return (
                    nombre.includes(textoBusqueda) ||
                    dni.includes(textoBusqueda) ||
                    celular.includes(textoBusqueda)
                );
            });
    }

    // ==============================
    // ORDENAR POR ESTADO
    // ==============================

    alumnosFiltrados.sort(function(a, b) {

        const estadoA =
            obtenerEstadoMembresia(
                a["FECHA VENCIMIENTO"]
            );

        const estadoB =
            obtenerEstadoMembresia(
                b["FECHA VENCIMIENTO"]
            );

        const ordenEstado = {
    "activo": 1,
    "por-vencer": 2,
    "vencido": 3,
    "sin-fecha": 4
};

        const prioridadA =
            ordenEstado[estadoA.clase] || 5;

        const prioridadB =
            ordenEstado[estadoB.clase] || 5;

        if (prioridadA !== prioridadB) {
            return prioridadA - prioridadB;
        }

        const fechaA =
            a["FECHA VENCIMIENTO"] || "";

        const fechaB =
            b["FECHA VENCIMIENTO"] || "";

        return fechaA.localeCompare(fechaB);
    });

    // ==============================
    // SIN RESULTADOS
    // ==============================

    if (alumnosFiltrados.length === 0) {

        lista.innerHTML =
            textoBusqueda
                ? "<p>No se encontraron alumnos.</p>"
                : "<p>No hay alumnos registrados.</p>";

        return;
    }

    // ==============================
    // MOSTRAR ALUMNOS
    // ==============================

    lista.innerHTML = "";

    alumnosFiltrados.forEach(function(alumno) {

        const dni =
            String(
                alumno["DNI"] ?? ""
            ).trim();

        const nombre =
            String(
                alumno["NOMBRE"] || "Sin nombre"
            );

        const celular =
            String(
                alumno["CELULAR"] || ""
            );

        let monto = Number(alumno["MONTO"]);

if (!monto || isNaN(monto)) {
    monto = 0;
}


const fechaOriginal =
    alumno["FECHA VENCIMIENTO"] || "";

let vencimiento = fechaOriginal;

if (fechaOriginal) {

    const partes =
        String(fechaOriginal).split("-");

    if (partes.length === 3) {

        // Si Supabase tiene YYYY-MM-DD
        if (partes[0].length === 4) {

            vencimiento =
                partes[2] + "-" +
                partes[1] + "-" +
                partes[0];

        } else {

            // Si tiene DD-MM-YY o DD-MM-YYYY
            let anio = partes[2];

            if (anio.length === 2) {
                anio = "20" + anio;
            }

            vencimiento =
                partes[0] + "-" +
                partes[1] + "-" +
                anio;
        }
    }
}

        const estado =
    obtenerEstadoMembresia(
        fechaOriginal

            );

        // COMPROBAR DNI QUE RECIBE CADA TARJETA
        console.log(
            "📋 Alumno:",
            nombre,
            "| DNI:",
            JSON.stringify(dni)
        );

        const tarjeta =
            document.createElement("div");

        tarjeta.className =
            "alumno-card";

        // Convertimos el DNI a una cadena segura
        // para enviarlo al botón
         const idSeguro =
         JSON.stringify(alumno["id"]);

        tarjeta.innerHTML = `

            <div class="alumno-info">

                <h3>${nombre}</h3>

                <p>
                    <strong>DNI:</strong>
                    ${dni || "Sin DNI"}
                </p>
<p>
    <strong>Plan:</strong>
    ${
        alumno["DURACIONPLAN"]
            ? alumno["DURACIONPLAN"]
            : "Sin plan"
    }
</p>

<p>
    <strong>Monto:</strong>
    S/${monto}
</p>
                <p>
                    <strong>Vencimiento:</strong>
                    ${vencimiento || "Sin fecha"}
                </p>

                <p class="${estado.clase}">
                    ${estado.detalle}
                </p>

            </div>

            <div class="alumno-acciones">

                <button
                    type="button"
                    onclick='verAlumno(${idSeguro})'
                >
                    Ver ficha
                </button>

                ${
                    celular
                        ? `
                        <button
                            type="button"
                            onclick='whatsappRenovacion(${idSeguro})'
                        >
                            WhatsApp
                        </button>
                        `
                        : ""
                }

            </div>
        `;

        lista.appendChild(tarjeta);
    });
}


function abrirAlumnos() {

    const pantallas = document.querySelectorAll(".section");

    pantallas.forEach(function(pantalla) {
        pantalla.style.display = "none";
    });

    const pantalla = document.getElementById("pantallaAlumnos");

    if (!pantalla) {
        alert("NO ENCUENTRO pantallaAlumnos");
        return;
    }

    pantalla.style.display = "block";

    mostrarAlumnos();

    pantalla.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


async function verAlumno(id) {

    alumnoEditando = id;

    console.log("🆔 ID recibido por verAlumno:", id);
    console.log("🆔 Tipo de ID:", typeof id);

    // ==============================
    // BUSCAR ALUMNO EN SUPABASE
    // ==============================

    const { data: alumno, error } =
        await supabaseClient
            .from("Alumnos")
            .select("*")
            .eq("id", id)
            .maybeSingle();

    if (error) {

        console.error(
            "ERROR AL BUSCAR ALUMNO:",
            error
        );

        alert(
            "No se pudo cargar el alumno desde Supabase.\n\n" +
            error.message
        );

        return;
    }

    if (!alumno) {

        alert("No se encontró el alumno.");
        return;
    }

    // ==============================
    // DATOS DEL ALUMNO
    // ==============================

    const nombre =
        alumno["NOMBRE"] || "";

    const dniAlumno =
        alumno["DNI"] || "";

    const celular =
    alumno["CELULAR"] || "";

const apoderado =
    String(alumno["APODERADO"] ?? "");

const telefonoApoderado =
    String(alumno["TELEFONO APODERADO"] ?? "");

const correo =
    alumno["CORREO"] || "";

    const fechaNacimiento =
    alumno["FECHA DE NACIMIENTO"] || "";

const fechaNacimientoMostrar =
    formatearFecha(fechaNacimiento);

    const plan =
        alumno["MONTO"] ||
        alumno["PLAN"] ||
        0;

    const fechaInicio =
        alumno["FECHA INICIO"] || "";

    const vencimiento =
        alumno["FECHA VENCIMIENTO"] || "";
console.log("🔎 FECHA INICIO:", alumno["FECHA INICIO"]);
console.log("🔎 FECHA VENCIMIENTO:", alumno["FECHA VENCIMIENTO"]);
        function formatearFecha(fecha) {

    if (!fecha) return "";

    const texto =
        String(fecha).trim();

    // Evitar mostrar textos de los campos de fecha
    if (
        texto === "Selecciona una fecha." ||
        texto === "Selecciona una fecha" ||
        texto === "Seleccione una fecha." ||
        texto === "Seleccione una fecha"
    ) {
        return "";
    }

    // Aceptar / y -
    const partes =
        texto.split(/[-\/]/);

    if (partes.length !== 3) {
        return texto;
    }

    // YYYY-MM-DD
    if (partes[0].length === 4) {

        return (
            partes[2] +
            "-" +
            partes[1] +
            "-" +
            partes[0]
        );
    }

    // DD-MM-YYYY o DD/MM/YYYY
    return (
        partes[0] +
        "-" +
        partes[1] +
        "-" +
        partes[2]
    );
}

const fechaInicioMostrar =
    formatearFecha(fechaInicio);

const vencimientoMostrar =
    formatearFecha(vencimiento);


    // ==============================
    // IDENTIFICADOR PARA ASISTENCIAS
    // ==============================

    let registrosAsistencia = [];
    let errorAsistencia = null;

    if (dniAlumno) {

        // Si tiene DNI, buscamos por DNI
        const resultadoAsistencia =
            await supabaseClient
                .from("Asistencias")
                .select("DNI, NOMBRE, FECHA, ESTADO")
                .eq("DNI", dniAlumno)
                .order("FECHA", { ascending: false });

        registrosAsistencia =
            resultadoAsistencia.data || [];

        errorAsistencia =
            resultadoAsistencia.error;

    } else if (nombre) {

        // Si NO tiene DNI, buscamos por NOMBRE
        const resultadoAsistencia =
            await supabaseClient
                .from("Asistencias")
                .select("DNI, NOMBRE, FECHA, ESTADO")
                .eq("NOMBRE", nombre)
                .order("FECHA", { ascending: false });

        registrosAsistencia =
            resultadoAsistencia.data || [];

        errorAsistencia =
            resultadoAsistencia.error;
    }

    if (errorAsistencia) {

        console.error(
            "ERROR CARGANDO ASISTENCIAS:",
            errorAsistencia
        );

        alert(
            "No se pudieron cargar las asistencias.\n\n" +
            errorAsistencia.message
        );

        return;
    }

    const asistenciasAlumno =
        registrosAsistencia || [];


    // ==============================
    // ÚLTIMA ASISTENCIA
    // ==============================

    let ultimaAsistencia =
        "Sin registros";

    if (asistenciasAlumno.length > 0) {

        ultimaAsistencia =
    formatearFecha(asistenciasAlumno[0]["FECHA"]);
    }


    // ==============================
    // CALCULAR ASISTENCIA
    // ==============================

    const presentes =
        asistenciasAlumno.filter(
            function(a) {
                return a["ESTADO"] === "Presente";
            }
        ).length;

    const faltas =
        asistenciasAlumno.filter(
            function(a) {
                return a["ESTADO"] === "Falta";
            }
        ).length;

    const totalAsistencias =
        presentes + faltas;

    const porcentajeAsistencia =
        totalAsistencias > 0
            ? Math.round(
                (presentes / totalAsistencias) * 100
            )
            : 0;


    // ==============================
    // ESTADO DE MEMBRESÍA
    // ==============================

    const estadoMembresia =
        obtenerEstadoMembresia(
            vencimiento
        );


    // ==============================
    // PAGOS DESDE SUPABASE
    // ==============================

    let pagosAlumno = [];
    let errorPagos = null;

    if (dniAlumno) {

        // Si tiene DNI, buscamos pagos por DNI
        const resultadoPagos =
            await supabaseClient
                .from("Pagos")
                .select("*")
                .eq("DNI", dniAlumno)
                .order("FECHA", { ascending: true });

        pagosAlumno =
            resultadoPagos.data || [];

        errorPagos =
            resultadoPagos.error;

    } else if (nombre) {

        // Si NO tiene DNI, buscamos pagos por NOMBRE
        const resultadoPagos =
            await supabaseClient
                .from("Pagos")
                .select("*")
                .eq("NOMBRE", nombre)
                .order("FECHA", { ascending: true });

        pagosAlumno =
            resultadoPagos.data || [];

        errorPagos =
            resultadoPagos.error;
    }

    if (errorPagos) {

        console.error(
            "ERROR CARGANDO PAGOS:",
            errorPagos
        );

        alert(
            "No se pudieron cargar los pagos.\n\n" +
            errorPagos.message
        );

        return;
    }

    const pagos =
        pagosAlumno || [];


    // ==============================
    // HISTORIAL DE PAGOS
    // ==============================

    let historial = "";

    if (pagos.length === 0) {

        historial = `
            <p>No hay pagos registrados.</p>
        `;

    } else {

        pagos
            .slice()
            .reverse()
            .forEach(function(pago) {

                historial += `
                    <div class="row">
                        <span>
                         ${formatearFecha(pago["FECHA"]) || ""}
                        </span>

                        <strong>
                            S/${Number(
                                pago["MONTO"] || 0
                            ).toFixed(2)}
                        </strong>
                    </div>
                `;

            });
    }

    // ==============================
    // ÚLTIMO PAGO
    // ==============================

    let ultimoPagoTexto =
        "Sin pagos registrados";

    if (pagos.length > 0) {

        const ultimoPago =
            pagos[pagos.length - 1];

        ultimoPagoTexto =
            "S/" +
            Number(
                ultimoPago["MONTO"] || 0
            ).toFixed(2) +
            " — " +
           (formatearFecha(ultimoPago["FECHA"]) || "");
    }


    // ==============================
    // PANTALLA
    // ==============================

    const pantalla =
        document.getElementById(
            "pantallaFichaAlumno"
        );

    const contenido =
        document.getElementById(
            "contenidoFichaAlumno"
        );

    if (!pantalla || !contenido) {

        alert(
            "No se encontró la pantalla de ficha."
        );

        return;
    }


    // ==============================
    // FICHA DEL ALUMNO
    // ==============================

    contenido.innerHTML = `

        <div class="card">

            <h3>${nombre}</h3>

            <p>
                <strong>DNI:</strong>
                ${dniAlumno || "Sin DNI"}
            </p>

            <p>
                <strong>Celular:</strong>
                ${celular}
            </p>

            <button
                type="button"
                class="primary-button"
                onclick="abrirWhatsApp('${celular}', '${nombre}')">
                📱 WhatsApp
            </button>

            <p>
                <strong>Correo:</strong>
                ${correo || "No registrado"}
            </p>

            <p>
                <strong>Nacimiento:</strong>
              ${fechaNacimientoMostrar || "No registrado"}
            </p>

            <p>
                <strong>Disciplina:</strong>
                MMA
            </p>

        </div>


        <div class="card">

            <h3>💳 Membresía</h3>

            <p class="estado-membresia ${estadoMembresia.clase}">

                <strong>Estado:</strong>
                ${estadoMembresia.texto}

                <br>

                <small>
                    ${estadoMembresia.detalle}
                </small>

            </p>

            <p>
    <strong>Plan:</strong>
    ${alumno["DURACIONPLAN"] || "Sin plan"} MESES
</p>

            <p>
                <strong>📅 Fecha de inicio:</strong>
                 ${fechaInicioMostrar}
            </p>

            <p>
                <strong>📅 Fecha de vencimiento:</strong>
               ${vencimientoMostrar}
            </p>

            <p>
                <strong>💰 Último pago:</strong>
                ${ultimoPagoTexto}
            </p>

        </div>


        <div class="card">

            <h3>📋 Asistencia</h3>

            <p>
                📅
                <strong>Última asistencia:</strong>
                ${ultimaAsistencia}
            </p>

            <p>
                ✅ Presentes:
                ${presentes}
            </p>

            <p>
                ❌ Faltas:
                ${faltas}
            </p>

            <p>
                <strong>
                    📊 Asistencia:
                    ${porcentajeAsistencia}%
                </strong>
            </p>

        </div>


        <div class="card">

            <h3>💰 Historial de pagos</h3>

            ${historial}

        </div>

        <div class="card">

    <h3>👨‍👩‍👦 Apoderado</h3>

    <p>
        <strong>Apoderado:</strong>
        ${apoderado || "No registrado"}
    </p>

    <p>
        <strong>Teléfono:</strong>
        ${telefonoApoderado || "No registrado"}
    </p>

</div>

    `;


    document.getElementById(
        "pantallaAlumnos"
    ).style.display = "none";

    pantalla.style.display = "block";
}


function cerrarFichaAlumno() {

    const ficha = document.getElementById(
        "pantallaFichaAlumno"
    );

    const alumnos = document.getElementById(
        "pantallaAlumnos"
    );

    if (ficha) {
        ficha.style.display = "none";
    }

    if (alumnos) {
        alumnos.style.display = "block";
    }
}
function abrirWhatsApp(celular, nombre) {

    if (!celular) {
        alert("Este alumno no tiene celular registrado.");
        return;
    }

    const numero = String(celular).replace(/\D/g, "");

    if (numero.length < 9) {
        alert("El número de celular no es válido.");
        return;
    }

    const numeroWhatsApp =
        numero.startsWith("51")
            ? numero
            : "51" + numero;

    const mensaje =
        "Hola " + nombre +
        " 👋, te escribimos de CFT - Cyclops Fight Team 🥊. " +
        "Queríamos comunicarnos contigo. " +
        "Si necesitas información sobre tus entrenamientos o tu membresía, estamos aquí para ayudarte. 💪🥊";

    const url =
        "https://web.whatsapp.com/send?phone=" +
        numeroWhatsApp +
        "&text=" +
        encodeURIComponent(mensaje);

    window.location.href = url;
}

function abrirPagos() {

    const pantallas = document.querySelectorAll(".section");

    pantallas.forEach(function(pantalla) {
        pantalla.style.display = "none";
    });

    const pantalla = document.getElementById("pantallaPagos");

    if (!pantalla) {
        alert("No se encontró la pantalla de Pagos.");
        return;
    }

    pantalla.style.display = "block";

    cargarAlumnosEnPagos();
    mostrarHistorialPagos();

    pantalla.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
async function cargarAlumnosEnPagos() {

    const selector =
        document.getElementById("alumnoPago");

    const buscador =
        document.getElementById("buscarPago");

    if (!selector) return;

    selector.innerHTML =
        '<option value="">Cargando alumnos...</option>';

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select("id, DNI, NOMBRE")
            .order("NOMBRE", { ascending: true });

    if (error) {

        console.error(
            "ERROR CARGANDO ALUMNOS EN PAGOS:",
            error
        );

        selector.innerHTML =
            '<option value="">Error al cargar alumnos</option>';

        alert(
            "No se pudieron cargar los alumnos desde Supabase.\n\n" +
            error.message
        );

        return;
    }


    function mostrarAlumnosPago(textoBusqueda = "") {

        selector.innerHTML =
            '<option value="">Seleccionar alumno</option>';

        const texto =
            textoBusqueda
                .toLowerCase()
                .trim();

        (alumnos || []).forEach(function(alumno) {

            const nombre =
                String(
                    alumno["NOMBRE"] || ""
                );

            const dni =
                String(
                    alumno["DNI"] || ""
                );

            const textoCompleto =
                (
                    nombre +
                    " " +
                    dni
                ).toLowerCase();

            if (
                texto === "" ||
                textoCompleto.includes(texto)
            ) {

                const opcion =
                    document.createElement("option");

                opcion.value =
                    alumno["id"];

                opcion.textContent =
                    dni
                        ? nombre + " — DNI: " + dni
                        : nombre;

                selector.appendChild(opcion);
            }
        });
    }


    mostrarAlumnosPago();


    if (buscador) {

        buscador.value = "";

        buscador.oninput = function() {

            mostrarAlumnosPago(
                buscador.value
            );
        };
    }
}



function calcularAsistenciaAlumno(dni) {

    const asistencias = JSON.parse(
        localStorage.getItem("asistenciasCFT")
    ) || [];

    const registros = asistencias.filter(function(a) {
        return a.dni === dni;
    });

    const presentes = asistencias.filter(function(a) {
    return (!alumnoFiltro || a.dni === alumnoFiltro) &&
           a.estado === "Presente";
    }).length;

    const faltas = asistencias.filter(function(a) {
    return (!alumnoFiltro || a.dni === alumnoFiltro) &&
           a.estado === "Falta";
     }).length;

    const total = presentes + faltas;

    const porcentaje = total > 0
        ? Math.round((presentes / total) * 100)
        : 0;

    return {
        presentes: presentes,
        faltas: faltas,
        porcentaje: porcentaje
    };
}


async function registrarPago() {

    const alumnoId =
    document.getElementById("alumnoPago").value;

    const monto =
        document.getElementById("planPago").value;
        console.log("MONTO QUE ESTÁ LEYENDO:", monto);

    const duracionPlan =
        document.getElementById("duracionPago").value;

    const diaCiclo =
        document.getElementById("diaCicloPago").value;

    const fechaPago =
        document.getElementById("fechaPago").value;


    // ==============================
    // VALIDACIONES
    // ==============================

    if (
    !alumnoId ||
    !monto ||
    !duracionPlan ||
    !diaCiclo ||
    !fechaPago
) {
        alert("⚠️ Completa todos los campos.");
        return;
    }

    if (Number(monto) <= 0) {
        alert("⚠️ Ingresa un monto válido.");
        return;
    }

    if (
        Number(duracionPlan) <= 0 ||
        !Number.isInteger(Number(duracionPlan))
    ) {
        alert("⚠️ Ingresa una duración válida en meses.");
        return;
    }

    if (
        diaCiclo !== "1" &&
        diaCiclo !== "15"
    ) {
        alert(
            "⚠️ Selecciona el ciclo del día 1 o día 15."
        );
        return;
    }


    // ==============================
    // BUSCAR ALUMNO EN SUPABASE
    // ==============================

    const { data: alumno, error: errorAlumno } =
        await supabaseClient
            .from("Alumnos")
            .select("*")
           .eq("id", alumnoId)
            .maybeSingle();

    if (errorAlumno) {

        console.error(
            "ERROR BUSCANDO ALUMNO:",
            errorAlumno
        );

        alert(
            "No se pudo buscar el alumno.\n\n" +
            errorAlumno.message
        );

        return;
    }

    if (!alumno) {

        alert(
            "No se encontró el alumno en Supabase."
        );

        return;
    }


    // ==============================
    // CREAR FECHA DEL CICLO
    // ==============================

    const fechaPagoBase =
        new Date(
            fechaPago + "T00:00:00"
        );

    let fechaInicio =
        new Date(
            fechaPagoBase.getFullYear(),
            fechaPagoBase.getMonth(),
            Number(diaCiclo)
        );


    if (fechaInicio < fechaPagoBase) {

        fechaInicio.setMonth(
            fechaInicio.getMonth() + 1
        );
    }


    // ==============================
    // CALCULAR VENCIMIENTO
    // ==============================

    const vencimiento =
        new Date(fechaInicio);

    vencimiento.setMonth(
        vencimiento.getMonth() +
        Number(duracionPlan)
    );


    // ==============================
    // FORMATEAR FECHAS
    // ==============================

    function formatearFechaSQL(fecha) {

        const anio =
            fecha.getFullYear();

        const mes =
            String(
                fecha.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                fecha.getDate()
            ).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }


    const fechaInicioTexto =
        formatearFechaSQL(
            fechaInicio
        );

    const vencimientoTexto =
        formatearFechaSQL(
            vencimiento
        );

const fechaInicioAlumno =
    fechaInicioTexto.split("-").reverse().join("-");

const vencimientoAlumno =
    vencimientoTexto.split("-").reverse().join("-");

    // ==============================
    // ACTUALIZAR ALUMNO EN SUPABASE
    // ==============================

    const datosAlumno = {

        PLAN:
            Number(monto),

        MONTO:
            Number(monto),

        DURACIONPLAN:
            Number(duracionPlan),

        "DIA CICLO":
            Number(diaCiclo),

        "FECHA INICIO":
    fechaInicioAlumno,

"FECHA VENCIMIENTO":
    vencimientoAlumno

    };
console.log("📅 FECHA INICIO QUE SE VA A GUARDAR:", fechaInicioTexto);
console.log("📅 FECHA VENCIMIENTO QUE SE VA A GUARDAR:", vencimientoTexto);
console.log("📦 DATOS ALUMNO:", datosAlumno);

    const { error: errorActualizar } =
        await supabaseClient
            .from("Alumnos")
            .update(datosAlumno)
            .eq("id", alumnoId);


    if (errorActualizar) {

        console.error(
            "ERROR ACTUALIZANDO ALUMNO:",
            errorActualizar
        );

        alert(
            "No se pudo actualizar la membresía.\n\n" +
            errorActualizar.message
        );

        return;
    }


    // ==============================
    // REGISTRAR PAGO EN SUPABASE
    // ==============================

    const pago = {

        DNI:
            alumno["DNI"],

        NOMBRE:
            alumno["NOMBRE"],

        MONTO:
            Number(monto),

        PLAN:
            Number(monto),

        DURACIONPLAN:
            Number(duracionPlan),

        "DIA CICLO":
            Number(diaCiclo),

        FECHA:
            fechaPago
    };


    const { error: errorPago } =
        await supabaseClient
            .from("Pagos")
            .insert([pago]);


    if (errorPago) {

        console.error(
            "ERROR REGISTRANDO PAGO:",
            errorPago
        );

        alert(
            "La membresía se actualizó, pero no se pudo registrar el pago.\n\n" +
            errorPago.message
        );

        return;
    }


    console.log(
        "PAGO REGISTRADO EN SUPABASE:",
        pago
    );


    // ==============================
    // CONFIRMACIÓN
    // ==============================

    alert(
        "✅ Pago registrado correctamente.\n\n" +
        "Alumno: " +
        alumno["NOMBRE"] +
        "\nMonto: S/" +
        Number(monto).toFixed(2) +
        "\nDuración: " +
        duracionPlan +
        " meses" +
        "\nCiclo: Día " +
        diaCiclo +
        "Inicio: " + fechaInicioTexto.split("-").reverse().join("-") +
"\nVencimiento: " + vencimientoTexto.split("-").reverse().join("-")
    );


    // ==============================
    // LIMPIAR FORMULARIO
    // ==============================

    document.getElementById(
        "alumnoPago"
    ).value = "";

    document.getElementById(
        "planPago"
    ).value = "";

    document.getElementById(
        "duracionPago"
    ).value = "";

    document.getElementById(
        "diaCicloPago"
    ).value = "";

    document.getElementById(
        "fechaPago"
    ).value = "";


    // ==============================
    // ACTUALIZAR INGRESOS
    // ==============================

    await actualizarIngresosMes();


    // ==============================
    // VOLVER A LA FICHA
    // ==============================

    if (window.vieneDeFicha) {

    window.vieneDeFicha = false;

    document.getElementById(
        "pantallaPagos"
    ).style.display = "none";

   await verAlumno(
    alumno["id"]
);

} else {

    document.getElementById(
        "pantallaPagos"
    ).style.display = "none";

    abrirInicio();
}
}


async function registrarRenovacion(
    plan,
    fechaInicioTextoUsuario,
    duracionPlan,
    diaCiclo
) {

    // ==============================
    // BUSCAR ALUMNO EN SUPABASE
    // ==============================

    const { data: alumno, error: errorAlumno } =
        await supabaseClient
            .from("Alumnos")
            .select("*")
            .eq("id", alumnoEditando)
            .maybeSingle();

    if (errorAlumno) {

        console.error(
            "ERROR BUSCANDO ALUMNO:",
            errorAlumno
        );

        alert(
            "No se pudo buscar el alumno.\n\n" +
            errorAlumno.message
        );

        return;
    }

    if (!alumno) {

        alert("No se encontró el alumno.");

        return;
    }


    // ==============================
    // FECHA DE PAGO REAL
    // ==============================

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);


    // ==============================
    // FECHA DE INICIO ELEGIDA
    // ==============================

    const partesFecha =
        fechaInicioTextoUsuario.split("/");

    const diaInicio =
        Number(partesFecha[0]);

    const mesInicio =
        Number(partesFecha[1]);

    const anioInicio =
        Number(partesFecha[2]);


    const fechaInicio =
        new Date(
            anioInicio,
            mesInicio - 1,
            diaInicio
        );

    fechaInicio.setHours(0, 0, 0, 0);


    // ==============================
    // VENCIMIENTO
    // ==============================

    const vencimiento =
        new Date(fechaInicio);

    vencimiento.setMonth(
        vencimiento.getMonth() +
        Number(duracionPlan)
    );


    // ==============================
    // FORMATEAR FECHA SQL
    // ==============================

    function formatearFechaSQL(fecha) {

        const anio =
            fecha.getFullYear();

        const mes =
            String(
                fecha.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                fecha.getDate()
            ).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }


    const fechaPagoTexto =
        formatearFechaSQL(hoy);

    const fechaInicioSQL =
        formatearFechaSQL(fechaInicio);

    const vencimientoTexto =
        formatearFechaSQL(vencimiento);


    // ==============================
    // ACTUALIZAR ALUMNO
    // ==============================

    const datosAlumno = {

        PLAN:
            Number(plan),

        MONTO:
            Number(plan),

        DURACIONPLAN:
            Number(duracionPlan),

        "DIA CICLO":
            Number(diaCiclo),

        "FECHA INICIO":
            fechaInicioSQL
                .split("-")
                .reverse()
                .join("-"),

        "FECHA VENCIMIENTO":
            vencimientoTexto
                .split("-")
                .reverse()
                .join("-")
    };


    const { error: errorActualizar } =
        await supabaseClient
            .from("Alumnos")
            .update(datosAlumno)
            .eq("id", alumnoEditando);


    if (errorActualizar) {

        console.error(
            "ERROR ACTUALIZANDO ALUMNO:",
            errorActualizar
        );

        alert(
            "No se pudo actualizar la membresía.\n\n" +
            errorActualizar.message
        );

        return;
    }


    // ==============================
    // REGISTRAR PAGO
    // ==============================

    const pago = {

        DNI:
            alumno["DNI"],

        NOMBRE:
            alumno["NOMBRE"],

        MONTO:
            Number(plan),

        PLAN:
            Number(plan),

        DURACIONPLAN:
            Number(duracionPlan),

        "DIA CICLO":
            Number(diaCiclo),

        FECHA:
            fechaPagoTexto
    };


    const { error: errorPago } =
        await supabaseClient
            .from("Pagos")
            .insert([pago]);


    if (errorPago) {

        console.error(
            "ERROR REGISTRANDO PAGO:",
            errorPago
        );

        alert(
            "La membresía se actualizó, pero no se pudo registrar el pago.\n\n" +
            errorPago.message
        );

        return;
    }


    console.log(
        "PAGO GUARDADO EN SUPABASE:",
        pago
    );


    // ==============================
    // CONFIRMACIÓN
    // ==============================

    alert(
        "✅ Renovación registrada.\n\n" +

        "Alumno: " +
        alumno["NOMBRE"] +

        "\nMonto: S/" +
        Number(plan).toFixed(2) +

        "\nDuración: " +
        duracionPlan +
        " meses" +

        "\nFecha de pago: " +
        fechaPagoTexto
            .split("-")
            .reverse()
            .join("-") +

        "\nInicio: " +
        fechaInicioSQL
            .split("-")
            .reverse()
            .join("-") +

        "\nVencimiento: " +
        vencimientoTexto
            .split("-")
            .reverse()
            .join("-") +

        "\nDía de ciclo: " +
        diaCiclo
    );


    // ==============================
    // ACTUALIZAR DASHBOARD
    // ==============================

    await actualizarIngresosMes();

    await actualizarTotalAlumnos();

    await actualizarAlumnosVencidos();

    await actualizarAlumnosPorVencer();

    await actualizarAlertasMembresias();

    await actualizarAlumnosSinAsistencia();


    if (
        typeof actualizarDashboardInicio === "function"
    ) {

        await actualizarDashboardInicio();
    }


    // ==============================
    // VOLVER A CARGAR LA FICHA
    // ==============================

    await verAlumno(alumno["id"]);
}


async function mostrarHistorialPagos() {

    const contenedor =
        document.getElementById("listaPagos");

    if (!contenedor) return;

    contenedor.innerHTML =
        "<p>Cargando pagos...</p>";

    const { data: pagos, error } =
        await supabaseClient
            .from("Pagos")
            .select("DNI, NOMBRE, MONTO, FECHA")
            .order("FECHA", { ascending: false });

    if (error) {

        console.error(
            "ERROR CARGANDO PAGOS:",
            error
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar los pagos.</p>";

        alert(
            "Error al cargar pagos desde Supabase:\n\n" +
            error.message
        );

        return;
    }

    contenedor.innerHTML = "";

    if (!pagos || pagos.length === 0) {

        contenedor.innerHTML =
            "<p>No hay pagos registrados.</p>";

        return;
    }

    pagos.forEach(function(pago) {

        const elemento =
            document.createElement("div");

        elemento.className =
            "row";

        elemento.innerHTML = `
            <span>
                ${pago["NOMBRE"] || ""}
            </span>

            <strong>
                S/${Number(pago["MONTO"] || 0).toFixed(2)}
            </strong>

            <small>
              <div class="row">
    <span>
        ${formatearFecha(pago["FECHA"]) || ""}
    </span>

    <strong>
        S/${Number(
            pago["MONTO"] || 0
        ).toFixed(2)}
    </strong>
</div>
            </small>
        `;

        contenedor.appendChild(elemento);
    });
}

function abrirAsistencia() {

    const pantallas = document.querySelectorAll(".section");

    pantallas.forEach(function(pantalla) {
        pantalla.style.display = "none";
    });

    const pantalla = document.getElementById("pantallaAsistencia");
    const fecha = document.getElementById("fechaAsistencia");

    if (!pantalla) {
        alert("No se encontró la pantalla de Asistencia.");
        return;
    }

    if (fecha && !fecha.value) {

        const hoy = new Date();

        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        fecha.value = `${año}-${mes}-${dia}`;
    }

    if (fecha) {
        fecha.onchange = function() {
            cargarListaAsistencia();
            mostrarEstadisticasAsistencia();
        };
    }

    pantalla.style.display = "block";

    cargarListaAsistencia();
    mostrarEstadisticasAsistencia();

    pantalla.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
let cargandoListaAsistencia = false;

async function cargarListaAsistencia() {

    if (cargandoListaAsistencia) return;

    cargandoListaAsistencia = true;

    const contenedor =
        document.getElementById("listaAsistencia");

    if (!contenedor) {
        cargandoListaAsistencia = false;
        return;
    }


    const fecha =
        document.getElementById("fechaAsistencia").value;
const fechaSupabase = fecha;

    if (!fecha) {
        contenedor.innerHTML =
            "<p>Selecciona una fecha.</p>";
        return;
    }

    const alumnoFiltro =
        window.alumnoAsistenciaFiltro || null;

    contenedor.innerHTML =
        "<p>Cargando alumnos...</p>";

    // ==============================
    // CARGAR ALUMNOS DESDE SUPABASE
    // ==============================

    const { data: alumnos, error: errorAlumnos } =
        await supabaseClient
            .from("Alumnos")
            .select("id, DNI, NOMBRE, \"FECHA VENCIMIENTO\"")
            .order("NOMBRE", { ascending: true });
console.log("ALUMNOS RECIBIDOS:", alumnos);
console.log("CANTIDAD DE ALUMNOS:", alumnos?.length);
console.log("📋 TODOS LOS ALUMNOS:", alumnos);
    if (errorAlumnos) {

        console.error(
            "ERROR CARGANDO ALUMNOS:",
            errorAlumnos
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar los alumnos.</p>";

        alert(
            "Error al cargar alumnos:\n\n" +
            errorAlumnos.message
        );

        return;
    }

    let alumnosFiltrados =
        alumnos || [];
// ==============================
// SOLO ALUMNOS CON MEMBRESÍA VIGENTE
// ==============================

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

   alumnosFiltrados = alumnosFiltrados.filter(function(alumno) {

    const fechaVencimiento = alumno["FECHA VENCIMIENTO"];

    if (!fechaVencimiento) {
        return false;
    }
let vencimiento;

// ==============================
// INTERPRETAR FECHA DE VENCIMIENTO
// ==============================

const fechaTexto = String(fechaVencimiento).trim();
const partes = fechaTexto.split(/[-\/]/);

if (partes.length === 3) {

    let dia;
    let mes;
    let anio;

    // FORMATO: YYYY-MM-DD
    if (partes[0].length === 4) {

        anio = Number(partes[0]);
        mes = Number(partes[1]);
        dia = Number(partes[2]);

    } else {

        // FORMATO: DD/MM/YYYY o DD-MM-YYYY

        dia = Number(partes[0]);
        mes = Number(partes[1]);
        anio = Number(partes[2]);

        if (anio < 100) {
            anio += 2000;
        }
    }

    vencimiento = new Date(anio, mes - 1, dia);

} else {

    vencimiento = new Date(fechaVencimiento);
}

vencimiento.setHours(0, 0, 0, 0);

    const activo = vencimiento >= hoy;

    if (activo) {
        console.log(
            "🟢 ACTIVO:",
            alumno["NOMBRE"],
            "| FECHA:",
            fechaVencimiento,
            "| INTERPRETADA COMO:",
            vencimiento
        );
    }

    return activo;
});

// ==============================
// ELIMINAR DUPLICADOS SOLO EN ASISTENCIA
// ==============================

const alumnosUnicos = [];
const nombresVistos = new Set();

alumnosFiltrados.forEach(function(alumno) {

    const nombre = (alumno["NOMBRE"] || "").trim().toUpperCase();

    if (!nombresVistos.has(nombre)) {
        nombresVistos.add(nombre);
        alumnosUnicos.push(alumno);
    }
});

alumnosFiltrados = alumnosUnicos;
console.log(
    "🟡 ACTIVOS ANTES DE QUITAR DUPLICADOS:",
    alumnosFiltrados.length
);
console.log(
    "✅ ALUMNOS ACTIVOS SIN DUPLICADOS:",
    alumnosFiltrados.length
);

    // ==============================
    // FILTRO DE UN SOLO ALUMNO
    // ==============================
console.log("🟢 ACTIVOS DESPUÉS DE QUITAR DUPLICADOS:", alumnosFiltrados.length);
console.log("🟠 VALOR DE alumnoFiltro:", alumnoFiltro);
    if (alumnoFiltro) {
    alumnosFiltrados =
        alumnosFiltrados.filter(
            function(alumno) {
                return String(alumno["id"]) === String(alumnoFiltro);
            }
        );
}
console.log("🔵 ALUMNOS FINALES PARA MOSTRAR:", alumnosFiltrados.length);

    // ==============================
    // CARGAR ASISTENCIAS DE LA FECHA
    // ==============================

    const { data: asistencias, error: errorAsistencias } =
        await supabaseClient
            .from("Asistencias")
            .select("DNI, NOMBRE, FECHA, ESTADO")
            .eq("FECHA", fechaSupabase);

    if (errorAsistencias) {

        console.error(
            "ERROR CARGANDO ASISTENCIAS:",
            errorAsistencias
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar las asistencias.</p>";

        alert(
            "Error al cargar asistencias:\n\n" +
            errorAsistencias.message
        );

        return;
    }

    contenedor.innerHTML = "";

    if (alumnosFiltrados.length === 0) {

        contenedor.innerHTML =
            "<p>No hay alumnos registrados.</p>";

        return;
    }

    // ==============================
    // MOSTRAR ALUMNOS
    // ==============================

    alumnosFiltrados.forEach(
        function(alumno) {

            const dni =
                alumno["DNI"];

            const nombre =
                alumno["NOMBRE"];

            const asistenciaAlumno =
    (asistencias || []).find(
        function(a) {
            if (dni) {
                return a["DNI"] === dni;
            }

            return a["NOMBRE"] === nombre;
        }
    );

            const estadoActual =
                asistenciaAlumno
                    ? asistenciaAlumno["ESTADO"]
                    : "";

            const fila =
                document.createElement("div");

            fila.className = "row";

            fila.innerHTML = `

                <strong>
                    ${nombre}
                </strong>

                <button
                    type="button"
                    onclick="marcarAsistencia('${alumno["id"]}', 'Presente')"
                >
                    ✅ Presente
                </button>

                <button
                    type="button"
                    onclick="marcarAsistencia('${alumno["id"]}', 'Falta')"
                >
                    ❌ Falta
                </button>

                <span>
                    ${estadoActual}
                </span>

            `;

            contenedor.appendChild(fila);
        }
    );
    cargandoListaAsistencia = false;
}
async function marcarAsistencia(alumnoId, estado) {

    console.log("========================================");
    console.log("🟢 MARCAR ASISTENCIA");
    console.log("Alumno ID:", alumnoId);
    console.log("Estado solicitado:", estado);
    console.log("========================================");

    const fecha =
        document.getElementById("fechaAsistencia").value;

    if (!fecha) {
        alert("Selecciona una fecha.");
        return;
    }

    // ==========================================
    // BUSCAR ALUMNO
    // ==========================================

    const { data: alumno, error: errorAlumno } =
        await supabaseClient
            .from("Alumnos")
            .select("id, DNI, NOMBRE")
            .eq("id", alumnoId)
            .maybeSingle();

    if (errorAlumno) {
        console.error("❌ ERROR BUSCANDO ALUMNO:", errorAlumno);

        alert(
            "No se pudo buscar el alumno.\n\n" +
            errorAlumno.message
        );

        return;
    }

    if (!alumno) {
        alert("No se encontró el alumno en Supabase.");
        return;
    }

    const dniAlumno = alumno["DNI"] || null;
    const nombreAlumno = alumno["NOMBRE"] || "";

    console.log("👤 ALUMNO:", alumno);

    // ==========================================
    // LA FECHA YA VIENE COMO YYYY-MM-DD
    // NO SE DEBE HACER reverse()
    // ==========================================

    const fechaSupabase = fecha;

    // ==========================================
    // BUSCAR TODAS LAS ASISTENCIAS DEL ALUMNO
    // ==========================================

    let consultaExistente =
        supabaseClient
            .from("Asistencias")
            .select(
                "id, ESTADO, DNI, NOMBRE, FECHA, HORARIO"
            )
            .eq("FECHA", fechaSupabase);

    if (dniAlumno) {

        consultaExistente =
            consultaExistente.eq("DNI", dniAlumno);

    } else {

        consultaExistente =
            consultaExistente
                .is("DNI", null)
                .eq("NOMBRE", nombreAlumno);
    }

    const {
        data: existentes,
        error: errorExistente
    } = await consultaExistente;

    if (errorExistente) {

        console.error(
            "❌ ERROR COMPROBANDO ASISTENCIA:",
            errorExistente
        );

        alert(
            "No se pudo comprobar la asistencia.\n\n" +
            errorExistente.message
        );

        return;
    }

    console.log(
        "🔎 ASISTENCIAS ENCONTRADAS:",
        existentes
    );

    // ==========================================
    // NO EXISTE → CREAR
    // ==========================================

    if (!existentes || existentes.length === 0) {

        console.log(
            "🆕 NO EXISTE ASISTENCIA → CREAR"
        );

        const horario = prompt(
            "🕐 ¿A qué horario asiste el alumno?\n\n" +
            "1 = 8:00 AM\n" +
            "2 = 4:00 PM\n" +
            "3 = 5:00 PM\n" +
            "4 = 6:00 PM\n" +
            "5 = 7:00 PM\n" +
            "6 = 8:00 PM"
        );

        if (horario === null) return;

        const horarios = {
            "1": "8:00 AM",
            "2": "4:00 PM",
            "3": "5:00 PM",
            "4": "6:00 PM",
            "5": "7:00 PM",
            "6": "8:00 PM"
        };

        if (!horarios[horario]) {

            alert(
                "⚠️ Selecciona un horario válido del 1 al 6."
            );

            return;
        }

        const registro = {

            DNI: alumno["DNI"],
            NOMBRE: alumno["NOMBRE"],
            FECHA: fechaSupabase,
            ESTADO: estado,
            HORARIO: horarios[horario]

        };

        const {
            data: insertado,
            error: errorInsertar
        } = await supabaseClient
            .from("Asistencias")
            .insert([registro])
            .select();

        if (errorInsertar) {

            console.error(
                "❌ ERROR GUARDANDO ASISTENCIA:",
                errorInsertar
            );

            alert(
                "No se pudo guardar la asistencia.\n\n" +
                errorInsertar.message
            );

            return;
        }

        console.log(
            "✅ ASISTENCIA CREADA:",
            insertado
        );

        await cargarListaAsistencia();
        await mostrarEstadisticasAsistencia();

        return;
    }

    // ==========================================
    // MISMO ESTADO → ELIMINAR
    // SIN PREGUNTAR HORARIO
    // ==========================================

    if (
        existentes.every(
            a => a["ESTADO"] === estado
        )
    ) {

        console.log(
            "🗑️ MISMO ESTADO → ELIMINANDO TODOS LOS REGISTROS"
        );

        const ids =
            existentes.map(
                a => a["id"]
            );

        for (const id of ids) {

            const {
                data: eliminado,
                error: errorEliminar
            } = await supabaseClient
                .from("Asistencias")
                .delete()
                .eq("id", id)
                .select();

            if (errorEliminar) {

                console.error(
                    "❌ ERROR ELIMINANDO ID:",
                    id,
                    errorEliminar
                );

                alert(
                    "No se pudo eliminar la asistencia.\n\n" +
                    errorEliminar.message
                );

                return;
            }

            console.log(
                "🗑️ ELIMINADO ID:",
                id,
                eliminado
            );
        }

        console.log(
            "✅ TODOS LOS REGISTROS ELIMINADOS"
        );

        await cargarListaAsistencia();
        await mostrarEstadisticasAsistencia();

        return;
    }

    // ==========================================
    // ESTADO DIFERENTE → ACTUALIZAR
    // AQUÍ SÍ PREGUNTA HORARIO
    // ==========================================

    console.log(
        "🔄 ESTADO DIFERENTE → ACTUALIZANDO"
    );

    const principal = existentes[0];

    const horario = prompt(
        "🕐 ¿A qué horario asiste el alumno?\n\n" +
        "1 = 8:00 AM\n" +
        "2 = 4:00 PM\n" +
        "3 = 5:00 PM\n" +
        "4 = 6:00 PM\n" +
        "5 = 7:00 PM\n" +
        "6 = 8:00 PM"
    );

    if (horario === null) return;

    const horarios = {

        "1": "8:00 AM",
        "2": "4:00 PM",
        "3": "5:00 PM",
        "4": "6:00 PM",
        "5": "7:00 PM",
        "6": "8:00 PM"

    };

    if (!horarios[horario]) {

        alert(
            "⚠️ Selecciona un horario válido del 1 al 6."
        );

        return;
    }

    const {
        data: actualizado,
        error: errorActualizar
    } = await supabaseClient
        .from("Asistencias")
        .update({

            ESTADO: estado,
            HORARIO: horarios[horario]

        })
        .eq("id", principal["id"])
        .select();

    if (errorActualizar) {

        console.error(
            "❌ ERROR ACTUALIZANDO:",
            errorActualizar
        );

        alert(
            "No se pudo actualizar la asistencia.\n\n" +
            errorActualizar.message
        );

        return;
    }

    console.log(
        "✅ ASISTENCIA ACTUALIZADA:",
        actualizado
    );

    // ==========================================
    // ELIMINAR DUPLICADOS
    // ==========================================

    const duplicados =
        existentes.slice(1);

    for (const duplicado of duplicados) {

        const {
            error: errorEliminarDuplicado
        } = await supabaseClient
            .from("Asistencias")
            .delete()
            .eq("id", duplicado["id"]);

        if (errorEliminarDuplicado) {

            console.error(
                "⚠️ ERROR ELIMINANDO DUPLICADO:",
                duplicado["id"],
                errorEliminarDuplicado
            );

        } else {

            console.log(
                "🧹 DUPLICADO ELIMINADO:",
                duplicado["id"]
            );
        }
    }

    await cargarListaAsistencia();
    await mostrarEstadisticasAsistencia();
}

async function calcularAsistenciaAlumno(dni) {

    const { data: registros, error } =
        await supabaseClient
            .from("Asistencias")
            .select("DNI, ESTADO")
            .eq("DNI", dni);

    if (error) {
        console.error(
            "ERROR CALCULANDO ASISTENCIA:",
            error
        );

        return {
            presentes: 0,
            faltas: 0,
            porcentaje: 0
        };
    }

    const asistencias =
        registros || [];

    const presentes =
        asistencias.filter(function(a) {
            return a["ESTADO"] === "Presente";
        }).length;

    const faltas =
        asistencias.filter(function(a) {
            return a["ESTADO"] === "Falta";
        }).length;

    const total =
        presentes + faltas;

    const porcentaje =
        total > 0
            ? Math.round((presentes / total) * 100)
            : 0;

    return {
        presentes: presentes,
        faltas: faltas,
        porcentaje: porcentaje
    };
}

async function mostrarEstadisticasAsistencia() {

    const contenedor =
        document.getElementById("estadisticasAsistencia");

    if (!contenedor) return;

    const elementoFecha =
        document.getElementById("fechaAsistencia");

    if (!elementoFecha) return;

    const fechaSeleccionada =
        elementoFecha.value;

        const fechaSupabase = fechaSeleccionada;

    if (!fechaSeleccionada) {
        contenedor.innerHTML =
            "<p>Selecciona una fecha.</p>";
        return;
    }

    const { data: asistencias, error } =
        await supabaseClient
            .from("Asistencias")
            .select("ESTADO")
           .eq("FECHA", fechaSupabase);

    if (error) {
        console.error(
            "ERROR CARGANDO ESTADISTICAS:",
            error
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar las estadísticas.</p>";

        alert(
            "Error al cargar estadísticas de asistencia:\n\n" +
            error.message
        );

        return;
    }

    const registros =
        asistencias || [];

    const presentes =
        registros.filter(function(a) {
            return a["ESTADO"] === "Presente";
        }).length;

    const faltas =
        registros.filter(function(a) {
            return a["ESTADO"] === "Falta";
        }).length;

    const total =
        presentes + faltas;

    const porcentaje =
        total > 0
            ? Math.round((presentes / total) * 100)
            : 0;

    contenedor.innerHTML = `
        <div class="row">
            <strong>📊 Resumen de asistencia</strong>
            <span>✅ ${presentes} presentes</span>
            <span>❌ ${faltas} faltas</span>
            <strong>📈 ${porcentaje}% asistencia</strong>
        </div>
    `;
}
async function actualizarTotalAlumnos() {

    const elemento =
        document.getElementById("totalAlumnos");

    if (!elemento) return;

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select("DNI, \"FECHA VENCIMIENTO\"");

    if (error) {

        console.error(
            "ERROR CONTANDO ALUMNOS ACTIVOS:",
            error
        );

        elemento.textContent = "0";

        return;
    }

    let activos = 0;

    (alumnos || []).forEach(function(alumno) {

        const estado =
            obtenerEstadoMembresia(
                alumno["FECHA VENCIMIENTO"]
            );

        if (estado.clase === "activo") {
            activos++;
        }
    });

    elemento.textContent = activos;

}

async function actualizarAlumnosVencidos() {

    const elemento =
        document.getElementById("alumnosVencidos");

    if (!elemento) return;

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select('"NOMBRE", "FECHA VENCIMIENTO"');

    if (error) {

        console.error(
            "ERROR CONTANDO ALUMNOS VENCIDOS:",
            error
        );

        elemento.textContent = "0";

        return;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);


    const vencidos =
        (alumnos || []).filter(function(alumno) {

            const fechaTexto =
                String(
                    alumno["FECHA VENCIMIENTO"] || ""
                ).trim();

            if (!fechaTexto) {
                return false;
            }


            // =================================
            // FORMATO REAL:
            // DD/MM/YYYY
            // =================================

            const partes =
                fechaTexto.split("/");

            if (partes.length !== 3) {
                return false;
            }

            const dia =
                Number(partes[0]);

            const mes =
                Number(partes[1]);

            const anio =
                Number(partes[2]);


            const vencimiento =
                new Date(
                    anio,
                    mes - 1,
                    dia
                );

            vencimiento.setHours(0, 0, 0, 0);


            return vencimiento < hoy;
        });


    elemento.textContent =
        vencidos.length;
}


async function actualizarAlumnosPorVencer() {

    const elemento =
        document.getElementById("alumnosPorVencer");

    if (!elemento) return;

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select('"DNI", "FECHA VENCIMIENTO"');

    if (error) {

        console.error(
            "ERROR CONTANDO ALUMNOS POR VENCER:",
            error
        );

        elemento.textContent = "0";

        return;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(hoy);

    limite.setDate(
        limite.getDate() + 7
    );

    const porVencer =
        (alumnos || []).filter(function(alumno) {

            if (!alumno["FECHA VENCIMIENTO"]) {
                return false;
            }

            const vencimiento =
                new Date(
                    alumno["FECHA VENCIMIENTO"] +
                    "T00:00:00"
                );

            vencimiento.setHours(0, 0, 0, 0);

            return (
                vencimiento >= hoy &&
                vencimiento <= limite
            );
        });

    elemento.textContent =
        porVencer.length;
}

async function actualizarIngresosMes() {

    console.log("🔥 ENTRÓ A actualizarIngresosMes");

    const elemento =
        document.getElementById("ingresosMes");

    if (!elemento) return;

    const { data: pagos, error } =
        await supabaseClient
            .from("Pagos")
            .select("MONTO, FECHA");

    if (error) {

        console.error(
            "ERROR CARGANDO INGRESOS DEL MES:",
            error
        );

        return;
    }

    const hoy = new Date();

    const añoActual =
        hoy.getFullYear();

    const mesActual =
        hoy.getMonth();

    let total = 0;

    (pagos || []).forEach(function(pago) {

        if (!pago["FECHA"]) {
            return;
        }

        const textoFecha =
            String(pago["FECHA"]).trim();

        let fechaPago = null;

        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(textoFecha)) {

            const partes =
                textoFecha.split("-");

            fechaPago = new Date(
                Number(partes[0]),
                Number(partes[1]) - 1,
                Number(partes[2])
            );

        }

        // DD/MM/YYYY
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(textoFecha)) {

            const partes =
                textoFecha.split("/");

            fechaPago = new Date(
                Number(partes[2]),
                Number(partes[1]) - 1,
                Number(partes[0])
            );
        }

        if (!fechaPago || isNaN(fechaPago.getTime())) {
            return;
        }

        if (
            fechaPago.getFullYear() === añoActual &&
            fechaPago.getMonth() === mesActual
        ) {

            total +=
                Number(pago["MONTO"] || 0);
        }

    });

    console.log(
        "💰 INGRESOS DEL MES CALCULADOS:",
        total
    );

    elemento.textContent =
        total.toLocaleString("es-PE");
}
function exportarDatos() {

    const datos = {
        alumnos: JSON.parse(localStorage.getItem("alumnosCFT")) || [],
        pagos: JSON.parse(localStorage.getItem("pagosCFT")) || [],
        asistencias: JSON.parse(localStorage.getItem("asistenciasCFT")) || []
    };

    const contenido = JSON.stringify(datos, null, 2);

    const archivo = new Blob(
        [contenido],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "CFT-Manager-respaldo.json";

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);

    alert("✅ Respaldo creado correctamente.");
}
function abrirMas() {

    const pantalla = document.getElementById("pantallaMas");

    if (pantalla) {
        pantalla.style.display = "block";
    }

}
function importarDatos(event) {

    const archivo = event.target.files[0];

    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function(e) {

        try {

            const datos = JSON.parse(e.target.result);

            if (
                !datos.alumnos ||
                !datos.pagos ||
                !datos.asistencias
            ) {
                alert("❌ El archivo no es un respaldo válido de CFT Manager.");
                return;
            }

            localStorage.setItem(
                "alumnosCFT",
                JSON.stringify(datos.alumnos)
            );

            localStorage.setItem(
                "pagosCFT",
                JSON.stringify(datos.pagos)
            );

            localStorage.setItem(
                "asistenciasCFT",
                JSON.stringify(datos.asistencias)
            );

            alert("✅ Datos restaurados correctamente.");

            location.reload();

        } catch (error) {

            alert("❌ No se pudo leer el archivo de respaldo.");

        }

    };

    lector.readAsText(archivo);
}
let alumnoEditando = null;

async function editarAlumno() {

    if (alumnoEditando === null || alumnoEditando === undefined) {
        alert("No se ha seleccionado ningún alumno.");
        return;
    }

    let alumno = null;
    let error = null;


    /* =========================
       BUSCAR POR ID
    ========================= */

    const resultadoId =
        await supabaseClient
            .from("Alumnos")
            .select("*")
            .eq("id", alumnoEditando)
            .maybeSingle();

    alumno = resultadoId.data;
    error = resultadoId.error;


    /* =========================
       SI NO ENCUENTRA POR ID,
       BUSCAR POR DNI
    ========================= */

    if (!alumno) {

        const resultadoDni =
            await supabaseClient
                .from("Alumnos")
                .select("*")
                .eq("DNI", alumnoEditando)
                .maybeSingle();

        alumno = resultadoDni.data;
        error = resultadoDni.error;
    }


    if (error) {

        console.error(
            "Error al buscar alumno:",
            error
        );

        alert(
            "No se pudo buscar el alumno."
        );

        return;
    }


    if (!alumno) {

        alert(
            "No se encontró el alumno."
        );

        return;
    }


    /* =========================
       GUARDAR EL ID REAL
    ========================= */

    alumnoEditando = alumno["id"];


    /* =========================
       CARGAR DATOS
    ========================= */

    document.getElementById("editarNombre").value =
        alumno["NOMBRE"] || "";

    document.getElementById("editarDni").value =
        alumno["DNI"] || "";

    document.getElementById("editarCelular").value =
        alumno["CELULAR"] || "";

    document.getElementById("editarCorreo").value =
        alumno["CORREO"] || "";

    document.getElementById("editarFechaNacimiento").value =
        alumno["FECHA DE NACIMIENTO"] || "";

    document.getElementById("editarPlan").value =
        alumno["PLAN"] || "130";

    document.getElementById("editarFechaInicio").value =
        alumno["FECHA INICIO"] || "";


    /* =========================
       APODERADO
    ========================= */

    document.getElementById("editarApoderado").value =
        alumno["APODERADO"] || "";

    document.getElementById("editarTelefonoApoderado").value =
        alumno["TELEFONO APODERADO"] || "";


    /* =========================
       MOSTRAR EDITAR
    ========================= */

    document.getElementById("pantallaFichaAlumno").style.display =
        "none";

    document.getElementById("pantallaEditarAlumno").style.display =
        "block";
}

function obtenerEstadoMembresia(vencimiento) {

    if (!vencimiento) {
        return {
            texto: "🔴 VENCIDO",
            clase: "vencido",
            dias: null,
            detalle: "Membresía vencida"
        };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const textoFecha = String(vencimiento).trim();
const fechaNormalizada = textoFecha.replace(/\//g, "-");
    let fechaVencimiento;

    // ==========================================
    // FORMATO PRINCIPAL: DD-MM-YYYY
    // Ejemplo: 15-12-2026
    // ==========================================

    if (/^\d{2}-\d{2}-\d{4}$/.test(fechaNormalizada)) {

    const partes = fechaNormalizada.split("-");

    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const anio = Number(partes[2]);

    fechaVencimiento = new Date(
        anio,
        mes - 1,
        dia
    );

} else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {

    const partes = fechaNormalizada.split("-");

    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    fechaVencimiento = new Date(
        anio,
        mes - 1,
        dia
    );

} else if (/^\d{2}-\d{2}-\d{2}$/.test(fechaNormalizada)) {

    const partes = fechaNormalizada.split("-");

    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const anio = 2000 + Number(partes[2]);

    fechaVencimiento = new Date(
        anio,
        mes - 1,
        dia
    );

} else {

    fechaVencimiento = new Date(fechaNormalizada);
}

    // ==========================================
    // VALIDAR FECHA
    // ==========================================

    if (isNaN(fechaVencimiento.getTime())) {

        return {
            texto: "🔴 VENCIDO",
            clase: "vencido",
            dias: null,
            detalle: "Fecha de vencimiento inválida"
        };
    }

    fechaVencimiento.setHours(0, 0, 0, 0);

    const diferencia = Math.round(
        (fechaVencimiento - hoy) /
        (1000 * 60 * 60 * 24)
    );

    // ==========================================
    // VENCIDO
    // ==========================================

    if (diferencia < 0) {

        const diasVencido = Math.abs(diferencia);

        return {
            texto: "🔴 VENCIDO",
            clase: "vencido",
            dias: diferencia,
            detalle: diasVencido === 1
                ? "Venció hace 1 día"
                : "Venció hace " +
                  diasVencido +
                  " días"
        };
    }

    // ==========================================
    // VENCE HOY
    // ==========================================

    if (diferencia === 0) {

        return {
            texto: "🟠 POR VENCER",
            clase: "por-vencer",
            dias: 0,
            detalle: "Vence hoy"
        };
    }

    // ==========================================
    // POR VENCER: 1 A 7 DÍAS
    // ==========================================

    if (diferencia <= 7) {

        return {
            texto: "🟠 POR VENCER",
            clase: "por-vencer",
            dias: diferencia,
            detalle: diferencia === 1
                ? "Falta 1 día para vencer"
                : "Faltan " +
                  diferencia +
                  " días para vencer"
        };
    }

    // ==========================================
    // ACTIVO
    // ==========================================

    return {
        texto: "🟢 ACTIVO",
        clase: "activo",
        dias: diferencia,
        detalle: "Faltan " +
                 diferencia +
                 " días para vencer"
    };
}
function registrarPagoDesdeFicha() {

    if (!alumnoEditando) {
        alert("No se ha seleccionado un alumno.");
        return;
    }

    const pantallaFicha = document.getElementById(
        "pantallaFichaAlumno"
    );

    const pantallaPagos = document.getElementById(
        "pantallaPagos"
    );

    const selector = document.getElementById(
        "alumnoPago"
    );

    if (!pantallaPagos || !selector) {
        alert("No se encontró la pantalla de pagos.");
        return;
    }

    if (pantallaFicha) {
        pantallaFicha.style.display = "none";
    }

    pantallaPagos.style.display = "block";

    cargarAlumnosEnPagos();

    selector.value = alumnoEditando;

    window.vieneDeFicha = true;
}
function renovarMembresia() {

    if (!alumnoEditando) {
        alert("No se ha seleccionado un alumno.");
        return;
    }

    const monto = prompt(
        "💰 Monto de la renovación\n\n" +
        "Ingresa el monto cobrado al alumno:"
    );

    if (monto === null) return;

    const montoLimpio = monto.trim();

    if (
        montoLimpio === "" ||
        isNaN(montoLimpio) ||
        Number(montoLimpio) <= 0
    ) {
        alert("⚠️ Ingresa un monto válido.");
        return;
    }

    const duracion = prompt(
        "⏱️ Duración del plan\n\n" +
        "¿Cuántos meses cubrirá este pago?\n\n" +
        "Puedes ingresar cualquier cantidad.\n" +
        "Ejemplo: 1, 2, 4, 5, 6, 12..."
    );

    if (duracion === null) return;

    const duracionLimpia = duracion.trim();

    if (
        duracionLimpia === "" ||
        isNaN(duracionLimpia) ||
        Number(duracionLimpia) <= 0 ||
        !Number.isInteger(Number(duracionLimpia))
    ) {
        alert("⚠️ Ingresa una cantidad de meses válida.");
        return;
    }

    // ================================
    // SELECCIÓN DE FECHA DE INICIO
    // ================================

    const hoyFechaInicio = new Date();

    const fechaHoy =
        hoyFechaInicio.getFullYear() +
        "-" +
        String(hoyFechaInicio.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(hoyFechaInicio.getDate()).padStart(2, "0");

    const contenedorFecha = document.createElement("div");

    contenedorFecha.style.position = "fixed";
    contenedorFecha.style.top = "50%";
    contenedorFecha.style.left = "50%";
    contenedorFecha.style.transform = "translate(-50%, -50%)";
    contenedorFecha.style.background = "white";
    contenedorFecha.style.padding = "25px";
    contenedorFecha.style.borderRadius = "12px";
    contenedorFecha.style.boxShadow = "0 5px 30px rgba(0,0,0,0.3)";
    contenedorFecha.style.zIndex = "99999";
    contenedorFecha.style.textAlign = "center";

    const tituloFecha = document.createElement("div");

    tituloFecha.textContent =
        "📅 Fecha de inicio de la nueva membresía";

    tituloFecha.style.fontWeight = "bold";
    tituloFecha.style.marginBottom = "15px";

    const inputFecha = document.createElement("input");

    inputFecha.type = "date";
    inputFecha.value = fechaHoy;

    inputFecha.style.fontSize = "18px";
    inputFecha.style.padding = "8px";
    inputFecha.style.marginBottom = "15px";

    const botonAceptar = document.createElement("button");

    botonAceptar.textContent = "Continuar";

    botonAceptar.style.display = "block";
    botonAceptar.style.margin = "0 auto";
    botonAceptar.style.padding = "10px 20px";
    botonAceptar.style.cursor = "pointer";

    contenedorFecha.appendChild(tituloFecha);
    contenedorFecha.appendChild(inputFecha);
    contenedorFecha.appendChild(botonAceptar);

    document.body.appendChild(contenedorFecha);

    inputFecha.focus();

    // Esperamos la selección de fecha
    botonAceptar.onclick = function () {

        const fechaSeleccionada = inputFecha.value;

        if (!fechaSeleccionada) {
            alert("⚠️ Selecciona una fecha.");
            return;
        }

        // Convertimos YYYY-MM-DD → DD/MM/YYYY
        const partesFecha = fechaSeleccionada.split("-");

        const anio = Number(partesFecha[0]);
        const mes = Number(partesFecha[1]);
        const dia = Number(partesFecha[2]);

        const fechaInicioLimpia =
            String(dia).padStart(2, "0") +
            "/" +
            String(mes).padStart(2, "0") +
            "/" +
            anio;

        // Eliminamos el selector
        contenedorFecha.remove();

        const fechaInicioDate =
            new Date(anio, mes - 1, dia);

        if (
            fechaInicioDate.getFullYear() !== anio ||
            fechaInicioDate.getMonth() !== mes - 1 ||
            fechaInicioDate.getDate() !== dia
        ) {
            alert(
                "⚠️ La fecha seleccionada no es válida."
            );
            return;
        }

        const diaCiclo = dia;

        const confirmar = confirm(
            "¿Confirmar renovación?\n\n" +
            "Monto: S/" +
            Number(montoLimpio).toFixed(2) +
            "\nDuración: " +
            Number(duracionLimpia) +
            " meses" +
            "\nFecha de inicio: " +
            fechaInicioLimpia +
            "\nDía de ciclo: " +
            diaCiclo
        );

        if (!confirmar) return;

        registrarRenovacion(
            montoLimpio,
            fechaInicioLimpia,
            Number(duracionLimpia),
            diaCiclo
        );
    };
}

async function verAsistenciaDesdeFicha() {

    if (!alumnoEditando) {

        alert(
            "No se ha seleccionado ningún alumno."
        );

        return;
    }

    const pantallaFicha =
        document.getElementById(
            "pantallaFichaAlumno"
        );

    const pantallaAsistencia =
        document.getElementById(
            "pantallaAsistencia"
        );

    if (!pantallaAsistencia) {

        alert(
            "No se encontró la pantalla de asistencia."
        );

        return;
    }

    if (pantallaFicha) {
        pantallaFicha.style.display = "none";
    }

    pantallaAsistencia.style.display = "block";

    window.alumnoAsistenciaFiltro =
        alumnoEditando;

    const { data: alumno, error } =
    await supabaseClient
        .from("Alumnos")
        .select("id, DNI, NOMBRE")
        .eq("id", alumnoEditando)
        .maybeSingle();

    if (error) {

        console.error(
            "ERROR CARGANDO ALUMNO PARA ASISTENCIA:",
            error
        );

        alert(
            "No se pudo cargar el alumno.\n\n" +
            error.message
        );

        return;
    }

    const titulo =
        document.getElementById(
            "tituloAlumnoAsistencia"
        );

    if (titulo && alumno) {

        titulo.innerHTML = `
            <div class="row">

                <strong>
                    👤 ${alumno["NOMBRE"] || ""}
                </strong>

                <small>
                    DNI: ${alumno["DNI"] || ""}
                </small>

            </div>
        `;
    }

    await cargarListaAsistencia();

    await mostrarEstadisticasAsistencia();
}

async function actualizarAlertasMembresias() {
    console.log("🟡 ENTRÓ A actualizarAlertasMembresias");

    const alertaVencidos =
        document.getElementById("alertaVencidos");

    const alertaPorVencer =
        document.getElementById("alertaPorVencer");

    if (!alertaVencidos || !alertaPorVencer) {
        return;
    }

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select('"NOMBRE", "FECHA VENCIMIENTO"');

    if (error) {

        console.error(
            "ERROR CARGANDO ALERTAS DE MEMBRESÍAS:",
            error
        );

        return;
    }


    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);


    const limite = new Date(hoy);

    limite.setDate(
        limite.getDate() + 7
    );

    limite.setHours(0, 0, 0, 0);


    let vencidos = 0;

    let porVencer = 0;


    // =================================
    // LEER FECHA DD/MM/YYYY
    // =================================

   function convertirFecha(fechaTexto) {

    const texto =
        String(fechaTexto || "").trim();

    if (!texto) {
        return null;
    }

    const partes =
        texto.split(/[\/-]/);

    if (partes.length !== 3) {
        return null;
    }

    let dia;
    let mes;
    let anio;

    // YYYY-MM-DD
    if (partes[0].length === 4) {

        anio = Number(partes[0]);
        mes = Number(partes[1]);
        dia = Number(partes[2]);

    } else {

        // DD/MM/YYYY o DD-MM-YYYY
        dia = Number(partes[0]);
        mes = Number(partes[1]);
        anio = Number(partes[2]);

        if (anio < 100) {
            anio += 2000;
        }
    }

    if (
        !dia ||
        !mes ||
        !anio ||
        mes < 1 ||
        mes > 12 ||
        dia < 1 ||
        dia > 31
    ) {
        return null;
    }

    const fecha =
        new Date(
            anio,
            mes - 1,
            dia
        );

    fecha.setHours(0, 0, 0, 0);

    return fecha;
}


    // =================================
    // CONTAR
    // =================================

    (alumnos || []).forEach(function(alumno) {

        const vencimiento =
            convertirFecha(
                alumno["FECHA VENCIMIENTO"]
            );

        if (!vencimiento) {
            return;
        }


        if (vencimiento < hoy) {

            vencidos++;

        } else if (
            vencimiento >= hoy &&
            vencimiento <= limite
        ) {

            porVencer++;

        }

    });


    // =================================
    // MOSTRAR RESULTADOS
    // =================================

    alertaVencidos.textContent =
        "🔴 " +
        vencidos +
        " membresías vencidas";

    alertaPorVencer.textContent =

    console.log("🟡 CONTADOR CALCULADO:", porVencer);
    alertaPorVencer.textContent =
        "🟡 " +
        porVencer +
        " membresías vencen en 7 días";
}

async function actualizarAlumnosSinAsistencia() {

    const alerta =
        document.getElementById(
            "alertaSinAsistencia"
        );

    if (!alerta) return;

    const { data: alumnos, error: errorAlumnos } =
        await supabaseClient
            .from("Alumnos")
            .select('DNI, NOMBRE, "FECHA VENCIMIENTO"')

    if (errorAlumnos) {

        console.error(
            "ERROR CARGANDO ALUMNOS:",
            errorAlumnos
        );

        return;
    }

    const { data: asistencias, error: errorAsistencias } =
        await supabaseClient
            .from("Asistencias")
            .select("DNI, NOMBRE, FECHA");

    if (errorAsistencias) {

        console.error(
            "ERROR CARGANDO ASISTENCIAS:",
            errorAsistencias
        );

        return;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    let sinAsistencia = 0;

    (alumnos || []).forEach(function(alumno) {

        const fechaVencimiento =
            alumno["FECHA VENCIMIENTO"];

        // SIN FECHA = HISTÓRICO
        if (!fechaVencimiento) {
            return;
        }

        let vencimiento;

        const fechaTexto =
            String(fechaVencimiento).trim();

        const partes =
            fechaTexto.split(/[-\/]/);

        if (partes.length === 3) {

            let dia;
            let mes;
            let anio;

            // FORMATO YYYY-MM-DD
            if (partes[0].length === 4) {

                anio = Number(partes[0]);
                mes = Number(partes[1]);
                dia = Number(partes[2]);

            } else {

                // FORMATO DD/MM/YYYY o DD-MM-YYYY

                dia = Number(partes[0]);
                mes = Number(partes[1]);
                anio = Number(partes[2]);

                if (anio < 100) {
                    anio += 2000;
                }
            }

            vencimiento =
                new Date(
                    anio,
                    mes - 1,
                    dia
                );

        } else {

            vencimiento =
                new Date(fechaVencimiento);
        }

        vencimiento.setHours(0, 0, 0, 0);

        // VENCIDO = NO SE CUENTA
        if (vencimiento < hoy) {
            return;
        }

        const registrosAlumno =
            (asistencias || []).filter(
                function(asistencia) {

                    return (
                        String(asistencia["NOMBRE"] || "")
                            .trim()
                            .toUpperCase() ===
                        String(alumno["NOMBRE"] || "")
                            .trim()
                            .toUpperCase()
                    );

                }
            );

        // NUNCA REGISTRÓ ASISTENCIA
        if (registrosAlumno.length === 0) {

            sinAsistencia++;

            return;
        }

        let ultimaFecha = null;

        registrosAlumno.forEach(
            function(registro) {

                if (!registro["FECHA"]) {
                    return;
                }

                const fecha =
                    new Date(
                        registro["FECHA"] +
                        "T00:00:00"
                    );

                if (
                    !ultimaFecha ||
                    fecha > ultimaFecha
                ) {
                    ultimaFecha = fecha;
                }
            }
        );

        if (!ultimaFecha) return;

        ultimaFecha.setHours(0, 0, 0, 0);

        const diferencia =
            Math.floor(
                (hoy - ultimaFecha) /
                (1000 * 60 * 60 * 24)
            );

        if (diferencia >= 7) {

            sinAsistencia++;

            console.log(
                "🔵 SUMANDO SIN ASISTENCIA:",
                alumno["NOMBRE"],
                diferencia,
                "días"
            );
        }

    });

    console.log(
        "🔵 CONTADOR SIN ASISTENCIA ACTIVOS:",
        sinAsistencia
    );

    alerta.textContent =
        "🔵 " +
        sinAsistencia +
        " alumnos sin asistir +7 días";
}

async function mostrarAlumnosVencidos() {

    const contenedor =
        document.getElementById("listaAlumnosVencidos");

    if (!contenedor) return;

    // =========================
    // ABRIR / CERRAR
    // =========================

    if (
        contenedor.innerHTML.trim() !== "" &&
        contenedor.dataset.abierto === "true"
    ) {
        contenedor.innerHTML = "";
        contenedor.dataset.abierto = "false";
        return;
    }

    contenedor.dataset.abierto = "true";

    contenedor.innerHTML =
        "<p>Cargando...</p>";

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select(
                'id, DNI, NOMBRE, CELULAR, "FECHA VENCIMIENTO"'
            );

    if (error) {

        console.error(
            "ERROR CARGANDO ALUMNOS VENCIDOS:",
            error
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar las membresías vencidas.</p>";

        return;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const convertirFecha = function(fechaTexto) {

        const texto =
            String(fechaTexto || "").trim();

        if (!texto) {
            return null;
        }

        const partes =
            texto.split(/[\/-]/);

        if (partes.length !== 3) {
            return null;
        }

        let dia;
        let mes;
        let anio;

        if (partes[0].length === 4) {

            anio = Number(partes[0]);
            mes = Number(partes[1]);
            dia = Number(partes[2]);

        } else {

            dia = Number(partes[0]);
            mes = Number(partes[1]);
            anio = Number(partes[2]);

            if (anio < 100) {
                anio += 2000;
            }
        }

        if (!dia || !mes || !anio) {
            return null;
        }

        const fecha =
            new Date(
                anio,
                mes - 1,
                dia
            );

        fecha.setHours(0, 0, 0, 0);

        return fecha;
    };

    const vencidos =
        (alumnos || []).filter(function(alumno) {

            const fechaTexto =
                String(
                    alumno["FECHA VENCIMIENTO"] || ""
                ).trim();

            if (!fechaTexto) {
                return false;
            }

            const vencimiento =
                convertirFecha(fechaTexto);

            if (!vencimiento) {
                return false;
            }

            return vencimiento < hoy;
        });

    vencidos.sort(function(a, b) {

        const fechaA =
            convertirFecha(
                a["FECHA VENCIMIENTO"]
            );

        const fechaB =
            convertirFecha(
                b["FECHA VENCIMIENTO"]
            );

        return fechaB - fechaA;
    });

    if (vencidos.length === 0) {

        contenedor.innerHTML =
            `
            <div class="card">

                <h3>
                    🔴 Membresías vencidas (0)
                </h3>

                <p>
                    No hay membresías vencidas.
                </p>

            </div>
            `;

        return;
    }

    contenedor.innerHTML = `

        <div class="card">

            <h3>
                🔴 Membresías vencidas (${vencidos.length})
            </h3>

            ${vencidos.map(function(alumno) {

                return `

                    <div class="row">

                        <span>

                            <strong>
                                ${alumno["NOMBRE"] || ""}
                            </strong>

                            <br>

                            <small>
                                Venció:
                                ${alumno["FECHA VENCIMIENTO"] || ""}
                            </small>

                        </span>

                        <button
                            type="button"
                            onclick="verAlumno('${alumno["id"]}')">

                            👤 Ver ficha

                        </button>

                        <button
                            type="button"
                            onclick="whatsappRenovacion('${alumno["id"]}')">

                            📲 WhatsApp

                        </button>

                    </div>

                `;

            }).join("")}

        </div>

    `;
}

async function enviarWhatsAppRenovacion(dni) {

    const { data: alumno, error } =
        await supabaseClient
            .from("Alumnos")
            .select(
                'id, DNI, NOMBRE, CELULAR, "FECHA VENCIMIENTO"'
            )
            .eq("DNI", dni)
            .maybeSingle();

    if (error) {

        console.error(
            "ERROR BUSCANDO ALUMNO PARA WHATSAPP:",
            error
        );

        alert(
            "No se pudo cargar el alumno.\n\n" +
            error.message
        );

        return;
    }

    if (!alumno) {

        alert(
            "No se encontró el alumno."
        );

        return;
    }

    if (!alumno["CELULAR"]) {

        alert(
            "Este alumno no tiene celular registrado."
        );

        return;
    }

    let numero =
        String(alumno["CELULAR"])
            .replace(/\D/g, "");

    if (numero.length === 9) {
        numero = "51" + numero;
    }

    if (numero.length < 11) {

        alert(
            "El número de celular no es válido."
        );

        return;
    }

    let fechaVencimientoTexto =
        alumno["FECHA VENCIMIENTO"] || "";

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            fechaVencimientoTexto
        )
    ) {
        fechaVencimientoTexto =
            fechaVencimientoTexto
                .split("-")
                .reverse()
                .join("/");
    }

    const mensaje =
        "Hola " +
        (alumno["NOMBRE"] || "") +
        " 👋\n\n" +

        "Te escribimos de CFT - Cyclops Fight Team 🥊\n\n" +

        "Tu membresía se encuentra vencida (" +
        fechaVencimientoTexto +
        ").\n\n" +

        "Si deseas renovar tu membresía, escríbenos para coordinar tu renovación. 💪🥊\n\n" +

        "¡Te esperamos en CFT!";

    const url =
        "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(mensaje);

    window.open(
        url,
        "_blank"
    );
}

async function mostrarAlumnosPorVencer() {

    const contenedor =
        document.getElementById("listaAlumnosPorVencer");

    if (!contenedor) return;
// ABRIR / CERRAR
if (
    contenedor.innerHTML.trim() !== "" &&
    contenedor.dataset.abierto === "true"
) {
    contenedor.innerHTML = "";
    contenedor.dataset.abierto = "false";
    return;
}

contenedor.dataset.abierto = "true";
    contenedor.innerHTML =
        "<p>Cargando...</p>";

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select(
                'id, DNI, NOMBRE, "FECHA VENCIMIENTO"'
            );

    if (error) {

        console.error(
            "ERROR CARGANDO ALUMNOS POR VENCER:",
            error
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar las membresías por vencer.</p>";

        return;
    }

    const porVencer =
    (alumnos || []).filter(function(alumno) {

        const estado =
            obtenerEstadoMembresia(
                alumno["FECHA VENCIMIENTO"]
            );

        return estado.clase === "por-vencer";
    });

    if (porVencer.length === 0) {

        contenedor.innerHTML =
            "<p>No hay membresías por vencer.</p>";

        return;
    }

    contenedor.innerHTML = `
        <div class="card">

            <h3>🟡 Membresías por vencer</h3>

            ${porVencer.map(function(alumno) {

                return `
                    <div class="row">

                        <span>

                            <strong>
                                ${alumno["NOMBRE"] || ""}
                            </strong>

                            <br>

                            <small>
                                Vence:
                                ${alumno["FECHA VENCIMIENTO"] || ""}
                            </small>

                        </span>

                        <button
    type="button"
    onclick="verAlumno('${alumno["id"]}')">
    👤 Ver ficha
</button>

                        <button
    type="button"
    onclick="whatsappRenovacion('${alumno["id"]}')">
    📲 WhatsApp
</button>

                    </div>
                `;

            }).join("")}

        </div>
    `;
}

async function mostrarAlumnosSinAsistencia() {

    const contenedor =
        document.getElementById(
            "listaAlumnosSinAsistencia"
        );

    if (!contenedor) return;
// ABRIR / CERRAR
if (
    contenedor.innerHTML.trim() !== "" &&
    contenedor.dataset.abierto === "true"
) {
    contenedor.innerHTML = "";
    contenedor.dataset.abierto = "false";
    return;
}

contenedor.dataset.abierto = "true";
    contenedor.innerHTML =
        "<p>Cargando...</p>";

    const { data: alumnos, error: errorAlumnos } =
        await supabaseClient
            .from("Alumnos")
            .select("DNI, NOMBRE");

    if (errorAlumnos) {

        console.error(
            "ERROR CARGANDO ALUMNOS:",
            errorAlumnos
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar los alumnos.</p>";

        return;
    }

    const { data: asistencias, error: errorAsistencias } =
        await supabaseClient
            .from("Asistencias")
            .select("id, DNI, FECHA");

    if (errorAsistencias) {

        console.error(
            "ERROR CARGANDO ASISTENCIAS:",
            errorAsistencias
        );

        contenedor.innerHTML =
            "<p>No se pudieron cargar las asistencias.</p>";

        return;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const alumnosSinAsistencia = [];

    (alumnos || []).forEach(function(alumno) {

        const registros =
            (asistencias || []).filter(
                function(asistencia) {

                    return asistencia["DNI"] ===
                        alumno["DNI"];
                }
            );

        // Nunca ha registrado asistencia
        if (registros.length === 0) {

            alumnosSinAsistencia.push({
                alumno: alumno,
                ultimaFecha: null
            });

            return;
        }

        let ultimaFecha = null;

        registros.forEach(function(registro) {

            if (!registro["FECHA"]) {
                return;
            }

            const fecha =
                new Date(
                    registro["FECHA"] +
                    "T00:00:00"
                );

            if (
                !ultimaFecha ||
                fecha > ultimaFecha
            ) {
                ultimaFecha = fecha;
            }
        });

        if (!ultimaFecha) return;

        ultimaFecha.setHours(0, 0, 0, 0);

        const diasSinAsistir =
            Math.floor(
                (hoy - ultimaFecha) /
                (1000 * 60 * 60 * 24)
            );

        if (diasSinAsistir >= 7) {

            alumnosSinAsistencia.push({
                alumno: alumno,
                ultimaFecha: ultimaFecha,
                dias: diasSinAsistir
            });
        }
    });

    if (alumnosSinAsistencia.length === 0) {

        contenedor.innerHTML =
            "<p>Todos los alumnos están asistiendo.</p>";

        return;
    }

    contenedor.innerHTML = `
        <div class="card">

            <h3>🔵 Alumnos sin asistencia +7 días</h3>

            ${alumnosSinAsistencia.map(function(item) {

                const ultima =
                    item.ultimaFecha
                        ? item.ultimaFecha
                            .toISOString()
                            .split("T")[0]
                        : "Nunca registrada";

                const dias =
                    item.dias !== undefined
                        ? item.dias + " días"
                        : "Sin asistencia";

                return `
                    <div class="row">

                        <span>

                            <strong>
                                ${item.alumno["NOMBRE"] || ""}
                            </strong>

                            <br>

                            <small>
                                Última asistencia:
                                ${ultima}
                            </small>

                            <br>

                            <small>
                                ${dias}
                            </small>

                        </span>

                        <button
    <button
    type="button"
    onclick="verAlumno('${item.alumno["id"]}')"
    style="padding: 8px 12px; margin-right: 8px;">
    👤 Ver ficha
</button>

                        <button
                            type="button"
                            onclick="enviarWhatsAppInasistencia('${item.alumno["DNI"]}')">
                            📲 WhatsApp
                        </button>

                    </div>
                `;

            }).join("")}

        </div>
    `;
}

async function enviarWhatsAppInasistencia(dni) {

    const { data: alumno, error: errorAlumno } =
        await supabaseClient
            .from("Alumnos")
            .select("DNI, NOMBRE, CELULAR")
            .eq("DNI", dni)
            .maybeSingle();

    if (errorAlumno) {

        console.error(
            "ERROR BUSCANDO ALUMNO:",
            errorAlumno
        );

        alert(
            "No se pudo cargar el alumno.\n\n" +
            errorAlumno.message
        );

        return;
    }

    if (!alumno) {

        alert(
            "No se encontró el alumno."
        );

        return;
    }

    if (!alumno["CELULAR"]) {

        alert(
            "Este alumno no tiene celular registrado."
        );

        return;
    }

    const { data: registros, error: errorAsistencias } =
        await supabaseClient
            .from("Asistencias")
            .select("FECHA")
            .eq("DNI", dni)
            .order("FECHA", { ascending: false });

    if (errorAsistencias) {

        console.error(
            "ERROR CARGANDO ASISTENCIAS:",
            errorAsistencias
        );

        alert(
            "No se pudieron cargar las asistencias.\n\n" +
            errorAsistencias.message
        );

        return;
    }

    let ultimaFecha = null;

    (registros || []).forEach(function(registro) {

        if (!registro["FECHA"]) {
            return;
        }

        const fecha =
            new Date(
                registro["FECHA"] +
                "T00:00:00"
            );

        if (
            !ultimaFecha ||
            fecha > ultimaFecha
        ) {
            ultimaFecha = fecha;
        }
    });

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    let diasSinAsistir = 0;

    if (ultimaFecha) {

        ultimaFecha.setHours(0, 0, 0, 0);

        diasSinAsistir =
            Math.floor(
                (hoy - ultimaFecha) /
                (1000 * 60 * 60 * 24)
            );
    }

    let mensaje;

    if (ultimaFecha) {

        mensaje =
            "Hola " +
            alumno["NOMBRE"] +
            " 👋\n\n" +

            "Te escribimos de CFT - Cyclops Fight Team 🥊\n\n" +

            "Hemos notado que llevas " +
            diasSinAsistir +
            " días sin venir a entrenar.\n\n" +

            "Queríamos saber si todo está bien contigo. 💪\n\n" +

            "Si necesitas algo o tienes alguna dificultad para venir, cuéntanos. Estamos para ayudarte.\n\n" +

            "¡Te esperamos nuevamente en CFT! 🥊🔥";

    } else {

        mensaje =
            "Hola " +
            alumno["NOMBRE"] +
            " 👋\n\n" +

            "Te escribimos de CFT - Cyclops Fight Team 🥊\n\n" +

            "Hemos notado que todavía no registras asistencia y queríamos saber si todo está bien.\n\n" +

            "Si necesitas ayuda para comenzar tus entrenamientos, escríbenos. 💪\n\n" +

            "¡Te esperamos en CFT! 🥊🔥";
    }

    let numero =
        alumno["CELULAR"]
            .replace(/\D/g, "");

    if (numero.length === 9) {
        numero = "51" + numero;
    }

    if (numero.length < 11) {

        alert(
            "El número de celular no es válido."
        );

        return;
    }

    const url =
        "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(mensaje);

    window.open(
        url,
        "_blank"
    );
}
async function enviarWhatsAppDesdeFicha() {

    if (!alumnoEditando) {
        alert("No se ha seleccionado ningún alumno.");
        return;
    }


    /* =========================
       BUSCAR ALUMNO EN SUPABASE
    ========================= */

    const { data: alumno, error } =
    await supabaseClient
        .from("Alumnos")
        .select("*")
        .eq("id", alumnoEditando)
        .maybeSingle();


    if (error) {

        console.error(
            "ERROR BUSCANDO ALUMNO PARA WHATSAPP:",
            error
        );

        alert(
            "No se pudo obtener los datos del alumno.\n\n" +
            error.message
        );

        return;
    }


    if (!alumno) {

        alert(
            "No se encontró el alumno en Supabase."
        );

        return;
    }


    /* =========================
       COMPROBAR CELULAR
    ========================= */

    if (!alumno["CELULAR"]) {

        alert(
            "Este alumno no tiene celular registrado."
        );

        return;
    }


    /* =========================
       PREPARAR NÚMERO
    ========================= */

    let numero =
        String(
            alumno["CELULAR"]
        ).replace(/\D/g, "");


    if (numero.length === 9) {

        numero =
            "51" +
            numero;
    }


    if (numero.length < 11) {

        alert(
            "El número de celular no es válido."
        );

        return;
    }


    /* =========================
       MENSAJE
    ========================= */

    const mensaje =
        "Hola " +
        alumno["NOMBRE"] +
        " 👋\n\n" +

        "Te escribimos de CFT - Cyclops Fight Team 🥊\n\n" +

        "¿Cómo estás? Queríamos comunicarnos contigo.\n\n" +

        "Si necesitas información sobre tus entrenamientos o tu membresía, estamos aquí para ayudarte. 💪🥊\n\n" +

        "¡Te esperamos en CFT! 🔥";


    /* =========================
       ABRIR WHATSAPP
    ========================= */

    const url =
        "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(mensaje);


    window.open(
        url,
        "_blank"
    );
}
async function guardarEdicionAlumno() {

    const botonGuardar = [...document.querySelectorAll("button")]
        .find(b => b.innerText.trim() === "💾 Guardar cambios");

    if (botonGuardar?.disabled) {
        console.log("🚫 Guardado ya en proceso. Segundo clic ignorado.");
        return;
    }

    if (botonGuardar) {
        botonGuardar.disabled = true;
        botonGuardar.innerText = "⏳ Guardando...";
    }

    try {

        if (alumnoEditando === null || alumnoEditando === undefined) {
            alert("No se ha seleccionado ningún alumno.");
            return;
        }

        const nombre =
            document.getElementById("editarNombre").value.trim();

        const nuevoDniTexto =
            document.getElementById("editarDni").value.trim();

        const nuevoDni =
            nuevoDniTexto !== ""
                ? Number(nuevoDniTexto)
                : null;

        const celular =
            document.getElementById("editarCelular").value.trim();

        const correo =
            document.getElementById("editarCorreo").value.trim();

        const fechaNacimientoValor =
            document.getElementById("editarFechaNacimiento").value;

        const fechaNacimiento =
            fechaNacimientoValor || null;

        const plan =
            Number(
                document.getElementById("editarPlan").value
            );

        const duracionPlan =
            Number(
                document.getElementById("editarDuracionPlan").value
            );

        const fechaInicioValor =
            document.getElementById("editarFechaInicio").value;

        const fechaInicio =
            fechaInicioValor || null;

        // =========================
        // CALCULAR FECHA DE VENCIMIENTO
        // =========================

        let fechaVencimiento = null;

        if (fechaInicio && duracionPlan) {

            const partes = fechaInicio.split("-");

            const anio = Number(partes[0]);
            const mes = Number(partes[1]);
            const dia = Number(partes[2]);

            const fecha = new Date(
                anio,
                mes - 1,
                dia
            );

            fecha.setMonth(
                fecha.getMonth() + duracionPlan
            );

            const diaVencimiento =
                String(fecha.getDate()).padStart(2, "0");

            const mesVencimiento =
                String(fecha.getMonth() + 1).padStart(2, "0");

            const anioVencimiento =
                fecha.getFullYear();

            fechaVencimiento =
                `${diaVencimiento}/${mesVencimiento}/${anioVencimiento}`;
        }

        const apoderado =
            document.getElementById("editarApoderado").value.trim();

        const telefonoApoderadoTexto =
            document.getElementById("editarTelefonoApoderado").value.trim();

        const telefonoApoderado =
            telefonoApoderadoTexto !== ""
                ? Number(telefonoApoderadoTexto)
                : null;

        if (!nombre) {
            alert("El nombre es obligatorio.");
            return;
        }

        /* =========================
           OBTENER ALUMNO ACTUAL
        ========================= */

        const { data: alumnoActual, error: errorAlumno } =
            await supabaseClient
                .from("Alumnos")
                .select("*")
                .eq("id", alumnoEditando)
                .maybeSingle();

        if (errorAlumno) {

            console.error(
                "Error obteniendo alumno:",
                errorAlumno
            );

            alert("No se pudo obtener el alumno.");
            return;
        }

        if (!alumnoActual) {

            alert(
                "NO ENCONTRÓ ALUMNO EN GUARDAR EDICIÓN. ID: " +
                alumnoEditando
            );

            return;
        }

        const dniAnterior =
            alumnoActual["DNI"] || "";

        /* =========================
           DATOS A ACTUALIZAR
        ========================= */

        const datosActualizados = {

            NOMBRE: nombre,

            DNI: nuevoDni,

            CELULAR: celular,

            CORREO: correo,

            "FECHA DE NACIMIENTO":
                fechaNacimiento,

            PLAN: plan,

            MONTO: plan,

            DURACIONPLAN: duracionPlan,

            "FECHA INICIO":
                fechaInicio,

            "FECHA VENCIMIENTO":
                fechaVencimiento,

            APODERADO:
                apoderado,

            "TELEFONO APODERADO":
                telefonoApoderado
        };

        console.log(
            "Datos que se van a guardar:",
            datosActualizados
        );

        /* =========================
           GUARDAR EN SUPABASE
        ========================= */

        const { error: errorUpdate } =
            await supabaseClient
                .from("Alumnos")
                .update(datosActualizados)
                .eq("id", alumnoEditando);

        if (errorUpdate) {

            console.error(
                "ERROR AL GUARDAR:",
                errorUpdate
            );

            alert(
                "No se pudieron guardar los cambios: " +
                errorUpdate.message
            );

            return;
        }

        /* =========================
           SI CAMBIÓ EL DNI
        ========================= */

        if (
            dniAnterior &&
            nuevoDni &&
            dniAnterior !== nuevoDni
        ) {

            await supabaseClient
                .from("Pagos")
                .update({
                    DNI: nuevoDni
                })
                .eq("DNI", dniAnterior);

            await supabaseClient
                .from("Asistencias")
                .update({
                    DNI: nuevoDni
                })
                .eq("DNI", dniAnterior);
        }

    
        // =========================
        // ACTUALIZAR DASHBOARD
        // =========================

        await actualizarIngresosMes();

        if (typeof actualizarDashboardInicio === "function") {
            await actualizarDashboardInicio();
        }

        alert(
            "✅ Cambios guardados correctamente."
        );

        document.getElementById("pantallaEditarAlumno").style.display =
            "none";

        document.getElementById("pantallaFichaAlumno").style.display =
            "block";

        await verAlumno(alumnoEditando);

    } finally {

        const botonActual = [...document.querySelectorAll("button")]
            .find(b =>
                b.innerText.trim() === "⏳ Guardando..." ||
                b.innerText.trim() === "💾 Guardar cambios"
            );

        if (botonActual) {
            botonActual.disabled = false;
            botonActual.innerText = "💾 Guardar cambios";
        }

        console.log("🔓 Guardado de edición terminado.");
    }
}


function cancelarEdicionAlumno() {

    document.getElementById(
        "pantallaEditarAlumno"
    ).style.display = "none";

    document.getElementById(
        "pantallaFichaAlumno"
    ).style.display = "block";
}
async function mostrarAlumnosPorRenovar() {

    const lista =
        document.getElementById(
            "listaAlumnos"
        );

    if (!lista) return;

    lista.innerHTML =
        "<p>Cargando renovaciones...</p>";

    const { data: alumnos, error } =
        await supabaseClient
            .from("Alumnos")
            .select(
                'id, DNI, NOMBRE, CELULAR, "FECHA VENCIMIENTO"'
            );

    if (error) {

        console.error(
            "ERROR CARGANDO RENOVACIONES:",
            error
        );

        lista.innerHTML =
            "<p>No se pudieron cargar las renovaciones.</p>";

        return;
    }

    let vencidos = 0;
    let porVencer = 0;

    const pendientes =
        (alumnos || []).filter(
            function(alumno) {

                const estado =
                    obtenerEstadoMembresia(
                        alumno["FECHA VENCIMIENTO"]
                    );

                if (
                    estado.clase ===
                    "vencido"
                ) {

                    vencidos++;

                    return true;
                }

                if (
                    estado.clase ===
                    "por-vencer"
                ) {

                    porVencer++;

                    return true;
                }

                return false;
            }
        );

    if (pendientes.length === 0) {

        lista.innerHTML = `
            <div class="card">

                <h3>📲 Renovaciones</h3>

                <p>
                    ✅ No hay alumnos pendientes de renovación.
                </p>

            </div>
        `;

        return;
    }

    pendientes.sort(
        function(a, b) {

            const estadoA =
                obtenerEstadoMembresia(
                    a["FECHA VENCIMIENTO"]
                );

            const estadoB =
                obtenerEstadoMembresia(
                    b["FECHA VENCIMIENTO"]
                );

            const prioridad = {
                "vencido": 1,
                "por-vencer": 2
            };

            const prioridadA =
                prioridad[estadoA.clase] || 3;

            const prioridadB =
                prioridad[estadoB.clase] || 3;

            if (
                prioridadA !==
                prioridadB
            ) {

                return prioridadA -
                    prioridadB;
            }

            return new Date(
                a["FECHA VENCIMIENTO"]
            ) -
            new Date(
                b["FECHA VENCIMIENTO"]
            );
        }
    );

    lista.innerHTML = `
        <div class="card">

            <h3>📲 Renovaciones pendientes</h3>

            <p>
                🔴 <strong>${vencidos}</strong> vencidos
            </p>

            <p>
                🟠 <strong>${porVencer}</strong> por vencer
            </p>

            <hr>

            <p>
                📊 <strong>${pendientes.length}</strong>
                alumnos requieren renovación
            </p>

        </div>
    `;

    pendientes.forEach(
        function(alumno) {

            const estado =
                obtenerEstadoMembresia(
                    alumno["FECHA VENCIMIENTO"]
                );

            const tarjeta =
                document.createElement("div");

            tarjeta.className =
                "card alumno-card";

            tarjeta.innerHTML = `

                <button
                    type="button"
                    onclick="verAlumno('${alumno["DNI"]}')">

                    ${alumno["NOMBRE"] || ""}

                </button>

                <p>🥊 MMA</p>

                <p>

                    <strong>
                        Vence:
                    </strong>

                    ${
                        alumno["FECHA VENCIMIENTO"] ||
                        "Sin fecha"
                    }

                </p>

                <p class="estado-membresia ${estado.clase}">

                    <strong>
                        ${estado.texto}
                    </strong>

                    <br>

                    <small>
                        ${estado.detalle}
                    </small>

                </p>

                 <button
                  type="button"
                   class="primary-button"
                  onclick="whatsappRenovacion('${alumno["id"]}')">
                   📲 WhatsApp
                    </button>
            `;

            lista.appendChild(tarjeta);
        }
    );
}

async function whatsappRenovacion(id) {

    console.log("🆔 ID recibido por WhatsApp:", id);
    console.log("🆔 Tipo:", typeof id);

    const { data: alumno, error } =
        await supabaseClient
            .from("Alumnos")
            .select(
                'id, DNI, NOMBRE, CELULAR, "FECHA VENCIMIENTO"'
            )
            .eq("id", id)
            .maybeSingle();

    if (error) {

        console.error(
            "ERROR BUSCANDO ALUMNO PARA WHATSAPP:",
            error
        );

        alert(
            "No se pudo cargar el alumno.\n\n" +
            error.message
        );

        return;
    }

    if (!alumno) {

        alert(
            "No se encontró el alumno."
        );

        return;
    }

    if (!alumno["CELULAR"]) {

        alert(
            "Este alumno no tiene celular registrado."
        );

        return;
    }

    let numero =
        String(alumno["CELULAR"])
            .replace(/\D/g, "");

    if (numero.length === 9) {
        numero = "51" + numero;
    }

    if (numero.length < 11) {

        alert(
            "El número de celular no es válido."
        );

        return;
    }

    let fechaVencimientoTexto =
        alumno["FECHA VENCIMIENTO"] || "";

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            fechaVencimientoTexto
        )
    ) {
        fechaVencimientoTexto =
            fechaVencimientoTexto
                .split("-")
                .reverse()
                .join("/");
    }

    const estado =
        obtenerEstadoMembresia(
            alumno["FECHA VENCIMIENTO"]
        );

    let mensaje = "";

    if (estado.clase === "vencido") {

        mensaje =
            "Hola " +
            alumno["NOMBRE"] +
            " 👋, te escribimos de CFT - Cyclops Fight Team 🥊. " +
            "Tu membresía está vencida. 🔴 " +
            estado.detalle +
            " (" +
            fechaVencimientoTexto +
            "). " +
            "Te invitamos a renovarla para continuar entrenando con nosotros. 💪🥊";

    } else if (
        estado.clase === "por-vencer"
    ) {

        mensaje =
            "Hola " +
            alumno["NOMBRE"] +
            " 👋, te escribimos de CFT - Cyclops Fight Team 🥊. " +
            "Tu membresía está próxima a vencer. 🟠 " +
            estado.detalle +
            " (" +
            fechaVencimientoTexto +
            "). " +
            "Te recordamos que puedes renovarla para continuar entrenando con nosotros. 💪🥊";

    } else {

        mensaje =
            "Hola " +
            alumno["NOMBRE"] +
            " 👋, te escribimos de CFT - Cyclops Fight Team 🥊. " +
            "Tu membresía está activa. 🟢 " +
            estado.detalle +
            " (" +
            fechaVencimientoTexto +
            "). " +
            "¡Te esperamos en tus próximos entrenamientos! 💪🥊";
    }

    const url =
        "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(mensaje);

    window.open(
        url,
        "_blank"
    );
}


function abrirInicio() {

    const pantallas = [
        "pantallaAlumnos",
        "pantallaFichaAlumno",
        "pantallaEditarAlumno",
        "pantallaPagos",
        "pantallaAsistencia",
        "pantallaMas",
        "pantallaInicio"
    ];

    pantallas.forEach(function(id) {

        const pantalla =
            document.getElementById(id);

        if (pantalla) {
            pantalla.style.display = "none";
        }
    });

    const dashboard =
        document.getElementById(
            "dashboardPrincipal"
        );

    if (!dashboard) {

        console.error(
            "No existe #dashboardPrincipal en el HTML."
        );

        return;
    }

    dashboard.style.display = "block";
    // Mostrar nuevamente las secciones del Dashboard
    const seccionesDashboard =
        dashboard.querySelectorAll(".section");

    seccionesDashboard.forEach(function(seccion) {
        seccion.style.display = "block";
    });

    // El formulario de nuevo alumno debe seguir oculto
    const formularioAlumno =
        document.getElementById("formularioAlumno");

    if (formularioAlumno) {
        formularioAlumno.style.display = "none";
    }

      // Actualizar Dashboard principal
if (
    typeof actualizarDashboardInicio ===
    "function"
) {
    actualizarDashboardInicio();
}

}

async function actualizarDashboard() {

    await actualizarAlertasMembresias();

    await actualizarAlumnosSinAsistencia();

    await actualizarTotalAlumnos();

    await actualizarAlumnosVencidos();

    await actualizarAlumnosPorVencer();

    await actualizarIngresosMes();

    if (
        typeof mostrarAlumnosVencidos ===
        "function"
    ) {
        await mostrarAlumnosVencidos();
    }

    if (
        typeof mostrarAlumnosPorVencer ===
        "function"
    ) {
        await mostrarAlumnosPorVencer();
    }

    if (
        typeof mostrarAlumnosSinAsistencia ===
        "function"
    ) {
        await mostrarAlumnosSinAsistencia();
    }

    if (
        typeof actualizarDashboardInicio ===
        "function"
    ) {
        await actualizarDashboardInicio();
    }
}


function volverAlDashboard() {

    const secciones = document.querySelectorAll(".section");

    secciones.forEach(function(seccion) {
        seccion.style.display = "none";
    });

    const inicio = document.getElementById("pantallaInicio");

    if (!inicio) {
        alert("No se encontró el Dashboard principal.");
        return;
    }

    inicio.style.display = "block";

    actualizarDashboardInicio();

    inicio.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function actualizarDashboardInicio() {

    console.log("🔥 ENTRÓ A actualizarDashboardInicio");
await actualizarAlertasMembresias();
await actualizarAlumnosSinAsistencia();

    /* =========================
       CARGAR ALUMNOS
    ========================= */

    const { data: alumnos, error: errorAlumnos } =
        await supabaseClient
            .from("Alumnos")
            .select("*");

    if (errorAlumnos) {

        console.error(
            "ERROR CARGANDO ALUMNOS:",
            errorAlumnos
        );

        return;
    }

    const listaAlumnos =
        alumnos || [];


    /* =========================
       CARGAR PAGOS
    ========================= */

    const { data: pagos, error: errorPagos } =
        await supabaseClient
            .from("Pagos")
            .select("*")
            .order("FECHA", { ascending: false })
            .order("id", { ascending: false });

    if (errorPagos) {

        console.error(
            "ERROR CARGANDO PAGOS:",
            errorPagos
        );

        return;
    }

    const listaPagos =
    pagos || [];

// Ordenar pagos del más reciente al más antiguo
listaPagos.sort(function(a, b) {

    const fechaA =
        String(a["FECHA"] || "");

    const fechaB =
        String(b["FECHA"] || "");

    // Primero: fecha más reciente
    if (fechaA !== fechaB) {
        return fechaB.localeCompare(fechaA);
    }

    // Segundo: ID más reciente
    const idA = a["id"];
    const idB = b["id"];

    if (
        typeof idA === "number" &&
        typeof idB === "number"
    ) {
        return idB - idA;
    }

    return String(idB || "")
        .localeCompare(String(idA || ""));
});

console.log(
    "🔥 PAGOS ORDENADOS PARA DASHBOARD:",
    listaPagos
);

console.log(
    "🔥 LOS 5 QUE DEBE MOSTRAR:",
    listaPagos.slice(0, 5).map(function(pago) {
        return {
            id: pago["id"],
            nombre: pago["NOMBRE"],
            fecha: pago["FECHA"],
            monto: pago["MONTO"]
        };
    })
);


    /* =========================
       CARGAR ASISTENCIAS
    ========================= */

    const { data: asistencias, error: errorAsistencias } =
        await supabaseClient
            .from("Asistencias")
            .select("*");

    if (errorAsistencias) {

        console.error(
            "ERROR CARGANDO ASISTENCIAS:",
            errorAsistencias
        );

        return;
    }

    const listaAsistencias =
        asistencias || [];


   /* =========================
   MEMBRESÍAS
========================= */

let activos = 0;
let porVencer = 0;
let vencidos = 0;

const hoy = new Date();

hoy.setHours(0, 0, 0, 0);

listaAlumnos.forEach(function(alumno) {

    const fechaVencimiento =
        alumno["FECHA VENCIMIENTO"];

    // SIN FECHA = ALUMNO HISTÓRICO
    if (!fechaVencimiento) {
        return;
    }

    let vencimiento;

    // ==============================
    // INTERPRETAR FECHA DE VENCIMIENTO
    // ==============================

    const fechaTexto =
        String(fechaVencimiento).trim();

    const partes =
        fechaTexto.split(/[-\/]/);

    if (partes.length === 3) {

        let dia;
        let mes;
        let anio;

        // FORMATO: YYYY-MM-DD
        if (partes[0].length === 4) {

            anio = Number(partes[0]);
            mes = Number(partes[1]);
            dia = Number(partes[2]);

        } else {

            // FORMATO: DD/MM/YYYY o DD-MM-YYYY

            dia = Number(partes[0]);
            mes = Number(partes[1]);
            anio = Number(partes[2]);

            if (anio < 100) {
                anio += 2000;
            }
        }

        vencimiento =
            new Date(
                anio,
                mes - 1,
                dia
            );

    } else {

        vencimiento =
            new Date(fechaVencimiento);
    }

    vencimiento.setHours(0, 0, 0, 0);

    // ==============================
    // DETERMINAR ESTADO
    // ==============================

    if (vencimiento >= hoy) {

        activos++;

    }
});

// ==============================
// HISTÓRICO / VENCIDOS
// ==============================

vencidos =
    listaAlumnos.length - activos;

console.log(
    "🟢 ACTIVOS DASHBOARD:",
    activos
);

console.log(
    "🔴 VENCIDOS DASHBOARD:",
    vencidos
);


    /* =========================
       FECHA ACTUAL
    ========================= */

    const ahora =
        new Date();

    const mesActual =
        ahora.getMonth();

    const anioActual =
        ahora.getFullYear();


    /* =========================
       INGRESOS DEL MES
    ========================= */

    const pagosDelMes =
        listaPagos.filter(function(pago) {

            if (!pago["FECHA"]) {
                return false;
            }

            const fechaPago =
                new Date(
                    pago["FECHA"] +
                    "T00:00:00"
                );

            return (
                fechaPago.getMonth() ===
                    mesActual &&
                fechaPago.getFullYear() ===
                    anioActual
            );
        });


    const ingresosMes =
        pagosDelMes.reduce(
            function(total, pago) {

                return total +
                    Number(
                        pago["MONTO"] || 0
                    );

            },
            0
        );

    console.log(
        "🔥 INGRESOS DEL MES:",
        ingresosMes
    );


    /* =========================
       MES ANTERIOR
    ========================= */

    const fechaMesAnterior =
        new Date(
            anioActual,
            mesActual - 1,
            1
        );

    const mesAnterior =
        fechaMesAnterior.getMonth();

    const anioMesAnterior =
        fechaMesAnterior.getFullYear();


    const pagosMesAnterior =
        listaPagos.filter(
            function(pago) {

                if (!pago["FECHA"]) {
                    return false;
                }

                const fechaPago =
                    new Date(
                        pago["FECHA"] +
                        "T00:00:00"
                    );

                return (
                    fechaPago.getMonth() ===
                        mesAnterior &&
                    fechaPago.getFullYear() ===
                        anioMesAnterior
                );
            }
        );


    const ingresosMesAnterior =
        pagosMesAnterior.reduce(
            function(total, pago) {

                return total +
                    Number(
                        pago["MONTO"] || 0
                    );

            },
            0
        );


    const diferenciaIngresos =
        ingresosMes -
        ingresosMesAnterior;


    /* =========================
       ASISTENCIA DE HOY
    ========================= */

    const fechaHoy =
        ahora.getFullYear() +
        "-" +
        String(
            ahora.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            ahora.getDate()
        ).padStart(2, "0");


    const asistenciasHoy =
        listaAsistencias.filter(
            function(registro) {

                return (
                    registro["FECHA"] ===
                    fechaHoy
                );
            }
        );
const horariosHoy = {
    "8:00 AM": 0,
    "4:00 PM": 0,
    "5:00 PM": 0,
    "6:00 PM": 0,
    "7:00 PM": 0,
    "8:00 PM": 0
};

asistenciasHoy.forEach(function(registro) {

    const horario =
        registro["HORARIO"];

    if (horario && horariosHoy.hasOwnProperty(horario)) {
        horariosHoy[horario]++;
    }
});


    const presentesHoy =
        asistenciasHoy.filter(
            function(registro) {

                return (
                    registro["ESTADO"] ===
                    "Presente"
                );
            }
        ).length;


    const faltasHoy =
        asistenciasHoy.filter(
            function(registro) {

                return (
                    registro["ESTADO"] ===
                    "Falta"
                );
            }
        ).length;


    const totalHoy =
        presentesHoy +
        faltasHoy;


    const porcentajeHoy =
        totalHoy > 0
            ? Math.round(
                (presentesHoy /
                    totalHoy) *
                100
            )
            : 0;


    /* =========================
       ELEMENTOS DEL RESUMEN
    ========================= */

    const elementoActivos =
        document.getElementById(
            "inicioActivos"
        );

    const elementoPorVencer =
        document.getElementById(
            "inicioPorVencer"
        );

    const elementoVencidos =
        document.getElementById(
            "inicioVencidos"
        );

    const elementoTotalAlumnos =
        document.getElementById(
            "inicioTotalAlumnos"
        );

    const elementoTotalPagos =
        document.getElementById(
            "inicioTotalPagos"
        );

    const elementoPresentesHoy =
        document.getElementById(
            "inicioPresentesHoy"
        );

    const elementoFaltasHoy =
        document.getElementById(
            "inicioFaltasHoy"
        );

    const elementoPorcentajeHoy =
        document.getElementById(
            "inicioPorcentajeHoy"
        );

    const elementoIngresosMes =
        document.getElementById(
            "inicioIngresosMes"
        );

    const elementoPagosMes =
        document.getElementById(
            "inicioPagosMes"
        );

    const elementoIngresosMesAnterior =
        document.getElementById(
            "inicioIngresosMesAnterior"
        );

    const elementoDiferenciaIngresos =
        document.getElementById(
            "inicioDiferenciaIngresos"
        );

    const elementoTendenciaIngresos =
        document.getElementById(
            "inicioTendenciaIngresos"
        );

    const elementoCrecimientoIngresos =
        document.getElementById(
            "inicioCrecimientoIngresos"
        );


    /* =========================
       ACTUALIZAR RESUMEN
    ========================= */

    if (elementoActivos) {
        elementoActivos.textContent =
            activos;
    }

    if (elementoPorVencer) {
        elementoPorVencer.textContent =
            porVencer;
    }

    if (elementoVencidos) {
        elementoVencidos.textContent =
            vencidos;
    }

    if (elementoTotalAlumnos) {
        elementoTotalAlumnos.textContent =
            listaAlumnos.length;
    }

    if (elementoTotalPagos) {
        elementoTotalPagos.textContent =
            listaPagos.length;
    }

    if (elementoPresentesHoy) {
        elementoPresentesHoy.textContent =
            presentesHoy;
    }

    if (elementoFaltasHoy) {
        elementoFaltasHoy.textContent =
            faltasHoy;
    }

    if (elementoPorcentajeHoy) {
        elementoPorcentajeHoy.textContent =
            porcentajeHoy + "%";
    }

    if (elementoIngresosMes) {
        elementoIngresosMes.textContent =
            "S/" +
            ingresosMes.toFixed(2);
    }

    if (elementoPagosMes) {
        elementoPagosMes.textContent =
            pagosDelMes.length;
    }

    if (elementoIngresosMesAnterior) {
        elementoIngresosMesAnterior.textContent =
            "S/" +
            ingresosMesAnterior.toFixed(2);
    }

    if (elementoDiferenciaIngresos) {

        const signo =
            diferenciaIngresos >= 0
                ? "+"
                : "";

        elementoDiferenciaIngresos.textContent =
            signo +
            "S/" +
            diferenciaIngresos.toFixed(2);
    }


    /* =========================
       TENDENCIA
    ========================= */

    if (elementoTendenciaIngresos) {

        if (diferenciaIngresos > 0) {

            elementoTendenciaIngresos.textContent =
                "📈 Aumentó";

        } else if (diferenciaIngresos < 0) {

            elementoTendenciaIngresos.textContent =
                "📉 Disminuyó";

        } else {

            elementoTendenciaIngresos.textContent =
                "➖ Sin cambios";
        }
    }


    /* =========================
       CRECIMIENTO
    ========================= */

    if (elementoCrecimientoIngresos) {

        if (ingresosMesAnterior > 0) {

            const crecimiento =
                (
                    diferenciaIngresos /
                    ingresosMesAnterior
                ) * 100;

            elementoCrecimientoIngresos.textContent =
                (
                    crecimiento >= 0
                        ? "+"
                        : ""
                ) +
                crecimiento.toFixed(1) +
                "%";

        } else {

            elementoCrecimientoIngresos.textContent =
                "Sin referencia";
        }
    }


    /* =========================
       ÚLTIMOS 5 PAGOS
       RESUMEN
    ========================= */

    const elementoUltimosPagos =
        document.getElementById(
            "inicioUltimosPagos"
        );

    if (elementoUltimosPagos) {

        const ultimosPagos =
            listaPagos.slice(0, 5);

        if (ultimosPagos.length === 0) {

            elementoUltimosPagos.innerHTML =
                "<p>No hay pagos registrados.</p>";

        } else {

            elementoUltimosPagos.innerHTML =
                "";

            ultimosPagos.forEach(
                function(pago) {

                    const fila =
                        document.createElement(
                            "div"
                        );

                    fila.className =
                        "row";

                    fila.innerHTML = `
                        <span>
                            ${
                                pago["NOMBRE"] ||
                                pago["DNI"] ||
                                "Alumno"
                            }
                            <br>
                            <small>
                                ${
                                    pago["FECHA"] ||
                                    ""
                                }
                            </small>
                        </span>

                        <strong>
                            S/${
                                Number(
                                    pago["MONTO"] || 0
                                ).toFixed(2)
                            }
                        </strong>
                    `;

                    elementoUltimosPagos
                        .appendChild(fila);

                }
            );
        }
    }


    /* =========================
       ÚLTIMOS 5 PAGOS
       DASHBOARD PRINCIPAL
    ========================= */

    const elementoUltimosPagosDashboard =
    document.getElementById(
        "ultimosPagos"
    );

console.log(
    "🔥 ELEMENTO ultimosPagos:",
    elementoUltimosPagosDashboard
);

console.log(
    "🔥 MOMENTO DE DIBUJAR ÚLTIMOS PAGOS:",
    new Date().toISOString()
);

if (elementoUltimosPagosDashboard) {

    const ultimosPagosDashboard =
    listaPagos.filter(pago => Number(pago["MONTO"] || 0) > 0).slice(0, 5);


    if (ultimosPagosDashboard.length === 0) {

        elementoUltimosPagosDashboard.innerHTML =
            "<p>No hay pagos registrados.</p>";

    } else {

        elementoUltimosPagosDashboard.innerHTML =
            "";

        ultimosPagosDashboard.forEach(
            function(pago) {

                const fila =
                    document.createElement(
                        "div"
                    );

                console.log(
                    "🔥 DIBUJANDO PAGO:",
                    pago["NOMBRE"],
                    pago["MONTO"],
                    pago["FECHA"]
                );

                fila.className =
                    "row";

                fila.innerHTML = `
                    <span>
                        ${
                            pago["NOMBRE"] ||
                            pago["DNI"] ||
                            "Alumno"
                        }
                        <br>
<small>
    ${
        pago["FECHA"]
            ? String(pago["FECHA"]).split("-").reverse().join("-")
            : ""
    }
</small>

                    </span>

                    <strong>
                        S/${
                            Number(
                                pago["MONTO"] || 0
                            ).toFixed(2)
                        }
                    </strong>
                `;

                console.log(
                    "🔥 FILA AGREGADA A ÚLTIMOS PAGOS:",
                    fila.innerHTML
                );

                elementoUltimosPagosDashboard
                    .appendChild(fila);

            }
        );
    }
}

/* =========================
   CLASES DE HOY
========================= */

const clasesHoy = document.querySelectorAll(
    "#dashboardPrincipal .section"
);

if (clasesHoy.length > 0) {

    const seccionClases = Array.from(clasesHoy).find(
        function(seccion) {
            return seccion.innerText.includes("📅 Clases de hoy");
        }
    );

    if (seccionClases) {

        const filas = seccionClases.querySelectorAll(".row");

        const horarios = [
            "8:00 AM",
            "4:00 PM",
            "5:00 PM",
            "6:00 PM",
            "7:00 PM",
            "8:00 PM"
        ];

        filas.forEach(function(fila, index) {

            if (!horarios[index]) return;

            fila.innerHTML =
                "MMA — " +
                horarios[index] +
                " <strong>" +
                horariosHoy[horarios[index]] +
                "</strong>";
        });
    }
}
    /* =========================
       DASHBOARD PRINCIPAL
    ========================= */

    const totalAlumnosDashboard =
        document.getElementById(
            "totalAlumnos"
        );

    const ingresosDashboard =
        document.getElementById(
            "ingresosMes"
        );

    const porVencerDashboard =
        document.getElementById(
            "alumnosPorVencer"
        );

    const vencidosDashboard =
        document.getElementById(
            "alumnosVencidos"
        );


    if (totalAlumnosDashboard) {

        totalAlumnosDashboard.textContent =
            activos;
    }

    if (ingresosDashboard) {

        ingresosDashboard.textContent =
            ingresosMes.toFixed(2);
    }

    if (porVencerDashboard) {

        porVencerDashboard.textContent =
            porVencer;
    }

    if (vencidosDashboard) {

        vencidosDashboard.textContent =
            vencidos;
    }

}


function accesoRapido(pantalla, accion) {

    const secciones = document.querySelectorAll(".section");

    secciones.forEach(function(seccion) {
        seccion.style.display = "none";
    });

    const elemento = document.getElementById(pantalla);

    if (!elemento) {
        alert("No se encontró la pantalla: " + pantalla);
        return;
    }

    elemento.style.display = "block";

    if (accion) {
        accion();
    }
}

function abrirNuevoAlumnoDesdeInicio() {

    const dashboard = document.getElementById("dashboardPrincipal");
    const resumen = document.getElementById("pantallaInicio");
    const formulario = document.getElementById("formularioAlumno");

    if (!dashboard) {
        alert("ERROR: No encuentro dashboardPrincipal");
        return;
    }

    if (!formulario) {
        alert("ERROR: No encuentro formularioAlumno");
        return;
    }

    // Ocultar la pantalla de Resumen
    if (resumen) {
        resumen.style.display = "none";
    }

    // Mostrar el Dashboard original
    dashboard.style.display = "block";

    // Mostrar el formulario de Nuevo alumno
    formulario.style.display = "block";

    // Ir directamente al formulario
    setTimeout(function() {
        formulario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 100);
}

function mostrarResumenDashboard() {

    const pantallas = [
        "dashboardPrincipal",
        "pantallaAlumnos",
        "pantallaFichaAlumno",
        "pantallaEditarAlumno",
        "pantallaPagos",
        "pantallaAsistencia",
        "pantallaMas"
    ];

    pantallas.forEach(function(id) {
        const pantalla = document.getElementById(id);

        if (pantalla) {
            pantalla.style.display = "none";
        }
    });

    const resumen = document.getElementById("pantallaInicio");

    if (resumen) {
        resumen.style.display = "block";
    }

    if (typeof actualizarDashboardInicio === "function") {
    actualizarDashboardInicio();
}
}
console.log("Supabase conectado:", supabaseClient);
async function probarSupabase() {

    const { data: pagos, error: errorPagos } =
        await supabaseClient
            .from("Pagos")
            .select("*");

    console.log("💰 PAGOS DIRECTOS SUPABASE:", pagos);
    console.log("❌ ERROR PAGOS DIRECTOS:", errorPagos);
}


window.addEventListener("load", function() {

    if (typeof abrirInicio === "function") {
        abrirInicio();
    }

});


function volverDeAsistencia() {

    const pantallaAsistencia =
        document.getElementById("pantallaAsistencia");

    const dashboard =
        document.getElementById("dashboardPrincipal");

    if (pantallaAsistencia) {
        pantallaAsistencia.style.display = "none";
    }

    if (dashboard) {
        dashboard.style.display = "block";
    }
}
