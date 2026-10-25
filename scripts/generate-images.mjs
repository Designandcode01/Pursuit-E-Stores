import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const catalog = JSON.parse(await readFile(path.join(root, "scripts", "catalog.json"), "utf8"));

const W = 1200;
const H = 1500;

function defs(p, id) {
  return `
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bg}" />
      <stop offset="55%" stop-color="${p.bg}" />
      <stop offset="100%" stop-color="${p.soft}" stop-opacity="0.55" />
    </linearGradient>
    <radialGradient id="glow-${id}" cx="50%" cy="38%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <pattern id="jaali-${id}" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="${p.ink}" opacity="0.13" />
      <circle cx="19" cy="19" r="1.4" fill="${p.accent}" opacity="0.12" />
    </pattern>
    <filter id="soft-${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>`;
}

function frame(p, id, { width = W, height = H } = {}) {
  const base = Math.min(width, height);
  const archW = base * 0.64;
  const archH = base * 0.78;
  const cx = width / 2;
  const bottom = height * 0.83;
  const left = cx - archW / 2;
  const right = cx + archW / 2;
  const top = bottom - archH;
  const radius = archW / 2;
  const floor = height * 0.86;

  return `
  <rect width="${width}" height="${height}" fill="url(#bg-${id})" />
  <rect width="${width}" height="${height}" fill="url(#glow-${id})" />
  <rect width="${width}" height="${height}" fill="url(#jaali-${id})" opacity="0.75" />
  <ellipse cx="${cx}" cy="${height * 0.3}" rx="${archW * 0.7}" ry="${archH * 0.42}" fill="${p.soft}" opacity="0.5" filter="url(#soft-${id})" />
  <path d="M ${left} ${bottom} V ${top + radius} A ${radius} ${radius} 0 0 1 ${right} ${top + radius} V ${bottom} Z"
        fill="#ffffff" opacity="0.28" stroke="${p.ink}" stroke-opacity="0.22" stroke-width="2" />
  <path d="M ${left + 22} ${bottom - 18} V ${top + radius + 8} A ${radius - 22} ${radius - 22} 0 0 1 ${right - 22} ${top + radius + 8} V ${bottom - 18}"
        fill="none" stroke="${p.accent}" stroke-opacity="0.32" stroke-width="1.5" />
  <path d="M ${width * 0.09} ${floor} H ${width * 0.91}" stroke="${p.ink}" stroke-opacity="0.18" stroke-width="2" />
  <path d="M ${width * 0.18} ${floor + 14} H ${width * 0.82}" stroke="${p.ink}" stroke-opacity="0.08" stroke-width="10" stroke-linecap="round" />
  <g opacity="0.55">
    <text x="${cx}" y="${height * 0.945}" text-anchor="middle" font-family="Georgia, serif"
          font-size="${Math.round(base * 0.016)}" letter-spacing="${Math.round(base * 0.009)}" fill="${p.ink}">
      HUNAR BAZAAR
    </text>
  </g>`;
}

function embroidery(p, cx, cy, scale = 1) {
  const petals = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    petals.push(
      `<ellipse cx="${cx + Math.cos(angle) * 16 * scale}" cy="${cy + Math.sin(angle) * 16 * scale}" rx="${8 * scale}" ry="${4 * scale}" fill="${p.accent}" opacity="0.85" transform="rotate(${(angle * 180) / Math.PI} ${cx + Math.cos(angle) * 16 * scale} ${cy + Math.sin(angle) * 16 * scale})" />`,
    );
  }
  return `<g>${petals.join("")}<circle cx="${cx}" cy="${cy}" r="${4 * scale}" fill="${p.ink}" /></g>`;
}

function drawSuit(p) {
  return `
  <g>
    <path d="M 400 470 C 470 430 730 430 800 470 L 860 860 L 790 890 L 720 700 L 720 1140 L 480 1140 L 480 700 L 410 890 L 340 860 Z"
          fill="${p.ink}" opacity="0.92" />
    <path d="M 520 480 C 560 540 640 540 680 480 L 660 450 C 630 485 570 485 540 450 Z" fill="${p.bg}" />
    <path d="M 600 500 V 1120" stroke="${p.bg}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="5 8" />
    <path d="M 470 600 C 430 650 400 720 380 800" stroke="${p.accent}" stroke-width="3" fill="none" opacity="0.75" />
    <path d="M 730 600 C 770 650 800 720 820 800" stroke="${p.accent}" stroke-width="3" fill="none" opacity="0.75" />
    ${embroidery(p, 600, 700, 1.2)}
    ${embroidery(p, 540, 900, 0.7)}
    ${embroidery(p, 660, 900, 0.7)}
    <path d="M 490 1060 H 710" stroke="${p.accent}" stroke-width="2" opacity="0.6" />
    <g opacity="0.8">
      <path d="M 470 520 C 380 640 360 760 360 980 L 300 1010 C 290 760 340 590 440 480 Z" fill="${p.soft}" opacity="0.9" />
      <path d="M 730 520 C 820 640 840 760 840 980 L 900 1010 C 910 760 860 590 760 480 Z" fill="${p.soft}" opacity="0.9" />
    </g>
  </g>`;
}

function drawKurta(p) {
  return `
  <g>
    <path d="M 430 470 C 490 440 710 440 770 470 L 820 820 L 755 845 L 700 680 L 700 1120 L 500 1120 L 500 680 L 445 845 L 380 820 Z"
          fill="${p.ink}" opacity="0.9" />
    <path d="M 550 470 H 650 L 640 540 L 600 570 L 560 540 Z" fill="${p.bg}" />
    <path d="M 600 570 V 1100" stroke="${p.bg}" stroke-opacity="0.35" stroke-width="2" />
    <path d="M 560 620 H 640" stroke="${p.accent}" stroke-width="2" opacity="0.7" />
    <circle cx="600" cy="640" r="4" fill="${p.accent}" />
    <circle cx="600" cy="700" r="4" fill="${p.accent}" />
    <path d="M 500 1040 H 700" stroke="${p.accent}" stroke-width="1.5" opacity="0.5" />
    <path d="M 470 500 C 430 640 420 820 430 1010 L 390 1030 C 370 830 390 640 430 490 Z" fill="${p.soft}" opacity="0.6" />
  </g>`;
}

function drawAbaya(p) {
  return `
  <g>
    <path d="M 470 460 C 520 430 680 430 730 460 L 840 1150 L 360 1150 Z" fill="${p.ink}" opacity="0.93" />
    <path d="M 530 460 C 560 520 640 520 670 460 L 650 430 C 630 465 570 465 550 430 Z" fill="${p.bg}" />
    <path d="M 600 520 V 1120" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="1.5" />
    <path d="M 540 600 C 520 720 510 860 515 1000" stroke="${p.accent}" stroke-width="2" fill="none" opacity="0.55" />
    <path d="M 660 600 C 680 720 690 860 685 1000" stroke="${p.accent}" stroke-width="2" fill="none" opacity="0.55" />
    ${embroidery(p, 600, 720, 1.05)}
    <path d="M 470 470 C 400 640 390 860 410 1080 L 370 1100 C 340 850 360 620 430 450 Z" fill="${p.soft}" opacity="0.75" />
    <path d="M 730 470 C 800 640 810 860 790 1080 L 830 1100 C 860 850 840 620 770 450 Z" fill="${p.soft}" opacity="0.75" />
  </g>`;
}

function drawWaistcoat(p) {
  return `
  <g>
    <rect x="455" y="440" width="290" height="680" rx="24" fill="${p.soft}" />
    <path d="M 490 470 L 600 560 L 710 470 L 740 520 L 730 1100 L 470 1100 L 460 520 Z"
          fill="${p.ink}" opacity="0.94" />
    <path d="M 600 560 V 1090" stroke="${p.bg}" stroke-opacity="0.3" stroke-width="2" />
    <path d="M 520 470 L 600 560 L 680 470" fill="none" stroke="${p.bg}" stroke-opacity="0.5" stroke-width="2" />
    <circle cx="600" cy="650" r="5" fill="${p.accent}" />
    <circle cx="600" cy="760" r="5" fill="${p.accent}" />
    <circle cx="600" cy="870" r="5" fill="${p.accent}" />
    <circle cx="600" cy="980" r="5" fill="${p.accent}" />
    <path d="M 470 1010 H 730" stroke="${p.accent}" stroke-width="1.5" opacity="0.6" />
  </g>`;
}

function drawShawl(p) {
  return `
  <g>
    <path d="M 340 520 C 470 460 730 460 860 520 C 890 700 870 920 800 1090 C 680 1140 520 1140 400 1090 C 330 920 310 700 340 520 Z"
          fill="${p.ink}" opacity="0.9" />
    <path d="M 390 560 C 500 520 700 520 810 560 C 830 720 810 900 760 1040 C 660 1070 540 1070 440 1040 C 390 900 370 720 390 560 Z"
          fill="none" stroke="${p.bg}" stroke-opacity="0.45" stroke-width="2" />
    <path d="M 430 620 C 520 600 680 600 770 620 M 420 700 C 520 680 680 680 780 700 M 410 780 C 520 760 680 760 790 780"
          stroke="${p.accent}" stroke-width="3" fill="none" opacity="0.55" />
    ${embroidery(p, 600, 700, 1.6)}
    ${embroidery(p, 500, 900, 0.9)}
    ${embroidery(p, 700, 900, 0.9)}
    <g stroke="${p.bg}" stroke-width="2" opacity="0.55">
      ${Array.from({ length: 16 }, (_, i) => `<path d="M ${380 + i * 28} 1090 v 34" />`).join("")}
      ${Array.from({ length: 16 }, (_, i) => `<path d="M ${380 + i * 28} 520 v -30" />`).join("")}
    </g>
  </g>`;
}

function drawDupatta(p) {
  return `
  <g>
    <path d="M 330 470 C 500 430 720 500 860 640 C 900 800 860 990 760 1110 C 600 1080 430 1000 330 860 C 300 720 300 580 330 470 Z"
          fill="${p.soft}" opacity="0.95" />
    <path d="M 360 500 C 510 470 700 530 830 660 C 860 800 830 950 750 1050 C 610 1020 460 950 370 830 C 345 710 345 600 360 500 Z"
          fill="${p.ink}" opacity="0.18" />
    <path d="M 360 500 C 510 470 700 530 830 660" stroke="${p.accent}" stroke-width="10" fill="none" opacity="0.55" />
    <path d="M 370 830 C 460 950 610 1020 750 1050" stroke="${p.accent}" stroke-width="8" fill="none" opacity="0.5" />
    ${Array.from({ length: 9 }, (_, i) => embroidery(p, 430 + i * 46, 700 + (i % 3) * 55, 0.55)).join("")}
    <g stroke="${p.accent}" stroke-width="1.5" opacity="0.4">
      ${Array.from({ length: 10 }, (_, i) => `<path d="M ${340 + i * 24} 880 l 8 20" />`).join("")}
    </g>
  </g>`;
}

function drawKhussa(p) {
  return `
  <g>
    <path d="M 290 940 C 380 900 560 880 700 890 C 800 898 870 930 910 980 C 930 1010 910 1040 870 1040 L 330 1040 C 290 1040 270 1000 290 940 Z"
          fill="${p.ink}" opacity="0.95" />
    <path d="M 330 900 C 430 860 610 850 740 870 C 820 882 870 910 900 950 C 850 920 780 902 700 900 C 560 896 420 918 350 950 Z"
          fill="${p.soft}" />
    <path d="M 320 1040 H 880" stroke="${p.accent}" stroke-width="8" opacity="0.6" />
    <path d="M 640 890 C 700 920 740 950 760 990" stroke="${p.bg}" stroke-width="3" fill="none" opacity="0.5" />
    ${embroidery(p, 500, 940, 1.4)}
    ${embroidery(p, 660, 955, 0.9)}
    <path d="M 880 960 C 930 950 960 910 950 870 C 940 840 910 830 890 850 C 910 860 920 885 900 900"
          fill="none" stroke="${p.ink}" stroke-width="12" stroke-linecap="round" />
  </g>`;
}

function drawChappal(p) {
  return `
  <g>
    <path d="M 280 980 C 420 930 620 920 820 950 C 900 962 950 1000 950 1040 L 280 1040 C 260 1020 260 1000 280 980 Z"
          fill="${p.ink}" opacity="0.95" />
    <path d="M 300 980 H 930" stroke="${p.accent}" stroke-width="7" opacity="0.55" />
    <path d="M 420 950 C 470 820 560 780 650 810 C 700 825 730 870 730 950"
          fill="none" stroke="${p.soft}" stroke-width="26" stroke-linecap="round" />
    <path d="M 600 900 C 680 840 760 850 800 910 C 820 940 800 960 770 950 C 740 940 720 915 690 920"
          fill="none" stroke="${p.soft}" stroke-width="20" stroke-linecap="round" />
    <rect x="690" y="885" width="34" height="24" rx="5" fill="${p.accent}" opacity="0.9" />
    <circle cx="707" cy="897" r="4" fill="${p.bg}" />
    ${embroidery(p, 500, 980, 0.8)}
  </g>`;
}

function drawRug(p) {
  return `
  <g>
    <rect x="330" y="430" width="540" height="720" rx="8" fill="${p.ink}" opacity="0.94" />
    <rect x="360" y="460" width="480" height="660" rx="4" fill="none" stroke="${p.bg}" stroke-opacity="0.5" stroke-width="2" />
    <path d="M 430 1050 V 760 C 430 640 510 580 600 580 C 690 580 770 640 770 760 V 1050"
          fill="${p.bg}" opacity="0.12" stroke="${p.accent}" stroke-width="3" />
    <path d="M 470 1050 V 770 C 470 680 530 630 600 630 C 670 630 730 680 730 770 V 1050"
          fill="none" stroke="${p.bg}" stroke-opacity="0.35" stroke-width="2" />
    ${embroidery(p, 600, 780, 1.2)}
    ${embroidery(p, 420, 520, 0.6)}
    ${embroidery(p, 780, 520, 0.6)}
    <g stroke="${p.bg}" stroke-width="2" opacity="0.45">
      ${Array.from({ length: 14 }, (_, i) => `<path d="M ${350 + i * 38} 430 v -26" />`).join("")}
      ${Array.from({ length: 14 }, (_, i) => `<path d="M ${350 + i * 38} 1150 v 26" />`).join("")}
    </g>
  </g>`;
}

function drawCushion(p) {
  return `
  <g>
    <g transform="rotate(-7 520 780)">
      <rect x="330" y="560" width="380" height="380" rx="26" fill="${p.soft}" stroke="${p.ink}" stroke-opacity="0.25" />
      ${embroidery(p, 520, 750, 2.4)}
      <path d="M 380 620 C 460 580 580 580 660 620" stroke="${p.accent}" stroke-width="3" fill="none" opacity="0.6" />
    </g>
    <g transform="rotate(6 720 900)">
      <rect x="530" y="690" width="360" height="360" rx="26" fill="${p.ink}" opacity="0.92" />
      ${embroidery(p, 710, 870, 2.2)}
      <path d="M 580 750 C 660 710 760 710 840 750" stroke="${p.accent}" stroke-width="3" fill="none" opacity="0.7" />
    </g>
  </g>`;
}

function drawQuilt(p) {
  const patches = [];
  const colors = [p.ink, p.accent, p.soft, p.bg, "#ffffff"];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const fill = colors[(row * 4 + col) % colors.length];
      patches.push(
        `<rect x="${350 + col * 125}" y="${470 + row * 130}" width="125" height="130" fill="${fill}" opacity="${fill === p.bg || fill === "#ffffff" ? 0.5 : 0.82}" />`,
      );
    }
  }
  return `
  <g>
    <rect x="330" y="450" width="540" height="680" rx="8" fill="${p.soft}" />
    <g clip-path="url(#quilt-clip)">
      ${patches.join("")}
    </g>
    <clipPath id="quilt-clip"><rect x="350" y="470" width="500" height="650" /></clipPath>
    <g stroke="${p.bg}" stroke-width="1.4" opacity="0.55">
      ${Array.from({ length: 7 }, (_, i) => `<path d="M ${350 + i * 83} 470 V 1120" />`).join("")}
      ${Array.from({ length: 9 }, (_, i) => `<path d="M 350 470 H 850" transform="translate(0 ${i * 81})" />`).join("")}
    </g>
    <rect x="350" y="470" width="500" height="650" fill="none" stroke="${p.ink}" stroke-width="3" opacity="0.5" />
  </g>`;
}

function drawVase(p) {
  return `
  <g>
    <path d="M 540 520 C 540 570 500 600 470 650 C 420 730 420 880 470 1000 C 510 1090 690 1090 730 1000 C 780 880 780 730 730 650 C 700 600 660 570 660 520 Z"
          fill="${p.ink}" opacity="0.92" />
    <path d="M 540 520 H 660 L 650 490 H 550 Z" fill="${p.ink}" opacity="0.95" />
    <path d="M 500 700 C 560 660 640 660 700 700 C 720 820 700 940 660 1020 C 620 1040 580 1040 540 1020 C 500 940 480 820 500 700 Z"
          fill="${p.bg}" opacity="0.16" stroke="${p.bg}" stroke-opacity="0.4" stroke-width="2" />
    ${embroidery(p, 600, 800, 1.5)}
    ${embroidery(p, 540, 930, 0.8)}
    ${embroidery(p, 660, 930, 0.8)}
    <path d="M 470 650 C 430 730 430 880 470 1000" stroke="${p.bg}" stroke-width="2" fill="none" opacity="0.45" />
    <path d="M 730 650 C 770 730 770 880 730 1000" stroke="${p.bg}" stroke-width="2" fill="none" opacity="0.45" />
  </g>`;
}

function drawEarrings(p) {
  return `
  <g>
    <g transform="translate(-130 0)">
      <circle cx="600" cy="470" r="16" fill="none" stroke="${p.ink}" stroke-width="5" />
      <path d="M 600 486 V 540" stroke="${p.ink}" stroke-width="4" />
      <path d="M 520 660 C 520 560 680 560 680 660 Z" fill="${p.ink}" opacity="0.95" />
      <path d="M 530 660 H 670" stroke="${p.accent}" stroke-width="5" />
      <path d="M 560 660 V 700 M 600 660 V 720 M 640 660 V 700" stroke="${p.accent}" stroke-width="3" />
      <circle cx="560" cy="712" r="8" fill="${p.soft}" stroke="${p.accent}" stroke-width="2" />
      <circle cx="600" cy="732" r="8" fill="${p.soft}" stroke="${p.accent}" stroke-width="2" />
      <circle cx="640" cy="712" r="8" fill="${p.soft}" stroke="${p.accent}" stroke-width="2" />
    </g>
    <g transform="translate(130 40) scale(0.9)">
      <circle cx="600" cy="470" r="16" fill="none" stroke="${p.ink}" stroke-width="5" />
      <path d="M 600 486 V 540" stroke="${p.ink}" stroke-width="4" />
      <path d="M 520 660 C 520 560 680 560 680 660 Z" fill="${p.ink}" opacity="0.95" />
      <path d="M 530 660 H 670" stroke="${p.accent}" stroke-width="5" />
      <path d="M 560 660 V 700 M 600 660 V 720 M 640 660 V 700" stroke="${p.accent}" stroke-width="3" />
      <circle cx="560" cy="712" r="8" fill="${p.soft}" stroke="${p.accent}" stroke-width="2" />
      <circle cx="600" cy="732" r="8" fill="${p.soft}" stroke="${p.accent}" stroke-width="2" />
      <circle cx="640" cy="712" r="8" fill="${p.soft}" stroke="${p.accent}" stroke-width="2" />
    </g>
  </g>`;
}

function drawBasket(p) {
  return `
  <g>
    <path d="M 400 620 H 800 L 760 1080 H 440 Z" fill="${p.ink}" opacity="0.85" />
    <path d="M 420 700 H 780 M 430 780 H 770 M 435 860 H 765 M 440 940 H 760 M 445 1020 H 755"
          stroke="${p.bg}" stroke-width="2" opacity="0.35" />
    <path d="M 470 620 C 470 500 560 460 600 460 C 640 460 730 500 730 620"
          fill="none" stroke="${p.ink}" stroke-width="14" opacity="0.8" />
    <path d="M 480 630 C 500 680 700 680 720 630" fill="none" stroke="${p.accent}" stroke-width="4" opacity="0.7" />
    <path d="M 450 640 H 750" stroke="${p.accent}" stroke-width="8" opacity="0.6" />
    ${Array.from({ length: 9 }, (_, i) => `<path d="M ${455 + i * 36} 640 V 1070" stroke="${p.bg}" stroke-width="1.2" opacity="0.18" />`).join("")}
  </g>`;
}

const ART = {
  suit: drawSuit,
  kurta: drawKurta,
  abaya: drawAbaya,
  waistcoat: drawWaistcoat,
  shawl: drawShawl,
  dupatta: drawDupatta,
  khussa: drawKhussa,
  chappal: drawChappal,
  rug: drawRug,
  cushion: drawCushion,
  quilt: drawQuilt,
  vase: drawVase,
  earrings: drawEarrings,
  basket: drawBasket,
};

function productSvg(product, variant = 1) {
  const p = product.palette;
  const id = `${product.slug}-${variant}`.replace(/[^a-z0-9-]/g, "");
  if (variant === 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${defs(p, id)}
      <rect width="${W}" height="${H}" fill="${p.bg}" />
      <rect width="${W}" height="${H}" fill="url(#jaali-${id})" opacity="0.9" />
      <rect x="120" y="170" width="960" height="1120" rx="480" fill="${p.soft}" opacity="0.42" />
      <rect x="170" y="220" width="860" height="1020" rx="430" fill="none" stroke="${p.ink}" stroke-opacity="0.22" stroke-width="2" />
      <g opacity="0.9">
        ${embroidery(p, 600, 560, 5.4)}
        ${embroidery(p, 600, 900, 3.2)}
        ${embroidery(p, 370, 780, 1.6)}
        ${embroidery(p, 830, 780, 1.6)}
      </g>
      <path d="M 180 1080 C 360 980 840 980 1020 1080" stroke="${p.ink}" stroke-width="2" fill="none" opacity="0.3" />
      <path d="M 180 1110 C 360 1010 840 1010 1020 1110" stroke="${p.accent}" stroke-width="1.5" fill="none" opacity="0.4" />
      <text x="600" y="1360" text-anchor="middle" font-family="Georgia, serif" font-size="22"
            letter-spacing="10" fill="${p.ink}" opacity="0.55">HUNAR BAZAAR</text>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${defs(p, id)}
    ${frame(p, id)}
    ${(ART[product.art] ?? drawSuit)(p)}
  </svg>`;
}

function categorySvg(category) {
  const p = category.palette;
  const id = category.slug;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    ${defs(p, id)}
    <rect width="1200" height="900" fill="url(#bg-${id})" />
    <rect width="1200" height="900" fill="url(#jaali-${id})" opacity="0.85" />
    <path d="M 230 760 V 420 C 230 220 380 140 600 140 C 820 140 970 220 970 420 V 760 Z"
          fill="#ffffff" opacity="0.3" stroke="${p.ink}" stroke-opacity="0.2" stroke-width="2" />
    <g transform="translate(0 -170) scale(0.9) translate(65 0)">
      ${(ART[category.art] ?? drawSuit)(p)}
    </g>
    <path d="M 120 780 H 1080" stroke="${p.ink}" stroke-opacity="0.2" />
  </svg>`;
}

function heroSvg() {
  const p = { bg: "#123b27", ink: "#f3e7cf", accent: "#d97706", soft: "#2f5c42" };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1500" viewBox="0 0 1800 1500">
    ${defs(p, "hero")}
    <rect width="1800" height="1500" fill="url(#bg-hero)" />
    <rect width="1800" height="1500" fill="url(#jaali-hero)" opacity="0.65" />
    <ellipse cx="900" cy="420" rx="720" ry="460" fill="${p.soft}" opacity="0.55" filter="url(#soft-hero)" />
    <path d="M 300 1300 V 620 C 300 320 560 180 900 180 C 1240 180 1500 320 1500 620 V 1300 Z"
          fill="#f7eeda" opacity="0.1" stroke="${p.ink}" stroke-opacity="0.28" stroke-width="3" />
    <path d="M 360 1280 V 640 C 360 370 590 240 900 240 C 1210 240 1440 370 1440 640 V 1280"
          fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="2" />
    <g transform="translate(470 160) scale(0.72)">
      ${drawSuit({ bg: "#123b27", ink: "#f3e7cf", accent: "#d97706", soft: "#2f5c42" })}
    </g>
    <g transform="translate(60 520) scale(0.62)">
      ${drawShawl({ bg: "#123b27", ink: "#8f2f2f", accent: "#d97706", soft: "#e9d6b7" })}
    </g>
    <g transform="translate(740 760) scale(0.52)">
      ${drawKhussa({ bg: "#123b27", ink: "#6b3416", accent: "#d97706", soft: "#e9d6b7" })}
    </g>
    <g transform="translate(1120 850) scale(0.5)">
      ${drawRug({ bg: "#123b27", ink: "#1f5136", accent: "#d97706", soft: "#e9d6b7" })}
    </g>
    <path d="M 240 1300 H 1560" stroke="${p.ink}" stroke-opacity="0.3" stroke-width="2" />
    <path d="M 420 1330 H 1380" stroke="${p.ink}" stroke-opacity="0.12" stroke-width="12" stroke-linecap="round" />
  </svg>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f3b25" />
        <stop offset="100%" stop-color="#14532d" />
      </linearGradient>
      <pattern id="ogjaali" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.2" fill="#f5ecd9" opacity="0.12" />
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="url(#ogbg)" />
    <rect width="1200" height="630" fill="url(#ogjaali)" />
    <path d="M 720 560 V 300 C 720 190 800 120 900 120 C 1000 120 1080 190 1080 300 V 560 Z"
          fill="none" stroke="#f5ecd9" stroke-opacity="0.35" stroke-width="3" />
    <path d="M 760 560 V 315 C 760 225 825 165 900 165 C 975 165 1040 225 1040 315 V 560"
          fill="none" stroke="#d97706" stroke-opacity="0.55" stroke-width="2" />
    <text x="90" y="270" font-family="Georgia, serif" font-size="76" fill="#f8f2e6">Hunar Bazaar</text>
    <text x="94" y="330" font-family="system-ui, sans-serif" font-size="24" fill="#c9d8c4" letter-spacing="2">
      CRAFTED IN PAKISTAN
    </text>
    <text x="94" y="430" font-family="system-ui, sans-serif" font-size="26" fill="#e9e2d3">
      Lawn · Kurtas · Shawls · Khussa · Home
    </text>
    <rect x="94" y="480" width="250" height="52" rx="26" fill="#d97706" />
    <text x="219" y="513" text-anchor="middle" font-family="system-ui, sans-serif" font-size="19" font-weight="600" fill="#fff">
      Shop the collection
    </text>
  </svg>`;
}

async function writeWebp(svg, file) {
  await sharp(Buffer.from(svg)).webp({ quality: 88, effort: 5 }).toFile(file);
}

async function writeJpeg(svg, file) {
  await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(file);
}

await mkdir(path.join(root, "public", "products"), { recursive: true });
await mkdir(path.join(root, "public", "categories"), { recursive: true });

let count = 0;
for (const product of catalog.products) {
  await writeWebp(productSvg(product, 1), path.join(root, "public", "products", `${product.slug}-1.webp`));
  await writeWebp(productSvg(product, 2), path.join(root, "public", "products", `${product.slug}-2.webp`));
  count += 2;
}

for (const category of catalog.categories) {
  await writeWebp(
    categorySvg(category),
    path.join(root, "public", "categories", `${category.slug}.webp`),
  );
  count += 1;
}

await writeJpeg(heroSvg(), path.join(root, "public", "hero.jpg"));
await writeJpeg(ogSvg(), path.join(root, "public", "og.jpg"));

console.log(`Generated ${count} product/category images, hero.jpg and og.jpg.`);
