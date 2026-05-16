'use client';

import styles from './styles.module.scss';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userProfileSchema, type UserProfileFormData } from './schema';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { profileService } from '../services/profileService';
import { normalizeApiError } from '../services/apiClient';
import { resolveMediaUrl } from '../services/mediaUrl';

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: '',
      email: '',
      avatar: null,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const loadUserData = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      try {
        const profile = await profileService.getProfile(accessToken);
        setValue('name', profile.name ?? '');
        setValue('email', profile.email ?? '');
        setValue('avatar', null);
        setAvatarPreview(resolveMediaUrl(profile.avatar ?? null) ?? null);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Erro ao carregar perfil');
      }
    };
    loadUserData();
  }, [setValue]);

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      await profileService.updateProfile(
        {
          name: data.name?.trim() ?? '',
          email: data.email.trim(),
          avatar: data.avatar || null,
          ...(data.newPassword
            ? {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
              }
            : {}),
        },
        accessToken,
      );

      await refreshUser();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: unknown) {
      toast.error(normalizeApiError(error, 'Falha ao atualizar perfil.'));
    }
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <button type="button" onClick={() => router.back()} className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1>Editar Perfil</h1>
      </div>

      <form className={styles.profileForm} onSubmit={handleSubmit(onSubmit)}>
        <h3 className={styles.sectionTitle}>Foto do usuário</h3>
        <p className={styles.avatarHint}>Resolução recomendada: 200x200px (máx. 2MB)</p>

        <div className={styles.avatarUploadContainer}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Foto do usuário" className={styles.avatarPreview} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <span>Clique para adicionar</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                toast.error('A imagem deve ter no máximo 2MB');
                return;
              }
              setValue('avatar', file);
              const reader = new FileReader();
              reader.onloadend = () => setAvatarPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
            className={styles.avatarInput}
          />
        </div>

        <h3 className={styles.sectionTitle}>Dados da conta</h3>

        <div className={styles.inputGroup}>
          <label htmlFor="name">Nome</label>
          <input
            type="text"
            id="name"
            placeholder="Seu nome"
            className={errors.name ? styles.inputError : ''}
            {...register('name')}
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name.message}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            placeholder="Digite seu e-mail"
            className={errors.email ? styles.inputError : ''}
            {...register('email')}
          />
          {errors.email && <span className={styles.errorMessage}>{errors.email.message}</span>}
        </div>

        <h3 className={styles.sectionTitle}>Alterar Senha</h3>
        <p className={styles.passwordHint}>Deixe em branco para manter a senha atual</p>

        <div className={styles.inputGroup}>
          <label htmlFor="currentPassword">Senha atual</label>
          <input
            type="password"
            id="currentPassword"
            placeholder="Digite sua senha atual"
            className={errors.currentPassword ? styles.inputError : ''}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <span className={styles.errorMessage}>{errors.currentPassword.message}</span>
          )}
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">Nova senha</label>
            <input
              type="password"
              id="newPassword"
              placeholder="Mínimo 8 caracteres"
              className={errors.newPassword ? styles.inputError : ''}
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <span className={styles.errorMessage}>{errors.newPassword.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar nova senha</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirme a nova senha"
              className={errors.confirmPassword ? styles.inputError : ''}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span className={styles.errorMessage}>{errors.confirmPassword.message}</span>
            )}
          </div>
        </div>

        <button type="submit" className={styles.saveButton}>
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}
