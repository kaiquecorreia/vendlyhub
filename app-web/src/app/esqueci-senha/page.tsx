'use client';

import Logo from '../components/Logo/Logo';
import Link from 'next/link';
import styles from '../login/styles.module.scss';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from './schema';
import { authService } from '../services/authService';
import { toast } from 'sonner';

const GENERIC_SUCCESS =
  'Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.';

export default function EsqueciSenhaPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await toast.promise(authService.requestPasswordReset(data.email), {
        loading: 'Enviando...',
        success: GENERIC_SUCCESS,
        error: 'Não foi possível enviar o pedido. Tente novamente.',
      });
      setSubmitted(true);
    } catch {
      /* toast.promise já exibe o erro */
    }
  };

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
          Esqueci minha senha
        </h1>

        <p
          style={{
            textAlign: 'center',
            marginBottom: '1.25rem',
            color: 'var(--text-color)',
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}
        >
          Informe seu e-mail. Se houver uma conta cadastrada, você receberá um link para criar uma
          nova senha.
        </p>

        {submitted ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: 8,
              marginBottom: '1rem',
              textAlign: 'center',
              backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, transparent)',
              border: '1px solid var(--accent-color)',
              color: 'var(--text-color)',
              fontSize: '0.95rem',
              lineHeight: 1.5,
            }}
          >
            {GENERIC_SUCCESS}
          </div>
        ) : (
          <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                placeholder="Digite seu e-mail"
                className={errors.email ? styles.inputError : ''}
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <span className={styles.errorMessage}>{errors.email.message}</span>}
            </div>

            <button type="submit" className={styles.loginButton}>
              Enviar instruções
            </button>
          </form>
        )}

        <p className={styles.signupText}>
          <Link href="/login">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
