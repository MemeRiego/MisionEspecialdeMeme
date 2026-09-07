const scenes = [...document.querySelectorAll('.scene')];
let currentScene = 0;
let noAttempts = 0;
let chosenPlan = null;

const loveLoader = document.getElementById('loveLoader');
const startButton = document.getElementById('startButton');
const loaderStatus = document.getElementById('loaderStatus');
const loaderDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 1750;

window.setTimeout(() => {
  loaderStatus.textContent = '¡Todo listo para empezar!';
  loveLoader.classList.add('is-ready');
  startButton.focus();
}, loaderDelay);

startButton.addEventListener('click', () => {
  loveLoader.classList.add('is-leaving');
  document.body.classList.remove('loading-active');
  window.setTimeout(() => {
    loveLoader.hidden = true;
    scenes[currentScene].querySelector('button:not([disabled])')?.focus({ preventScroll: true });
  }, 430);
});

function showScene(index) {
  scenes[currentScene].classList.remove('is-active');
  currentScene = index;
  scenes[currentScene].classList.add('is-active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  scenes[currentScene].querySelector('button:not([disabled])')?.focus({ preventScroll: true });
}

document.querySelectorAll('[data-next]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!button.disabled) showScene(Math.min(currentScene + 1, scenes.length - 1));
  });
});

const activatedChampions = new Set();
document.querySelectorAll('[data-champ]').forEach((card) => {
  card.addEventListener('click', () => {
    card.classList.add('is-active');
    activatedChampions.add(card.dataset.champ);
    document.getElementById('champCount').textContent = activatedChampions.size;
    if (activatedChampions.size === 5) {
      document.getElementById('teamNext').disabled = false;
      toast('¡Equipo completo! Todas las habilidades están activadas.');
    }
  });
});

const TOTAL_HEARTS = 10;
let caughtHearts = 0;
const heartArena = document.getElementById('heartArena');

function moveRunnerHeart(heart) {
  const dodges = Number(heart.dataset.dodges || 0);
  if (dodges >= 3 || heart.classList.contains('caught')) return false;

  const padding = 10;
  const heartSize = heart.offsetWidth || 56;
  const maxLeft = Math.max(padding, heartArena.clientWidth - heartSize - padding);
  const maxTop = Math.max(padding, heartArena.clientHeight - heartSize - 66);
  heart.style.right = 'auto';
  heart.style.bottom = 'auto';
  heart.style.left = `${padding + Math.random() * Math.max(0, maxLeft - padding)}px`;
  heart.style.top = `${padding + Math.random() * Math.max(0, maxTop - padding)}px`;
  heart.dataset.dodges = String(dodges + 1);
  toast(dodges === 2 ? 'Se quedó sin Flash. ¡Ahora sí!' : 'Ese corazón usó Flash.');
  return true;
}

document.querySelectorAll('.catch-heart').forEach((heart) => {
  heart.addEventListener('pointerenter', (event) => {
    if (heart.matches('[data-runner]') && event.pointerType !== 'touch') moveRunnerHeart(heart);
  });
  heart.addEventListener('click', () => {
    if (heart.classList.contains('caught')) return;
    if (heart.matches('[data-runner]') && moveRunnerHeart(heart)) return;
    heart.classList.add('caught');
    caughtHearts += 1;
    document.getElementById('heartCount').textContent = caughtHearts;
    if (caughtHearts === TOTAL_HEARTS) {
      const ultimate = document.getElementById('ultimate');
      ultimate.classList.add('ready');
      ultimate.innerHTML = `<span>${TOTAL_HEARTS}</span>/${TOTAL_HEARTS} · ¡DEFINITIVA LISTA!`;
      document.getElementById('heartNext').disabled = false;
      burstHearts(22);
    }
  });
});

const noMessages = [
  'Fallaste el click. Pasa hasta en Challenger.',
  'El botón usó Flash.',
  'Mmm… parece que esa opción está fuera de rango.',
  'El Sí está escalando mejor que un carry al minuto 40.',
  'Último intento: el No acaba de volver a base.'
];

const noButton = document.getElementById('noButton');
const yesButton = document.getElementById('yesButton');

function dodgeNo() {
  noAttempts += 1;
  const yesRect = yesButton.getBoundingClientRect();
  const noWidth = noButton.offsetWidth || 85;
  const noHeight = noButton.offsetHeight || 48;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const padding = 14;
  const safeGap = 28;
  let x = padding;
  let y = padding;
  let positionFound = false;

  const overlapsYes = (candidateX, candidateY) => !(
    candidateX + noWidth < yesRect.left - safeGap ||
    candidateX > yesRect.right + safeGap ||
    candidateY + noHeight < yesRect.top - safeGap ||
    candidateY > yesRect.bottom + safeGap
  );

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const candidateX = padding + Math.random() * Math.max(0, viewportWidth - noWidth - padding * 2);
    const candidateY = padding + Math.random() * Math.max(0, viewportHeight - noHeight - padding * 2);
    if (!overlapsYes(candidateX, candidateY)) {
      x = candidateX;
      y = candidateY;
      positionFound = true;
      break;
    }
  }

  if (!positionFound) {
    const corners = [
      [padding, padding],
      [viewportWidth - noWidth - padding, padding],
      [padding, viewportHeight - noHeight - padding],
      [viewportWidth - noWidth - padding, viewportHeight - noHeight - padding]
    ];
    const safeCorner = corners.find(([candidateX, candidateY]) => !overlapsYes(candidateX, candidateY));
    if (safeCorner) [x, y] = safeCorner;
  }
  if (noButton.parentElement !== document.body) document.body.appendChild(noButton);
  noButton.style.position = 'fixed';
  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
  noButton.style.transform = 'none';
  const scale = Math.min(1.85, 1 + noAttempts * .14);
  yesButton.style.transform = `scale(${scale})`;
  document.getElementById('noMessage').textContent = noMessages[Math.min(noAttempts - 1, noMessages.length - 1)];
}

noButton.addEventListener('pointerenter', dodgeNo);
noButton.addEventListener('click', (event) => { event.preventDefault(); dodgeNo(); });
noButton.addEventListener('focus', () => { if (noAttempts > 0) dodgeNo(); });

yesButton.addEventListener('click', () => {
  noButton.style.display = 'none';
  megaHeartBurst();
  burstHearts(56);
  window.setTimeout(() => showScene(5), 1050);
});

document.getElementById('timeButton').addEventListener('click', () => {
  document.getElementById('noMessage').textContent = 'Está bien, de verdad. No tenés que decidir nada ahora. El cariño no tiene temporizador.';
  yesButton.style.transform = 'scale(1)';
  noButton.style.display = 'none';
});

const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const localToday = new Date();
const todayString = [localToday.getFullYear(), String(localToday.getMonth() + 1).padStart(2, '0'), String(localToday.getDate()).padStart(2, '0')].join('-');
dateInput.min = todayString;

document.getElementById('dateForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const date = dateInput.value;
  const time = timeInput.value;
  const plan = document.getElementById('planInput').value;
  const trap = document.getElementById('websiteInput').value;
  const submitButton = document.getElementById('confirmDateButton');
  if (!date || !time) {
    document.getElementById('formError').textContent = 'Falta elegir fecha y hora para entrar a la partida.';
    return;
  }
  if (trap) return;
  document.getElementById('formError').textContent = '';
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando invitación...';

  const prettyDate = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`));
  const notification = new FormData();
  notification.append('Fecha elegida', prettyDate);
  notification.append('Hora elegida', time);
  notification.append('Tipo de cita', plan);
  notification.append('Mensaje', `Naza aceptó la cita sorpresa para el ${prettyDate} a las ${time}. Plan: ${plan}.`);
  notification.append('_subject', '♡ Naza aceptó la cita sorpresa');

  try {
    const response = await fetch('https://formspree.io/f/xvkowwvn', {
      method: 'POST',
      body: notification,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('No se pudo enviar la notificación');
    chosenPlan = { date, time, plan };
    document.getElementById('planSummary').innerHTML = `<span>Próxima misión:</span><br>${plan} · ${prettyDate} a las ${time}`;
    showScene(6);
    burstHearts(45);
  } catch (error) {
    document.getElementById('formError').textContent = 'No pudimos enviar la notificación. Revisá la conexión e intentá nuevamente.';
    submitButton.disabled = false;
    submitButton.textContent = 'Reintentar confirmación';
  }
});

document.getElementById('calendarButton').addEventListener('click', () => {
  if (!chosenPlan) return;
  const start = new Date(`${chosenPlan.date}T${chosenPlan.time}:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const formatICS = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const safePlan = chosenPlan.plan.replace(/[;,]/g, ' ');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Meme//Cita sorpresa//ES',
    'BEGIN:VEVENT', `DTSTART:${formatICS(start)}`, `DTEND:${formatICS(end)}`,
    'SUMMARY:Cita sorpresa con Meme ♡', `DESCRIPTION:${safePlan}. Una pequeña aventura juntos.`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'cita-sorpresa-con-meme.ics';
  link.click();
  URL.revokeObjectURL(link.href);
  toast('Cita preparada para agregar al calendario ♡');
});

document.getElementById('restartButton').addEventListener('click', () => window.location.reload());

function toast(message) {
  const element = document.getElementById('toast');
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 2300);
}

function burstHearts(amount) {
  const layer = document.getElementById('skyHearts');
  for (let index = 0; index < amount; index += 1) {
    const heart = document.createElement('span');
    heart.textContent = Math.random() > .25 ? '♥' : '♡';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.bottom = `${Math.random() * 18 - 5}%`;
    heart.style.setProperty('--size', `${14 + Math.random() * 24}px`);
    heart.style.setProperty('--speed', `${2.2 + Math.random() * 2.5}s`);
    heart.style.setProperty('--delay', `${Math.random() * .35}s`);
    layer.appendChild(heart);
    window.setTimeout(() => heart.remove(), 5200);
  }
}

function megaHeartBurst() {
  const explosion = document.getElementById('heartExplosion');
  explosion.classList.remove('is-bursting');
  void explosion.offsetWidth;
  explosion.classList.add('is-bursting');
  window.setTimeout(() => explosion.classList.remove('is-bursting'), 1250);
}

for (let index = 0; index < 14; index += 1) {
  const heart = document.createElement('span');
  heart.textContent = index % 3 ? '♥' : '♡';
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.setProperty('--size', `${12 + Math.random() * 18}px`);
  heart.style.setProperty('--speed', `${8 + Math.random() * 7}s`);
  heart.style.setProperty('--delay', `${-Math.random() * 12}s`);
  document.getElementById('skyHearts').appendChild(heart);
}
