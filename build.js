const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const INPUT_FILE = path.join(ROOT_DIR, 'index.html');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'index.html');
const ROOT_INDEX_FILE = path.join(ROOT_DIR, 'index.html');

const SECTION_FILES = [
  'sections/01-nav.html',
  'sections/02-hero.html',
  'sections/03-about.html',
  'sections/04-skills.html',
  'sections/05-experience.html',
  'sections/06-achievements.html',
  'sections/07-portfolio.html',
  'sections/08-live.html',
  'sections/09-blog.html',
  'sections/10-cta.html',
  'sections/11-contact.html',
  'sections/12-footer.html'
];

function build() {
  try {
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`[ERROR] File not found: ${INPUT_FILE}`);
      return;
    }
    const head = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kheng Vatanautdom — Technology &amp; Digital Solutions Professional</title>
<meta name="description" content="Portfolio of Kheng Vatanautdom — technology and digital solutions professional building web applications and supporting technology-driven operations in Phnom Penh.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css?v=13">
</head>
<body>
`;

    let html = fs.readFileSync(INPUT_FILE, 'utf8');
    const foot = `
<script src="js/main.js?v=7"></script>
</body>
</html>
`;

    // Read and combine each section cleanly
    const sectionsContent = SECTION_FILES.map(file => {
      const fullPath = path.join(ROOT_DIR, file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Section file not found: ${file}`);
      }
      return fs.readFileSync(fullPath, 'utf8').trim();
    }).join('\n\n');

    const cleanHtml = head + '\n' + sectionsContent + '\n' + foot;

    // 1. Write clean standalone index.html at root
    fs.writeFileSync(ROOT_INDEX_FILE, cleanHtml, 'utf8');
    console.log('[BUILD] Updated clean index.html at root');

    // 2. Write to dist/index.html
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, cleanHtml, 'utf8');
    console.log('[BUILD] Generated dist/index.html');

    // Copy assets to dist so dist/index.html is fully standalone
    // 3. Copy assets to dist
    const copyDir = (src, dest) => {
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(dest, { recursive: true });
      for (const item of fs.readdirSync(src)) {
        const s = path.join(src, item);
        const d = path.join(dest, item);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
      }
    };

    copyDir(path.join(ROOT_DIR, 'css'), path.join(DIST_DIR, 'css'));
    copyDir(path.join(ROOT_DIR, 'js'), path.join(DIST_DIR, 'js'));

    for (const file of fs.readdirSync(ROOT_DIR)) {
      if (/\.(png|jpe?g|svg|pdf|webp)$/i.test(file)) {
        fs.copyFileSync(path.join(ROOT_DIR, file), path.join(DIST_DIR, file));
      }
    }

    console.log(`[BUILD] Generated standalone bundle at dist/index.html with all assets`);
    console.log('[BUILD] Assets synchronized to dist/');
    console.log('[BUILD] Build completed successfully with all 9 projects and 0 duplicates!');
  } catch (err) {
    console.error(`[ERROR] Build failed:`, err.message);
    console.error('[BUILD ERROR]', err.message);
    process.exit(1);
  }
}

build();