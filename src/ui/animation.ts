import chalk from 'chalk';

// ANSI escape codes for cursor control
const ESC = '\x1b';
const CSI = `${ESC}[`;

export const cursor = {
  hide: () => process.stdout.write(`${CSI}?25l`),
  show: () => process.stdout.write(`${CSI}?25h`),
  moveTo: (row: number, col: number) => process.stdout.write(`${CSI}${row};${col}H`),
  moveUp: (n: number = 1) => process.stdout.write(`${CSI}${n}A`),
  moveDown: (n: number = 1) => process.stdout.write(`${CSI}${n}B`),
  saveCursor: () => process.stdout.write(`${CSI}s`),
  restoreCursor: () => process.stdout.write(`${CSI}u`),
  clearScreen: () => process.stdout.write(`${CSI}2J${CSI}0;0H`),
  clearLine: () => process.stdout.write(`${CSI}2K`),
};

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Frame-based animation player.
 */
export class AnimationPlayer {
  private running: boolean = false;
  private currentInterval: ReturnType<typeof setInterval> | null = null;

  stop(): void {
    this.running = false;
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
  }

  async playFrames(frames: string[], frameDelay: number, loops: number = 1, startRow: number = 0): Promise<void> {
    this.running = true;
    for (let loop = 0; loop < loops && this.running; loop++) {
      for (const frame of frames) {
        if (!this.running) break;
        if (startRow > 0) cursor.moveTo(startRow, 1);
        process.stdout.write(frame);
        await sleep(frameDelay);
      }
    }
  }
}

// ============================================================================
// GLITCH EFFECTS
// ============================================================================

const GLITCH_CHARS = '░▒▓█▄▀│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌';

export function glitchText(text: string, intensity: number = 0.15): string {
  return text.split('').map(char => {
    if (char === ' ' || char === '\n') return char;
    if (Math.random() < intensity) {
      const glitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      const colors = [chalk.red, chalk.magenta, chalk.cyan, chalk.yellow];
      return colors[Math.floor(Math.random() * colors.length)](glitchChar);
    }
    return char;
  }).join('');
}

export function glitchLine(text: string, intensity: number = 0.3): string {
  if (Math.random() < intensity) {
    // Shift entire line
    const shift = Math.floor(Math.random() * 8) - 4;
    const pad = shift > 0 ? ' '.repeat(shift) : '';
    const trimmed = shift < 0 ? text.slice(Math.abs(shift)) : text;
    return chalk.red(pad + trimmed);
  }
  return text;
}

export function scanlineEffect(text: string): string {
  const lines = text.split('\n');
  const scanlinePos = Math.floor(Math.random() * lines.length);
  return lines.map((line, i) => {
    if (i === scanlinePos) {
      return chalk.bgRgb(20, 0, 40)(line) + chalk.reset('');
    }
    if (Math.abs(i - scanlinePos) === 1) {
      return chalk.bgRgb(10, 0, 20)(line) + chalk.reset('');
    }
    return line;
  }).join('\n');
}

// ============================================================================
// RAIN ANIMATION
// ============================================================================

export class CyberRain {
  private width: number;
  private height: number;
  private drops: { x: number; y: number; speed: number; char: string; color: chalk.Chalk }[];
  private rainChars = ['│', '┃', '┆', '┇', '┊', '┋', '╎', '╏', '|', '¦', ':', '.'];

  constructor(width: number = 60, height: number = 20) {
    this.width = width;
    this.height = height;
    this.drops = [];
    this.initDrops(30);
  }

  private initDrops(count: number): void {
    for (let i = 0; i < count; i++) {
      this.drops.push(this.newDrop());
    }
  }

  private newDrop(): { x: number; y: number; speed: number; char: string; color: chalk.Chalk } {
    const colors = [
      chalk.rgb(0, 180, 180),
      chalk.rgb(0, 120, 160),
      chalk.rgb(0, 80, 140),
      chalk.rgb(40, 40, 80),
      chalk.rgb(100, 0, 160),
    ];
    return {
      x: Math.floor(Math.random() * this.width),
      y: Math.floor(Math.random() * this.height),
      speed: Math.random() * 2 + 0.5,
      char: this.rainChars[Math.floor(Math.random() * this.rainChars.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  render(): string {
    const grid: string[][] = Array(this.height).fill(null).map(() => Array(this.width).fill(' '));

    for (const drop of this.drops) {
      const y = Math.floor(drop.y);
      if (y >= 0 && y < this.height && drop.x >= 0 && drop.x < this.width) {
        grid[y][drop.x] = drop.color(drop.char);
      }
      // Trail
      const trailY = y - 1;
      if (trailY >= 0 && trailY < this.height && drop.x >= 0 && drop.x < this.width) {
        grid[trailY][drop.x] = chalk.rgb(20, 20, 50)(drop.char);
      }

      drop.y += drop.speed;
      if (drop.y >= this.height) {
        Object.assign(drop, this.newDrop());
        drop.y = 0;
      }
    }

    return grid.map(row => row.join('')).join('\n');
  }
}

// ============================================================================
// NEON SIGN FLICKER
// ============================================================================

export function neonFlicker(text: string, primaryColor: chalk.Chalk, flickerChance: number = 0.08): string {
  if (Math.random() < flickerChance) {
    // Full flicker - dim version
    return chalk.gray(text.replace(/[^\s]/g, (ch) => Math.random() < 0.5 ? ch : '░'));
  }
  if (Math.random() < flickerChance * 2) {
    // Partial flicker - some chars dim
    return text.split('').map(ch => {
      if (ch === ' ' || ch === '\n') return ch;
      return Math.random() < 0.3 ? chalk.gray(ch) : primaryColor(ch);
    }).join('');
  }
  return primaryColor(text);
}

// ============================================================================
// ANIMATED TITLE SCREEN
// ============================================================================

const CYBER_TITLE = [
  '  ▄████▄▄   ██    ██ ▀█████▄  ▄████▀ ▀█████▄  ',
  ' ██▀    ▀█  ▀█▄  ▄█▀  ██   █ ██▀      ██   █  ',
  ' ██         ▀████▀    ██████ ████▄    ██████  ',
  ' ██      █   ▀██▀     ██   █ ██▀      ██  █▄  ',
  '  ▀████▄▀     ██      ██████ ▀████▄  ██   ██  ',
];

const LIFE_SIM_TEXT = [
  ' ▀█▀   █ █▀▀ █▀▀   ▄▀▀ █ █▄ ▄█ █ █ █   ▄▀▄ ▀█▀ ▄▀▄ █▀▀▄',
  '  █▄  █▄ █▀  █▀    ▀▄▄ █ █ █ █ █▄█ █▄  █▀█  █  █ █ █▀▀▄',
  '  ▀  ▀   ▀   ▀▀▀   ▄▄▀ ▀ ▀   ▀ ▀ ▀ ▀▀▀ ▀ ▀  ▀  ▀▄▀ ▀  ▀',
];

const CITYSCAPE_FRAMES = [
  // Frame 1
  `
     ▄▄    ▄▄▄▄                    ▄▄▄▄     ▄▄
    ████  ██████  ▄▄    ▄▄▄▄     ██████   ████
    ████  ██████ ████  ██████    ████████  ████
   ██████████████████ ████████  ██████████████████
  ▐██████████████████████████████████████████████▌
  ▐██████████████████████████████████████████████▌
  ▐████░░██░░██░░████░░██░░██░░████░░██░░████████▌
  ▐████░░██░░██░░████░░██░░██░░████░░██░░████████▌
  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`,
  // Frame 2 (windows flicker)
  `
     ▄▄    ▄▄▄▄                    ▄▄▄▄     ▄▄
    ████  ██████  ▄▄    ▄▄▄▄     ██████   ████
    ████  ██████ ████  ██████    ████████  ████
   ██████████████████ ████████  ██████████████████
  ▐██████████████████████████████████████████████▌
  ▐██████████████████████████████████████████████▌
  ▐████▓▓██░░██▓▓████░░██▓▓██░░████▓▓██░░████████▌
  ▐████░░██▓▓██░░████▓▓██░░██▓▓████░░██▓▓████████▌
  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`,
];

export async function playTitleAnimation(durationMs: number = 6000): Promise<void> {
  cursor.hide();
  cursor.clearScreen();

  const startTime = Date.now();
  const rain = new CyberRain(60, 6);
  let frame = 0;

  while (Date.now() - startTime < durationMs) {
    cursor.moveTo(1, 1);

    // Rain at top
    const rainFrame = rain.render();
    const rainLines = rainFrame.split('\n').slice(0, 4);
    console.log(chalk.rgb(20, 10, 40)('  ─'.repeat(20)));

    for (const line of rainLines) {
      process.stdout.write('  ' + line + '\n');
    }

    // Title with neon flicker
    console.log('');
    for (const line of CYBER_TITLE) {
      console.log('  ' + neonFlicker(line, chalk.rgb(255, 0, 100), 0.06));
    }

    console.log('');

    // Subtitle
    for (const line of LIFE_SIM_TEXT) {
      const flickered = neonFlicker(line, chalk.rgb(0, 200, 255), 0.04);
      console.log('  ' + (Math.random() < 0.03 ? glitchLine(flickered, 0.8) : flickered));
    }

    console.log('');

    // Cityscape with window flicker
    const cityFrame = CITYSCAPE_FRAMES[frame % CITYSCAPE_FRAMES.length];
    const cityLines = cityFrame.split('\n');
    for (const line of cityLines) {
      const colored = line
        .replace(/░/g, chalk.yellow('░'))
        .replace(/▓/g, chalk.rgb(255, 200, 50)('▓'));
      console.log(chalk.rgb(60, 40, 80)(colored));
    }

    // Glitch bar
    if (Math.random() < 0.15) {
      const glitchBar = Array(60).fill(null).map(() =>
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      ).join('');
      console.log('  ' + chalk.rgb(255, 0, 60)(glitchBar));
    } else {
      console.log(chalk.rgb(40, 0, 60)('  ' + '─'.repeat(56)));
    }

    // Bottom text
    console.log('');
    const tagline = '  T H E   Y E A R   I S   2 0 8 7';
    console.log(neonFlicker(tagline, chalk.rgb(180, 0, 255), 0.03));
    console.log(chalk.gray('  The megacorps rule. The streets bleed. You survive.'));
    console.log('');

    // Blinking prompt
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      console.log(chalk.cyan('  ► PRESS ENTER TO JACK IN ◄'));
    } else {
      console.log(chalk.rgb(0, 80, 120)('  ► PRESS ENTER TO JACK IN ◄'));
    }

    frame++;
    await sleep(120);
  }

  cursor.show();
}

// ============================================================================
// BOOT SEQUENCE ANIMATION
// ============================================================================

const BOOT_LINES = [
  { text: 'NEURAL_LINK v4.7.2 ... INITIALIZING', delay: 80 },
  { text: 'SCANNING CYBERWARE .............. OK', delay: 60 },
  { text: 'OPTICS CALIBRATION .............. OK', delay: 40 },
  { text: 'LOADING ICE PROTOCOLS ........... OK', delay: 70 },
  { text: 'NET DRIVER: BlackICE v12.0 ...... OK', delay: 50 },
  { text: 'THREAT ASSESSMENT MODULE ........ ACTIVE', delay: 60 },
  { text: 'GPS TRIANGULATION ............... OK', delay: 30 },
  { text: 'CREDIT CHIP SYNC ................ OK', delay: 40 },
  { text: 'REPUTATION DATABASE ............. LOADED', delay: 50 },
  { text: 'COMBAT SUBROUTINES .............. ARMED', delay: 80 },
  { text: '', delay: 200 },
  { text: 'ALL SYSTEMS NOMINAL. WELCOME BACK.', delay: 100 },
];

export async function playBootSequence(): Promise<void> {
  cursor.hide();
  console.log(chalk.rgb(0, 180, 0)('\n  ┌─────────────────────────────────────────┐'));
  console.log(chalk.rgb(0, 180, 0)('  │        CYBERDECK BOOT SEQUENCE          │'));
  console.log(chalk.rgb(0, 180, 0)('  └─────────────────────────────────────────┘\n'));

  for (const line of BOOT_LINES) {
    if (line.text === '') {
      await sleep(line.delay);
      continue;
    }

    // Type out each character
    process.stdout.write('  ');
    for (let i = 0; i < line.text.length; i++) {
      const char = line.text[i];
      if (char === '.') {
        process.stdout.write(chalk.gray(char));
      } else if (line.text.endsWith('OK') || line.text.endsWith('LOADED') || line.text.endsWith('ACTIVE') || line.text.endsWith('ARMED')) {
        const statusStart = line.text.lastIndexOf(' ') + 1;
        if (i >= statusStart) {
          process.stdout.write(chalk.green(char));
        } else {
          process.stdout.write(chalk.rgb(0, 160, 0)(char));
        }
      } else {
        process.stdout.write(chalk.rgb(0, 180, 0)(char));
      }
      if (Math.random() < 0.05) {
        await sleep(line.delay);
      }
    }
    process.stdout.write('\n');
    await sleep(line.delay);
  }

  console.log('');
  cursor.show();
}

// ============================================================================
// COMBAT ANIMATIONS
// ============================================================================

const ATTACK_FRAMES = [
  chalk.red('   ╔══╗     '),
  chalk.red('   ║▓▓║ ──► '),
  chalk.redBright('   ║██║══►  '),
  chalk.redBright('   ║██║════►'),
  chalk.yellow('   ║██║ ★★★ '),
  chalk.red('   ╚══╝     '),
];

const HACK_FRAMES = [
  chalk.cyan('  [          ]'),
  chalk.cyan('  [█         ]'),
  chalk.cyan('  [███       ]'),
  chalk.cyan('  [█████     ]'),
  chalk.cyan('  [████████  ]'),
  chalk.cyanBright('  [██████████]'),
  chalk.greenBright('  [■■BREACH■■]'),
];

const DAMAGE_FRAMES = [
  chalk.red(`
    ╲   ╱
     ╲ ╱
    ─ ✦ ─
     ╱ ╲
    ╱   ╲`),
  chalk.yellow(`
    ╲   ╱
     ╲ ╱
    ─ ◆ ─
     ╱ ╲
    ╱   ╲`),
  chalk.red(`
    *   *
     * *
    * ✦ *
     * *
    *   *`),
];

export async function playAttackAnimation(): Promise<void> {
  for (const frame of ATTACK_FRAMES) {
    process.stdout.write('\r' + frame);
    await sleep(80);
  }
  process.stdout.write('\n');
}

export async function playHackAnimation(): Promise<void> {
  for (const frame of HACK_FRAMES) {
    process.stdout.write('\r' + frame);
    await sleep(100);
  }
  process.stdout.write('\n');
}

export async function playDamageFlash(): Promise<void> {
  const frame = DAMAGE_FRAMES[Math.floor(Math.random() * DAMAGE_FRAMES.length)];
  console.log(frame);
  await sleep(200);
}

export async function playDeathAnimation(): Promise<void> {
  const frames = [
    chalk.red('  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'),
    chalk.redBright('  ░░░░ FLATLINED ░░░░░░░░░░░░░░░░'),
    chalk.red('  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'),
  ];
  for (let i = 0; i < 4; i++) {
    cursor.clearScreen();
    await sleep(150);
    for (const f of frames) console.log(f);
    await sleep(250);
  }
}

// ============================================================================
// TRAVEL / TRANSITION ANIMATION
// ============================================================================

export async function playTravelAnimation(fromDistrict: string, toDistrict: string): Promise<void> {
  cursor.hide();
  const width = 50;

  console.log('');
  console.log(chalk.gray('  ' + '─'.repeat(width)));

  const travelText = `  TRANSIT: ${fromDistrict} → ${toDistrict}`;
  for (let i = 0; i <= width; i++) {
    const bar = '█'.repeat(i) + '░'.repeat(width - i);
    process.stdout.write(`\r  ${chalk.cyan(bar)}`);
    await sleep(20);
  }
  console.log('');
  console.log(chalk.cyan(travelText));

  // Glitch transition
  for (let i = 0; i < 3; i++) {
    const glitchBar = Array(width).fill(null).map(() =>
      GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    ).join('');
    console.log(chalk.magenta('  ' + glitchBar));
    await sleep(60);
  }

  console.log(chalk.gray('  ' + '─'.repeat(width)));
  console.log('');
  cursor.show();
}

// ============================================================================
// DISTRICT AMBIENT ANIMATIONS
// ============================================================================

export function getDistrictAmbience(districtId: string): string {
  switch (districtId) {
    case 'downtown':
      return renderDowntownAmbience();
    case 'kabuki':
      return renderKabukiAmbience();
    case 'industrial':
      return renderIndustrialAmbience();
    case 'neon_heights':
      return renderNeonHeightsAmbience();
    case 'undercity':
      return renderUndercityAmbience();
    default:
      return '';
  }
}

function renderDowntownAmbience(): string {
  const signs = [
    neonFlicker('KENZAKI', chalk.rgb(255, 0, 80)),
    neonFlicker('CORP', chalk.rgb(255, 0, 80)),
  ];
  const r = Math.random();
  const hologram = r < 0.3 ? chalk.cyan('  [HOLOGRAM: Buy Kenzaki Neural™]') :
    r < 0.6 ? chalk.magenta('  [HOLOGRAM: Your Life. Upgraded.]') :
    chalk.yellow('  [HOLOGRAM: Report Cyberpsychos → Earn ¥¥¥]');

  return `  ${chalk.gray('▌')}${signs.join(' ')}${chalk.gray('▐')}\n${hologram}`;
}

function renderKabukiAmbience(): string {
  const lanterns = ['提', '灯', '夜', '市'].map(c =>
    neonFlicker(c, chalk.rgb(255, 100, 0), 0.1)
  ).join(' ');
  const smoke = Math.random() < 0.4 ? chalk.gray('  ~~~~ steam rises from the grates ~~~~') : '';
  return `  ${lanterns}\n${smoke}`;
}

function renderIndustrialAmbience(): string {
  const sparks = Math.random() < 0.3 ? chalk.yellow('  *spark* *spark*  ') +
    chalk.rgb(255, 200, 0)('⚡') : '';
  const machine = Math.random() < 0.5 ?
    chalk.gray('  [distant machinery: CLANK... CLANK... HISSSS]') :
    chalk.gray('  [grinding metal echoes through the corridors]');
  return `${machine}\n${sparks}`;
}

function renderNeonHeightsAmbience(): string {
  const neonSigns = [
    neonFlicker('♫ AFTERLIFE ♫', chalk.magenta, 0.05),
    neonFlicker('DREAMSCAPE', chalk.cyan, 0.08),
    neonFlicker('BD LOUNGE', chalk.rgb(255, 0, 255), 0.06),
  ];
  const music = Math.random() < 0.4 ? chalk.gray('  ♪ bass thuds from a nearby club ♪') : '';
  return `  ${neonSigns[Math.floor(Math.random() * neonSigns.length)]}\n${music}`;
}

function renderUndercityAmbience(): string {
  const drip = Math.random() < 0.5 ? chalk.blue('  *drip*    *drip*') : '';
  const flicker = Math.random() < 0.3 ? chalk.gray('  [ fluorescent light flickers ]') : '';
  const data = Math.random() < 0.2 ?
    chalk.green(`  ${Array(30).fill(null).map(() => Math.round(Math.random())).join('')}`) : '';
  return `${drip}\n${flicker}\n${data}`;
}

// ============================================================================
// EVENT HEADER ANIMATION
// ============================================================================

export async function playEventIntro(title: string): Promise<void> {
  cursor.hide();
  const width = 50;
  const padding = Math.max(0, Math.floor((width - title.length) / 2));

  // Glitch reveal
  for (let i = 0; i < 5; i++) {
    process.stdout.write('\r  ');
    const revealed = title.split('').map((ch, idx) => {
      if (Math.random() < (i / 5)) return chalk.bold.yellow(ch);
      return chalk.red(GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]);
    }).join('');
    process.stdout.write(' '.repeat(padding) + revealed);
    await sleep(80);
  }

  // Final clean version
  process.stdout.write('\r  ' + ' '.repeat(padding) + chalk.bold.yellow(title) + '  \n');
  cursor.show();
}

// ============================================================================
// LEVEL UP ANIMATION
// ============================================================================

export async function playLevelUpAnimation(level: number): Promise<void> {
  cursor.hide();
  const frames = [
    chalk.yellow('  ╔═══════════════════════╗'),
    chalk.yellow('  ║                       ║'),
    chalk.yellow(`  ║   ★ LEVEL UP! Lv.${String(level).padEnd(3)} ★  ║`),
    chalk.yellow('  ║                       ║'),
    chalk.yellow('  ╚═══════════════════════╝'),
  ];

  for (let flash = 0; flash < 4; flash++) {
    console.log('');
    const color = flash % 2 === 0 ? chalk.yellow : chalk.yellowBright;
    for (const line of frames) {
      console.log(color === chalk.yellow ? line : line.replace(/[═║╔╗╚╝★]/g, m => chalk.yellowBright(m)));
    }
    await sleep(200);
  }
  cursor.show();
}
