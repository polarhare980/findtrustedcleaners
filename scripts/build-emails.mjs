// scripts/build-emails.mjs
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import mjml2html from 'mjml';
import Mustache from 'mustache';

const root = process.cwd();
const emailsDir = path.resolve(root, 'emails');
const outDir = path.resolve(emailsDir, 'dist');

async function loadTheme() {
  const themePath = path.join(emailsDir, 'theme.json');
  try {
    const raw = await readFile(themePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    console.warn('No emails/theme.json found. Using defaults.');
    return {
      bg_color: '#ffffff',
      divider: '#e5e7eb',
      brand_color: '#0D9488',
      body_text: '#111827',
      footer_text: '#6b7280',
      button_bg: '#0D9488',
    };
  }
}

async function build() {
  await mkdir(outDir, { recursive: true });
  const theme = await loadTheme();

  const files = (await readdir(emailsDir))
    .filter(f => f.endsWith('.mjml') && f !== 'dist');

  let hadSeriousFailure = false;

  for (const file of files) {
    const inPath = path.join(emailsDir, file);
    const outPath = path.join(outDir, file.replace(/\.mjml$/i, '.html'));

    const mjmlTemplate = await readFile(inPath, 'utf8');

    // 1) Render Mustache variables -> real hex values (so MJML sees valid colours)
    const renderedMjml = Mustache.render(mjmlTemplate, theme);

    // 2) Compile MJML -> HTML. (No deprecated "minify" option)
    const { html, errors } = mjml2html(renderedMjml, {
      validationLevel: 'soft',    // don't fail build on warnings
      keepComments: false,
    });

    if (errors?.length) {
      console.warn(`MJML reported issues in ${file}`, errors);
      // Treat as warnings; only fail if no HTML was produced.
      if (!html || !html.trim()) {
        hadSeriousFailure = true;
      }
    }

    await writeFile(outPath, html, 'utf8');
    console.log(`Built ${path.relative(root, outPath)}`);
  }

  if (hadSeriousFailure) {
    console.error('Email build produced no HTML for at least one template.');
    process.exit(1);
  }
}

build().catch(err => {
  console.error('Email build failed:', err);
  process.exit(1);
});
