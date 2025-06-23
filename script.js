// Lista de nombres permitidos para jugar
const nombresPermitidos = ["jessi", "jessica", "prueba", "federico", "manuel", "aldana", "eliana", "sofia", "jenni"];

let isSelecting = false;      // Controla si el usuario está seleccionando letras
let selectedCells = [];       // Celdas seleccionadas actualmente
let direction = null;         // Dirección de selección (horizontal, vertical, diagonal)
let time = 0;                 // Tiempo transcurrido en segundos
let timerInterval = null;     // Intervalo del timer
let juegoIniciado = false;    // Estado del juego
let palabrasEncontradas = []; // Palabras encontradas por el jugador

// Se ejecuta cuando la página carga completamente
window.onload = () => {
  // Recupera estado previo guardado en localStorage
  const data = JSON.parse(localStorage.getItem("sopaJugador"));             // Datos guardados del jugador
  const tiempoGuardado = parseInt(localStorage.getItem("sopaTiempo"), 10) || 0;  // Tiempo guardado
  const palabrasGuardadas = JSON.parse(localStorage.getItem("palabrasEncontradas") || "[]"); // Palabras encontradas guardadas
  const boton = document.getElementById("startBtn");

  // Asignamos el evento click al botón siempre (para evitar problemas)
  boton.addEventListener("click", startGame);
  
  // Si hay datos guardados, restauramos el estado
  if (data) {
     // Juego ya iniciado: recupera estado y timer
    document.getElementById("playerName").value = data.nombre.toUpperCase();
    document.getElementById("playerName").disabled = true;

    boton.disabled = true;
    boton.textContent = "Juego corriendo";

    mostrarElementosDeJuego();
    palabrasEncontradas = palabrasGuardadas || [];
    clearTemporarySelection();
    marcarPalabrasEncontradas();

    time = tiempoGuardado;
    updateTimer();
    juegoIniciado = true;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      time++;
      localStorage.setItem("sopaTiempo", time);
      updateTimer();
    }, 1000);
  } else {
    
    // Si no hay datos guardados, preparamos el juego para iniciar
    juegoIniciado = false;
    boton.disabled = false;
    boton.textContent = "Comenzar";
  }

  bloquearCaptura();
  bindCellEvents();
};

document.addEventListener('touchstart', function(e) {
  if (e.target.closest('.cell')) e.preventDefault();
}, { passive: false });

// Bloquea el scroll táctil para que no interfiera con la selección de letra
document.addEventListener('touchmove', function(e) {
  if (e.target.closest('.cell')) e.preventDefault();
}, { passive: false });


// Lista de palabras que hay que encontrar en la sopa
const wordList = [
  "ALDANA", "AMIGOS", "CALILEGUA", "CARNAVAL", "ELIANA", "EMPANADAS", "FEDERICO", "FUENTEDEJAGUAR",
  "HORNOCAL", "JESSICA", "JUJUY", "LAQUIACA", "LASYUNGAS", "LLAMA", "MANUEL", "PACHAMAMA",
  "QUEBRADAHUMAHUACA", "SALINAS", "SIERVOS", "SOFIA", "TAMALES", "TORTILLA", "UQUIA", "VACACIONES", "VILLAZON"
];

// Función para iniciar el juego al presionar el botón "Comenzar"
function startGame() {
  // Inicia juego, valida nombre, prepara tablero y timer
  const playerNameInput = document.getElementById("playerName");
  const playerName = playerNameInput.value.trim().toLowerCase();

// Validamos el nombre ingresado
  if (!nombresPermitidos.includes(playerName)) {
    alert("Nombre no permitido. Usá uno válido.");
    return;
  }

  playerNameInput.value = playerName.toUpperCase();
  playerNameInput.disabled = true;

  const boton = document.getElementById("startBtn");
  boton.disabled = true;
  boton.textContent = "Juego iniciado";

  mostrarElementosDeJuego();
  juegoIniciado = true;
  clearInterval(timerInterval);

  // Limpiamos selecciones previas
  document.querySelectorAll(".cell").forEach(cell => cell.className = "cell");
  document.querySelectorAll("#wordList li").forEach(li => li.classList.remove("found"));
  document.getElementById("result").textContent = "";

  time = 0;
  palabrasEncontradas = [];
  updateTimer();
  
  // Iniciamos el timer
  timerInterval = setInterval(() => {
    time++;
    localStorage.setItem("sopaTiempo", time);
    updateTimer();
  }, 1000);

 // Guardamos datos iniciales del jugador
  const record = { nombre: playerName.toUpperCase() };
  localStorage.setItem("sopaJugador", JSON.stringify(record));
  localStorage.setItem("palabrasEncontradas", JSON.stringify([]));
}

// Actualiza el temporizador en pantalla
function updateTimer() {
  const min = String(Math.floor(time / 60)).padStart(2, "0");
  const sec = String(time % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `Tiempo: ${min}:${sec}`;
}

// Asigna los eventos necesarios a cada celda para manejar la selección de letras
function bindCellEvents() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('mousedown', e => juegoIniciado && startSelection(e));
    cell.addEventListener('mouseover', e => juegoIniciado && continueSelection(e));
    cell.addEventListener('mouseup', e => juegoIniciado && endSelection());

    // Eventos táctiles para móviles TOUCH para móviles
    cell.addEventListener('touchstart', e => {
      if (juegoIniciado) {
        e.preventDefault();
        startSelection(e);
      }
    }, { passive: false });

    cell.addEventListener('touchmove', e => {
      if (juegoIniciado) {
        e.preventDefault();
        touchMove(e);
      }
    }, { passive: false });
  });

// Eventos globales para detectar fin de selección fuera de las celdas
  document.addEventListener('mouseup', () => juegoIniciado && endSelection());
  document.addEventListener('touchend', () => juegoIniciado && endSelection());
}

// Inicia la selección de letras cuando el usuario presiona una celda
function startSelection(e) {
  e.preventDefault();
  isSelecting = true;
  clearTemporarySelection();
  selectCell(e.target);
}

// Continúa la selección mientras el usuario mueve el mouse o el dedo
function continueSelection(e) {
  if (!isSelecting) return;
  selectCell(e.target);
}

// Maneja el movimiento táctil para seleccionar celdas
function touchMove(e) {
  if (!isSelecting) return;
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (el && el.classList.contains('cell')) {
    selectCell(el);
  }
}

// Termina la selección cuando el usuario suelta el botón o deja de tocar
function endSelection() {
  if (!isSelecting) return;
  isSelecting = false;

 // Forma la palabra con las letras seleccionadas
  const word = selectedCells.map(c => c.textContent).join('');
  const reversed = word.split('').reverse().join('');
  let found = false;

 // Revisa si la palabra o su reversa están en la lista de palabra
  wordList.forEach((w, idx) => {
    if (w === word || w === reversed) {
      if (!palabrasEncontradas.find(obj => obj.word === w)) {
        found = true;
        const posiciones = selectedCells.map(c => ({
          row: parseInt(c.dataset.row),
          col: parseInt(c.dataset.col),
        }));
        palabrasEncontradas.push({ word: w, positions: posiciones });

        const items = document.querySelectorAll('#wordList li');
items.forEach(li => {
  if (li.textContent.trim().toUpperCase() === w) {
    li.classList.add('found');
  }
});
selectedCells.forEach(cell => cell.classList.add('highlighted'));

localStorage.setItem("palabrasEncontradas", JSON.stringify(palabrasEncontradas));

      } else {
        found = true;
      }
    }
  });

  if (!found) {
    clearTemporarySelection();
  } else {
    selectedCells = [];
  }
  
// Verifica si se encontraron todas las palabras para finalizar el juego
  const items = document.querySelectorAll('#wordList li');
  if ([...items].every(li => li.classList.contains('found'))) {
    clearInterval(timerInterval);
    juegoIniciado = false;
  const boton = document.getElementById("startBtn");
  boton.disabled = true;

    const tiempoStr = document.getElementById('timer').textContent.split(' ')[1];
    const playerName = document.getElementById("playerName").value.trim();

    alert(`🎉 ¡Felicidades, ${playerName}!\nLo lograste en ${tiempoStr} 🎯`);
    document.getElementById('result').textContent = `¡Felicidades, ${playerName}! Lo lograste en ${tiempoStr}`;

    saveScore(tiempoStr);
    sendScore();
  }
}


// Selecciona una celda y valida la dirección para formar palabras en línea recta
function selectCell(cell) {
  if (selectedCells.includes(cell)) return;

  const rowN = parseInt(cell.dataset.row);
  const colN = parseInt(cell.dataset.col);

  if (selectedCells.length === 0) {
    cell.classList.add('selected');
    selectedCells.push(cell);
    direction = null;
    return;
  }

  const lastCell = selectedCells[selectedCells.length - 1];
  const rowL = parseInt(lastCell.dataset.row);
  const colL = parseInt(lastCell.dataset.col);

  const dRow = rowN - rowL;
  const dCol = colN - colL;

 // Permite sólo celdas adyacentes (incluyendo diagonales)
  if (Math.abs(dRow) > 1 || Math.abs(dCol) > 1) return;
  
// Define dirección en la segunda selección
  if (selectedCells.length === 1) {
    if (dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol)) {
      direction = [dRow, dCol];
      cell.classList.add('selected');
      selectedCells.push(cell);
    }
    return;
  }
// Continua solo si la nueva celda está en la misma dirección
  if (direction) {
    if (dRow === direction[0] && dCol === direction[1]) {
      cell.classList.add('selected');
      selectedCells.push(cell);
    }
  }
}

// Limpia la selección temporal (cuando la palabra no es válida)
function clearTemporarySelection() {
  document.querySelectorAll('.cell.selected').forEach(cell => cell.classList.remove('selected'));
  selectedCells = [];
  direction = null;
}

// Marca en la interfaz las palabras ya encontradas y resalta sus celdas
function marcarPalabrasEncontradas() {
  if (!palabrasEncontradas.length) return;
  palabrasEncontradas.forEach(({ word, positions }) => {
    const idx = wordList.indexOf(word);
    if (idx >= 0) {
      document.querySelectorAll('#wordList li')[idx].classList.add('found');
    }
    positions.forEach(pos => {
      const selector = `.cell[data-row="${pos.row}"][data-col="${pos.col}"]`;
      const cell = document.querySelector(selector);
      if (cell) cell.classList.add('highlighted');
    });
  });
}

// Guarda el puntaje y actualiza el ranking en localStorage
function saveScore(tiempo) {
  const playerName = document.getElementById("playerName").value.trim();
  if (!playerName) return;
  const record = { nombre: playerName, tiempo };
  localStorage.setItem("sopaJugador", JSON.stringify(record));
  const rankings = JSON.parse(localStorage.getItem("sopaRanking") || "[]");
  rankings.push(record);
  rankings.sort((a, b) => {
    const [ma, sa] = a.tiempo.split(":").map(Number);
    const [mb, sb] = b.tiempo.split(":").map(Number);
    return (ma * 60 + sa) - (mb * 60 + sb);
  });
  localStorage.setItem("sopaRanking", JSON.stringify(rankings.slice(0, 10)));
}


// Envía el puntaje a un formulario oculto y muestra confirmación

function sendScore() {
  const playerName = document.getElementById("playerName").value.trim();
  const tiempo = document.getElementById("timer").textContent.split(' ')[1];
  if (!playerName || !tiempo) return;

  // Poner los datos en inputs ocultos
  document.getElementById("inputName").value = playerName;
  document.getElementById("inputTime").value = tiempo;

  // Enviar el formulario (sin manejar iframe onload porque Google Forms no lo permite confiablemente)
  document.getElementById("scoreForm").submit();

  // Mostrar mensaje inmediato que se envió (no esperamos confirmación real)
 mostrarMensaje("✅ Resultado enviado. ¡Gracias por jugar!");
}



// BLOQUEO PANTALLA

function bloquearCaptura() {
  const overlay = document.createElement("div");
  overlay.id = "antiCapture";
  overlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    display: none;
  `;
  document.body.appendChild(overlay);

  document.addEventListener("visibilitychange", () => {
    overlay.style.display = document.hidden ? "block" : "none";
  });
  window.addEventListener("blur", () => overlay.style.display = "block");
  window.addEventListener("focus", () => overlay.style.display = "none");
}

function mostrarElementosDeJuego() {
  document.querySelector(".controls").style.display = "block";
  document.getElementById("grid").style.display = "grid";
  document.getElementById("wordList").style.display = "block";
  document.getElementById("result").style.display = "block";
}
// ✅ Mostrar mensaje en modal personalizado

function mostrarMensaje(texto) {
  const messageBox = document.getElementById("messageBox");
  const btn = document.getElementById("messageBtn");
  document.getElementById("messageText").textContent = texto;
  messageBox.style.display = "block";
  btn.disabled = false;  // Activar botón cuando se muestra el mensaje
}

//function mostrarMensaje(texto) {
  //document.getElementById("messageText").textContent = texto;
  //document.getElementById("messageBox").style.display = "block";
//}

// ✅ Ocultar modal cuando se hace clic en el botón
function hideMessage() {
  const messageBox = document.getElementById("messageBox");
  const btn = document.getElementById("messageBtn");
  messageBox.style.display = "none";
  btn.disabled = true;  // Desactivar para evitar cerrar prematuro
}

//function hideMessage() {
  //document.getElementById("messageBox").style.display = "none";
//}