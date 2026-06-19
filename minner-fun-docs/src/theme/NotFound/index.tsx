import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import ParticleField from '@site/src/components/ParticleField';

import styles from './styles.module.css';

/** 自定义 404 —— 链上赛博风：粒子背景 + glitch 大字 + 模拟 console。 */
export default function NotFound(): ReactNode {
  return (
    <Layout title="404 · Block Not Found">
      <main className={styles.wrap}>
        <ParticleField density={50} />
        <div className={styles.glow} />
        <div className={styles.center}>
          <div className={styles.badge}>
            <span className={styles.errDot} />
            ERROR · TRANSACTION REVERTED
          </div>
          <div className={styles.big}>404</div>
          <h1 className={styles.title}>区块未找到 · Block Not Found</h1>
          <p className={styles.desc}>
            你访问的页面可能已被回滚，或从未上链。检查链接，或返回首页重新出发。
          </p>

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
              <div className={styles.muted}>  reason: "the resource does not exist"</div>
              <div className={styles.redirect}>
                <span className={styles.prompt}>$</span> redirect --to /{' '}
                <span className={styles.caret}>&nbsp;</span>
              </div>
            </div>
          </div>

          <div className={styles.btns}>
            <Link to="/" className={styles.btnPrimary}>
              ← 返回首页
            </Link>
            <Link to="/docs/notes/foundry/updraft" className={styles.btnGhost}>
              浏览笔记
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
