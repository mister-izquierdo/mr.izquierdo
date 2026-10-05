/* Mr_Izquierdo · configuración. Es el único archivo que necesitas editar. */
window.MR_CONFIG = {
  // 1) URL de tu Apps Script desplegado como aplicación web (termina en /exec).
  //    Pega aquí la URL que te da Google al implementar el Code.gs como aplicación web.
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxbOL0CkuNEqgJi5nSKMmkApwKQEgvWQS0lmv17roHbONTrh5S2sDwKMpAL4zPQOoXp/exec',

  // 2) Calendly (se incrusta en la página al terminar el formulario).
  CALENDLY_URL: 'https://calendly.com/info-mr-izquierdo/30min',

  // 3) Vídeo de la primera carpeta. Acepta una de estas tres opciones:
  //    'presentation.mp4'                       → archivo junto a index.html
  //    'https://youtu.be/XXXXXXXXXXX'           → YouTube (se carga sin cookies hasta que das al play)
  //    'https://vimeo.com/123456789'            → Vimeo
  VIDEO_URL: 'presentation.mp4',

  // 4) Analítica (opcional). ID de Google Analytics 4, tipo 'G-XXXXXXXXXX'. Vacío = la web no usa analítica
  //    y el panel de cookies solo informa. Con ID, solo se carga si el visitante acepta.
  ANALYTICS_ID: '',

  // 5) Microsoft Clarity (opcional). ID del proyecto de Clarity. Vacío = no se carga.
  //    Se activa únicamente después de aceptar la analítica en el panel de cookies.
  CLARITY_ID: '',

  // 6) Manos guía (opcional). Acepta PNG o GIF; si existen se usan en lugar del emoji nativo.
  GUIDE_IMAGES: {},   // ejemplo: { up: 'assets/emoji/up.gif', down: 'assets/emoji/down.gif', write: 'assets/emoji/write.gif' }

  // 7) false = todas las carpetas abiertas (recomendado mientras pruebas). true = las carpetas 02–05 se abren al enviar el formulario.
  LOCK_STEPS: false
};
