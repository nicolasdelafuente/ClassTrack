"""Extract ClassTrack demo data from the local Excel (not committed)."""
from __future__ import annotations

import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[4]
if not (ROOT / "DesAPP-PPS 2026-c1- Asistencia.xlsx").exists():
    # fallback: walk up until we find the workbook
    ROOT = Path(__file__).resolve().parent
    while ROOT.parent != ROOT and not (ROOT / "DesAPP-PPS 2026-c1- Asistencia.xlsx").exists():
        ROOT = ROOT.parent
XLSX = ROOT / "DesAPP-PPS 2026-c1- Asistencia.xlsx"
OUT_DIR = Path(__file__).resolve().parents[1] / "data"  # prisma/data
print("ROOT", ROOT)
print("XLSX", XLSX, XLSX.exists())

OUT_FULL = OUT_DIR / "from-excel.json"
OUT_DEMO = OUT_DIR / "demo.json"


def main() -> None:
    if not XLSX.exists():
        raise SystemExit(f"Excel not found: {XLSX}")

    wb = openpyxl.load_workbook(XLSX, data_only=True)
    groups: dict[int, dict] = {}

    ws = wb["DesApp por grupo"]
    current: int | None = None
    for row in ws.iter_rows(min_row=1, max_col=6, values_only=True):
        a, b, c, d, e, f = (list(row) + [None] * 6)[:6]
        if a and str(a).startswith("Grupo"):
            m = re.search(r"(\d+)", str(a))
            current = int(m.group(1)) if m else None
            if current is None:
                continue
            topic = d.strip() if isinstance(d, str) and d.strip() else None
            teacher = e.strip() if isinstance(e, str) and e.strip() else None
            groups[current] = {
                "number": current,
                "name": f"Grupo {current}",
                "projectTopic": topic,
                "teacherName": teacher,
                "students": [],
                "links": {},
            }
        elif current and a and d and "@" in str(d):
            groups[current]["students"].append(
                {
                    "fullName": str(a).strip(),
                    "email": str(d).strip(),
                    "legajo": None,
                }
            )

    ws = wb["Desapp - inicializacion"]
    for row in ws.iter_rows(min_row=2, max_col=4, values_only=True):
        gname, github, trello, folder = (list(row) + [None] * 4)[:4]
        if not gname:
            continue
        m = re.search(r"(\d+)", str(gname))
        if not m:
            continue
        num = int(m.group(1))
        if num not in groups:
            groups[num] = {
                "number": num,
                "name": f"Grupo {num}",
                "projectTopic": None,
                "teacherName": None,
                "students": [],
                "links": {},
            }
        groups[num]["links"] = {
            "githubUrl": str(github).strip() if github else None,
            "trelloUrl": str(trello).strip() if trello else None,
            "driveUrl": None,
            "folderName": str(folder).strip() if folder else None,
        }

    by_email: dict[str, dict] = {}
    by_name: dict[str, dict] = {}
    ws = wb["DesApp2026"]
    for row in ws.iter_rows(min_row=3, max_col=5, values_only=True):
        _, legajo, alumno, grupo, contactos = (list(row) + [None] * 5)[:5]
        if not alumno:
            continue
        name = str(alumno).strip()
        email = str(contactos).strip() if contactos else None
        leg = str(int(legajo)) if isinstance(legajo, float) else (str(legajo).strip() if legajo else None)
        gnum = None
        if grupo:
            m = re.search(r"(\d+)", str(grupo))
            if m:
                gnum = int(m.group(1))
        rec = {"fullName": name, "email": email, "legajo": leg, "groupNumber": gnum}
        if email:
            by_email[email.lower()] = rec
        by_name[name.upper()] = rec

    for g in groups.values():
        for s in g["students"]:
            key = (s.get("email") or "").lower()
            if key in by_email:
                s["legajo"] = by_email[key]["legajo"]
            elif s["fullName"].upper() in by_name:
                s["legajo"] = by_name[s["fullName"].upper()]["legajo"]

    for rec in by_email.values():
        gnum = rec["groupNumber"]
        if gnum is None or gnum not in groups:
            continue
        emails = {(s.get("email") or "").lower() for s in groups[gnum]["students"]}
        if rec["email"] and rec["email"].lower() not in emails:
            groups[gnum]["students"].append(
                {
                    "fullName": rec["fullName"],
                    "email": rec["email"],
                    "legajo": rec["legajo"],
                }
            )

    ws = wb["DESAPP FINAL"]
    for row in ws.iter_rows(min_row=2, max_col=3, values_only=True):
        g, _, teacher = (list(row) + [None] * 3)[:3]
        if not g:
            continue
        m = re.search(r"(\d+)", str(g))
        if not m:
            continue
        num = int(m.group(1))
        if num in groups and teacher:
            groups[num]["teacherName"] = str(teacher).strip().title()

    payload = {
        "course": {
            "name": "Desarrollo de Aplicaciones 2026-c1",
            "code": "2026-c1",
            "isCurrent": True,
        },
        "groups": [groups[n] for n in sorted(groups.keys())],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_FULL.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # Anonymized demo for the public repo (no real emails/names/legajos)
    demo = {
        "course": payload["course"],
        "groups": [],
    }
    for g in payload["groups"]:
        demo_students = []
        for i, _s in enumerate(g["students"], start=1):
            demo_students.append(
                {
                    "fullName": f"Alumno {g['number']}-{i:02d}",
                    "email": f"alumno{g['number']:02d}{i:02d}@demo.classtrack.local",
                    "legajo": f"2026{g['number']:02d}{i:02d}",
                }
            )
        demo["groups"].append(
            {
                "number": g["number"],
                "name": g["name"],
                "projectTopic": g.get("projectTopic"),
                "teacherName": g.get("teacherName"),
                "students": demo_students,
                "links": g.get("links") or {},
            }
        )
    OUT_DEMO.write_text(json.dumps(demo, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"groups={len(payload['groups'])}")
    for g in payload["groups"]:
        print(
            f"G{g['number']}: {len(g['students'])} students | "
            f"{g.get('projectTopic')} | {g.get('teacherName')}"
        )
    print(f"wrote {OUT_FULL}")
    print(f"wrote {OUT_DEMO} (anonymized)")


if __name__ == "__main__":
    main()
