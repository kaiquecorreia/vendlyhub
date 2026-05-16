'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { AUTH_INVALID_SESSION_EVENT, clearAuthSessionStorage } from '../services/authSession';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  whatsapp?: string;
  minimalProfileCompleted?: boolean;
}

const normalizeProfileToUser = (profile: {
  userId: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  whatsapp?: string;
  minimalProfileCompleted?: boolean;
}): User => ({
  id: profile.userId,
  name: profile.name ?? '',
  email: profile.email,
  avatar: profile.avatar ?? null,
  whatsapp: profile.whatsapp,
  minimalProfileCompleted: profile.minimalProfileCompleted,
});

interface RegisterData {
  userName: string;
  establishmentName: string;
  documentType: 'cpf' | 'cnpj';
  document: string;
  establishmentTypes: string[];
  email: string;
  phone_number: string;
  mobile_number: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  password: string;
  logo?: File | null;
}

interface RegisterOptions {
  redirectToHome?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  register: (data: RegisterData, options?: RegisterOptions) => Promise<void>;
  registerMinimal: (data: {
    establishmentName: string;
    whatsapp: string;
    password: string;
    logo?: File | null;
    pixCopyPaste?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const storeAuthData = useCallback((accessToken: string, refreshToken: string, user: User) => {
    console.log('Storing auth data:', accessToken, refreshToken, user);
    // Store in localStorage for client-side access
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Set cookie for server-side (middleware) access
    document.cookie = `auth-token=${accessToken}; path=/`;

    setUser(user);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          const response = await authService.refreshToken(refreshToken);
          localStorage.setItem('accessToken', response.access_token);

          const profile = await profileService.getProfile(response.access_token);
          const normalizedUser = normalizeProfileToUser(profile);
          storeAuthData(response.access_token, refreshToken, normalizedUser);
        } catch (error) {
          console.error('Token refresh failed:', error);
          clearAuthSessionStorage();
          setUser(null);
        }
      } else {
        clearAuthSessionStorage();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthSessionStorage();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [storeAuthData]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleInvalidSession = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener(AUTH_INVALID_SESSION_EVENT, handleInvalidSession as EventListener);
    return () => {
      window.removeEventListener(AUTH_INVALID_SESSION_EVENT, handleInvalidSession as EventListener);
    };
  }, []);

  const completeAuthWithProfile = async (accessToken: string, refreshToken: string) => {
    try {
      const profile = await profileService.getProfile(accessToken);
      const normalizedUser = normalizeProfileToUser(profile);
      storeAuthData(accessToken, refreshToken, normalizedUser);
    } catch (err) {
      console.error('Failed to load profile after auth:', err);
      throw new Error('Não foi possível carregar os dados do usuário. Tente novamente.');
    }
  };

  const refreshUser = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) return null;
    const profile = await profileService.getProfile();
    const normalizedUser = normalizeProfileToUser(profile);
    storeAuthData(accessToken, refreshToken, normalizedUser);
    return normalizedUser;
  };

  const register = async (data: RegisterData, options?: RegisterOptions) => {
    try {
      const tokens = await authService.register(data);
      await completeAuthWithProfile(tokens.access_token, tokens.refresh_token);

      if (options?.redirectToHome ?? true) {
        // Successful registration, redirect to home
        console.log('Registration successful, redirecting to home');
        router.push('/');
      }
    } catch (error: unknown) {
      // Check for specific HTTP status codes
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          if (status === 400) {
            console.error('Registration failed: Invalid data');
            throw new Error('Dados de cadastro inválidos. Verifique suas informações.');
          } else if (status === 409) {
            console.error('Registration failed: Email already registered');
            throw new Error('Este email já está cadastrado. Por favor, use outro email.');
          } else {
            console.error(`Registration failed with status ${status}:`, error.response.data);
            throw new Error('Cadastro falhou. Por favor, tente novamente.');
          }
        } else {
          console.error('Registration failed: Network issue or server not responding');
          throw new Error('Erro de rede. Por favor, verifique sua conexão e tente novamente.');
        }
      }
      if (error instanceof Error) {
        throw error;
      }
      console.error('Registration failed:', error);
      throw new Error('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }
  };

  const registerMinimal = async (data: {
    establishmentName: string;
    whatsapp: string;
    password: string;
    logo?: File | null;
    pixCopyPaste?: string;
  }) => {
    const tokens = await authService.registerMinimal(data);
    await completeAuthWithProfile(tokens.access_token, tokens.refresh_token);
  };

  const login = async (identifier: string, password: string) => {
    try {
      const tokens = await authService.login(identifier, password);
      await completeAuthWithProfile(tokens.access_token, tokens.refresh_token);

      console.log('Login successful, redirecting to catalog preview');
      router.push('/catalog/preview');
    } catch (error: unknown) {
      // Check for specific HTTP status codes
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          if (status === 401 || status === 403) {
            console.error('Login failed: Invalid credentials');
            throw new Error('WhatsApp/e-mail ou senha inválidos');
          } else if (status === 429) {
            console.error('Login failed: Too many attempts');
            throw new Error('Muitas tentativas de login. Por favor, tente novamente mais tarde.');
          } else {
            console.error(`Login failed with status ${status}:`, error.response.data);
            throw new Error('Login falhou. Por favor, tente novamente.');
          }
        } else {
          console.error('Login failed: Network issue or server not responding');
          throw new Error('Erro de rede. Por favor, verifique sua conexão e tente novamente.');
        }
      }
      if (error instanceof Error) {
        throw error;
      }
      console.error('Login failed:', error);
      throw new Error('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');

      if (refreshToken && accessToken) {
        await authService.logout(refreshToken, accessToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuthSessionStorage();
      setUser(null);
      router.push('/login');
    }
  };

  const googleLogin = async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const handleOAuthCallback = async (accessToken: string, refreshToken: string) => {
    try {
      console.log('Frontend OAuth Callback - Loading profile');
      await completeAuthWithProfile(accessToken, refreshToken);

      console.log('OAuth callback successful, user authenticated');
    } catch (error: unknown) {
      console.error('Frontend OAuth Callback - Error details:', error);
      const axiosError = error as { response?: { data?: unknown; status?: number } };
      console.error('Frontend OAuth Callback - Error response:', axiosError.response?.data);
      console.error('Frontend OAuth Callback - Error status:', axiosError.response?.status);
      clearAuthSessionStorage();
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        googleLogin,
        handleOAuthCallback,
        register,
        registerMinimal,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
