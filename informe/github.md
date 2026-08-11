# Sistema de Análisis de Actividad Git por Sprint

## 1. Objetivo

Desarrollar una funcionalidad que permita analizar la participación individual de los alumnos de un grupo de desarrollo de software, tomando como fuente sus repositorios Git.

El análisis se realizará **sprint por sprint**.

El sistema deberá consumir la información de uno o varios repositorios/branches utilizados por el grupo y generar un JSON estructurado con:

* actividad de cada alumno;
* cantidad y características de commits;
* cantidad de código agregado/eliminado;
* archivos modificados;
* branches utilizadas;
* Pull Requests;
* distribución temporal de la actividad;
* horarios de trabajo;
* tipo de trabajo realizado;
* participación por área del proyecto;
* evolución durante el sprint;
* patrones relevantes;
* evidencia suficiente para que posteriormente un agente de IA pueda generar conclusiones docentes.

## 2. Objetivo principal de esta etapa

**NO comenzar implementando directamente.**

Primero:

1. Analizar el repositorio actual.
2. Identificar arquitectura, stack tecnológico y estructura existente.
3. Identificar cómo están representados:

   * alumnos;
   * grupos;
   * sprints;
   * repositorios;
   * branches;
   * usuarios de GitHub;
   * proyectos.
4. Determinar qué información ya existe en el sistema.
5. Determinar qué información deberá obtenerse desde GitHub/Git.
6. Identificar integraciones existentes con GitHub.
7. Analizar posibles limitaciones de la API de GitHub.
8. Diseñar la solución.
9. Proponer un plan de implementación por etapas.
10. Recién después comenzar el desarrollo.

El resultado esperado de esta etapa es un **plan técnico detallado**, no código.

---

# 3. Concepto de Sprint

Cada análisis debe estar asociado a un sprint.

Un sprint tendrá:

```text
Sprint
├── fecha_inicio
├── fecha_fin
├── grupo
├── repositorios
└── alumnos
```

El análisis deberá considerar únicamente la actividad comprendida dentro del período del sprint.

Por ejemplo:

```text
Sprint 1
Desde: 2026-03-15
Hasta: 2026-03-29
```

Un commit realizado el:

```text
2026-03-20
```

pertenece al sprint.

Un commit realizado el:

```text
2026-04-02
```

no pertenece al sprint.

---

# 4. Fuentes de información

El sistema puede utilizar información proveniente de:

## Git

* commits;
* autor;
* fecha;
* hora;
* mensaje;
* SHA;
* archivos modificados;
* líneas agregadas;
* líneas eliminadas;
* branches.

## GitHub

Cuando esté disponible:

* Pull Requests;
* estado de Pull Requests;
* merges;
* reviewers;
* reviews;
* issues;
* labels;
* branches;
* commits;
* relaciones entre PR, issue y commits.

## Información del sistema

* alumno;
* grupo;
* sprint;
* repositorio;
* branch;
* usuario GitHub asociado.

---

# 5. Identificación de alumnos

El sistema debe poder determinar qué actividad corresponde a cada alumno.

No asumir que el nombre del autor del commit coincide exactamente con el nombre del alumno.

Evaluar la posibilidad de almacenar una relación:

```text
Alumno
    ↓
GitHub User
    ↓
email / username / author
```

Ejemplo conceptual:

```json
{
  "alumno_id": 15,
  "nombre": "Juan Pérez",
  "github": {
    "username": "juanperez",
    "emails": [
      "juan@example.com"
    ]
  }
}
```

El plan deberá determinar cuál es la estrategia más confiable para realizar esta asociación.

---

# 6. Métricas a obtener

## 6.1 Actividad general

Por alumno y por sprint:

* commits totales;
* días activos;
* semanas activas;
* primer commit;
* último commit;
* branches utilizadas;
* Pull Requests creados;
* Pull Requests mergeados;
* Pull Requests cerrados sin merge.

Ejemplo:

```json
{
  "commits": 25,
  "dias_activos": 8,
  "semanas_activas": 3,
  "branches": 4,
  "prs_creados": 3,
  "prs_mergeados": 2
}
```

---

# 7. Métricas de código

Por alumno y sprint:

* líneas agregadas;
* líneas eliminadas;
* archivos modificados;
* archivos creados;
* archivos eliminados;
* cantidad de cambios;
* cantidad de commits con modificaciones pequeñas;
* cantidad de commits grandes.

Importante:

**No utilizar líneas de código como indicador directo de productividad o calidad.**

Las líneas deben considerarse únicamente como evidencia cuantitativa.

---

# 8. Análisis de commits

Analizar:

* cantidad;
* frecuencia;
* distribución;
* tamaño;
* mensajes;
* commits de revert;
* commits muy grandes;
* commits muy pequeños;
* commits consecutivos;
* commits realizados en poco tiempo.

Intentar identificar patrones como:

```text
Actividad sostenida
Actividad concentrada
Commits muy grandes
Commits muy frecuentes
Actividad cercana a la fecha de entrega
```

Estos patrones deben ser descriptivos.

No deben convertirse automáticamente en conclusiones negativas.

---

# 9. Horarios de trabajo

Esta dimensión es obligatoria.

Analizar el timestamp de los commits.

Obtener:

* hora promedio;
* hora más frecuente;
* primer horario de actividad;
* último horario de actividad;
* actividad por franja horaria;
* actividad durante fines de semana;
* actividad por día de la semana.

Ejemplo:

```json
{
  "horarios": {
    "hora_promedio": "19:42",
    "hora_mas_frecuente": "20:00",
    "actividad_por_hora": {
      "00-06": 0,
      "06-09": 2,
      "09-12": 8,
      "12-15": 14,
      "15-18": 22,
      "18-21": 47,
      "21-00": 19
    },
    "fin_de_semana": 12
  }
}
```

El horario debe considerarse como **información descriptiva**, no como indicador de compromiso o calidad.

---

# 10. Tipo de trabajo realizado

Intentar determinar qué tipo de trabajo realizó cada alumno.

La clasificación puede utilizar:

### A. Ubicación de archivos

Ejemplo:

```text
frontend/
backend/
controllers/
services/
components/
pages/
tests/
docs/
docker/
```

### B. Extensiones

Ejemplo:

```text
.php
.js
.ts
.jsx
.tsx
.css
.sql
.md
.yml
```

### C. Mensajes de commit

Ejemplo:

```text
feat: agregar login
fix: corregir validación
test: agregar pruebas de usuarios
docs: actualizar README
```

### D. Issues y Pull Requests

Cuando exista información suficiente.

---

# 11. Áreas de trabajo

Generar una clasificación aproximada:

```json
{
  "trabajo_por_area": {
    "frontend": 0.40,
    "backend": 0.35,
    "testing": 0.15,
    "documentacion": 0.05,
    "devops": 0.05
  }
}
```

La estrategia exacta para calcular estos porcentajes deberá ser definida durante el análisis técnico.

No asumir que una simple cantidad de archivos equivale automáticamente a porcentaje de trabajo.

---

# 12. Branches

Por cada alumno:

* branches utilizadas;
* commits por branch;
* archivos modificados por branch;
* fecha de creación;
* fecha de última actividad;
* branch mergeada o no;
* Pull Request asociado.

Ejemplo:

```json
{
  "nombre": "feature/asistencia",
  "commits": 12,
  "archivos_modificados": 21,
  "mergeada": true
}
```

---

# 13. Pull Requests

Cuando GitHub esté disponible, analizar:

* PRs creados;
* PRs mergeados;
* PRs cerrados;
* tiempo hasta merge;
* cantidad de commits;
* archivos afectados;
* reviews;
* comentarios;
* reviewers;
* relación con issues.

Esto permitirá diferenciar:

```text
Código desarrollado
```

de:

```text
Código efectivamente integrado al proyecto
```

---

# 14. Colaboración

Analizar indicadores como:

* PRs creados;
* PRs revisados;
* reviews realizadas;
* PRs aprobados;
* merges;
* conflictos;
* participación en integración.

No utilizar estas métricas como una puntuación automática.

Su objetivo es aportar evidencia sobre el trabajo colaborativo.

---

# 15. Evolución durante el sprint

Analizar cómo se distribuyó la actividad dentro del sprint.

Ejemplo:

```text
Día 1 → 2 commits
Día 2 → 0 commits
Día 3 → 4 commits
Día 4 → 1 commit
...
```

Detectar patrones:

* actividad sostenida;
* actividad concentrada;
* actividad al inicio;
* actividad al final;
* ausencia de actividad;
* aumento progresivo.

---

# 16. Evidencias y patrones

El sistema podrá detectar patrones objetivos.

Ejemplos:

```json
{
  "patrones": [
    {
      "tipo": "actividad_concentrada",
      "descripcion": "El 72% de los commits se realizaron durante los últimos dos días del sprint",
      "evidencia": {
        "porcentaje": 0.72
      }
    }
  ]
}
```

Otros patrones posibles:

```text
actividad_concentrada
actividad_sostenida
actividad_irregular
commits_muy_grandes
cantidad_alta_de_reverts
trabajo_principalmente_frontend
trabajo_principalmente_backend
actividad_en_varias_areas
actividad_principalmente_testing
actividad_principalmente_documentacion
```

El sistema debe reportar **evidencias**, no juicios.

---

# 17. Separación entre datos e interpretación

La arquitectura debe separar claramente:

## Datos

Información obtenida directamente desde Git/GitHub.

## Métricas

Información calculada a partir de esos datos.

## Patrones

Comportamientos detectados mediante reglas.

## Conclusiones

Interpretación realizada posteriormente por un agente de IA.

Ejemplo:

```text
Git
 ↓
Datos RAW
 ↓
Métricas
 ↓
Patrones
 ↓
JSON
 ↓
Agente IA
 ↓
Conclusiones docentes
```

No implementar en esta etapa una evaluación automática del alumno.

---

# 18. JSON de salida

Diseñar un JSON que pueda ser consumido posteriormente por otro agente.

Estructura conceptual:

```json
{
  "proyecto": {
    "nombre": "...",
    "sprint": 1,
    "fecha_inicio": "...",
    "fecha_fin": "..."
  },

  "repositorios": [],

  "alumnos": [
    {
      "id": "...",
      "nombre": "...",

      "actividad": {},

      "codigo": {},

      "commits": {},

      "horarios": {},

      "branches": [],

      "pull_requests": {},

      "colaboracion": {},

      "trabajo_por_area": {},

      "evolucion": {},

      "patrones": []
    }
  ]
}
```

El agente deberá proponer la estructura definitiva.

---

# 19. Comparación entre alumnos

El JSON debe permitir posteriormente comparar alumnos dentro del mismo sprint.

Por ejemplo:

```text
Alumno A
Alumno B
Alumno C
Alumno D
Alumno E
```

Pero evitar generar un simple ranking.

El objetivo es poder responder posteriormente preguntas como:

* ¿Quién tuvo mayor participación?
* ¿Quién trabajó de manera más sostenida?
* ¿Quién trabajó principalmente backend?
* ¿Quién trabajó principalmente frontend?
* ¿Quién participó en testing?
* ¿Quién tuvo mayor participación colaborativa?
* ¿Quién concentró su actividad antes de la entrega?
* ¿Cómo evolucionó cada alumno?

---

# 20. Comparación histórica

Aunque el análisis se realizará sprint por sprint, diseñar la estructura pensando en que posteriormente puedan compararse varios sprints.

Ejemplo:

```text
Sprint 1
 ↓
Sprint 2
 ↓
Sprint 3
 ↓
Sprint 4
 ↓
Sprint 5
```

Esto permitirá posteriormente detectar:

* evolución de participación;
* cambios de área;
* aumento/disminución de actividad;
* incorporación de nuevas responsabilidades;
* cambios en prácticas de Git;
* evolución de colaboración.

---

# 21. Consideraciones importantes

## No medir calidad solamente por cantidad

Evitar:

```text
más commits = mejor alumno
más líneas = mejor alumno
más horas = mejor alumno
```

Estas métricas son únicamente indicadores.

## No penalizar horarios

Trabajar de noche o durante fines de semana no debe interpretarse automáticamente como algo positivo o negativo.

## Considerar contexto

Un alumno puede realizar menos commits porque trabajó en una funcionalidad compleja.

Otro puede realizar muchos commits porque realizó cambios pequeños.

Por eso se necesitan múltiples indicadores.

---

# 22. Requerimiento del agente en esta primera etapa

Antes de modificar código, realizar un análisis del proyecto actual.

Entregar un documento con:

### 1. Arquitectura actual

* frontend;
* backend;
* base de datos;
* servicios;
* integraciones;
* autenticación.

### 2. Estructuras existentes

Identificar:

* alumnos;
* grupos;
* sprints;
* repositorios;
* GitHub;
* usuarios.

### 3. Integraciones existentes

Determinar si ya existe:

* GitHub API;
* OAuth;
* tokens;
* webhooks;
* almacenamiento de información GitHub.

### 4. Información faltante

Determinar qué datos será necesario incorporar.

### 5. Diseño propuesto

Proponer:

* entidades;
* servicios;
* endpoints;
* jobs;
* procesos de sincronización;
* almacenamiento;
* estructura JSON.

### 6. Estrategia de extracción

Explicar cómo obtener:

```text
commits
branches
PRs
reviews
issues
archivos
líneas agregadas/eliminadas
timestamps
```

### 7. Estrategia de identificación

Explicar cómo relacionar:

```text
Alumno ↔ GitHub User ↔ Commit
```

### 8. Plan de implementación

Dividir el trabajo en etapas pequeñas y verificables.

Por ejemplo:

```text
Fase 1 — Modelo de datos
Fase 2 — Integración GitHub
Fase 3 — Obtención de commits
Fase 4 — Métricas
Fase 5 — Horarios
Fase 6 — Análisis de archivos
Fase 7 — Pull Requests
Fase 8 — Generación JSON
Fase 9 — Testing
Fase 10 — Documentación
```

No asumir que estas fases son definitivas: modificarlas según la arquitectura real encontrada.

---

# 23. Criterio de éxito

La funcionalidad estará correctamente diseñada cuando sea posible seleccionar:

```text
Grupo
+
Sprint
+
Repositorio(s)
```

y obtener:

```text
JSON
 ↓
actividad individual de cada alumno
 ↓
métricas
 ↓
trabajo realizado
 ↓
horarios
 ↓
branches
 ↓
PRs
 ↓
colaboración
 ↓
patrones
```

El resultado debe ser suficientemente estructurado para que un agente de IA externo pueda analizarlo y producir posteriormente un informe docente.

---

# 24. Resultado esperado de esta tarea

**No implementar todavía.**

Primero presentar:

1. análisis del repositorio;
2. arquitectura detectada;
3. datos disponibles;
4. datos faltantes;
5. propuesta de arquitectura;
6. modelo de datos;
7. estrategia GitHub;
8. estrategia de identificación de alumnos;
9. estructura JSON propuesta;
10. plan de implementación;
11. riesgos y limitaciones;
12. estimación de complejidad por etapa.

Después de revisar ese plan se decidirá qué partes implementar.
