'use client';

import Logo from '../components/Logo/Logo';
import Link from 'next/link';
import styles from '../login/styles.module.scss';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from './schema';
import { authService } from '../services/authService';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    try {
      await toast.promise(authService.resetPassword(token, data.password), {
        loading: 'Salvando...',
        success: 'Senha alterada! Redirecionando para o login...',
        error: (err: unknown) => {
          if (err instanceof AxiosError) {
            const m = err.response?.data?.message;
            if (m) return Array.isArray(m) ? m.join(', ') : String(m);
          }
          return 'Não foi possível redefinir a senha.';
        },
      });
      router.push('/login');
    } catch {
      /* toast.promise já exibe o erro */
    }
  };

  if (!token) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <div className={styles.logoContainer}>
            <Logo />
          </div>
          <div className={styles.error}>
            Link inválido ou incompleto. Solicite uma nova redefinição de senha.
          </div>
          <p className={styles.signupText}>
            <Link href="/esqueci-senha">Esqueci minha senha</Link>
            {' · '}
            <Link href="/login">Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>

        <h1
          style={{
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '1.25rem',
            color: 'var(--text-color)',
            fontWeight: 600,
          }}
        >
          Nova senha
        </h1>

        <p
          style={{
            textAlign: 'center',
            marginBottom: '1.25rem',
            color: 'var(--text-color)',
            fontSize: '0.95rem',
          }}
        >
          Escolha uma nova senha para sua conta.
        </p>

        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Nova senha</label>
            <input
              type="password"
              id="password"
              placeholder="Mínimo 8 caracteres"
              className={errors.password ? styles.inputError : ''}
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.errorMessage}>{errors.password.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar nova senha</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Repita a senha"
              className={errors.confirmPassword ? styles.inputError : ''}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span className={styles.errorMessage}>{errors.confirmPassword.message}</span>
            )}
          </div>

          <button type="submit" className={styles.loginButton}>
            Salvar nova senha
          </button>
        </form>

        <p className={styles.signupText}>
          <Link href="/login">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <div className={styles.logoContainer}>
              <Logo />
            </div>
            <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>Carregando...</p>
          </div>
        </div>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
