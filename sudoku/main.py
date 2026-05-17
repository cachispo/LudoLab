from pyscript import web, when, document
import random

# El número de celdas visibles se ajustará según la dificultad elegida por el usuario
visibles = 0

# 1. FUNCIONES PARA GENERAR EL TABLERO DE SUDOKU
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
    # Limpiamos el tablero por si cambian de dificultad a mitad de partida
    container._dom_element.innerHTML = ""

    escaques = list(range(81))
    random.shuffle(escaques)
    ocultos = escaques[:81 - visibles]

    for i in range(9):
        for j in range(9):
            id_celda = i * 9 + j
            valor = tablero[i][j]

            if id_celda in ocultos:
                dom_input = document.createElement("input")
                dom_input.type = "number"
                dom_input.id = str(id_celda)
                dom_input.className = "celda vacia"
                dom_input.min = "1"
                dom_input.max = "9"
                dom_input.setAttribute("data-solucion", str(valor))
                container._dom_element.appendChild(dom_input)
            else:
                celda = web.div(
                    str(valor),
                    id=str(id_celda),
                    classes=["celda", "fija"]
                )
                container.append(celda)


# 2. EL EVENTO QUE SE DISPARA AL CAMBIAR LA DIFICULTAD
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