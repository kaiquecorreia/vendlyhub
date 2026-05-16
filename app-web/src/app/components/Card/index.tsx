import styles from './card.module.scss';

export default function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      {title ? (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      ) : null}

      {children}
    </div>
  );
}
