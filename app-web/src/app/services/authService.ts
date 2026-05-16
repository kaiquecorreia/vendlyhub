import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface RegisterData {
  /** Full name of the person creating the account (maps to User.name). */
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

interface RegisterMinimalData {
  establishmentName: string;
  whatsapp: string;
  password: string;
  logo?: File | null;
  pixCopyPaste?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

function assertTokenResponse(data: unknown): asserts data is TokenResponse {
  const d = data as TokenResponse;
  if (!d?.access_token || !d?.refresh_token) {
    console.error('Auth failed: Incomplete token response', data);
    throw new Error('Resposta de autenticação está faltando tokens obrigatórios');
  }
}

export const authService = {
  register: async (data: RegisterData): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append('name', data.userName);
    formData.append('establishmentName', data.establishmentName);
    formData.append('documentType', data.documentType);
    formData.append('document', data.document);
    for (const t of data.establishmentTypes) {
      formData.append('establishmentTypes', t);
    }
    formData.append('email', data.email);
    formData.append('phone_number', data.phone_number);
    formData.append('mobile_number', data.mobile_number);
    formData.append('cep', data.cep);
    formData.append('street', data.street);
    formData.append('number', data.number);
    if (data.complement) formData.append('complement', data.complement);
    formData.append('neighborhood', data.neighborhood);
    formData.append('city', data.city);
    formData.append('state', data.state);
    formData.append('password', data.password);
    if (data.logo) formData.append('logo', data.logo);

    const response = await axios.post(`${baseUrl}/auth/register`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    assertTokenResponse(response.data);
    return response.data;
  },

  registerMinimal: async (data: RegisterMinimalData): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append('establishmentName', data.establishmentName);
    formData.append('whatsapp', data.whatsapp);
    formData.append('password', data.password);
    if (data.pixCopyPaste) formData.append('pixCopyPaste', data.pixCopyPaste);
    if (data.logo) formData.append('logo', data.logo);

    const response = await axios.post(`${baseUrl}/auth/register-minimal`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    assertTokenResponse(response.data);
    return response.data;
  },

  login: async (identifier: string, password: string): Promise<TokenResponse> => {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const payload = isEmail ? { email: trimmed, password } : { whatsapp: trimmed, password };
    const response = await axios.post(`${baseUrl}/auth/login`, payload);
    assertTokenResponse(response.data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await axios.post(`${baseUrl}/auth/refresh`, { refresh_token: refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string, accessToken: string): Promise<void> => {
    await axios.post(
      `${baseUrl}/auth/logout`,
      { refresh_token: refreshToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await axios.post(`${baseUrl}/auth/forgot-password`, { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await axios.post(`${baseUrl}/auth/reset-password`, {
      token,
      password,
    });
    return response.data;
  },
};
