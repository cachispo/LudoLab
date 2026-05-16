from pyscript import web, when, display
import random

# Declarad la variable en la linde principal
visibles = 0

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

def generar_cuadricula(tablero):
    container = web.page["sudoku-board"]

    for i in range(9):
        for j in range(9):
            id_celda = str(i * 9 + j)
            valor = tablero[i][j]
            texto = str(valor) if valor != 0 else ""

            celda = web.div(
                texto,
                id=id_celda,
                classes=["celda"]
            )

            container.append(celda)

@when("change", "#dificultad")
def set_dificultad(event):
    global visibles
    
    # Sin corchetes, acudimos al elemento puro
    selector = web.page["dificultad"]
    dificultad = selector.value
    
    if dificultad == "facil":
        visibles = 38
    elif dificultad == "medio":
        visibles = 30
    elif dificultad == "dificil":
        visibles = 23
        
    # La palabra se estampa con textContent
    web.page["banner"].innerHTML = f"<p>Visibles: {visibles}</p>"

tablero = [[0] * 9 for _ in range(9)]
rellenar(tablero)
generar_cuadricula(tablero)