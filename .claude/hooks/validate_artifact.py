#!/usr/bin/env python3
"""
PostToolUse hook: Write

Validates workflow artifacts written by agents have the required structure.
Detects tickets, research docs, plans, and review reports by frontmatter content.
Outputs a systemMessage with warnings if required sections are missing.
"""

import json
import re
import sys

# Matches backtick-quoted file:line references like `path/to/file.py:42`
EVIDENCE_RE = re.compile(r"`[^`]+:\d+`")


def parse_frontmatter(content: str) -> dict:
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    fm = {}
    for line in parts[1].splitlines():
        if ":" in line and not line.strip().startswith("#"):
            key, _, val = line.partition(":")
            fm[key.strip()] = val.strip().strip("\"'")
    return fm


def detect_type(fm: dict, content: str) -> str | None:
    artifact_type = fm.get("type", "")
    if artifact_type in ("bug", "feature", "debt"):
        return "ticket"
    if "git_commit" in fm and "branch" in fm:
        return "research"
    if re.search(r"^## Phase \d+", content, re.MULTILINE):
        return "plan"
    if re.search(r"^# Validation Report", content, re.MULTILINE):
        return "review"
    return None


def check_ticket(content: str) -> list[str]:
    issues = []
    for section in ["## Description", "## In Scope", "## Out of Scope", "## Success Criteria"]:
        if section not in content:
            issues.append(f"Missing section: `{section}`")
    fm = parse_frontmatter(content)
    if not fm.get("keywords"):
        issues.append("Frontmatter `keywords` is empty — research agents won't have search terms")
    if not fm.get("patterns"):
        issues.append("Frontmatter `patterns` is empty — investigation patterns not defined")
    return issues


def check_research(content: str) -> list[str]:
    issues = []
    for section in ["## Summary", "## Detailed Findings"]:
        if section not in content:
            issues.append(f"Missing section: `{section}`")
    evidence_count = len(EVIDENCE_RE.findall(content))
    if evidence_count < 3:
        issues.append(
            f"Only {evidence_count} file:line reference(s) found — research should cite concrete evidence (>=3)"
        )
    if "## Open Questions" not in content:
        issues.append("Missing section: `## Open Questions`")
    return issues


def check_plan(content: str) -> list[str]:
    issues = []
    phases = re.findall(r"^## Phase \d+", content, re.MULTILINE)
    if not phases:
        issues.append("No phases found — plan must have at least one `## Phase N` section")
    else:
        for phase in phases:
            phase_num = phase.split()[-1]
            start = content.index(phase)
            next_phase = re.search(r"^## Phase \d+", content[start + 1:], re.MULTILINE)
            block = content[start: start + 1 + next_phase.start()] if next_phase else content[start:]
            if "### Success Criteria" not in block:
                issues.append(f"Phase {phase_num} is missing `### Success Criteria`")
            if "### Changes Required" not in block:
                issues.append(f"Phase {phase_num} is missing `### Changes Required`")
            else:
                changes_start = block.index("### Changes Required")
                next_section = re.search(r"^### ", block[changes_start + 1:], re.MULTILINE)
                changes_block = block[changes_start: changes_start + 1 + next_section.start()] if next_section else block[changes_start:]
                if not EVIDENCE_RE.search(changes_block):
                    issues.append(f"Phase {phase_num} `### Changes Required` has no `file:line` references — plan is too vague for execution")
    if not re.search(r"## Rollback", content):
        issues.append("Missing `## Rollback` / `## Rollback/Mitigation Notes` section")
    return issues


def check_review(content: str) -> list[str]:
    issues = []
    for section in ["## Implementation Status", "## Findings", "## Recommendation"]:
        if section not in content:
            issues.append(f"Missing section: `{section}`")
    if "## Automated Verification Results" not in content:
        issues.append("Missing `## Automated Verification Results` — were test commands run?")
    return issues


CHECKERS = {
    "ticket": check_ticket,
    "research": check_research,
    "plan": check_plan,
    "review": check_review,
}


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    content = tool_input.get("content", "")

    if not content or not file_path.endswith(".md"):
        sys.exit(0)

    fm = parse_frontmatter(content)
    artifact_type = detect_type(fm, content)
    if not artifact_type:
        sys.exit(0)

    issues = CHECKERS[artifact_type](content)
    if not issues:
        sys.exit(0)

    bullet_list = "\n".join(f"- {i}" for i in issues)
    msg = f"**[validate-artifact]** `{artifact_type.upper()}` written to `{file_path}` has issues:\n{bullet_list}"
    print(json.dumps({
        "systemMessage": msg,
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": msg,
        },
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
