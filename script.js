let infoboton = document.getElementById('infoboton');
let infocaja = document.getElementById('infocaja');

infoboton.addEventListener('click', () => {
    if (infocaja.classList.contains('cajaoculta')) {
        infocaja.classList.replace('cajaoculta', 'cajavisible')
    } else if (infocaja.classList.contains('cajavisible')) {
        infocaja.classList.replace('cajavisible', 'cajaoculta')
    }
});