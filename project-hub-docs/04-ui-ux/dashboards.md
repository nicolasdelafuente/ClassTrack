# Tablero (dashboard) — MVP

En ClassTrack el “dashboard” **es** el tablero de grupos `[B]`, no un panel con muchas métricas.

## Qué muestra

Una vista de la cursada actual con **una tarjeta o fila por grupo** (~10).

Información mínima por grupo:

| Campo | Por qué |
|-------|---------|
| Grupo | Identidad |
| Tema | Recordar de qué trata el TP |
| Docente a cargo | Quién sigue a ese grupo |
| Semáforo S1–S5 | Estado de la cursada de un vistazo |

## Qué no muestra (a propósito)

- Totales de asistencia globales
- Gráficos
- Rankings de commits
- Alertas de IA
- Lista completa de alumnos en esta pantalla

Esas cosas diluyen el objetivo: **ver los 10 grupos**.

## Semáforo — lectura rápida

Ejemplo visual (conceptual):

```text
Grupo 3 · App de acompañamiento · Nico
S1 ●  S2 ●  S3 ○  S4 ○  S5 ○
     ok    ok   sin datos …
```

Colores/estados se unifican en implementación; acá importa que sean **legibles en 3 segundos**.

## Variantes responsive

| Viewport | Layout |
|----------|--------|
| Mobile | Lista de cards apiladas |
| Desktop | Grilla 2–3 columnas o tabla compacta |

## Relación con otras pantallas

- Tocá el grupo → detalle `[C]`
- Desde home `[A]` se entra acá
- Asistencia vive en `[D]`/`[E]`, no en este tablero
