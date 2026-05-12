from pyscript import document
import random

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
    container = document.querySelector("#sudoku-board")

    for i in range(9):
        for j in range(9):
            celdaPadre = document.createElement("div")
            celda = document.createElement("div")

            id_celda = i * 9 + j

            celda.id = str(id_celda)
            celda.innerText = str(tablero[i][j])

            container.appendChild(celdaPadre)
            celdaPadre.appendChild(celda)

tablero = [[0] * 9 for _ in range(9)]
rellenar(tablero)

generar_cuadricula(tablero)