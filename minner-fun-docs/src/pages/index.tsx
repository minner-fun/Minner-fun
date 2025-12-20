import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type Section = {
  label: string;
  icon: string;
  description: string;
  href: string;
  latestTitle: string;
  latestDate: string;
};

const sections: Section[] = [
  {
    label: 'Notes',
    icon: '📝',
    description: 'Foundry 与 Solidity 测试的实战笔记与速查。',
    href: '/docs/notes/foundry/intro',
    latestTitle: 'Foundry Cheatcodes',
    latestDate: '2025-01-10',
  },
  {
    label: 'Protocols',
    icon: '🔬',
    description: 'AMM 与 DeFi 协议的架构拆解与安全要点。',
    href: '/docs/protocols/uniswap-v2/overview',
    latestTitle: 'Uniswap V2 Overview',
    latestDate: '2024-12-18',
  },
  {
    label: 'Projects',
    icon: '🚀',
    description: '可复用的链上项目模板与测试工作流。',
    href: '/docs/projects/fuzzing-template',
    latestTitle: 'Fuzzing Template',
    latestDate: '2024-12-05',
  },
];

function CategoryCard(section: Section) {
  return (
    <Link className={styles.card} to={section.href}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{section.icon}</span>
        <Heading as="h3" className={styles.cardTitle}>
          {section.label}
        </Heading>
      </div>
      <p className={styles.cardDescription}>{section.description}</p>
      <div className={styles.cardMeta}>
        <span className={styles.cardMetaLabel}>Latest</span>
        <div className={styles.cardMetaTitle}>{section.latestTitle}</div>
        <div className={styles.cardMetaDate}>{section.latestDate}</div>
      </div>
    </Link>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>

        <div className={styles.githubLink}>
          <Link
            className="button button--secondary button--outline"
            href="https://github.com/minner-fun">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Smart Contract Notes · Protocol Research · Builder Log">
      <HomepageHeader />
      <main>
        <section className={styles.cardsSection}>
          <div className="container">
            <div className={styles.cardsHeader}>
              <Heading as="h2">Docs at a glance</Heading>
              <p className={styles.cardsSub}>
                重点内容与最近更新，一眼直达。
              </p>
            </div>
            <div className={styles.cardsGrid}>
              {sections.map((section) => (
                <CategoryCard key={section.label} {...section} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
