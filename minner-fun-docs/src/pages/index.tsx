import {useEffect, useRef, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import ParticleField from '@site/src/components/ParticleField';

import styles from './index.module.css';

/* ── 打字机：词组循环，逐字加/删 ── */
const TYPE_WORDS = [
  'Uniswap V4 Hooks',
  'AMM 做市与定价机制',
  'MEV 与 BidWall',
  'LP 仓位管理策略',
  'Memecoin Launchpad',
];

function Typewriter(): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let wi = 0;
    let ci = 0;
    let del = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const w = TYPE_WORDS[wi];
      ci += del ? -1 : 1;
      if (ref.current) ref.current.textContent = w.slice(0, ci);
      let t = del ? 40 : 85;
      if (!del && ci === w.length) {
        t = 1500;
        del = true;
      } else if (del && ci === 0) {
        del = false;
        wi = (wi + 1) % TYPE_WORDS.length;
        t = 320;
      }
      timer = setTimeout(tick, t);
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, []);
  return (
    <span ref={ref} className={styles.caret}>
      Uniswap V4 Hooks
    </span>
  );
}

/* ── 计数动画：requestAnimationFrame + easeOutCubic ── */
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

/* ── 实时 ETH 区块号：每 2.6s +1 ── */
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
  'Solidity',
  'Foundry',
  'Hardhat',
  'Rust',
  'Solana',
  'Chainlink',
  'Uniswap V2/V3/V4',
  'OpenZeppelin',
  'Solady',
  'TheGraph',
  'Dune',
  'Permit2',
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
  const {siteConfig} = useDocusaurusContext();
  const logo = useBaseUrl('/img/myLogo.jpg');

  return (
    <Layout
      title={siteConfig.title}
      description="Smart Contract Notes · Protocol Research · Builder Log">
      <div className={styles.page}>
        {/* ░░ HERO ░░ */}
        <header className={styles.hero}>
          <ParticleField />
          <div className={styles.heroGlow} />
          <div className={styles.wrap}>
            <div className={styles.heroGrid}>
              {/* 左 */}
              <div className={styles.rise}>
                <div className={styles.badge}>
                  <span className={styles.dot} />
                  0xMINNER · SMART CONTRACT ENGINEER
                </div>
                <h1 className={styles.h1}>
                  我把协议拆开，
                  <br />
                  <span className={styles.grad}>再重新构建它。</span>
                </h1>
                <p className={styles.researching}>
                  <span style={{color: 'var(--accent)'}}>&gt;</span> 正在研究：
                  <Typewriter />
                </p>
                <p className={styles.lede}>
                  智能合约工程师，专注 DeFi、AMM 与 MEV。我阅读源码、复现机制，把每一次研究写成可复用的笔记与实战项目。
                </p>
                <div className={styles.ctaRow}>
                  <a href="#work" className={styles.btnPrimary}>
                    查看作品集 →
                  </a>
                  <Link to="/docs/notes/foundry/updraft" className={styles.btnGhost}>
                    阅读笔记
                  </Link>
                </div>
                <div className={styles.stats}>
                  <div>
                    <div className={styles.statNum}>
                      <Counter to={180} suffix="+" />
                    </div>
                    <div className={styles.statLabel}>篇技术文档</div>
                  </div>
                  <div className={styles.statDivider} />
                  <div>
                    <div className={styles.statNum}>
                      <Counter to={12} />
                    </div>
                    <div className={styles.statLabel}>协议源码精读</div>
                  </div>
                  <div className={styles.statDivider} />
                  <div>
                    <div className={styles.statNum}>
                      <Counter to={4} />
                    </div>
                    <div className={styles.statLabel}>链上实战项目</div>
                  </div>
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

          {/* 跑马灯 */}
          <div id="stack" className={styles.marquee}>
            <div className={styles.marqueeTrack}>
              <MarqueeRow />
              <MarqueeRow hidden />
            </div>
          </div>
        </header>

        {/* ░░ ABOUT ░░ */}
        <section id="about" className={styles.about}>
          <div className={styles.kicker}>// 01 — ABOUT</div>
          <div className={styles.col2}>
            <div>
              <h2 className={styles.h2}>
                不止会写合约，
                <br />
                更想搞懂它为什么这样写。
              </h2>
              <p className={styles.aboutText}>
                我做智能合约开发，日常在 Foundry / Hardhat 里写测试、调 gas、读协议源码。比起调用 API，我更喜欢把
                Uniswap、AMM、Launchpad 这类系统从底层拆开，弄明白每一行的意图。
              </p>
              <p className={styles.aboutText} style={{marginTop: 16}}>
                这个站点是我的研究与构建日志——中英双语，边学边写，持续更新。
              </p>
            </div>
            <div className={styles.panel}>
              <div className={styles.panelLabel}>CURRENTLY</div>
              {[
                {
                  c: 'var(--accent)',
                  t: '精读 Uniswap V3 / V4 源码',
                  s: 'Tick、流动性管理、Hooks 机制系列',
                },
                {
                  c: 'var(--accent2)',
                  t: '构建 Memecoin Launchpad',
                  s: 'internal swap、BidWall、TreasuryManager',
                },
                {
                  c: 'var(--accent)',
                  t: 'LP 仓位数据 → 策略',
                  s: '链上数据抓取、分析与做市策略',
                },
              ].map((it, i) => (
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
              <div className={styles.kicker}>// 02 — SELECTED WORK</div>
              <h2 className={styles.h2}>项目与协议研究</h2>
            </div>
            <Link to="/docs/projects/LpManager/data-crawl" className={styles.workHeadLink}>
              查看全部文档 →
            </Link>
          </div>

          <div className={styles.workGrid}>
            <Link to="/docs/projects/LaunchV2/StartLunch" className={styles.workCard}>
              <div className={styles.workNum}>01</div>
              <div className={styles.workInner}>
                <div className={styles.tag}>PROJECT</div>
                <h3 className={styles.workTitle}>LaunchV2 · Memecoin Launchpad</h3>
                <p className={styles.workDesc}>
                  从 0 设计代币发射台：internal swap 内部做市、BidWall 买墙机制与国库授权流程。
                </p>
                <div className={styles.miniChips}>
                  {['Solidity', 'Uniswap V4 Hooks', 'Foundry'].map((t) => (
                    <span className={styles.miniChip} key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className={styles.workLink}>阅读分析 →</div>
              </div>
            </Link>

            <Link to="/docs/projects/LpManager/data-crawl" className={styles.workCard}>
              <div className={styles.workNum}>02</div>
              <div className={styles.workInner}>
                <div className={styles.tag}>PROJECT</div>
                <h3 className={styles.workTitle}>LpManager · 仓位策略引擎</h3>
                <p className={styles.workDesc}>
                  链上 LP 数据抓取 → 分析 → 策略闭环，把做市仓位的盈亏拆成可量化的指标。
                </p>
                <div className={styles.miniChips}>
                  {['TheGraph', 'Dune', 'Python'].map((t) => (
                    <span className={styles.miniChip} key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className={styles.workLink}>阅读分析 →</div>
              </div>
            </Link>

            <Link
              to="/docs/protocols/Uniswap/V2/overview"
              className={`${styles.workCard} ${styles.alt}`}>
              <div className={styles.workNum}>03</div>
              <div className={styles.workInner}>
                <div className={`${styles.tag} ${styles.tagAlt}`}>RESEARCH</div>
                <h3 className={styles.workTitle}>Uniswap V3 源码精读系列</h3>
                <p className={styles.workDesc}>
                  20+ 篇深入：Tick 系统、流动性管理、跨 tick swap、TWAP 预言机与 gas 优化。
                </p>
                <div className={styles.miniChips}>
                  {['Architecture', 'Math Model', 'Oracle'].map((t) => (
                    <span className={styles.miniChip} key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className={`${styles.workLink} ${styles.workLinkAlt}`}>阅读系列 →</div>
              </div>
            </Link>

            <Link
              to="/docs/projects/LaunchV2/StartLunch"
              className={`${styles.workCard} ${styles.alt}`}>
              <div className={styles.workNum}>04</div>
              <div className={styles.workInner}>
                <div className={`${styles.tag} ${styles.tagAlt}`}>RESEARCH</div>
                <h3 className={styles.workTitle}>Hooks & PositionManager 拆解</h3>
                <p className={styles.workDesc}>
                  Flaunch / beforeSwap / afterSwap 钩子分析，逐方法还原合约的授权与执行流。
                </p>
                <div className={styles.miniChips}>
                  {['Hooks', 'Solady', 'Permit2'].map((t) => (
                    <span className={styles.miniChip} key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className={`${styles.workLink} ${styles.workLinkAlt}`}>阅读分析 →</div>
              </div>
            </Link>
          </div>

          <div className={styles.notesStrip}>
            <Link to="/docs/notes/Solidity/Solidity语法重点" className={styles.noteCard}>
              <div className={styles.notePath}>notes/</div>
              <div className={styles.noteTitle}>Solidity 语法重点</div>
              <div className={styles.noteSub}>assembly · create2 · 数据位置 · NatSpec</div>
            </Link>
            <Link to="/docs/notes/foundry/updraft" className={styles.noteCard}>
              <div className={styles.notePath}>notes/</div>
              <div className={styles.noteTitle}>Foundry & Hardhat 测试</div>
              <div className={styles.noteSub}>cheatcodes · fuzzing · 最佳实践</div>
            </Link>
            <Link to="/docs/notes/Chainlink/Vrf" className={styles.noteCard}>
              <div className={styles.notePath}>notes/</div>
              <div className={styles.noteTitle}>Chainlink VRF / Datafeed</div>
              <div className={styles.noteSub}>随机数 · 喂价 · Automation</div>
            </Link>
          </div>
        </section>

        {/* ░░ CTA ░░ */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>
              一起在链上
              <span style={{color: 'var(--accent)'}}> 构建点什么。</span>
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
