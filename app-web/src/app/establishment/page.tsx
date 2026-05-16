'use client';

import profileStyles from '../profile/styles.module.scss';
import registerStyles from '../register/styles.module.scss';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { establishmentEditSchema, type EstablishmentEditFormData } from './schema';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { profileService } from '../services/profileService';
import { normalizeApiError } from '../services/apiClient';
import { resolveMediaUrl } from '../services/mediaUrl';
import { PatternFormat } from 'react-number-format';
import { establishmentTypes } from '../register/schema';
import { useAuth } from '../contexts/AuthContext';

function formatDisplayPhone10(d: string) {
  const x = d.replace(/\D/g, '');
  if (x.length !== 10) return d;
  return `(${x.slice(0, 2)}) ${x.slice(2, 6)}-${x.slice(6)}`;
}

function formatDisplayPhone11(d: string) {
  const x = d.replace(/\D/g, '');
  if (x.length !== 11) return d;
  return `(${x.slice(0, 2)}) ${x.slice(2, 7)}-${x.slice(7)}`;
}

function formatDisplayCep(d: string) {
  const x = d.replace(/\D/g, '');
  if (x.length !== 8) return d;
  return `${x.slice(0, 5)}-${x.slice(5)}`;
}

export default function EstablishmentPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasEstablishment, setHasEstablishment] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EstablishmentEditFormData>({
    resolver: zodResolver(establishmentEditSchema),
    defaultValues: {
      logo: null,
      establishmentName: '',
      documentType: 'cnpj',
      document: '',
      establishmentTypes: [],
      phone_number: '',
      mobile_number: '',
      pixCopyPaste: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  const documentType = watch('documentType');

  useEffect(() => {
    const load = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;
      try {
        const profile = await profileService.getProfile(accessToken);
        const est = profile.establishment;
        if (!est) {
          setHasEstablishment(false);
          return;
        }
        setValue('establishmentName', est.name);
        setValue('documentType', (est.documentType?.toLowerCase() as 'cpf' | 'cnpj') || 'cnpj');
        setValue('document', est.document ?? '');
        const validLabels = new Set<string>(establishmentTypes);
        setValue(
          'establishmentTypes',
          (est.establishmentTypes ?? []).filter((t) =>
            validLabels.has(t),
          ) as EstablishmentEditFormData['establishmentTypes'],
        );
        const addr = est.address;
        if (addr) {
          setValue('cep', addr.cep ? formatDisplayCep(addr.cep) : '');
          setValue('street', addr.street ?? '');
          setValue('number', addr.number ?? '');
          setValue('complement', addr.complement ?? '');
          setValue('neighborhood', addr.neighborhood ?? '');
          setValue('city', addr.city ?? '');
          setValue('state', addr.state ?? '');
        }
        const phoneDigits = (est.phone_number ?? '').replace(/\D/g, '');
        const mobileDigits = (est.mobile_number ?? '').replace(/\D/g, '');
        setValue(
          'phone_number',
          phoneDigits.length === 10 ? formatDisplayPhone10(phoneDigits) : phoneDigits,
        );
        setValue(
          'mobile_number',
          mobileDigits.length === 11 ? formatDisplayPhone11(mobileDigits) : mobileDigits,
        );
        setValue('pixCopyPaste', est.pixCopyPaste ?? '');
        setValue('logo', null);
        setLogoPreview(resolveMediaUrl(est.logo ?? null) ?? null);
      } catch (e) {
        console.error(e);
        toast.error('Erro ao carregar dados do estabelecimento');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setValue]);

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setValue('street', data.logradouro || '');
          setValue('neighborhood', data.bairro || '');
          setValue('city', data.localidade || '');
          setValue('state', data.uf || '');
        }
      } catch (err) {
        console.log('Erro ao buscar CEP:', err);
      }
    }
  };

  const onSubmit = async (data: EstablishmentEditFormData) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      await profileService.completeOnboarding(
        {
          establishmentName: data.establishmentName.trim(),
          documentType: data.documentType,
          document: data.document.replace(/\D/g, ''),
          establishmentTypes: data.establishmentTypes,
          logo: data.logo || null,
          cep: data.cep.replace(/\D/g, ''),
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          phone_number: data.phone_number.replace(/\D/g, ''),
          mobile_number: data.mobile_number.replace(/\D/g, ''),
          pixCopyPaste: data.pixCopyPaste?.trim() || undefined,
        },
        accessToken,
      );
      await refreshUser();
      toast.success('Onboarding do estabelecimento concluído com sucesso!');
    } catch (error: unknown) {
      toast.error(normalizeApiError(error, 'Falha ao atualizar estabelecimento.'));
    }
  };

  if (loading) {
    return (
      <div className={profileStyles.profileContainer}>
        <p className={profileStyles.passwordHint}>Carregando…</p>
      </div>
    );
  }

  if (!hasEstablishment) {
    return (
      <div className={profileStyles.profileContainer}>
        <div className={profileStyles.header}>
          <button type="button" onClick={() => router.back()} className={profileStyles.backButton}>
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
          <h1>Estabelecimento</h1>
        </div>
        <p>Nenhum estabelecimento vinculado à sua conta.</p>
      </div>
    );
  }

  return (
    <div className={profileStyles.profileContainer}>
      <div className={profileStyles.header}>
        <button type="button" onClick={() => router.back()} className={profileStyles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1>Editar Estabelecimento</h1>
      </div>

      <form className={profileStyles.profileForm} onSubmit={handleSubmit(onSubmit)}>
        <h3 className={profileStyles.sectionTitle}>Logo</h3>
        <p className={profileStyles.avatarHint}>Resolução recomendada: 200x200px (máx. 2MB)</p>
        <div className={registerStyles.logoUploadSection}>
          <div className={registerStyles.logoUploadContainer}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className={registerStyles.logoPreview} />
            ) : (
              <div className={registerStyles.logoPlaceholder}>
                <span>Clique para adicionar</span>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  toast.error('A imagem deve ter no máximo 2MB');
                  return;
                }
                setValue('logo', file);
                const reader = new FileReader();
                reader.onloadend = () => setLogoPreview(reader.result as string);
                reader.readAsDataURL(file);
              }}
              className={registerStyles.logoInput}
            />
          </div>
        </div>

        <h3 className={profileStyles.sectionTitle}>Dados do estabelecimento</h3>

        <div className={profileStyles.inputGroup}>
          <label htmlFor="establishmentName">Nome do estabelecimento</label>
          <input
            type="text"
            id="establishmentName"
            className={errors.establishmentName ? profileStyles.inputError : ''}
            {...register('establishmentName')}
          />
          {errors.establishmentName && (
            <span className={profileStyles.errorMessage}>{errors.establishmentName.message}</span>
          )}
        </div>

        <div className={profileStyles.inputGroup}>
          <label>Tipo de documento</label>
          <div className={registerStyles.radioGroup}>
            <label className={registerStyles.radioLabel}>
              <input type="radio" value="cpf" {...register('documentType')} />
              <span>CPF</span>
            </label>
            <label className={registerStyles.radioLabel}>
              <input type="radio" value="cnpj" {...register('documentType')} />
              <span>CNPJ</span>
            </label>
          </div>
        </div>

        <div className={profileStyles.inputGroup}>
          <label htmlFor="document">{documentType === 'cpf' ? 'CPF' : 'CNPJ'}</label>
          <Controller
            name="document"
            control={control}
            render={({ field }) => (
              <PatternFormat
                {...field}
                format={documentType === 'cpf' ? '###.###.###-##' : '##.###.###/####-##'}
                mask="_"
                id="document"
                className={errors.document ? profileStyles.inputError : ''}
              />
            )}
          />
          {errors.document && (
            <span className={profileStyles.errorMessage}>{errors.document.message}</span>
          )}
        </div>

        <div className={profileStyles.inputGroup}>
          <span className={registerStyles.fieldLabel}>Tipos de estabelecimento</span>
          <p className={registerStyles.sectionHint}>
            Selecione um ou mais tipos que representem seu negócio.
          </p>
          <Controller
            name="establishmentTypes"
            control={control}
            render={({ field }) => (
              <div
                className={
                  errors.establishmentTypes
                    ? `${registerStyles.typesCheckboxList} ${profileStyles.inputError}`
                    : registerStyles.typesCheckboxList
                }
                role="group"
                aria-label="Tipos de estabelecimento"
              >
                {establishmentTypes.map((type) => (
                  <label key={type} className={registerStyles.typeCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={field.value?.includes(type)}
                      onChange={(e) => {
                        const set = new Set(field.value ?? []);
                        if (e.target.checked) set.add(type);
                        else set.delete(type);
                        field.onChange([...set]);
                      }}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.establishmentTypes && (
            <span className={profileStyles.errorMessage}>{errors.establishmentTypes.message}</span>
          )}
        </div>

        <h3 className={profileStyles.sectionTitle}>Contato</h3>

        <div className={profileStyles.inputRow}>
          <div className={profileStyles.inputGroup}>
            <label htmlFor="phone_number">Telefone</label>
            <Controller
              name="phone_number"
              control={control}
              render={({ field }) => (
                <PatternFormat
                  {...field}
                  format="(##) ####-####"
                  mask="_"
                  type="tel"
                  id="phone_number"
                  className={errors.phone_number ? profileStyles.inputError : ''}
                />
              )}
            />
            {errors.phone_number && (
              <span className={profileStyles.errorMessage}>{errors.phone_number.message}</span>
            )}
          </div>

          <div className={profileStyles.inputGroup}>
            <label htmlFor="mobile_number">Celular</label>
            <Controller
              name="mobile_number"
              control={control}
              render={({ field }) => (
                <PatternFormat
                  {...field}
                  format="(##) #####-####"
                  mask="_"
                  type="tel"
                  id="mobile_number"
                  className={errors.mobile_number ? profileStyles.inputError : ''}
                />
              )}
            />
            {errors.mobile_number && (
              <span className={profileStyles.errorMessage}>{errors.mobile_number.message}</span>
            )}
          </div>
        </div>

        <div className={profileStyles.inputGroup}>
          <label htmlFor="pixCopyPaste">Código Pix Copia e Cola</label>
          <textarea
            id="pixCopyPaste"
            rows={4}
            placeholder="Cole aqui o código Pix Copia e Cola do estabelecimento"
            className={errors.pixCopyPaste ? profileStyles.inputError : ''}
            {...register('pixCopyPaste')}
          />
          {errors.pixCopyPaste && (
            <span className={profileStyles.errorMessage}>{errors.pixCopyPaste.message}</span>
          )}
        </div>

        <h3 className={profileStyles.sectionTitle}>Endereço</h3>

        <div className={profileStyles.inputRow}>
          <div className={profileStyles.inputGroup} style={{ flex: '0 0 40%' }}>
            <label htmlFor="cep">CEP</label>
            <Controller
              name="cep"
              control={control}
              render={({ field }) => (
                <PatternFormat
                  {...field}
                  format="#####-####"
                  mask="_"
                  id="cep"
                  onBlur={(e) => {
                    field.onBlur();
                    void handleCepBlur(e.target.value);
                  }}
                  className={errors.cep ? profileStyles.inputError : ''}
                />
              )}
            />
            {errors.cep && <span className={profileStyles.errorMessage}>{errors.cep.message}</span>}
          </div>
        </div>

        <div className={profileStyles.inputGroup}>
          <label htmlFor="street">Rua</label>
          <input
            type="text"
            id="street"
            className={errors.street ? profileStyles.inputError : ''}
            {...register('street')}
          />
          {errors.street && (
            <span className={profileStyles.errorMessage}>{errors.street.message}</span>
          )}
        </div>

        <div className={profileStyles.inputRow}>
          <div className={profileStyles.inputGroup}>
            <label htmlFor="number">Número</label>
            <input
              type="text"
              id="number"
              className={errors.number ? profileStyles.inputError : ''}
              {...register('number')}
            />
            {errors.number && (
              <span className={profileStyles.errorMessage}>{errors.number.message}</span>
            )}
          </div>
          <div className={profileStyles.inputGroup}>
            <label htmlFor="complement">Complemento</label>
            <input type="text" id="complement" {...register('complement')} />
          </div>
        </div>

        <div className={profileStyles.inputGroup}>
          <label htmlFor="neighborhood">Bairro</label>
          <input
            type="text"
            id="neighborhood"
            className={errors.neighborhood ? profileStyles.inputError : ''}
            {...register('neighborhood')}
          />
          {errors.neighborhood && (
            <span className={profileStyles.errorMessage}>{errors.neighborhood.message}</span>
          )}
        </div>

        <div className={profileStyles.inputRow}>
          <div className={profileStyles.inputGroup}>
            <label htmlFor="city">Cidade</label>
            <input
              type="text"
              id="city"
              className={errors.city ? profileStyles.inputError : ''}
              {...register('city')}
            />
            {errors.city && (
              <span className={profileStyles.errorMessage}>{errors.city.message}</span>
            )}
          </div>
          <div className={profileStyles.inputGroup}>
            <label htmlFor="state">UF</label>
            <input
              type="text"
              id="state"
              maxLength={2}
              className={errors.state ? profileStyles.inputError : ''}
              {...register('state')}
            />
            {errors.state && (
              <span className={profileStyles.errorMessage}>{errors.state.message}</span>
            )}
          </div>
        </div>

        <button type="submit" className={profileStyles.saveButton}>
          Salvar alterações
        </button>
      </form>
    </div>
  );
}
