from pyscript import document

def generar_cuadricula():
    container = document.querySelector("#sudoku-board")
    
    for i in range(9):
        for j in range(9):
            celdaPadre = document.createElement("div")
            celda = document.createElement("div")
            
            # Cálculo de bloque y posición
            bloque = (i // 3) * 3 + (j // 3)
            posicion = (i % 3) * 3 + (j % 3)
            
            id_celda = f"{bloque}{posicion}"
            
            celda.id = id_celda
            celda.innerText = f"{id_celda} -> {i},{j}"
            
            container.appendChild(celdaPadre)
            celdaPadre.appendChild(celda)

generar_cuadricula()
print("Lógica del Sudoku cargada al 100%.")