'use client';

import { useState } from 'react';
import styles from './accordion.module.scss';

export default function Accordion({
  title,
  enableBorderBottom,
  children,
}: {
  title: string;
  enableBorderBottom?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${styles.accordion} ${enableBorderBottom ? styles.enableBorderBottom : ''}`}>
      <div className={styles.accordionItem}>
        <button onClick={() => setExpanded(!expanded)} className={styles.header}>
          {title}
        </button>
        {expanded && <div className={styles.content}>{children}</div>}
      </div>
    </div>
  );
}
