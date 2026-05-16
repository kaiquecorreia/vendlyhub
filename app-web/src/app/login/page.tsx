'use client';

import Logo from '../components/Logo/Logo';
import Link from 'next/link';
import styles from './styles.module.scss';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from './schema';
import { AxiosError } from 'axios';
import { feedback } from '@/app/services/feedback';

const INVALID_LOGIN_MESSAGE = 'Falha ao fazer login. Verifique suas credenciais.';

function LoginContent() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = '';
      switch (errorParam) {
        case 'auth_failed':
          errorMessage = 'Falha na autenticação com Google. Tente novamente.';
          break;
        case 'callback_failed':
          errorMessage = 'Erro no processo de autenticação. Tente novamente.';
          break;
        case 'missing_tokens':
          errorMessage = 'Dados de autenticação incompletos. Tente novamente.';
          break;
        default:
          errorMessage = 'Erro desconhecido durante a autenticação.';
      }
      setError(errorMessage);
      feedback.error(errorMessage);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');

    try {
      await feedback.promise(login(data.identifier, data.password), {
        loading: 'Entrando...',
        success: 'Login realizado com sucesso!',
        error: INVALID_LOGIN_MESSAGE,
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMessage = err.response?.data?.message || INVALID_LOGIN_MESSAGE;
        setError(errorMessage);
      } else {
        setError(INVALID_LOGIN_MESSAGE);
      }
      console.log('[LOGIN PAGE] error: ', err);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>

        {/* <button className={styles.googleButton} onClick={handleGoogleLogin}>
          <FcGoogle size={24} />
          <span>Acessar conta com o Google</span>
        </button>

        <div className={styles.divider}>
          <span>ou</span>
        </div> */}

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">WhatsApp ou e-mail</label>
            <input
              type="text"
              id="identifier"
              placeholder="Digite seu WhatsApp ou e-mail"
              className={errors.identifier ? styles.inputError : ''}
              {...register('identifier')}
            />
            {errors.identifier && (
              <span className={styles.errorMessage}>{errors.identifier.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="Digite sua senha"
              className={errors.password ? styles.inputError : ''}
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.errorMessage}>{errors.password.message}</span>
            )}
          </div>

          <Link href="/esqueci-senha" className={styles.forgotPassword}>
            Esqueci minha senha
          </Link>

          <button type="submit" className={styles.loginButton}>
            Entrar
          </button>
        </form>

        <p className={styles.signupText}>
          Não tem uma conta?
          <Link href="/fast-onboarding"> Crie sua conta grátis</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <div className={styles.logoContainer}>
              <Logo />
            </div>
            <p>Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
