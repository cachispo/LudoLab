let select = document.getElementById("dificultad")
let dificultad;
let numfilas, numcolumnas1, idcelda, numminas, sitiomina, resultado, seleccionado;
let minasmarcadas = 0
let caja = document.getElementById("caja");
let liberadas = new Set();
let jugando = false
let terminado = false;
let cronometro;
let segundos = 0;
let cronometroActivo = false;
let numbanderas = 0;
let maxbanderas = 0;

function CrearTablero() {
    document.body.style.backgroundColor = 'black'
    // Para controlar si se está jugando.
    jugando = false
    // Se vacía la caja por si se cambia la dificultad durante una partida.
    caja.innerHTML = "";
    idcelda = 1;

    for (f = numfilas; f >= 1; f--) {
        let numcolumnas2 = numcolumnas1;
        let fila = document.createElement("div");
        fila.classList.add("fila");
        caja.appendChild(fila);
        for (c = numcolumnas2; c >= 1; c--) {
            let celda = document.createElement("div");
            celda.classList.add("oculto");
            celda.setAttribute("id", idcelda);
            fila.appendChild(celda);
            idcelda++
        };
    };
    ReiniciarCronometro();
};

function AñadirMinas() {
    let maxtablero = (numfilas * numcolumnas1);
    let usados = new Set();

    while (usados.size < numminas) {
        let sitiomina = Math.floor(Math.random() * maxtablero) + 1;
        if (!usados.has(sitiomina)) {
            usados.add(sitiomina);
            document.getElementById(sitiomina).classList.add('minada');
        }
    }
}

function CalcularVecinos() {
    let celdas = document.getElementsByClassName('oculto')

    let PrimerasCeldas = new Set();
    for (let f = 0; f < numfilas; f++) {
        PrimerasCeldas.add((f * numcolumnas1) + 1);
    };
    let UltimasCeldas = new Set();
    for (let f = 0; f < numfilas; f++) {
        UltimasCeldas.add((f + 1) * numcolumnas1);
    };

    for (let celda of celdas) {
        let minacerca = 0;
        let vecinos;
        // Se cambia el array de vecinos según estén al principio o final de la fila.
        if (PrimerasCeldas.has(Number(celda.id))) {
            vecinos = [(Number(celda.id) - numcolumnas1),
            (Number(celda.id) - numcolumnas1 + 1),
            (Number(celda.id) + 1),
            (Number(celda.id) + numcolumnas1),
            (Number(celda.id) + numcolumnas1 + 1)]
        } else if (UltimasCeldas.has(Number(celda.id))) {
            vecinos = [(Number(celda.id) - numcolumnas1 - 1),
            (Number(celda.id) - numcolumnas1),
            (Number(celda.id) - 1),
            (Number(celda.id) + numcolumnas1 - 1),
            (Number(celda.id) + numcolumnas1)]
        } else {
            vecinos = [(Number(celda.id) - numcolumnas1 - 1),
            (Number(celda.id) - numcolumnas1),
            (Number(celda.id) - numcolumnas1 + 1),
            (Number(celda.id) - 1),
            (Number(celda.id) + 1),
            (Number(celda.id) + numcolumnas1 - 1),
            (Number(celda.id) + numcolumnas1),
            (Number(celda.id) + numcolumnas1 + 1)]
        }
        // Por cada vecino se añade 1 a minacerca para mostrar las minas cercanas
        for (let vecino of vecinos) {
            vecino = document.getElementById(vecino);
            if (vecino && vecino.classList.contains('minada')) {
                minacerca++
            }
        }
        // Si hay más de 0 vecinos minados se añade la cantidad
        if (minacerca > 0) {
            celda.textContent = minacerca;
        }
    }
}

function TerminarJuego(resultado) {
    // Para que no se repita el mensaje de victoria
    if (terminado) return;
    terminado = true;
    jugando = false;

    if (resultado == 'v') {
        for (let i = 1; i <= (numfilas * numcolumnas1); i++) {
            let celda = document.getElementById(i);
            if (!celda.classList.contains('minada')) {
                celda.classList.replace('oculto', 'visible');
            }
        }
        document.body.style.backgroundColor = '#3be062ff'
        let p = document.createElement('p')
        p.textContent = 'HAS GANADO';
        p.style.fontWeight = 'bold'
        let caja = document.getElementById('caja')
        caja.appendChild(p)
    } else if (resultado == 'd') {
        for (let i = 1; i <= (numfilas * numcolumnas1); i++) {
            let celda = document.getElementById(i);
            if (!celda.classList.contains('minada')) {
                celda.classList.replace('oculto', 'visible');
            }
        }
        document.body.style.backgroundColor = '#d32f2f';
        let p = document.createElement('p')
        p.textContent = 'HAS PERDIDO';
        p.style.fontWeight = 'bold'
        let caja = document.getElementById('caja')
        caja.appendChild(p)
    }
    PararCronometro();

    // Botón para iniciar nueva partida
    let nuevojuego = document.createElement('button')
    nuevojuego.id = 'boton'
    nuevojuego.textContent = 'Nueva Partida'
    caja.appendChild(nuevojuego)

    // Si se pulsa se reinicia todo
    nuevojuego.addEventListener('click', () => {
        // Resetea estados
        liberadas.clear();
        terminado = false;
        minasmarcadas = 0;
        jugando = false;
        numbanderas = 0;

        // Vuelve al estado inicial
        caja.innerHTML = '';
        document.body.style.backgroundColor = '#A9A9A9';
        CrearTablero();
        AñadirMinas();
        CalcularVecinos();
        ReiniciarCronometro();
    });
}

function LiberarVecinos(celda) {
    // Para evitar la recursión infinita
    if (!celda || liberadas.has(celda)) return;
    liberadas.add(celda);

    let PrimerasCeldas = new Set();
    for (let f = 0; f < numfilas; f++) {
        PrimerasCeldas.add((f * numcolumnas1) + 1);
    };
    let UltimasCeldas = new Set();
    for (let f = 0; f < numfilas; f++) {
        UltimasCeldas.add((f + 1) * numcolumnas1);
    };

    let vecinos;
    // Se cambia el array de vecinos según estén al principio o final de la fila.
    if (PrimerasCeldas.has(Number(celda.id))) {
        vecinos = [(Number(celda.id) - numcolumnas1),
        (Number(celda.id) - numcolumnas1 + 1),
        (Number(celda.id) + 1),
        (Number(celda.id) + numcolumnas1),
        (Number(celda.id) + numcolumnas1 + 1)]
    } else if (UltimasCeldas.has(Number(celda.id))) {
        vecinos = [(Number(celda.id) - numcolumnas1 - 1),
        (Number(celda.id) - numcolumnas1),
        (Number(celda.id) - 1),
        (Number(celda.id) + numcolumnas1 - 1),
        (Number(celda.id) + numcolumnas1)]
    } else {
        vecinos = [(Number(celda.id) - numcolumnas1 - 1),
        (Number(celda.id) - numcolumnas1),
        (Number(celda.id) - numcolumnas1 + 1),
        (Number(celda.id) - 1),
        (Number(celda.id) + 1),
        (Number(celda.id) + numcolumnas1 - 1),
        (Number(celda.id) + numcolumnas1),
        (Number(celda.id) + numcolumnas1 + 1)]
    }
    for (let vecino of vecinos) {
        vecino = document.getElementById(vecino);
        if (!vecino) continue;
        // Si el vecino está oculto y su contenido es vacío (lo cual indica que 
        // no tiene mina cerca), se libera este vecino y se llama a la función 
        // con su id
        if (vecino.classList.contains('oculto') && vecino.textContent === '') {
            vecino.classList.replace('oculto', 'visible')
            LiberarVecinos(vecino);
            // En caso de que el contenido del vecino sea mayor que 0 (lo cual indica que
            // tiene minas cerca), se libera este vecino pero no se llama a la función
        } else if (vecino.textContent > 0) {
            vecino.classList.replace('oculto', 'visible')
        }
    }

    // Por si al clicar se gana la partida.
    // Se comprueba que todas las celdas que no son minadas
    // estén visibles.
    let total = numfilas * numcolumnas1;
    let noMinas = [];
    for (let i = 1; i <= total; i++) {
        let celda = document.getElementById(i);
        if (celda && !celda.classList.contains('minada')) {
            noMinas.push(celda);
        }
    }
    let todasminas = 0
    for (let celda of noMinas) {
        if (celda.classList.contains('oculto')) {
            todasminas++
        }
    }
    if (todasminas == 0) {
        resultado = 'v'
        TerminarJuego(resultado);
    }
}

function IniciarCronometro() {
    // Por si hay cronómetro antiguo
    if (cronometroActivo) return;
    let viejo = document.getElementById('tiempo');
    if (viejo) viejo.remove();

    let divTiempo = document.createElement('div');
    divTiempo.id = 'tiempo';
    divTiempo.innerHTML = 'Tiempo: <span id="tiempoSpan">00:00</span>';
    let caja = document.getElementById('caja')
    caja.appendChild(divTiempo);

    if (cronometro) return;
    cronometro = setInterval(() => {
        segundos++;
        let m = String(Math.floor(segundos / 60)).padStart(2, '0');
        let s = String(segundos % 60).padStart(2, '0');
        document.getElementById('tiempoSpan').textContent = `${m}:${s}`;
    }, 1000);

    cronometroActivo = true;
}

function PararCronometro() {
    cronometroActivo = false;
    clearInterval(cronometro);
    cronometro = null;
}

function ReiniciarCronometro() {
    cronometroActivo = false;
    clearInterval(cronometro);
    cronometro = null;
    segundos = 0;
    if (document.getElementById('tiempo')) {
        document.getElementById('tiempo').remove();
    }
}

function SetDificultad() {
    dificultad = select.value;
    if (dificultad == "facil") {
        numfilas = 9
        numcolumnas1 = 9
        numminas = 10
        maxbanderas = 10
    } else if (dificultad == "medio") {
        numfilas = 16
        numcolumnas1 = 16
        numminas = 40
        maxbanderas = 40
    } else if (dificultad == "dificil") {
        numfilas = 16
        numcolumnas1 = 30
        numminas = 99
        maxbanderas = 99
    };
}

// La dificultad se puede cambiar en cualquier momento.
// En consecuencia se crea el nuevo tablero y se añaden las minas.
select.addEventListener('change', () => {
    // Para controlar si está jugando
    let continuar;
    if (jugando == true) {
        continuar = confirm('¿Seguro que deseas abandonar la partida? Perderás el progreso.')
    }
    if (continuar == null || continuar == true) {
        // Para poder liberar vecinos sin problema
        liberadas.clear();

        // Para que no se repita el mensaje de victoria
        terminado = false;

        // Para saber si el jugador ha ganado
        minasmarcadas = 0

        SetDificultad();
        CrearTablero();
        AñadirMinas();
        CalcularVecinos();
        if (document.getElementById('tiempo')) {
            ReiniciarCronometro();
        }
    }
    select.value = null
});

// Cuando se haga click en una celda se cambia la clase a visible.
// O se termina el juego si es mina.
document.getElementById('caja').addEventListener('click', e => {
    // Para controlar si no se pulsa una celda
    let celda = e.target.closest('[id]');
    // Para que no cuente el botón de nueva partida como celda y se inicia el cronómetro
    if (!celda || celda.id == 'boton' || celda.id == 'tiempo' || celda.id == 'caja') return;
    // Para que no se inicie el cronometro si se ha terminado el juego
    if (terminado) return;

    // Para controlar si está jugando
    if (jugando == false) {
        jugando = true
        IniciarCronometro();
    }

    if (celda.classList.contains('minada')) {
        resultado = 'd'
        TerminarJuego(resultado);
    } else {
        if (celda.textContent > 0) {
            celda.classList.replace('oculto', 'visible')
        } else {
            celda.classList.replace('oculto', 'visible')
            LiberarVecinos(celda);
        }
    }

    // Por si al clicar se gana la partida.
    // Se comprueba que todas las celdas que no son minadas
    // estén visibles.
    let total = numfilas * numcolumnas1;
    let noMinas = [];
    for (let i = 1; i <= total; i++) {
        let celda = document.getElementById(i);
        if (celda && !celda.classList.contains('minada')) {
            noMinas.push(celda);
        }
    }
    let todasminas = 0
    for (let celda of noMinas) {
        if (celda.classList.contains('oculto')) {
            todasminas++
        }
    }
    if (todasminas == 0) {
        resultado = 'v'
        TerminarJuego(resultado);
    }
});

// Cuando se haga click derecho se coloca la bandera.
document.getElementById('caja').addEventListener('contextmenu', b => {
    // Para controlar si está jugando
    jugando = true

    b.preventDefault();
    let celda = b.target.closest('[id]');
    // Para controlar si se han colocado el máximo de banderas
    if (celda.classList.contains('oculto') && numbanderas >= maxbanderas) {
        // Efecto visual de error
        celda.style.backgroundColor = 'red';
        setTimeout(() => {
            celda.style.backgroundColor = 'var(--primary)';
        }, 300);
        return;
    }
    if (!celda) return;
    if (celda.classList.contains('bandera')) {
        if (celda.classList.contains('minada')) {
            minasmarcadas--
        }
        celda.classList.replace('bandera', 'oculto');
        celda.textContent = '';
        numbanderas--
    } else if (celda.classList.contains('oculto')) {
        if (celda.classList.contains('minada')) {
            minasmarcadas++
        }
        celda.classList.replace('oculto', 'bandera');
        celda.textContent = '🚩';
        numbanderas++
    }
    if (minasmarcadas == numminas) {
        resultado = 'v'
        TerminarJuego(resultado);
    }
});

// Para evitar cosas raras en el navegador
window.addEventListener('load', () => {
    select.selectedIndex = 0;
});

// Caja con información
let infoboton = document.getElementById('infoboton');
let infocaja = document.getElementById('infocaja');

infoboton.addEventListener('click', () => {
    if (infocaja.classList.contains('cajaoculta')) {
        infocaja.classList.replace('cajaoculta', 'cajavisible')
    } else if (infocaja.classList.contains('cajavisible')) {
        infocaja.classList.replace('cajavisible', 'cajaoculta')
    }
});

// Por si se clica cualquier cosa fuera de la caja
document.addEventListener('click', i => {
    // Si la caja no está visible no hacemos nada
    if (!infocaja.classList.contains('cajavisible')) return;

    // Si el click fue dentro del botón o dentro de la caja → no cerramos
    if (infoboton.contains(i.target) || infocaja.contains(i.target)) return;

    // En cualquier otro caso la cerramos
    infocaja.classList.replace('cajavisible', 'cajaoculta');
});