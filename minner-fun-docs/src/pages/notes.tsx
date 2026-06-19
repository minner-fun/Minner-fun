import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import styles from './directory.module.css';

const CATEGORIES = [
  {
    abbr: 'Sol',
    title: 'Solidity',
    desc: '基本语法 · assembly · create2 · 数据位置 · 金库与 AMM',
    count: '8 篇',
    to: '/docs/notes/Solidity/基本语法',
  },
  {
    abbr: 'Fdy',
    title: 'Foundry',
    desc: 'cheatcodes · fuzzing · 质押收益 · 测试模式',
    count: '2 篇',
    to: '/docs/notes/foundry/updraft',
  },
  {
    abbr: 'Hh',
    title: 'Hardhat',
    desc: '环境搭建 · 测试语法 · 高级技巧 · 最佳实践',
    count: '9 篇',
    to: '/docs/notes/Hardhat/基础概念和原则',
  },
  {
    abbr: 'Lnk',
    title: 'Chainlink',
    desc: 'VRF 随机数 · Datafeed 喂价 · Automation',
    count: '3 篇',
    to: '/docs/notes/Chainlink/Vrf',
    alt: true,
  },
  {
    abbr: 'OZ',
    title: 'OpenZeppelin',
    desc: 'ERC20 · AccessControl · 常用库 · utils',
    count: '5 篇',
    to: '/docs/notes/OpenZeeplin/安装与基础',
  },
  {
    abbr: 'Rs',
    title: 'Rust',
    desc: '所有权 · 泛型 · 异步并发 · 模块系统',
    count: '8 篇',
    to: '/docs/notes/Rust/所有权',
    alt: true,
  },
];

const RECENT = [
  {date: '06-12', title: '金库合约与 CPAMM 恒定乘积做市商', tag: 'Solidity', to: '/docs/notes/Solidity/金库合约与AMM'},
  {date: '06-08', title: 'Chainlink VRF 可验证随机数集成', tag: 'Chainlink', to: '/docs/notes/Chainlink/Vrf', alt: true},
  {date: '06-03', title: 'create2 与确定性地址部署', tag: 'Solidity', to: '/docs/notes/Solidity/create2'},
  {date: '05-28', title: 'Rust 异步并发与所有权模型', tag: 'Rust', to: '/docs/notes/Rust/异步并发', alt: true},
];

export default function Notes(): ReactNode {
  return (
    <Layout title="笔记 / Notes" description="智能合约开发的系统化笔记——语言、工具链、协议与安全。">
      <main className={styles.page}>
        <div className={styles.wrap}>
          <div className={styles.crumb}>
            <Link to="/">~</Link>
            <span className={styles.crumbSlash}>/</span>
            <span className={styles.crumbCur}>notes</span>
          </div>

          <div className={styles.head}>
            <div>
              <h1 className={styles.h1}>
                笔记 <span className={styles.en}>/ Notes</span>
              </h1>
              <p className={styles.intro}>
                智能合约开发的系统化笔记——语言、工具链、协议与安全。边学边写，中英双语，持续更新。
              </p>
            </div>
            <div className={styles.search}>
              <span>⌕</span>
              <span>搜索 80+ 篇笔记</span>
              <span className={styles.kbd}>⌘K</span>
            </div>
          </div>

          <div className={styles.filters}>
            <span className={styles.pillActive}>全部</span>
            {['语言', '工具链', '协议', '安全'].map((f) => (
              <span className={styles.pill} key={f}>
                {f}
              </span>
            ))}
          </div>

          <div className={styles.col3}>
            {CATEGORIES.map((c) => (
              <Link
                to={c.to}
                key={c.title}
                className={`${styles.cat} ${c.alt ? styles.alt : ''}`}>
                <div className={styles.catTop}>
                  <span className={`${styles.abbr} ${c.alt ? styles.abbrAlt : ''}`}>{c.abbr}</span>
                  <span className={styles.count}>{c.count}</span>
                </div>
                <h3 className={styles.catTitle}>{c.title}</h3>
                <p className={styles.catDesc}>{c.desc}</p>
                <div className={`${styles.enter} ${c.alt ? styles.enterAlt : ''}`}>进入 →</div>
              </Link>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>
            <span className={styles.slashes}>//</span>最近更新
          </h2>
          <div className={styles.recent}>
            {RECENT.map((r) => (
              <Link to={r.to} key={r.title} className={styles.recentRow}>
                <span className={styles.recentDate}>{r.date}</span>
                <span className={styles.recentTitle}>{r.title}</span>
                <span className={`${styles.recentTag} ${r.alt ? styles.recentTagAlt : ''}`}>
                  {r.tag}
                </span>
                <span className={styles.arrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
