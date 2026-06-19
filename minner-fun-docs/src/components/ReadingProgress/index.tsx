import {useEffect, useState, type ReactNode} from 'react';
import styles from './styles.module.css';

/** 文档页顶部阅读进度条：随滚动从 0→100% 填充，霓虹渐变 + 发光。 */
export default function ReadingProgress(): ReactNode {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setPct(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return <div className={styles.bar} style={{width: `${pct}%`}} aria-hidden="true" />;
}
