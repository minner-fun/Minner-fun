import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import styles from './directory.module.css';

type Project = {
  path: string;
  status: '进行中' | '已完成' | '模板';
  title: string;
  desc: string;
  chips: string[];
  foot: string;
  meta: string;
  to: string;
  external?: boolean;
  alt?: boolean;
  glow?: boolean;
};

const PROJECTS: Project[] = [
  {
    path: 'launchpad/v2',
    status: '进行中',
    title: 'LaunchV2 · Memecoin Launchpad',
    desc: '完整代币发射台：internal swap 内部做市、BidWall 买墙护盘、TreasuryActionManager 国库授权流。深入 Uniswap V4 Hooks 实践。',
    chips: ['Solidity', 'V4 Hooks', 'Foundry', 'Solady'],
    foot: '阅读文档 →',
    meta: '4 篇',
    to: '/docs/projects/LaunchV2/StartLunch',
    glow: true,
  },
  {
    path: 'lp-manager/',
    status: '进行中',
    title: 'LpManager · 仓位策略引擎',
    desc: '链上 LP 数据抓取 → 分析 → 策略闭环。用 TheGraph + Dune 把做市仓位盈亏拆成可量化指标，驱动再平衡决策。',
    chips: ['TheGraph', 'Dune', 'Python'],
    foot: '阅读文档 →',
    meta: '3 篇',
    to: '/docs/projects/LpManager/data-crawl',
    glow: true,
  },
  {
    path: 'launchpad/v1',
    status: '已完成',
    title: 'LaunchV1 · 发射台原型',
    desc: '第一版 launchpad 的设计与实现，验证核心代币曲线与流动性引导机制。',
    chips: ['Solidity', 'Hardhat'],
    foot: '阅读文档 →',
    meta: '1 篇',
    to: '/docs/projects/LaunchV1/launchpad',
    alt: true,
  },
  {
    path: 'template/',
    status: '模板',
    title: 'Fuzzing Template · 模糊测试脚手架',
    desc: '开箱即用的合约模糊测试模板，内置不变量测试与典型攻击面用例。',
    chips: ['Foundry', 'Invariant'],
    foot: '查看模板 →',
    meta: 'GitHub',
    to: 'https://github.com/minner-fun',
    external: true,
    alt: true,
  },
];

export default function Projects(): ReactNode {
  return (
    <Layout title="项目 / Projects" description="从研究到落地的构建日志。每个项目都附带设计思路、合约结构与踩坑记录。">
      <main className={styles.page}>
        <div className={styles.wrap}>
          <div className={styles.crumb}>
            <Link to="/">~</Link>
            <span className={styles.crumbSlash}>/</span>
            <span className={styles.crumbCur}>projects</span>
          </div>

          <h1 className={styles.h1} style={{marginTop: 16}}>
            项目 <span className={styles.en}>/ Projects</span>
          </h1>
          <p className={styles.intro}>
            从研究到落地的构建日志。每个项目都附带设计思路、合约结构与踩坑记录——可读、可复用。
          </p>

          <div className={styles.col2}>
            {PROJECTS.map((p) => {
              const inner = (
                <>
                  {p.glow && <div className={styles.projGlow} />}
                  <div className={styles.projHead}>
                    <div className={`${styles.projPath} ${p.alt ? styles.projPathAlt : ''}`}>
                      {p.path}
                    </div>
                    {p.status === '进行中' ? (
                      <span className={styles.statusActive}>
                        <span className={styles.sdot} style={{background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)'}} />
                        进行中
                      </span>
                    ) : (
                      <span className={styles.statusDone}>
                        <span className={styles.sdot} style={{background: 'var(--muted)'}} />
                        {p.status}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.projTitle}>{p.title}</h3>
                  <p className={styles.projDesc}>{p.desc}</p>
                  <div className={styles.chips}>
                    {p.chips.map((c) => (
                      <span className={styles.chip} key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className={`${styles.projFoot} ${p.alt ? styles.projFootAlt : ''}`}>
                    {p.foot}
                    <span className={styles.projFootMeta}>{p.meta}</span>
                  </div>
                </>
              );
              const cls = `${styles.projCard} ${p.alt ? styles.alt : ''}`;
              return p.external ? (
                <a href={p.to} key={p.title} className={cls}>
                  {inner}
                </a>
              ) : (
                <Link to={p.to} key={p.title} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </Layout>
  );
}
