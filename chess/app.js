(() => {
  'use strict';

  /* ---------- Constantes ---------- */
  const API_URL = 'https://lichess.org/api/puzzle/next';

  // \uFE0E fuerza el peón negro a dibujarse como texto y no como emoji a color.
  const GLYPHS = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟\uFE0E' }
  };

  // Puzles de respaldo por si la API no responde (sin conexión, etc.)
  const FALLBACK = [
    { id: 'local1', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', solution: ['d1d8'], rating: 400, themes: ['mateIn1', 'backRankMate'], lastMove: null },
    { id: 'local2', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: ['h5f7'], rating: 400, themes: ['mateIn1'], lastMove: null },
    { id: 'local3', fen: '3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', solution: ['d8d1'], rating: 400, themes: ['mateIn1', 'backRankMate'], lastMove: null }
  ];

  /* ---------- Estado ---------- */
  let game = null, puzzle = null, solution = [], idx = 0;
  let playerColor = 'w', selected = null, legalTargets = [];
  let lastMove = null, hintSq = null, hintUsed = false;
  let locked = true, over = false, gameOver = false, epoch = 0;
  let score = 0, streak = 0, lives = 3, record = 0;
  let soundOn = true, audio = null;

  /* ---------- DOM ---------- */
  const $ = id => document.getElementById(id);
  const el = {
    board: $('board'), status: $('status'), turn: $('turn'), themes: $('themes'),
    score: $('score'), streak: $('streak'), lives: $('lives'), rating: $('rating'), record: $('record'),
    hint: $('btn-hint'), skip: $('btn-skip'), next: $('btn-next'), sound: $('btn-sound')
  };

  try { record = parseInt(localStorage.getItem('ajedrez-arcade-record') || '0', 10) || 0; } catch (e) { /* sin almacenamiento */ }

  /* ---------- Sonido (pitidos retro) ---------- */
  function beep(freq, dur = 0.1, type = 'square', delay = 0) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator();
      const g = audio.createGain();
      const t = audio.currentTime + delay;
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* sin audio */ }
  }
  const sfx = {
    move:  () => beep(440, 0.06),
    good:  () => { beep(523, 0.08); beep(659, 0.08, 'square', 0.09); },
    win:   () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.12, 'square', i * 0.11)),
    bad:   () => { beep(180, 0.15, 'sawtooth'); beep(120, 0.2, 'sawtooth', 0.14); },
    over:  () => [392, 330, 262, 196].forEach((f, i) => beep(f, 0.2, 'sawtooth', i * 0.18))
  };

  /* ---------- API ---------- */
  async function fetchPuzzle() {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const res = await fetch(API_URL, { headers: { Accept: 'application/json' }, signal: ctl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return fromLichess(await res.json());
    } finally {
      clearTimeout(timer);
    }
  }

  // Lichess entrega la partida (PGN) hasta justo antes del puzle
  // y la solución en notación UCI; el primer movimiento es del jugador.
  function fromLichess(d) {
    const g = new Chess();
    const tokens = d.game.pgn.split(/\s+/)
      .map(t => t.replace(/^\d+\.+/, ''))
      .filter(t => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
    for (const san of tokens) {
      if (!g.move(san, { sloppy: true })) throw new Error('PGN inválido');
    }
    const hist = g.history({ verbose: true });
    const last = hist.length ? hist[hist.length - 1] : null;
    return {
      id: d.puzzle.id,
      fen: g.fen(),
      solution: d.puzzle.solution,
      rating: d.puzzle.rating,
      themes: d.puzzle.themes || [],
      lastMove: last ? { from: last.from, to: last.to } : null
    };
  }

  /* ---------- Flujo de puzles ---------- */
  async function nextPuzzle() {
    const myEpoch = ++epoch;
    locked = true; over = false;
    selected = null; legalTargets = []; hintSq = null; hintUsed = false;
    setStatus('CARGANDO PUZLE...', '', true);
    updateButtons();

    let p, offline = false;
    try {
      p = await fetchPuzzle();
    } catch (e) {
      offline = true;
      p = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    }
    if (myEpoch !== epoch) return;

    puzzle = p;
    game = new Chess(p.fen);
    solution = p.solution.slice();
    idx = 0;
    playerColor = game.turn();
    lastMove = p.lastMove;
    locked = false;

    el.rating.textContent = p.rating;
    el.themes.textContent = p.themes.map(t => t.replace(/([A-Z])/g, ' $1').toUpperCase()).join(' · ');
    setStatus(offline ? 'SIN CONEXIÓN: PUZLE LOCAL' : 'ENCUENTRA LA MEJOR JUGADA', '');
    render();
    updateButtons();
  }

  function onSquare(sq) {
    if (locked || over || gameOver) return;
    const piece = game.get(sq);
    if (selected && legalTargets.includes(sq)) {
      tryMove(selected, sq);
      return;
    }
    if (piece && piece.color === playerColor && sq !== selected) {
      selected = sq;
      legalTargets = game.moves({ square: sq, verbose: true }).map(m => m.to);
    } else {
      selected = null; legalTargets = [];
    }
    render();
  }

  function tryMove(from, to) {
    const cands = game.moves({ square: from, verbose: true }).filter(m => m.to === to);
    if (!cands.length) return;

    const exp = solution[idx];
    const matches = !!exp && exp.slice(0, 4) === from + to;
    let promo;
    if (cands[0].flags.indexOf('p') !== -1) {
      promo = (matches && exp[4]) ? exp[4] : 'q';
    }

    game.move({ from, to, promotion: promo });
    selected = null; legalTargets = []; hintSq = null;

    if (matches) {
      lastMove = { from, to };
      idx++;
      if (idx >= solution.length) return solved();
      sfx.move();
      render();
      opponentReply();
    } else if (game.in_checkmate()) {
      // Otra vía de mate válida: también se da por buena.
      lastMove = { from, to };
      solved();
    } else {
      game.undo();
      wrong();
    }
  }

  function opponentReply() {
    const myEpoch = epoch;
    locked = true;
    setStatus('¡BIEN! ESPERA...', '');
    setTimeout(() => {
      if (myEpoch !== epoch) return;
      const u = solution[idx];
      const m = game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      lastMove = m ? { from: m.from, to: m.to } : lastMove;
      idx++;
      locked = false;
      sfx.good();
      if (idx >= solution.length) return solved();
      setStatus('¡SIGUE ASÍ!', '');
      render();
    }, 550);
  }

  function solved() {
    over = true; locked = false;
    let pts = 100 + Math.round(puzzle.rating / 10) + streak * 10 - (hintUsed ? 50 : 0);
    pts = Math.max(pts, 10);
    score += pts;
    streak++;
    if (score > record) {
      record = score;
      try { localStorage.setItem('ajedrez-arcade-record', String(record)); } catch (e) { /* nada */ }
    }
    sfx.win();
    setStatus('¡PUZLE RESUELTO! +' + pts, 'win');
    render(); updateHud(); updateButtons();
  }

  function wrong() {
    lives--;
    streak = 0;
    el.board.classList.remove('shake');
    void el.board.offsetWidth;
    el.board.classList.add('shake');
    updateHud();
    if (lives <= 0) {
      gameOver = true; over = true;
      sfx.over();
      setStatus('FIN DEL JUEGO · SOLUCIÓN: ' + solutionSAN(), 'bad');
    } else {
      sfx.bad();
      setStatus('JUGADA INCORRECTA · -1 VIDA', 'bad');
    }
    render(); updateButtons();
  }

  function solutionSAN() {
    const g = new Chess(puzzle.fen);
    return solution.map(u => {
      const m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      return m ? m.san : u;
    }).join(' ');
  }

  /* ---------- Render ---------- */
  function render() {
    const files = 'abcdefgh';
    const flip = playerColor === 'b';
    const inCheck = game.in_check();
    const frag = document.createDocumentFragment();

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const file = flip ? 7 - f : f;
        const rank = flip ? r : 7 - r;
        const sq = files[file] + (rank + 1);
        const piece = game.get(sq);

        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.sq = sq;
        b.className = 'sq ' + ((file + rank) % 2 === 0 ? 'dark' : 'light');
        if (r === 7) b.dataset.file = files[file];
        if (f === 0) b.dataset.rank = rank + 1;

        if (lastMove && (sq === lastMove.from || sq === lastMove.to)) b.classList.add('last');
        if (sq === selected) b.classList.add('selected');
        if (legalTargets.includes(sq)) b.classList.add('target', ...(piece ? ['capture'] : []));
        if (sq === hintSq) b.classList.add('hint');
        if (inCheck && piece && piece.type === 'k' && piece.color === game.turn()) b.classList.add('check');

        if (piece) {
          const s = document.createElement('span');
          s.className = 'piece ' + piece.color;
          s.textContent = GLYPHS[piece.color][piece.type];
          b.appendChild(s);
          b.setAttribute('aria-label', sq + ' ' + piece.color + piece.type);
        } else {
          b.setAttribute('aria-label', sq);
        }
        frag.appendChild(b);
      }
    }
    el.board.replaceChildren(frag);

    el.turn.textContent = 'TE TOCA: ' + (playerColor === 'w' ? 'BLANCAS ♔' : 'NEGRAS ♚');
    updateHud();
  }

  function updateHud() {
    el.score.textContent = String(score).padStart(6, '0');
    el.record.textContent = String(record).padStart(6, '0');
    el.streak.textContent = streak;
    el.lives.textContent = lives > 0 ? '♥'.repeat(lives) : '---';
  }

  function updateButtons() {
    el.next.disabled = !over;
    el.next.textContent = gameOver ? 'REINICIAR ▶' : 'SIGUIENTE ▶';
    el.hint.disabled = over || locked;
    el.skip.disabled = over || locked;
  }

  function setStatus(msg, cls, blink) {
    el.status.textContent = msg;
    el.status.className = 'status' + (cls ? ' ' + cls : '') + (blink ? ' blink' : '');
  }

  /* ---------- Eventos ---------- */
  el.board.addEventListener('click', e => {
    const sq = e.target.closest('.sq');
    if (sq) onSquare(sq.dataset.sq);
  });

  el.hint.addEventListener('click', () => {
    if (over || locked || !solution[idx]) return;
    hintSq = solution[idx].slice(0, 2);
    hintUsed = true;
    render();
  });

  el.skip.addEventListener('click', () => {
    if (over || locked) return;
    streak = 0;
    nextPuzzle();
  });

  el.next.addEventListener('click', () => {
    if (!over) return;
    if (gameOver) {
      gameOver = false; score = 0; streak = 0; lives = 3;
      updateHud();
    }
    nextPuzzle();
  });

  el.sound.addEventListener('click', () => {
    soundOn = !soundOn;
    el.sound.textContent = 'SONIDO: ' + (soundOn ? 'SÍ' : 'NO');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !el.next.disabled && document.activeElement.tagName !== 'BUTTON') el.next.click();
  });

  /* ---------- Arranque ---------- */
  updateHud();
  updateButtons();
  nextPuzzle();
})();
