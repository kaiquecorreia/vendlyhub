'use client';

import Link from 'next/link';
import styles from './not-found.module.scss';
import Logo from './components/Logo/Logo';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>
        <h1 className={styles.title}>404 - Página não encontrada</h1>
        <p className={styles.description}>
          Desculpe, a página que você está procurando não existe.
        </p>
        <Link href="/" className={styles.button}>
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
