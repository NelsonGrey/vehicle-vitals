#!/usr/bin/env node
// Submits the verdict produced by ai-review.mjs as a real PR review, under
// the dedicated bot account's token (GH_TOKEN) — a different identity from
// the PR author, so the review can satisfy a "require approval" branch rule.
import { readFileSync } from "node:fs";

const RESULT_PATH = process.env.REVIEW_RESULT_PATH ?? "/tmp/review-result.json";
const REPO = process.env.REPO; // "owner/repo"
const PR_NUMBER = process.env.PR_NUMBER;
const HEAD_SHA = process.env.HEAD_SHA;
const GH_TOKEN = process.env.GH_TOKEN;

const VERDICT_TO_EVENT = {
  approve: "APPROVE",
  request_changes: "REQUEST_CHANGES",
  comment: "COMMENT",
};

if (!REPO || !PR_NUMBER || !HEAD_SHA || !GH_TOKEN) {
  console.error("Missing required env vars (REPO, PR_NUMBER, HEAD_SHA, GH_TOKEN)");
  process.exit(1);
}

const raw = readFileSync(RESULT_PATH, "utf8");
const result = JSON.parse(raw);

const event = VERDICT_TO_EVENT[result.verdict] ?? "COMMENT";
const findings = Array.isArray(result.findings) ? result.findings : [];

const inlineComments = [];
const generalNotes = [];

for (const f of findings) {
  const hasLocation =
    typeof f.file === "string" &&
    f.file.length > 0 &&
    Number.isInteger(f.line) &&
    f.line > 0;
  const label = `**[${f.severity ?? "note"}]** ${f.comment ?? ""}`;
  if (hasLocation) {
    inlineComments.push({ path: f.file, line: f.line, body: label });
  } else {
    generalNotes.push(`- ${label}${f.file ? ` (${f.file})` : ""}`);
  }
}

const bodyParts = [
  result.summary ?? "(no summary)",
  generalNotes.length ? `\n**Additional notes:**\n${generalNotes.join("\n")}` : "",
  "\n---\n*Automated review by Claude (claude-opus-5) — verify anything blocking before merging.*",
];
const body = bodyParts.filter(Boolean).join("\n");

async function submitReview(comments) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_id: HEAD_SHA,
        event,
        body,
        comments,
      }),
    },
  );
  return res;
}

async function main() {
  let res = await submitReview(inlineComments);

  if (!res.ok && inlineComments.length > 0) {
    // Likely a stale/invalid line reference (422) — retry as a summary-only
    // review rather than failing the whole check.
    const errText = await res.text();
    console.warn(
      `Review with inline comments failed (${res.status}): ${errText}. Retrying without inline comments.`,
    );
    res = await submitReview([]);
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Failed to submit review (${res.status}): ${errText}`);
    process.exit(1);
  }

  const posted = await res.json();
  console.log(`Submitted review ${posted.id} as ${event}`);
}

main();
