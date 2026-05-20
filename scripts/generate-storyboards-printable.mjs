#!/usr/bin/env node

import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const inputPath = path.join(repoRoot, 'docs', 'SOLUTION_STORYBOARDS.md');
const outputMdPath = path.join(
  repoRoot,
  'docs',
  'SOLUTION_STORYBOARDS_PRINT.md'
);
const outputPdfPath = path.join(
  repoRoot,
  'docs',
  'SOLUTION_STORYBOARDS_PRINT.pdf'
);
const diagramsDir = path.join(
  repoRoot,
  'docs',
  'screenshots',
  'storyboards-mermaid'
);
const tempDir = path.join(repoRoot, 'docs', '.tmp-storyboards-mermaid');

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

fs.mkdirSync(diagramsDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const source = fs.readFileSync(inputPath, 'utf8');
const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;

let index = 0;
const transformed = source.replace(mermaidRegex, (_match, diagramCode) => {
  index += 1;
  const id = String(index).padStart(2, '0');
  const tempInput = path.join(tempDir, `diagram-${id}.mmd`);
  const outputPng = path.join(diagramsDir, `diagram-${id}.png`);

  fs.writeFileSync(tempInput, `${diagramCode.trim()}\n`, 'utf8');

  const command = [
    'npx -y @mermaid-js/mermaid-cli',
    `-i \"${tempInput}\"`,
    `-o \"${outputPng}\"`,
    '-w 1800',
    '-s 2',
    '-b white',
  ].join(' ');

  execSync(command, { stdio: 'inherit' });

  const relativeImagePath = path.posix.join(
    'screenshots',
    'storyboards-mermaid',
    `diagram-${id}.png`
  );
  return `![Storyboard Diagram ${id}](${relativeImagePath})`;
});

fs.writeFileSync(outputMdPath, transformed, 'utf8');

const pdfOptions = JSON.stringify({
  format: 'Letter',
  printBackground: true,
  margin: {
    top: '14mm',
    right: '12mm',
    bottom: '14mm',
    left: '12mm',
  },
});

execFileSync(
  'npx',
  ['-y', 'md-to-pdf', outputMdPath, '--pdf-options', pdfOptions],
  {
    stdio: 'inherit',
  }
);

if (fs.existsSync(outputPdfPath)) {
  console.log(`\nPrintable PDF generated: ${outputPdfPath}`);
} else {
  console.error('PDF generation did not produce expected output file.');
  process.exit(1);
}
