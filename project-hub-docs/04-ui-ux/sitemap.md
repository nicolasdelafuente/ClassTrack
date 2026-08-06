# Sitemap — MVP

Mapa de pantallas del MVP. Solo lo necesario para el criterio de “MVP listo”.

```text
ClassTrack (docente)
│
├── [A] Home / Cursada actual
│       → atajo al tablero de la cursada abierta
│
├── [B] Tablero de grupos          ★ prioridad 1
│       lista de ~10 grupos + semáforo por sprint
│
├── [C] Detalle de grupo           ★ prioridad 2
│       ├── info (tema, docente a cargo)
│       ├── integrantes
│       ├── semáforo del grupo
│       └── links (GitHub / Trello / Drive) — solo URLs
│
├── [D] Asistencia de la cursada   ★ prioridad 3
│       elegir fecha → lista de alumnos → marcar
│
└── [E] Asistencia de un grupo (atajo desde [C])
        misma idea que [D], filtrada al grupo
```

## Fuera del sitemap MVP

- Login complejo / varios roles
- Vista alumno
- Notas, export, PPS
- Pantallas de sync / IA
- Alta masiva de cuatrimestre (se asume seed/demo)

## Relación con el Excel

| Pantalla | Se inspira en |
|----------|----------------|
| [B] Tablero | `Desapp - semáforo` + `DesApp por grupo` |
| [C] Detalle | `DesApp por grupo` + `Desapp - inicializacion` |
| [D]/[E] Asistencia | `DesApp2026` (asistencia / participación) |
