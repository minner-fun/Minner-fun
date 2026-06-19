import {useEffect, useRef, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import ParticleField from '@site/src/components/ParticleField';

import styles from './index.module.css';

/* ── 双语文案：按 currentLocale 选择 ── */
const CONTENT = {
  zh: {
    badge: '0xMINNER · SMART CONTRACT ENGINEER',
    h1a: '我把协议拆开，',
    h1b: '再重新构建它。',
    researchingLabel: '正在研究：',
    typeWords: ['Uniswap V4 Hooks', 'AMM 做市与定价机制', 'MEV 与 BidWall', 'LP 仓位管理策略', 'Memecoin Launchpad'],
    lede: '智能合约工程师，专注 DeFi、AMM 与 MEV。我阅读源码、复现机制，把每一次研究写成可复用的笔记与实战项目。',
    cta1: '查看作品集 →',
    cta2: '阅读笔记',
    stats: [
      {label: '篇技术文档'},
      {label: '协议源码精读'},
      {label: '链上实战项目'},
    ],
    aboutKicker: '// 01 — ABOUT',
    aboutH2a: '不止会写合约，',
    aboutH2b: '更想搞懂它为什么这样写。',
    aboutP1: '我做智能合约开发，日常在 Foundry / Hardhat 里写测试、调 gas、读协议源码。比起调用 API，我更喜欢把 Uniswap、AMM、Launchpad 这类系统从底层拆开，弄明白每一行的意图。',
    aboutP2: '这个站点是我的研究与构建日志——中英双语，边学边写，持续更新。',
    currentlyLabel: 'CURRENTLY',
    currently: [
      {c: 'var(--accent)', t: '精读 Uniswap V3 / V4 源码', s: 'Tick、流动性管理、Hooks 机制系列'},
      {c: 'var(--accent2)', t: '构建 Memecoin Launchpad', s: 'internal swap、BidWall、TreasuryManager'},
      {c: 'var(--accent)', t: 'LP 仓位数据 → 策略', s: '链上数据抓取、分析与做市策略'},
    ],
    workKicker: '// 02 — SELECTED WORK',
    workH2: '项目与协议研究',
    workAll: '查看全部文档 →',
    work: [
      {tag: 'PROJECT', title: 'LaunchV2 · Memecoin Launchpad', desc: '从 0 设计代币发射台：internal swap 内部做市、BidWall 买墙机制与国库授权流程。', chips: ['Solidity', 'Uniswap V4 Hooks', 'Foundry'], link: '阅读分析 →'},
      {tag: 'PROJECT', title: 'LpManager · 仓位策略引擎', desc: '链上 LP 数据抓取 → 分析 → 策略闭环，把做市仓位的盈亏拆成可量化的指标。', chips: ['TheGraph', 'Dune', 'Python'], link: '阅读分析 →'},
      {tag: 'RESEARCH', title: 'Uniswap V3 源码精读系列', desc: '20+ 篇深入：Tick 系统、流动性管理、跨 tick swap、TWAP 预言机与 gas 优化。', chips: ['Architecture', 'Math Model', 'Oracle'], link: '阅读系列 →', alt: true},
      {tag: 'RESEARCH', title: 'Hooks & PositionManager 拆解', desc: 'Flaunch / beforeSwap / afterSwap 钩子分析，逐方法还原合约的授权与执行流。', chips: ['Hooks', 'Solady', 'Permit2'], link: '阅读分析 →', alt: true},
    ],
    notes: [
      {title: 'Solidity 语法重点', sub: 'assembly · create2 · 数据位置 · NatSpec'},
      {title: 'Foundry & Hardhat 测试', sub: 'cheatcodes · fuzzing · 最佳实践'},
      {title: 'Chainlink VRF / Datafeed', sub: '随机数 · 喂价 · Automation'},
    ],
    ctaTitle: '一起在链上',
    ctaTitleAccent: ' 构建点什么。',
  },
  en: {
    badge: '0xMINNER · SMART CONTRACT ENGINEER',
    h1a: 'I take protocols apart,',
    h1b: 'then rebuild them.',
    researchingLabel: 'Researching: ',
    typeWords: ['Uniswap V4 Hooks', 'AMM pricing mechanics', 'MEV & BidWall', 'LP position strategy', 'Memecoin Launchpad'],
    lede: 'Smart contract engineer focused on DeFi, AMM and MEV. I read source code, reproduce mechanisms, and turn every study into reusable notes and hands-on projects.',
    cta1: 'View work →',
    cta2: 'Read notes',
    stats: [
      {label: 'technical docs'},
      {label: 'protocol deep dives'},
      {label: 'on-chain projects'},
    ],
    aboutKicker: '// 01 — ABOUT',
    aboutH2a: 'Not just writing contracts —',
    aboutH2b: 'understanding why they are written that way.',
    aboutP1: 'I build smart contracts: writing tests, tuning gas and reading protocol source in Foundry / Hardhat every day. Rather than just calling an API, I like taking systems like Uniswap, AMMs and launchpads apart from the ground up to understand the intent behind every line.',
    aboutP2: 'This site is my research-and-build log — bilingual, written as I learn, continuously updated.',
    currentlyLabel: 'CURRENTLY',
    currently: [
      {c: 'var(--accent)', t: 'Reading Uniswap V3 / V4 source', s: 'Ticks, liquidity management, Hooks series'},
      {c: 'var(--accent2)', t: 'Building a Memecoin Launchpad', s: 'internal swap, BidWall, TreasuryManager'},
      {c: 'var(--accent)', t: 'LP position data → strategy', s: 'On-chain data capture, analysis and market making'},
    ],
    workKicker: '// 02 — SELECTED WORK',
    workH2: 'Projects & Protocol Research',
    workAll: 'View all docs →',
    work: [
      {tag: 'PROJECT', title: 'LaunchV2 · Memecoin Launchpad', desc: 'Designing a token launchpad from scratch: internal swap market making, the BidWall mechanism and treasury authorization flow.', chips: ['Solidity', 'Uniswap V4 Hooks', 'Foundry'], link: 'Read analysis →'},
      {tag: 'PROJECT', title: 'LpManager · Position Strategy Engine', desc: 'On-chain LP data capture → analysis → strategy loop, breaking market-making PnL into quantifiable metrics.', chips: ['TheGraph', 'Dune', 'Python'], link: 'Read analysis →'},
      {tag: 'RESEARCH', title: 'Uniswap V3 Source Code Series', desc: '20+ deep dives: the tick system, liquidity management, cross-tick swaps, the TWAP oracle and gas optimization.', chips: ['Architecture', 'Math Model', 'Oracle'], link: 'Read series →', alt: true},
      {tag: 'RESEARCH', title: 'Hooks & PositionManager Breakdown', desc: 'Flaunch / beforeSwap / afterSwap hook analysis, reconstructing the contract authorization and execution flow method by method.', chips: ['Hooks', 'Solady', 'Permit2'], link: 'Read analysis →', alt: true},
    ],
    notes: [
      {title: 'Solidity Language Notes', sub: 'assembly · create2 · data location · NatSpec'},
      {title: 'Foundry & Hardhat Testing', sub: 'cheatcodes · fuzzing · best practices'},
      {title: 'Chainlink VRF / Datafeed', sub: 'randomness · price feeds · Automation'},
    ],
    ctaTitle: "Let's build something",
    ctaTitleAccent: ' on-chain.',
  },
} as const;

type Locale = keyof typeof CONTENT;

const LINKS = {
  notes: '/docs/notes/foundry/updraft',
  work: '/docs/projects/LpManager/data-crawl',
  card0: '/docs/projects/LaunchV2/StartLunch',
  card1: '/docs/projects/LpManager/data-crawl',
  card2: '/docs/protocols/Uniswap/V2/overview',
  card3: '/docs/projects/LaunchV2/StartLunch',
  note0: '/docs/notes/Solidity/Solidity语法重点',
  note1: '/docs/notes/foundry/updraft',
  note2: '/docs/notes/Chainlink/Vrf',
};
const CARD_LINKS = [LINKS.card0, LINKS.card1, LINKS.card2, LINKS.card3];
const NOTE_LINKS = [LINKS.note0, LINKS.note1, LINKS.note2];
const STAT_VALUES = [
  {to: 180, suffix: '+'},
  {to: 12, suffix: ''},
  {to: 4, suffix: ''},
];

function Typewriter({words}: {words: readonly string[]}): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let wi = 0;
    let ci = 0;
    let del = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const w = words[wi];
      ci += del ? -1 : 1;
      if (ref.current) ref.current.textContent = w.slice(0, ci);
      let t = del ? 40 : 85;
      if (!del && ci === w.length) {
        t = 1500;
        del = true;
      } else if (del && ci === 0) {
        del = false;
        wi = (wi + 1) % words.length;
        t = 320;
      }
      timer = setTimeout(tick, t);
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [words]);
  return (
    <span ref={ref} className={styles.caret}>
      {words[0]}
    </span>
  );
}

function Counter({to, suffix = ''}: {to: number; suffix?: string}): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const dur = 1400;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const k = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - k, 3);
      if (ref.current) ref.current.textContent = Math.round(e * to) + suffix;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

function BlockNumber(): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let n = 21567432;
    const set = () => {
      if (ref.current) ref.current.textContent = '#' + n.toLocaleString('en-US');
    };
    set();
    const id = setInterval(() => {
      n += 1;
      set();
    }, 2600);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref}>#21,567,432</span>;
}

const MARQUEE = [
  'Solidity', 'Foundry', 'Hardhat', 'Rust', 'Solana', 'Chainlink',
  'Uniswap V2/V3/V4', 'OpenZeppelin', 'Solady', 'TheGraph', 'Dune', 'Permit2',
];

function MarqueeRow({hidden}: {hidden?: boolean}): ReactNode {
  return (
    <div className={styles.marqueeRow} aria-hidden={hidden}>
      {MARQUEE.map((m, i) => (
        <span key={i} style={{display: 'contents'}}>
          <span>{m}</span>
          <span className={styles.sep}>·</span>
        </span>
      ))}
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig, i18n} = useDocusaurusContext();
  const logo = useBaseUrl('/img/myLogo.jpg');
  const t = CONTENT[(i18n.currentLocale as Locale)] ?? CONTENT.zh;

  return (
    <Layout title={siteConfig.title} description={t.lede}>
      <div className={styles.page}>
        {/* ░░ HERO ░░ */}
        <header className={styles.hero}>
          <ParticleField />
          <div className={styles.heroGlow} />
          <div className={styles.wrap}>
            <div className={styles.heroGrid}>
              <div className={styles.rise}>
                <div className={styles.badge}>
                  <span className={styles.dot} />
                  {t.badge}
                </div>
                <h1 className={styles.h1}>
                  {t.h1a}
                  <br />
                  <span className={styles.grad}>{t.h1b}</span>
                </h1>
                <p className={styles.researching}>
                  <span style={{color: 'var(--accent)'}}>&gt;</span> {t.researchingLabel}
                  <Typewriter words={t.typeWords} />
                </p>
                <p className={styles.lede}>{t.lede}</p>
                <div className={styles.ctaRow}>
                  <a href="#work" className={styles.btnPrimary}>
                    {t.cta1}
                  </a>
                  <Link to={LINKS.notes} className={styles.btnGhost}>
                    {t.cta2}
                  </Link>
                </div>
                <div className={styles.stats}>
                  {STAT_VALUES.map((s, i) => (
                    <span key={i} style={{display: 'contents'}}>
                      {i > 0 && <div className={styles.statDivider} />}
                      <div>
                        <div className={styles.statNum}>
                          <Counter to={s.to} suffix={s.suffix} />
                        </div>
                        <div className={styles.statLabel}>{t.stats[i].label}</div>
                      </div>
                    </span>
                  ))}
                </div>
              </div>

              {/* 右：身份终端卡 */}
              <div className={styles.riseSlow}>
                <div className={styles.terminal}>
                  <div className={styles.termBar}>
                    <span className={styles.tdot} style={{background: '#ff5f57'}} />
                    <span className={styles.tdot} style={{background: '#febc2e'}} />
                    <span className={styles.tdot} style={{background: '#28c840'}} />
                    <span className={styles.termTitle}>minner.identity.ts</span>
                  </div>
                  <div className={styles.termBody}>
                    <div className={styles.avatarRow}>
                      <img className={styles.avatar} src={logo} alt="Minner" />
                      <div>
                        <div className={styles.handle}>@minner-fun</div>
                        <div className={styles.status}>● building on-chain</div>
                      </div>
                    </div>
                    <div className={styles.code}>
                      <div className={styles.k}>
                        <span className={styles.k}>const </span>
                        <span className={styles.n}>minner</span> = {'{'}
                      </div>
                      <div className={styles.indent}>
                        <span className={styles.k}>role:</span>{'  '}
                        <span className={styles.s}>"Smart Contract Eng"</span>,
                      </div>
                      <div className={styles.indent}>
                        <span className={styles.k}>focus:</span> [<span className={styles.s}>"DeFi"</span>,
                        <span className={styles.s}>"AMM"</span>,<span className={styles.s}>"MEV"</span>],
                      </div>
                      <div className={styles.indent}>
                        <span className={styles.k}>stack:</span> [<span className={styles.s}>"Solidity"</span>,
                        <span className={styles.s}>"Foundry"</span>],
                      </div>
                      <div className={styles.indent}>
                        <span className={styles.k}>since:</span> <span className={styles.n}>2021</span>,
                      </div>
                      <div className={styles.k}>{'}'}</div>
                    </div>
                    <div className={styles.blockRow}>
                      <span className={styles.blockLabel}>ETH BLOCK</span>
                      <span className={styles.blockNum}>
                        <span className={styles.blockDot} />
                        <BlockNumber />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="stack" className={styles.marquee}>
            <div className={styles.marqueeTrack}>
              <MarqueeRow />
              <MarqueeRow hidden />
            </div>
          </div>
        </header>

        {/* ░░ ABOUT ░░ */}
        <section id="about" className={styles.about}>
          <div className={styles.kicker}>{t.aboutKicker}</div>
          <div className={styles.col2}>
            <div>
              <h2 className={styles.h2}>
                {t.aboutH2a}
                <br />
                {t.aboutH2b}
              </h2>
              <p className={styles.aboutText}>{t.aboutP1}</p>
              <p className={styles.aboutText} style={{marginTop: 16}}>
                {t.aboutP2}
              </p>
            </div>
            <div className={styles.panel}>
              <div className={styles.panelLabel}>{t.currentlyLabel}</div>
              {t.currently.map((it, i) => (
                <div className={styles.currentItem} key={i}>
                  <span
                    className={styles.cdot}
                    style={{background: it.c, boxShadow: `0 0 8px ${it.c}`}}
                  />
                  <div>
                    <div className={styles.cTitle}>{it.t}</div>
                    <div className={styles.cSub}>{it.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.col3}>
            {[
              {l: 'languages', items: ['Solidity', 'Rust', 'TypeScript', 'Python']},
              {l: 'tooling', items: ['Foundry', 'Hardhat', 'OpenZeppelin', 'TheGraph', 'Dune']},
              {l: 'protocols', items: ['Uniswap V2/V3/V4', 'AMM', 'Chainlink']},
            ].map((g, i) => (
              <div className={styles.skillCard} key={i}>
                <div className={styles.skillLabel}>{g.l}</div>
                <div className={styles.chips}>
                  {g.items.map((it) => (
                    <span className={styles.chip} key={it}>
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ░░ WORK ░░ */}
        <section id="work" className={styles.work}>
          <div className={styles.workHead}>
            <div>
              <div className={styles.kicker}>{t.workKicker}</div>
              <h2 className={styles.h2}>{t.workH2}</h2>
            </div>
            <Link to={LINKS.work} className={styles.workHeadLink}>
              {t.workAll}
            </Link>
          </div>

          <div className={styles.workGrid}>
            {t.work.map((w, i) => (
              <Link
                to={CARD_LINKS[i]}
                key={i}
                className={`${styles.workCard} ${w.alt ? styles.alt : ''}`}>
                <div className={styles.workNum}>{String(i + 1).padStart(2, '0')}</div>
                <div className={styles.workInner}>
                  <div className={`${styles.tag} ${w.alt ? styles.tagAlt : ''}`}>{w.tag}</div>
                  <h3 className={styles.workTitle}>{w.title}</h3>
                  <p className={styles.workDesc}>{w.desc}</p>
                  <div className={styles.miniChips}>
                    {w.chips.map((c) => (
                      <span className={styles.miniChip} key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className={`${styles.workLink} ${w.alt ? styles.workLinkAlt : ''}`}>
                    {w.link}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.notesStrip}>
            {t.notes.map((n, i) => (
              <Link to={NOTE_LINKS[i]} key={i} className={styles.noteCard}>
                <div className={styles.notePath}>notes/</div>
                <div className={styles.noteTitle}>{n.title}</div>
                <div className={styles.noteSub}>{n.sub}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ░░ CTA ░░ */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>
              {t.ctaTitle}
              <span style={{color: 'var(--accent)'}}>{t.ctaTitleAccent}</span>
            </h2>
            <a href="https://github.com/minner-fun" className={styles.btnPrimary}>
              GitHub ↗
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}
