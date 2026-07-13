import re
import json

def parse_outline(text_path, exam, out_path, body_start_marker, dash):
    raw = open(text_path, encoding="utf-8").read()
    idx = raw.rfind(body_start_marker)
    body = re.sub(r"--- PAGE \d+ ---", "", raw[idx:])

    prefix = "T" if exam == "technician" else "G"
    sub_pat = re.compile(
        rf"SUBELEMENT ({prefix}\d) [{dash}] (.+?) \[(\d+) Exam Questions [{dash}] (\d+) Groups?\]",
        re.IGNORECASE,
    )
    group_pat = re.compile(rf"^({prefix}\d[A-Z]) (.+)$", re.MULTILINE)

    subelements = []
    sub_matches = list(sub_pat.finditer(body))
    for i, m in enumerate(sub_matches):
        sub_id, title, nq, ng = m.group(1), m.group(2).strip(), int(m.group(3)), int(m.group(4))
        chunk_end = sub_matches[i + 1].start() if i + 1 < len(sub_matches) else len(body)
        chunk = body[m.end():chunk_end]
        groups = []
        for gm in group_pat.finditer(chunk):
            groups.append({"id": gm.group(1), "description": gm.group(2).strip()})
            if len(groups) >= ng:
                break
        subelements.append({
            "id": sub_id,
            "title": title,
            "examQuestions": nq,
            "groupCount": ng,
            "groups": groups,
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(subelements, f, indent=2, ensure_ascii=False)
    print(f"{exam}: {len(subelements)} subelements")
    for s in subelements:
        print(" ", s["id"], s["title"], "-", len(s["groups"]), "groups")


if __name__ == "__main__":
    SP = "/private/tmp/claude-501/-Users-harrisonhill-Documents-ham/e74b8eca-5e6c-4299-ad09-162b145a9079/scratchpad"
    parse_outline(f"{SP}/tech_pool.txt", "technician", f"{SP}/technician-outline.json",
                  "FCC Element 2 Question Pool  ", "-")
    parse_outline(f"{SP}/gen_pool.txt", "general", f"{SP}/general-outline.json",
                  "FCC Element 3 Question Pool", "–")
