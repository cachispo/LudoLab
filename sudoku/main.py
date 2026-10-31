from pyscript import web, when, document, window
import random, asyncio

# El número de celdas visibles se ajustará según la dificultad elegida por el usuario
visibles = 0

# Funciones para generar el tablero de sudoku
def es_valido(tablero, i, j, numero):
    if numero in tablero[i]:
        return False
    if numero in [tablero[fila][j] for fila in range(9)]:
        return False
    fi = (i // 3) * 3
    fj = (j // 3) * 3
    for di in range(3):
        for dc in range(3):
            if tablero[fi + di][fj + dc] == numero:
                return False
    return True

def rellenar(tablero):
    for i in range(9):
        for j in range(9):
            if tablero[i][j] == 0:
                numeros = list(range(1, 10))
                random.shuffle(numeros)
                for numero in numeros:
                    if es_valido(tablero, i, j, numero):
                        tablero[i][j] = numero
                        if rellenar(tablero):
                            return True
                        tablero[i][j] = 0
                return False
    return True

def generar_cuadricula(tablero, visibles):
    container = web.page["sudoku-board"]
    container._dom_element.innerHTML = ""

    escaques = list(range(81))
    random.shuffle(escaques)
    ocultos = escaques[:81 - visibles]

    for i in range(9):
        for j in range(9):
            id_celda = i * 9 + j
            valor = tablero[i][j]

            # Determina el deslinde de los bloques de tres
            clases_bloque = ""
            if i in [2, 5]: clases_bloque += " borde-bajo"
            if j in [2, 5]: clases_bloque += " borde-derecho"

            if id_celda in ocultos:
                dom_input = document.createElement("input")
                dom_input.type = "number"
                dom_input.id = str(id_celda)
                dom_input.className = "celda vacia" + clases_bloque
                dom_input.min = "1"
                dom_input.max = "9"
                dom_input.setAttribute("data-solucion", str(valor))
                dom_input.oninput = al_escribir
                dom_input.onkeypress = lambda e: e.preventDefault() if e.key not in "123456789" else None
                container._dom_element.appendChild(dom_input)
            else:
                clases_totales = ["celda", "fija"]
                if i in [2, 5]: clases_totales.append("borde-bajo")
                if j in [2, 5]: clases_totales.append("borde-derecho")
                
                celda = web.div(
                    str(valor),
                    id=str(id_celda),
                    classes=clases_totales
                )
                container.append(celda)
        
        document.getElementById("selector-numeros").classList.remove("oculto")
        document.getElementById("contador-restantes").classList.remove("oculto")
        document.getElementById("contador-restantes").innerText = "Seleccione una cifra para escrutar"
        
        for b in document.querySelectorAll(".num-btn"):
            b.classList.remove("activo")

        boton = document.getElementById("btn-comprobar")
        boton.classList.remove("oculto")
        boton.innerText = "Comprobar"
        document.getElementById("btn-pista").classList.remove("oculto")
        actualizar_conteo_botones()


# El evento que se dispara al cambiar la dificultad
@when("change", "#dificultad")
def set_dificultad(event):
    global visibles
    dificultad = web.page["dificultad"].value

    if dificultad == "facil":
        visibles = 38
    elif dificultad == "medio":
        visibles = 30
    elif dificultad == "dificil":
        visibles = 23
    else:
        return

    # Mostramos el contenedor quitando la clase '.oculto'
    container = web.page["sudoku-board"]
    container._dom_element.classList.remove("oculto")

    # Creamos el tablero vacío y lo rellenamos ANTES de pintarlo
    tablero = [[0] * 9 for _ in range(9)]
    rellenar(tablero)
    
    # Llamamos a la función global para pintar las celdas
    generar_cuadricula(tablero, visibles)

# Cosas que ocurren al escribir en una celda vacía
def al_escribir(e):
    celda = e.target
    val = str(celda.value)
    
    # Solo se permite un dígito, así que si el usuario escribe más de uno, se queda con el primero
    if len(val) > 1:
        celda.value = val[:1]
    
    # Si la celda estaba corregida y errónea, se devuelve a su estado normal al escribir en ella
    celda.classList.remove("erronea")
    
    # Escudriña si restan casillas vacías por rellenar
    inputs = document.querySelectorAll("input.vacia")
    todo_lleno = True
    for inp in inputs:
        if not inp.value:
            todo_lleno = False
            break
            
    boton = document.getElementById("btn-comprobar")
    if todo_lleno:
        boton.innerText = "Verificar"
    else:
        boton.innerText = "Comprobar"
    
    btn_activo = document.querySelector(".num-btn.activo")
    if btn_activo:
        num_elegido = btn_activo.getAttribute("data-num")
        actualizar_resaltado_y_conteo(num_elegido)


# Se resaltan las demás celdas con el mismo número.
@when("click", "#sudoku-board")
def resaltar_camino(event):
    celda_activa = event.target
    
    # Si la pieza no es celda, no se hace nada.
    if "celda" not in celda_activa.className:
        return

    celdas = document.querySelectorAll(".celda")
    for c in celdas:
        c.classList.remove("resaltada")
        
    id_activa = int(celda_activa.id)
    fila_activa = id_activa // 9
    col_activa = id_activa % 9
    
    es_fija = "fija" in celda_activa.className
    valor_activo = celda_activa.innerText.strip() if es_fija else None
    
    for c in celdas:
        # Si la celda pulsada es fija, resalta los números iguales del tablero
        if es_fija and valor_activo and valor_activo != "":
            val_c = c.value if "vacia" in c.className else c.innerText
            if val_c and val_c.strip() == valor_activo:
                c.classList.add("resaltada")

def actualizar_resaltado_y_conteo(num_elegido):
    celdas = document.querySelectorAll(".celda")
    contador_div = document.getElementById("contador-restantes")
    
    # Limpia los resaltes anteriores
    for c in celdas:
        c.classList.remove("resaltada")
        
    if num_elegido == "X" or not num_elegido:
        contador_div.innerText = "Seleccione una cifra para escrutar"
        return
        
    puestos = 0
    for c in celdas:
        val_c = c.value if "vacia" in c.className else c.innerText
        if val_c and val_c.strip() == num_elegido:
            c.classList.add("resaltada")
            puestos += 1
            
    restantes = 9 - puestos
    if restantes > 0:
        contador_div.innerText = f"Restan {restantes} piezas del número {num_elegido}"
    elif restantes == 0:
        contador_div.innerText = f"El número {num_elegido} está completo"
    else:
        contador_div.innerText = f"Demasía del número {num_elegido}: {abs(restantes)}"
    
    actualizar_conteo_botones()


@when("click", "#selector-numeros")
def seleccionar_numero(event):
    btn = event.target
    if "num-btn" not in btn.className:
        return
        
    botones = document.querySelectorAll(".num-btn")
    for b in botones:
        b.classList.remove("activo")
        
    num_elegido = btn.getAttribute("data-num")
    if num_elegido != "X":
        btn.classList.add("activo")
        
    actualizar_resaltado_y_conteo(num_elegido)


@when("click", "#sudoku-board")
def click_tablero(event):
    celda = event.target
    if "celda" not in celda.className:
        return
        
    # Si el jugador clica una casilla vacía y hay número activo abajo, se escribe.
    if "vacia" in celda.className:
        btn_activo = document.querySelector(".num-btn.activo")
        if btn_activo:
            num_elegido = btn_activo.getAttribute("data-num")
            celda.value = num_elegido
            celda.classList.remove("erronea")
            actualizar_resaltado_y_conteo(num_elegido)
            
            # Escudriña si todo el tablero quedó cubierto
            inputs = document.querySelectorAll("input.vacia")
            todo_lleno = True
            for inp in inputs:
                if not inp.value:
                    todo_lleno = False
                    break
            boton = document.getElementById("btn-comprobar")
            boton.innerText = "Verificar" if todo_lleno else "Comprobar"
        return
        
    # Si se pincha una celda fija, enciende su correspondiente botón abajo
    if "fija" in celda.className:
        num = celda.innerText.strip()
        if num:
            botones = document.querySelectorAll(".num-btn")
            for b in botones:
                b.classList.remove("activo")
                if b.getAttribute("data-num") == num:
                    b.classList.add("activo")
            actualizar_resaltado_y_conteo(num)


@when("click", "#btn-pista")
async def dar_pista(event):
    inputs = document.querySelectorAll("input.vacia")
    vacios = [inp for inp in inputs if not inp.value]
    
    if not vacios:
        return  # No resta hueco alguno por rellenar
        
    celda_azar = random.choice(vacios)
    solucion = celda_azar.getAttribute("data-solucion")
    celda_azar.value = solucion
    celda_azar.classList.remove("erronea")
    
    # Enciende el destello en la pieza otorgada
    celda_azar.classList.add("anim-pista")
    
    # Si hubiere botón encendido, se renueva el conteo
    btn_activo = document.querySelector(".num-btn.activo")
    if btn_activo:
        num_elegido = btn_activo.getAttribute("data-num")
        actualizar_resaltado_y_conteo(num_elegido)
        
    # Si tras la pista se completó el lienzo, múdese el rótulo
    vacios_despues = [inp for inp in inputs if not inp.value]
    if not vacios_despues:
        document.getElementById("btn-comprobar").innerText = "Verificar"
        
    actualizar_conteo_botones()
        
    # Detiene la razón un segundo e apaga la lumbre
    await asyncio.sleep(1.0)
    celda_azar.classList.remove("anim-pista")

def actualizar_conteo_botones():
    """Apaga la lumbre de los botones desque sus nueve piezas están en su justo lugar."""
    conteos = {str(n): 0 for n in range(1, 10)}
    
    # Cuenta las celdas que vinieron fijas de la matriz
    for celda in document.querySelectorAll(".celda.fija"):
        num = celda.innerText.strip()
        if num in conteos:
            conteos[num] += 1
            
    # Cuenta los huecos que se han rellenado correctamente
    for inp in document.querySelectorAll("input.vacia"):
        val = inp.value.strip()
        sol = inp.getAttribute("data-solucion")
        if val == sol:
            conteos[val] += 1
            
    # Muda el tono de los botones si llegaron a la novena pieza
    for n in range(1, 10):
        btn = document.querySelector(f".num-btn[data-num='{n}']")
        if btn:
            if conteos[str(n)] >= 9:
                btn.classList.add("agotado")
            else:
                btn.classList.remove("agotado")

@when("click", "#btn-comprobar")
async def comprobar_tablero(event):
    tablero = document.getElementById("sudoku-board")
    banner = document.getElementById("banner")
    
    # Enciende el pulso en el tablero
    tablero.classList.add("anim-verificar")
    
    inputs = document.querySelectorAll("input.vacia")
    errores = 0
    vacios = 0
    
    # Escrutinio de las casillas
    for inp in inputs:
        val = inp.value.strip()
        sol = inp.getAttribute("data-solucion")
        
        if not val:
            vacios += 1
            inp.classList.remove("erronea")
        elif val != sol:
            errores += 1
            inp.classList.add("erronea")
        else:
            inp.classList.remove("erronea")
            
    # Espera que el pulso acabe su danza
    await asyncio.sleep(0.4)
    tablero.classList.remove("anim-verificar")
    
    # Sentencia del banner
    if errores == 0 and vacios == 0:
        banner.className = "victoria"
        banner.innerText = "¡Victoria! El armazón es perfecto y cabal."
    elif errores > 0:
        banner.className = "error"
        banner.innerText = f"Casi lo tienes: restan {errores} piezas erradas."
    else:
        banner.className = "incompleto"
        banner.innerText = "El juicio va bien, empero quedan huecos."
    
    actualizar_conteo_botones()

@when("click", "#enlace-volver")
async def detener_y_volver(event):
    event.preventDefault() # Detiene la huida inmediata
    
    # Envía el aviso al servidor del menú para tumbar el contenedor
    try:
        opciones = window.JSON.parse('{"method": "POST"}')
        await window.fetch("http://localhost:80/api/stop/sudoku", opciones)
    except Exception as e:
        # Si la máquina no responde, la razón no se detiene
        pass
        
    # Muda el viaje al menú principal
    window.location.href = "http://localhost:80"