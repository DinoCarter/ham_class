import re
import json
import sys

def parse_pool(text_path, exam, out_path, body_start_marker):
    with open(text_path, encoding="utf-8") as f:
        raw = f.read()

    # Cut off everything before the actual pool body (skip errata front matter)
    idx = raw.find(body_start_marker)
    if idx == -1:
        raise SystemExit(f"body_start_marker not found: {body_start_marker!r}")
    body = raw[idx:]

    # Strip page marker lines
    body = re.sub(r"--- PAGE \d+ ---", "", body)

    # Split on question-ID anchors: e.g. "T1A01 (C) [97.1]" or "G1A04  Question Deleted"
    qid_pat = re.compile(
        r"^([TG]\d[A-Z]\d{2})\s+(?:\(([A-D])\)\s*(?:\[([^\]]*)\])?|(Question Deleted))",
        re.MULTILINE,
    )

    matches = list(qid_pat.finditer(body))
    questions = []
    deleted = []

    for i, m in enumerate(matches):
        qid = m.group(1)
        answer = m.group(2)
        citation = m.group(3)
        is_deleted = m.group(4) is not None

        if is_deleted:
            deleted.append(qid)
            continue

        chunk_start = m.end()
        chunk_end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        chunk = body[chunk_start:chunk_end]

        # chunk should contain question text, then A./B./C./D. lines, then ~~
        end_marker = chunk.find("~~")
        if end_marker != -1:
            chunk = chunk[:end_marker]

        lines = [l.strip() for l in chunk.split("\n")]
        lines = [l for l in lines if l != ""]

        # find choice line indices
        choice_idx = {}
        for li, l in enumerate(lines):
            cm = re.match(r"^([A-D])\.\s*(.*)$", l)
            if cm and cm.group(1) not in choice_idx:
                choice_idx[cm.group(1)] = li

        if set(choice_idx.keys()) != {"A", "B", "C", "D"}:
            print(f"WARNING: {qid} missing choices, found {sorted(choice_idx.keys())}", file=sys.stderr)
            continue

        first_choice_line = min(choice_idx.values())
        question_text = " ".join(lines[:first_choice_line]).strip()

        # build ordered choice list A,B,C,D handling multi-line choices
        order = sorted(choice_idx.items(), key=lambda kv: kv[1])
        choices = {}
        for idx2, (letter, line_no) in enumerate(order):
            next_line_no = order[idx2 + 1][1] if idx2 + 1 < len(order) else len(lines)
            piece_lines = lines[line_no:next_line_no]
            full = " ".join(piece_lines)
            full = re.sub(rf"^{letter}\.\s*", "", full).strip()
            choices[letter] = full

        subelement = qid[0:2]
        group = qid[0:3]

        figure = None
        if exam == "technician":
            fig_m = re.search(r"[Ff]igure\s+T-?(\d)", question_text)
            if fig_m:
                figure = "T" + fig_m.group(1)
        else:
            fig_m = re.search(r"[Ff]igure\s+(G\d+-\d+)", question_text)
            if fig_m:
                figure = fig_m.group(1)

        questions.append({
            "id": qid,
            "exam": exam,
            "subelement": subelement,
            "group": group,
            "citation": citation.strip() if citation else None,
            "question": question_text,
            "choices": {
                "A": choices["A"],
                "B": choices["B"],
                "C": choices["C"],
                "D": choices["D"],
            },
            "answer": answer,
            "figure": figure,
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"{exam}: parsed {len(questions)} questions, {len(deleted)} deleted ({deleted})")
    return questions, deleted


if __name__ == "__main__":
    SP = "/private/tmp/claude-501/-Users-harrisonhill-Documents-ham/e74b8eca-5e6c-4299-ad09-162b145a9079/scratchpad"
    parse_pool(
        f"{SP}/tech_pool.txt",
        "technician",
        f"{SP}/tech_pool.json",
        "FCC Element 2 Question Pool  ",
    )
    parse_pool(
        f"{SP}/gen_pool.txt",
        "general",
        f"{SP}/gen_pool.json",
        "FCC Element 3 Question Pool",
    )
