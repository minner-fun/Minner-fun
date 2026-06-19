import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import ParticleField from '@site/src/components/ParticleField';

import styles from './styles.module.css';

/* ── 双语文案：按 currentLocale 选择 ── */
const CONTENT = {
  zh: {
    layoutTitle: '404 · Block Not Found',
    title: '区块未找到 · Block Not Found',
    desc: '你访问的页面可能已被回滚，或从未上链。检查链接，或返回首页重新出发。',
    reason: '  reason: "the resource does not exist"',
    home: '← 返回首页',
    notes: '浏览笔记',
  },
  en: {
    layoutTitle: '404 · Block Not Found',
    title: 'Block Not Found',
    desc: 'The page you requested may have been rolled back, or never made it on-chain. Check the link, or head back home to start over.',
    reason: '  reason: "the resource does not exist"',
    home: '← Back home',
    notes: 'Browse notes',
  },
} as const;

type Locale = keyof typeof CONTENT;

/** 自定义 404 —— 链上赛博风：粒子背景 + glitch 大字 + 模拟 console。 */
export default function NotFound(): ReactNode {
  const {i18n} = useDocusaurusContext();
  const t = CONTENT[(i18n.currentLocale as Locale)] ?? CONTENT.zh;

  return (
    <Layout title={t.layoutTitle}>
      <main className={styles.wrap}>
        <ParticleField density={50} />
        <div className={styles.glow} />
        <div className={styles.center}>
          <div className={styles.badge}>
            <span className={styles.errDot} />
            ERROR · TRANSACTION REVERTED
          </div>
          <div className={styles.big}>404</div>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.desc}>{t.desc}</p>

          <div className={styles.terminal}>
            <div className={styles.termBar}>
              <span className={styles.tdot} style={{background: '#ff5f57'}} />
              <span className={styles.tdot} style={{background: '#febc2e'}} />
              <span className={styles.tdot} style={{background: '#28c840'}} />
              <span className={styles.termTitle}>console</span>
            </div>
            <div className={styles.termBody}>
              <div>
                <span className={styles.prompt}>$</span> cast call minner.fun --path
              </div>
              <div className={styles.err}>✗ revert: PageNotFound(0x194)</div>
              <div className={styles.muted}>{t.reason}</div>
              <div className={styles.redirect}>
                <span className={styles.prompt}>$</span> redirect --to /{' '}
                <span className={styles.caret}>&nbsp;</span>
              </div>
            </div>
          </div>

          <div className={styles.btns}>
            <Link to="/" className={styles.btnPrimary}>
              {t.home}
            </Link>
            <Link to="/docs/notes/foundry/updraft" className={styles.btnGhost}>
              {t.notes}
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
