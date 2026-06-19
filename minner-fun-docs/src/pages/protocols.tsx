import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './directory.module.css';

/* ── 双语文案：按 currentLocale 选择 ── */
const CONTENT = {
  zh: {
    layoutTitle: '协议 / Protocols',
    layoutDesc: '把主流 DeFi 协议从合约层逐行拆开：架构、数学模型、安全机制与版本演进。',
    h1: '协议',
    h1en: '/ Protocols',
    intro: '不止读文档，更读源码。把主流 DeFi 协议从合约层逐行拆开：架构、数学模型、安全机制与版本演进。',
    starBadge: '★ 重点研究',
    featuredH2: 'Uniswap 全版本源码精读',
    featuredDesc: '从 V2 的恒定乘积，到 V3 的集中流动性与 Tick 系统，再到 V4 的 Hooks 架构——40+ 篇逐方法拆解。',
    v3SeriesTitle: 'V3 源码系列',
    ammTitle: 'AMM 做市机制通论',
    ammDesc: '恒定乘积 / 恒和 / 混合曲线的定价、滑点与无常损失对比。',
    flaunchTitle: 'Flaunch · Hooks 拆解',
    flaunchDesc: 'beforeSwap / afterSwap 钩子的授权与执行流逐方法分析。',
    versions: [
      {ver: 'V2', count: '8 篇', name: '恒定乘积 AMM', sub: 'x·y=k · 闪电兑换 · 预言机', to: '/docs/protocols/Uniswap/V2/overview'},
      {ver: 'V3', count: '24 篇', name: '集中流动性', sub: 'Tick · 资本效率 · TWAP', to: '/docs/protocols/Uniswap/V3/overview'},
      {ver: 'V4', count: '草案', name: 'Hooks 架构', sub: '单例 · Hooks · 闪电记账', to: '/docs/protocols/Uniswap/V4/Updraft', alt: true},
    ],
    v3series: [
      {num: '01', title: '架构深度剖析', desc: '核心合约分层、调用关系与设计取舍', to: '/docs/other/uniV3/ARCHITECTURE_DEEP_DIVE'},
      {num: '02', title: '数学模型与算法', desc: 'sqrtPriceX96、liquidity 与定点数运算', to: '/docs/other/uniV3/MATH_MODEL_AND_ALGORITHMS'},
      {num: '03', title: '价格与 Tick 系统', desc: 'tick spacing、跨 tick swap 的实现', to: '/docs/other/uniV3/PRICE_AND_TICK_SYSTEM'},
      {num: '04', title: '流动性管理', desc: 'position、mint/burn 与手续费累计', to: '/docs/other/uniV3/LIQUIDITY_MANAGEMENT'},
      {num: '05', title: 'Swap 机制深潜', desc: '单次 swap 的完整状态转移路径', to: '/docs/other/uniV3/SWAP_MECHANISM_DEEP_DIVE'},
      {num: '06', title: '安全机制 & Oracle', desc: '重入防护、TWAP 预言机与闪电贷', to: '/docs/other/uniV3/SECURITY_MECHANISMS', alt: true},
    ],
  },
  en: {
    layoutTitle: 'Protocols',
    layoutDesc: 'Tearing major DeFi protocols apart line by line at the contract level: architecture, math models, security mechanisms and version evolution.',
    h1: 'Protocols',
    h1en: '',
    intro: 'Not just reading the docs — reading the source. Tearing major DeFi protocols apart line by line at the contract level: architecture, math models, security mechanisms and version evolution.',
    starBadge: '★ Featured',
    featuredH2: 'Uniswap Full-Version Source Walkthrough',
    featuredDesc: 'From V2 constant-product, to V3 concentrated liquidity and the Tick system, to the V4 Hooks architecture — 40+ method-by-method breakdowns.',
    v3SeriesTitle: 'V3 Source Series',
    ammTitle: 'AMM Market-Making Primer',
    ammDesc: 'Comparing pricing, slippage and impermanent loss across constant-product / constant-sum / hybrid curves.',
    flaunchTitle: 'Flaunch · Hooks Breakdown',
    flaunchDesc: 'A method-by-method analysis of the authorization and execution flow of the beforeSwap / afterSwap hooks.',
    versions: [
      {ver: 'V2', count: '8 docs', name: 'Constant-Product AMM', sub: 'x·y=k · flash swaps · oracle', to: '/docs/protocols/Uniswap/V2/overview'},
      {ver: 'V3', count: '24 docs', name: 'Concentrated Liquidity', sub: 'Tick · capital efficiency · TWAP', to: '/docs/protocols/Uniswap/V3/overview'},
      {ver: 'V4', count: 'Draft', name: 'Hooks Architecture', sub: 'singleton · Hooks · flash accounting', to: '/docs/protocols/Uniswap/V4/Updraft', alt: true},
    ],
    v3series: [
      {num: '01', title: 'Architecture Deep Dive', desc: 'Core contract layering, call relationships and design trade-offs', to: '/docs/other/uniV3/ARCHITECTURE_DEEP_DIVE'},
      {num: '02', title: 'Math Models & Algorithms', desc: 'sqrtPriceX96, liquidity and fixed-point arithmetic', to: '/docs/other/uniV3/MATH_MODEL_AND_ALGORITHMS'},
      {num: '03', title: 'Price & Tick System', desc: 'tick spacing and the cross-tick swap implementation', to: '/docs/other/uniV3/PRICE_AND_TICK_SYSTEM'},
      {num: '04', title: 'Liquidity Management', desc: 'positions, mint/burn and fee accrual', to: '/docs/other/uniV3/LIQUIDITY_MANAGEMENT'},
      {num: '05', title: 'Swap Mechanism Deep Dive', desc: 'The full state-transition path of a single swap', to: '/docs/other/uniV3/SWAP_MECHANISM_DEEP_DIVE'},
      {num: '06', title: 'Security & Oracle', desc: 'Reentrancy protection, the TWAP oracle and flash loans', to: '/docs/other/uniV3/SECURITY_MECHANISMS', alt: true},
    ],
  },
} as const;

type Locale = keyof typeof CONTENT;

export default function Protocols(): ReactNode {
  const {i18n} = useDocusaurusContext();
  const t = CONTENT[(i18n.currentLocale as Locale)] ?? CONTENT.zh;

  return (
    <Layout title={t.layoutTitle} description={t.layoutDesc}>
      <main className={styles.page}>
        <div className={styles.wrap}>
          <div className={styles.crumb}>
            <Link to="/">~</Link>
            <span className={styles.crumbSlash}>/</span>
            <span className={styles.crumbCur}>protocols</span>
          </div>

          <h1 className={styles.h1} style={{marginTop: 16}}>
            {t.h1} {t.h1en && <span className={styles.en}>{t.h1en}</span>}
          </h1>
          <p className={styles.intro}>{t.intro}</p>

          {/* Featured: Uniswap */}
          <div className={styles.featured}>
            <div className={styles.watermark}>Uni</div>
            <div className={styles.featuredInner}>
              <div className={styles.starBadge}>{t.starBadge}</div>
              <h2 className={styles.featuredH2}>{t.featuredH2}</h2>
              <p className={styles.featuredDesc}>{t.featuredDesc}</p>
              <div className={styles.verGrid}>
                {t.versions.map((v) => (
                  <Link
                    to={v.to}
                    key={v.ver}
                    className={`${styles.verCard} ${v.alt ? styles.alt : ''}`}>
                    <div className={styles.verTop}>
                      <span className={`${styles.ver} ${v.alt ? styles.verAlt : ''}`}>{v.ver}</span>
                      <span className={styles.verCount}>{v.count}</span>
                    </div>
                    <div className={styles.verName}>{v.name}</div>
                    <div className={styles.verSub}>{v.sub}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* V3 series */}
          <h2 className={styles.sectionTitle}>
            <span className={styles.slashes}>//</span>{t.v3SeriesTitle}
          </h2>
          <div className={styles.col3} style={{marginTop: 22}}>
            {t.v3series.map((s) => (
              <Link
                to={s.to}
                key={s.num}
                className={`${styles.numCard} ${s.alt ? styles.alt : ''}`}>
                <div className={`${styles.num} ${s.alt ? styles.numAlt : ''}`}>{s.num}</div>
                <h3 className={styles.numTitle}>{s.title}</h3>
                <p className={styles.numDesc}>{s.desc}</p>
              </Link>
            ))}
          </div>

          {/* AMM / Flaunch */}
          <div className={styles.col2} style={{marginTop: 16}}>
            <Link to="/docs/notes/Solidity/金库合约与AMM" className={styles.wideCard}>
              <div className={styles.widePath}>amm/</div>
              <h3 className={styles.numTitle}>{t.ammTitle}</h3>
              <p className={styles.numDesc}>{t.ammDesc}</p>
            </Link>
            <Link to="/docs/other/Flaunch-Contract-Analysis" className={`${styles.wideCard} ${styles.alt}`}>
              <div className={`${styles.widePath} ${styles.widePathAlt}`}>research/</div>
              <h3 className={styles.numTitle}>{t.flaunchTitle}</h3>
              <p className={styles.numDesc}>{t.flaunchDesc}</p>
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
