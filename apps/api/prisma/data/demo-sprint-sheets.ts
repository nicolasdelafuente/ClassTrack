import { TaskCategory } from '@prisma/client';

/**
 * Realistic demo sprint sheets for Group 1 (CT-056).
 * HTML is intentional: the web app renders rich text on sheets.
 */

export type DemoStartTask = {
  /** Optional tags (0..n); demo usually has 1–2 (CT-071). */
  categories: TaskCategory[];
  title: string;
  description: string;
  /** Optional Trello card URLs (CT-058). */
  trelloLinks?: string[];
};

export type DemoEndOutcome =
  | { kind: 'done' }
  | { kind: 'incomplete'; reason: string }
  | {
      kind: 'extra';
      categories: TaskCategory[];
      title: string;
      description: string;
      reason: string;
      completed: boolean;
    };

/** Sprint 1 — ficha de inicio (aprobada). */
export const DEMO_S1_START_TASKS: DemoStartTask[] = [
  {
    categories: [TaskCategory.design, TaskCategory.frontend],
    title: 'Wireframes de login y home del alumno',
    description: `
<p>Definir pantallas base en Figma antes de codear.</p>
<ul>
  <li>Login (email + contraseña + mensajes de error)</li>
  <li>Home alumno con acceso a fichas y grupo</li>
  <li>Estados vacíos (sin grupo / sin fichas)</li>
</ul>
<p><strong>Criterio:</strong> link de Figma en el README del repo y revisión con el docente en clase.</p>
`.trim(),
  },
  {
    categories: [TaskCategory.frontend, TaskCategory.backend],
    title: 'Pantalla de login responsive',
    description: `
<p>Formulario usable en notebook y celular.</p>
<ul>
  <li>Campos email y password con validación básica</li>
  <li>Feedback claro si las credenciales fallan</li>
  <li>Botón deshabilitado mientras carga</li>
</ul>
<ol>
  <li>Probar en Chrome desktop</li>
  <li>Probar en viewport móvil (~375px)</li>
</ol>
`.trim(),
    trelloLinks: ['https://trello.com/c/5KbT8SJd/ejemplo-login-responsive'],
  },
  {
    categories: [TaskCategory.frontend],
    title: 'Shell de navegación del alumno',
    description: `
<p>Header con nombre del curso, link a fichas y cerrar sesión.</p>
<ul>
  <li>No romper el layout en pantallas chicas</li>
  <li>Volver atrás desde fichas sin perder contexto</li>
</ul>
`.trim(),
  },
  {
    categories: [TaskCategory.backend, TaskCategory.documentation],
    title: 'Endpoint de autenticación',
    description: `
<p><strong>POST</strong> <code>/auth/login</code></p>
<ul>
  <li>Validar email/password contra usuarios seed</li>
  <li>Devolver token + rol (docente / alumno)</li>
  <li>Respuesta 401 con mensaje claro si falla</li>
</ul>
<p><em>Nota:</em> por ahora sin refresh token; alcanza para la demo del sprint.</p>
`.trim(),
    trelloLinks: [
      'https://trello.com/c/48YewFQR/ejemplo-auth-api',
      'https://trello.com/c/TTryoEYL/ejemplo-links-trello',
    ],
  },
  {
    categories: [TaskCategory.backend],
    title: 'Endpoint de perfil del alumno logueado',
    description: `
<p><strong>GET</strong> <code>/me</code> (o equivalente) para mostrar nombre, email y grupo asignado.</p>
<ul>
  <li>Incluir número de grupo si tiene membership</li>
  <li>No filtrar datos de otros grupos</li>
</ul>
`.trim(),
  },
  {
    categories: [TaskCategory.devops],
    title: 'README de arranque local',
    description: `
<p>Documentar cómo levantar web + api en una máquina limpia.</p>
<ol>
  <li><code>npm install</code> en la raíz</li>
  <li>Copiar <code>.env.example</code> → <code>.env</code></li>
  <li><code>npx prisma migrate</code> + <code>npm run seed</code></li>
  <li>Credenciales demo docente/alumno</li>
</ol>
`.trim(),
  },
  {
    categories: [TaskCategory.testing],
    title: 'Prueba manual del flujo alumno',
    description: `
<p>Checklist de aceptación del sprint 1:</p>
<ol>
  <li>Login con alumno demo</li>
  <li>Ver que pertenece al Grupo 1</li>
  <li>Abrir ficha de inicio</li>
  <li>Editar una tarea y guardar</li>
  <li>Enviar a revisión</li>
</ol>
<p>Dejar evidencias (capturas) en Drive del grupo.</p>
`.trim(),
  },
  {
    categories: [TaskCategory.documentation],
    title: 'Actualizar Trello del sprint 1',
    description: `
<ul>
  <li>Mover tarjetas a En curso / Hecho según el avance real</li>
  <li>Pegar link de PR en la tarjeta correspondiente</li>
  <li>Marcar bloqueos en el comentario de la card</li>
</ul>
`.trim(),
  },
  {
    categories: [TaskCategory.other],
    title: 'Acuerdo de pair programming del equipo',
    description: `
<p>Definir cómo nos organizamos esta semana:</p>
<ul>
  <li>Quién toca frontend / backend / docs</li>
  <li>Horario de sync (15 min) entre clases</li>
  <li>Regla: no mergear a main sin review de al menos 1 compañero</li>
</ul>
`.trim(),
  },
];

/**
 * Outcomes for S1 end sheet, aligned 1:1 with DEMO_S1_START_TASKS indexes,
 * plus optional extras appended after.
 */
export const DEMO_S1_END_OUTCOMES: DemoEndOutcome[] = [
  { kind: 'done' },
  { kind: 'done' },
  { kind: 'done' },
  { kind: 'done' },
  {
    kind: 'incomplete',
    reason: `
<p>Quedó el endpoint esbozado pero <strong>sin tests</strong> y el front todavía lee un mock.</p>
<ul>
  <li>Faltó tiempo por el setup de Prisma en Windows</li>
  <li>Lo movemos al sprint 2 como primera prioridad</li>
</ul>
`.trim(),
  },
  { kind: 'done' },
  { kind: 'done' },
  {
    kind: 'incomplete',
    reason: `
<p>Actualizamos las cards principales, pero no pegamos todos los links de PR.</p>
<ol>
  <li>Completar links el lunes</li>
  <li>Pedir review al docente en la próxima clase</li>
</ol>
`.trim(),
  },
  { kind: 'done' },
  {
    kind: 'extra',
    categories: [TaskCategory.frontend],
    title: 'Mensaje de bienvenida con nombre del alumno',
    description: `
<p>En el home, mostrar <em>“Hola, {nombre}”</em> usando el perfil del login.</p>
<ul>
  <li>Fallback si el nombre viene vacío</li>
</ul>
`.trim(),
    reason: `
<p>Salió barato mientras armábamos el shell y mejora mucho la demo.</p>
`.trim(),
    completed: true,
  },
  {
    kind: 'extra',
    categories: [TaskCategory.testing],
    title: 'Smoke test del login docente',
    description: `
<ol>
  <li>Login docente</li>
  <li>Entrar al curso demo</li>
  <li>Abrir tablero y ver Grupo 1</li>
</ol>
`.trim(),
    reason: `
<p>El docente pidió verificar que la cuenta demo no quedó rota después del seed.</p>
`.trim(),
    completed: true,
  },
];

/** Sprint 2 — ficha de inicio (en revisión). */
export const DEMO_S2_START_TASKS: DemoStartTask[] = [
  {
    categories: [TaskCategory.frontend],
    title: 'Tablero docente: nombres de integrantes en cada grupo',
    description: `
<p>En las cards del tablero mostrar los alumnos del grupo (no solo “5/5”).</p>
<ul>
  <li>Lista compacta de nombres</li>
  <li>Indicar cupo actual / máximo</li>
  <li>Link “Armar grupos” cerca del contador</li>
</ul>
`.trim(),
    trelloLinks: ['https://trello.com/c/vavg1Rz8/ejemplo-ver-alumnos'],
  },
  {
    categories: [TaskCategory.frontend, TaskCategory.design],
    title: 'Vista de fichas del sprint (alumno)',
    description: `
<p>Poder alternar Inicio / Fin y ver el estado (borrador, revisión, aprobada).</p>
<ul>
  <li>Deshabilitar Fin hasta que Inicio esté aprobada</li>
  <li>Editor con formato (negrita, listas, numeración)</li>
  <li>Eliminar tareas del borrador y guardar</li>
</ul>
`.trim(),
  },
  {
    categories: [TaskCategory.backend, TaskCategory.documentation],
    title: 'API de fichas: crear inicio, guardar tareas, enviar a revisión',
    description: `
<p>Endpoints alineados al flujo de clase:</p>
<ol>
  <li>Crear ficha de inicio del sprint N</li>
  <li>PATCH de tareas (título, descripción HTML, tags opcionales)</li>
  <li>Submit → estado <strong>in_review</strong></li>
</ol>
<p><strong>Regla:</strong> no se edita si ya está en revisión o aprobada.</p>
`.trim(),
  },
  {
    categories: [TaskCategory.backend],
    title: 'API docente: aprobar / pedir cambios',
    description: `
<ul>
  <li>Aprobar → <code>approved</code> + fecha</li>
  <li>Pedir cambios → comentario obligatorio + <code>needs_changes</code></li>
  <li>Al aprobar inicio, habilitar creación de ficha de fin</li>
</ul>
`.trim(),
  },
  {
    categories: [TaskCategory.design],
    title: 'Ajuste visual del editor de texto enriquecido',
    description: `
<p>Que se entienda como “mini Word”, sin parecer un dashboard.</p>
<ul>
  <li>Toolbar: N / C / S / viñetas / numeración</li>
  <li>Listas con sangría legible en mobile</li>
</ul>
`.trim(),
  },
  {
    categories: [TaskCategory.devops],
    title: 'Seed demo con fichas S1/S2 realistas',
    description: `
<p>Dejar el entorno listo para la cursada:</p>
<ol>
  <li>S1 inicio + fin aprobadas</li>
  <li>S2 inicio en revisión</li>
  <li>Textos con HTML de ejemplo (listas, negrita)</li>
  <li>Alumno demo metido en Grupo 1</li>
</ol>
`.trim(),
  },
  {
    categories: [TaskCategory.testing],
    title: 'Recorrido docente: revisar ficha S2',
    description: `
<ol>
  <li>Login docente</li>
  <li>Curso → Fichas / detalle Grupo 1</li>
  <li>Ver tareas con formato</li>
  <li>Probar “Pedir cambios” y “Aprobar” en un entorno local</li>
</ol>
`.trim(),
  },
  {
    categories: [TaskCategory.documentation],
    title: 'Guía corta para compañeros: cómo llenar la ficha',
    description: `
<p>Media página en el Drive del grupo:</p>
<ul>
  <li>Qué va en Inicio vs Fin</li>
  <li>Cuándo marcar “no hecha” y cómo escribir el motivo</li>
  <li>Ejemplos de tareas buenas vs vagas</li>
</ul>
`.trim(),
  },
  {
    categories: [TaskCategory.other],
    title: 'Sync con el docente sobre criterios de aprobación',
    description: `
<p>Anotar en la ficha lo que el docente pidió en clase:</p>
<ul>
  <li>Tareas concretas y verificables</li>
  <li>No mezclar “investigación eterna” sin entregable</li>
  <li>Fin del sprint con honestidad (qué quedó pendiente)</li>
</ul>
`.trim(),
  },
];
