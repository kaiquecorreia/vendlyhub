import { apiClient } from './apiClient';

export interface EstablishmentAddress {
  addressId: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface UserProfileEstablishment {
  establishmentId: string;
  name: string;
  document?: string | null;
  documentType?: string | null;
  onboardingStatus?: 'draft' | 'minimal_completed' | 'completed';
  establishmentTypes: string[];
  pixCopyPaste?: string | null;
  logo?: string | null;
  address?: EstablishmentAddress;
  phone_number?: string;
  mobile_number?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  whatsapp?: string;
  minimalProfileCompleted?: boolean;
  establishment?: UserProfileEstablishment;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatar?: File | null;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateEstablishmentPayload {
  establishmentName: string;
  documentType: 'cpf' | 'cnpj';
  document: string;
  establishmentTypes: string[];
  logo?: File | null;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone_number?: string;
  mobile_number?: string;
  pixCopyPaste?: string;
}

export interface UpdateEstablishmentPixPayload {
  pixCopyPaste?: string | null;
}

function authConfig(accessToken?: string) {
  if (!accessToken) return undefined;
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

export const profileService = {
  getProfile: async (accessToken?: string): Promise<UserProfile> => {
    const response = await apiClient.get('/auth/me', authConfig(accessToken));
    return response.data;
  },

  updateProfile: async (data: UpdateProfilePayload, accessToken?: string): Promise<UserProfile> => {
    const formData = new FormData();
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.email !== undefined) formData.append('email', data.email);
    if (data.avatar) formData.append('avatar', data.avatar);

    const newPassword = data.newPassword?.trim();
    if (newPassword) {
      formData.append('currentPassword', data.currentPassword || '');
      formData.append('newPassword', newPassword);
    }

    const response = await apiClient.patch('/auth/me', formData, authConfig(accessToken));
    return response.data;
  },

  updateEstablishment: async (
    data: UpdateEstablishmentPayload,
    accessToken?: string,
  ): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('establishmentName', data.establishmentName);
    formData.append('documentType', data.documentType);
    formData.append('document', data.document);
    for (const t of data.establishmentTypes) {
      formData.append('establishmentTypes', t);
    }
    if (data.cep !== undefined) formData.append('cep', data.cep);
    if (data.street !== undefined) formData.append('street', data.street);
    if (data.number !== undefined) formData.append('number', data.number);
    if (data.complement !== undefined) formData.append('complement', data.complement);
    if (data.neighborhood !== undefined) formData.append('neighborhood', data.neighborhood);
    if (data.city !== undefined) formData.append('city', data.city);
    if (data.state !== undefined) formData.append('state', data.state);
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number);
    if (data.mobile_number !== undefined) formData.append('mobile_number', data.mobile_number);
    if (data.pixCopyPaste !== undefined) formData.append('pixCopyPaste', data.pixCopyPaste);
    if (data.logo) formData.append('logo', data.logo);

    const response = await apiClient.patch(
      '/auth/establishment',
      formData,
      authConfig(accessToken),
    );
    return response.data;
  },

  updateEstablishmentLogo: async (logo: File, accessToken?: string): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('logo', logo);

    const response = await apiClient.patch(
      '/auth/establishment/logo',
      formData,
      authConfig(accessToken),
    );
    return response.data;
  },

  updateEstablishmentPix: async (
    data: UpdateEstablishmentPixPayload,
    accessToken?: string,
  ): Promise<UserProfile> => {
    const response = await apiClient.patch(
      '/auth/establishment/pix',
      { pixCopyPaste: data.pixCopyPaste },
      authConfig(accessToken),
    );
    return response.data;
  },

  completeOnboarding: async (
    data: UpdateEstablishmentPayload,
    accessToken?: string,
  ): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('establishmentName', data.establishmentName);
    formData.append('documentType', data.documentType);
    formData.append('document', data.document);
    for (const t of data.establishmentTypes) {
      formData.append('establishmentTypes', t);
    }
    if (data.cep !== undefined) formData.append('cep', data.cep);
    if (data.street !== undefined) formData.append('street', data.street);
    if (data.number !== undefined) formData.append('number', data.number);
    if (data.complement !== undefined) formData.append('complement', data.complement);
    if (data.neighborhood !== undefined) formData.append('neighborhood', data.neighborhood);
    if (data.city !== undefined) formData.append('city', data.city);
    if (data.state !== undefined) formData.append('state', data.state);
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number);
    if (data.mobile_number !== undefined) formData.append('mobile_number', data.mobile_number);
    if (data.pixCopyPaste !== undefined) formData.append('pixCopyPaste', data.pixCopyPaste);
    if (data.logo) formData.append('logo', data.logo);

    const response = await apiClient.post(
      '/auth/onboarding/complete',
      formData,
      authConfig(accessToken),
    );
    return response.data;
  },
};
