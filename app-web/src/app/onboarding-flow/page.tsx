'use client';

import Link from 'next/link';
import { useMemo, useState, useRef, KeyboardEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Controller,
  type FieldError,
  type FieldErrors,
  type FieldPath,
  useForm,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import Logo from '../components/Logo/Logo';
import OnboardingMascotVideo from '../components/OnboardingMascotVideo';
import { useAuth } from '../contexts/AuthContext';
import { fireSuccessConfetti } from '../lib/confetti';
import { setHighlightShareCatalogFlag } from '../lib/postOnboarding';
import { clearPendingProductDraft, loadPendingProductDraft } from '../lib/pendingProductDraft';
import { ERoutePath } from '../config/navigation';
import { establishmentTypes, registerSchema, type RegisterFormData } from '../register/schema';
import { productService } from '../services/productService';
import styles from './styles.module.scss';

type StepId =
  | 'welcome'
  | 'establishment_name'
  | 'document'
  | 'business_type'
  | 'logo_upload'
  | 'user_name'
  | 'email'
  | 'phone'
  | 'cep'
  | 'address_details'
  | 'password'
  | 'success';

const steps: StepId[] = [
  'welcome',
  'establishment_name',
  'document',
  'business_type',
  'logo_upload',
  'user_name',
  'email',
  'phone',
  'cep',
  'address_details',
  'password',
  'success',
];

const progressSteps = steps.filter((step) => step !== 'welcome' && step !== 'success');

const stepFields: Partial<Record<StepId, FieldPath<RegisterFormData>[]>> = {
  establishment_name: ['establishmentName'],
  document: ['documentType', 'document'],
  business_type: ['establishmentTypes'],
  user_name: ['userName'],
  email: ['email'],
  phone: ['mobile_number'],
  cep: ['cep'],
  address_details: ['street', 'number', 'complement', 'neighborhood', 'city', 'state'],
  password: ['password'],
};

const serverFieldHints: Array<{ field: FieldPath<RegisterFormData>; keywords: string[] }> = [
  { field: 'email', keywords: ['email', 'e-mail'] },
  { field: 'document', keywords: ['cpf', 'cnpj', 'documento'] },
  { field: 'mobile_number', keywords: ['celular', 'whatsapp', 'telefone'] },
  { field: 'cep', keywords: ['cep'] },
  { field: 'number', keywords: ['numero', 'número'] },
  { field: 'street', keywords: ['rua', 'endereco', 'endereço', 'logradouro'] },
  { field: 'neighborhood', keywords: ['bairro'] },
  { field: 'city', keywords: ['cidade'] },
  { field: 'state', keywords: ['estado', 'uf'] },
  { field: 'password', keywords: ['senha'] },
  { field: 'establishmentName', keywords: ['estabelecimento', 'loja', 'negocio', 'negócio'] },
  { field: 'userName', keywords: ['nome'] },
];

const stepMessages: Record<StepId, string> = {
  welcome: 'Oi! Vamos configurar sua loja juntos em poucos passos.',
  establishment_name: 'Comecamos pelo nome do seu negocio para identificar sua vitrine.',
  document: 'Agora informe CPF ou CNPJ para validar seu cadastro com seguranca.',
  business_type: 'Escolha o tipo do seu estabelecimento para personalizar sua experiencia.',
  logo_upload: 'Se quiser, adicione sua logo para deixar sua marca mais profissional.',
  user_name: 'Me conta seu nome completo para personalizar seu atendimento.',
  email: 'Digite seu melhor e-mail, ele sera usado para acesso e avisos importantes.',
  phone: 'Informe seu WhatsApp para facilitar o contato com seus clientes.',
  cep: 'Agora vamos localizar seu endereco rapidamente pelo CEP.',
  address_details: 'Confira o endereco e complete os detalhes que faltam.',
  password: 'Crie uma senha segura para proteger sua conta.',
  success: 'Pronto! Sua conta foi criada e ja estamos te levando para a área de produtos.',
};

export default function OnboardingFlowPage() {
  const { register, refreshUser } = useAuth();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState('');
  const [successCountdown, setSuccessCountdown] = useState(4);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successRedirectRef = useRef(ERoutePath.PRODUCTS);
  const successConfettiFiredRef = useRef(false);

  const currentStep = steps[stepIndex];

  const {
    register: formRegister,
    watch,
    control,
    setValue,
    setError,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      logo: null,
      userName: '',
      establishmentName: '',
      documentType: 'cnpj',
      document: '',
      establishmentTypes: [],
      email: '',
      phone_number: '(00) 0000-0000',
      mobile_number: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      password: '',
      terms: true,
    },
  });

  const documentType = watch('documentType');
  const progress = useMemo(() => {
    if (currentStep === 'welcome' || currentStep === 'success') return 0;
    const completed = progressSteps.indexOf(currentStep) + 1;
    return Math.round((completed / progressSteps.length) * 100);
  }, [currentStep]);

  const successProgress = useMemo(() => {
    const totalSeconds = 4;
    return Math.max(0, (successCountdown / totalSeconds) * 100);
  }, [successCountdown]);

  const completeSuccessRedirect = useCallback(() => {
    router.push(successRedirectRef.current);
  }, [router]);

  useEffect(() => {
    if (currentStep !== 'success') {
      successConfettiFiredRef.current = false;
      return;
    }

    if (!successConfettiFiredRef.current) {
      fireSuccessConfetti();
      successConfettiFiredRef.current = true;
    }

    setSuccessCountdown(4);
    const interval = window.setInterval(() => {
      setSuccessCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          completeSuccessRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentStep, completeSuccessRedirect]);

  const fetchCepData = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setValue('street', data.logradouro || '', { shouldValidate: true });
      setValue('neighborhood', data.bairro || '', { shouldValidate: true });
      setValue('city', data.localidade || '', { shouldValidate: true });
      setValue('state', data.uf || '', { shouldValidate: true });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Não foi possível buscar o CEP agora');
    } finally {
      setIsFetchingCep(false);
    }
  };

  const validateCurrentStep = async () => {
    const fields = stepFields[currentStep];
    if (!fields?.length) return true;
    return trigger(fields);
  };

  const goToStep = (step: StepId) => {
    setStepIndex(steps.indexOf(step));
  };

  const getStepForField = (field: FieldPath<RegisterFormData>): StepId | null => {
    const entry = Object.entries(stepFields).find(([, fields]) => fields?.includes(field));
    return (entry?.[0] as StepId | undefined) ?? null;
  };

  const getFirstInvalidStep = (formErrors: FieldErrors<RegisterFormData>): StepId | null => {
    const errs = formErrors as Partial<Record<FieldPath<RegisterFormData>, FieldError | undefined>>;
    for (const step of steps) {
      const fields = stepFields[step];
      if (!fields?.length) continue;
      if (fields.some((field) => Boolean(errs[field]))) return step;
    }
    return null;
  };

  const getFieldFromServerMessage = (message: string): FieldPath<RegisterFormData> | null => {
    const normalizedMessage = message.toLowerCase();
    const match = serverFieldHints.find(({ keywords }) =>
      keywords.some((keyword) => normalizedMessage.includes(keyword)),
    );
    return match?.field ?? null;
  };

  const goToNextStep = async () => {
    setGlobalError('');

    if (currentStep === 'cep') {
      const isCepValid = await trigger('cep');
      if (!isCepValid) return;
      await fetchCepData(watch('cep'));
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    if (currentStep === 'password') {
      await handleSubmit(onSubmit, onInvalidSubmit)();
      return;
    }

    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setGlobalError('');

    const payload = {
      userName: data.userName.trim(),
      establishmentName: data.establishmentName,
      documentType: data.documentType,
      document: data.document.replace(/\D/g, ''),
      establishmentTypes: data.establishmentTypes,
      email: data.email,
      phone_number: data.mobile_number.replace(/\D/g, ''),
      mobile_number: data.mobile_number.replace(/\D/g, ''),
      cep: data.cep.replace(/\D/g, ''),
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      password: data.password,
      terms: true,
      logo: data.logo,
    };

    const promise = register(payload, { redirectToHome: false });
    toast.promise(promise, {
      loading: 'Criando sua conta...',
      success: 'Conta criada com sucesso!',
      error: 'Falha ao criar conta. Tente novamente.',
    });

    try {
      await promise;

      successRedirectRef.current = ERoutePath.PRODUCTS;
      const draft = loadPendingProductDraft();
      if (draft) {
        try {
          await productService.createProductsFromPendingDraft(draft);
          clearPendingProductDraft();
        } catch (syncErr) {
          console.error(syncErr);
          toast.error(
            'Conta criada, mas o produto não foi salvo. Cadastre-o em Produtos no painel.',
          );
        }
      }

      await refreshUser();
      setHighlightShareCatalogFlag();
      goToStep('success');
    } catch (error) {
      let message = 'Falha ao criar conta. Tente novamente.';
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object' && data !== null && 'message' in data) {
          const m = (data as { message?: unknown }).message;
          if (typeof m === 'string') message = m;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      setGlobalError(message);

      const field = getFieldFromServerMessage(message);
      if (field) {
        setError(field, { type: 'server', message });
        const step = getStepForField(field);
        if (step) goToStep(step);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalidSubmit = (formErrors: FieldErrors<RegisterFormData>) => {
    const step = getFirstInvalidStep(formErrors);
    if (step) goToStep(step);
  };

  const handleBack = () => {
    setGlobalError('');
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setValue('logo', file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEnterNext = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
    if ((target as HTMLInputElement).type === 'checkbox') return;
    event.preventDefault();
    void goToNextStep();
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.assistantGuide}>
          <OnboardingMascotVideo />
          <div className={styles.mascotBubble} aria-live="polite">
            {stepMessages[currentStep]}
          </div>
        </div>

        {currentStep === 'welcome' && (
          <div className={`${styles.logoWrap} ${styles.logoWrapWelcome}`}>
            <Logo />
          </div>
        )}

        {currentStep !== 'welcome' && currentStep !== 'success' && (
          <div className={styles.progressWrap}>
            <div className={styles.progressHead}>
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {globalError && <div className={styles.globalError}>{globalError}</div>}

        <div key={currentStep} className={styles.step} onKeyDown={handleEnterNext}>
          {currentStep === 'welcome' && (
            <section className={styles.centerContent}>
              <h1>Vamos criar seu estabelecimento</h1>
              <p>Leva menos de 2 minutos</p>
              <button type="button" className={styles.welcomeButton} onClick={goToNextStep}>
                Começar
              </button>
            </section>
          )}

          {currentStep === 'establishment_name' && (
            <section className={styles.stepContent}>
              <h2>Nome do estabelecimento</h2>
              <p className={styles.subtitle}>Excelente começo, estamos montando sua vitrine.</p>
              <div className={styles.field}>
                <input
                  autoFocus
                  placeholder="Digite o nome do estabelecimento"
                  className={errors.establishmentName ? styles.inputError : ''}
                  {...formRegister('establishmentName')}
                />
                {errors.establishmentName && <span>{errors.establishmentName.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'document' && (
            <section className={styles.stepContent}>
              <h2>{documentType === 'cpf' ? 'CPF' : 'CNPJ'}</h2>
              <p className={styles.subtitle}>Falta pouco, você está indo muito bem.</p>
              <div className={styles.radioRow}>
                <label>
                  <input type="radio" value="cpf" {...formRegister('documentType')} />
                  <span>CPF</span>
                </label>
                <label>
                  <input type="radio" value="cnpj" {...formRegister('documentType')} />
                  <span>CNPJ</span>
                </label>
              </div>
              <div className={styles.field}>
                <Controller
                  name="document"
                  control={control}
                  render={({ field }) => (
                    <PatternFormat
                      {...field}
                      autoFocus
                      format={documentType === 'cpf' ? '###.###.###-##' : '##.###.###/####-##'}
                      mask="_"
                      placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                      className={errors.document ? styles.inputError : ''}
                    />
                  )}
                />
                {errors.document && <span>{errors.document.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'business_type' && (
            <section className={styles.stepContent}>
              <h2>Tipo de estabelecimento</h2>
              <p className={styles.subtitle}>
                Agora estamos deixando seu perfil mais inteligente para vender mais.
              </p>
              <Controller
                name="establishmentTypes"
                control={control}
                render={({ field }) => (
                  <div className={styles.cardsGrid}>
                    {establishmentTypes.map((type) => {
                      const isSelected = field.value?.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`${styles.typeCard} ${isSelected ? styles.typeCardSelected : ''}`}
                          onClick={() => {
                            const nextValues = new Set(field.value ?? []);
                            if (isSelected) nextValues.delete(type);
                            else nextValues.add(type);
                            field.onChange([...nextValues]);
                          }}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.establishmentTypes && (
                <span className={styles.inlineError}>{errors.establishmentTypes.message}</span>
              )}
            </section>
          )}

          {currentStep === 'logo_upload' && (
            <section className={styles.stepContent}>
              <h2>Upload de logo</h2>
              <p className={styles.subtitle}>
                Opcional: uma logo ajuda no reconhecimento da sua marca.
              </p>
              <div className={styles.logoUploadContainer}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Pré-visualização da logo"
                    className={styles.logoPreview}
                  />
                ) : (
                  <div className={styles.logoPlaceholder}>Clique para adicionar</div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={styles.fileInput}
                  onChange={handleLogoChange}
                />
              </div>
            </section>
          )}

          {currentStep === 'user_name' && (
            <section className={styles.stepContent}>
              <h2>Nome completo</h2>
              <p className={styles.subtitle}>Ótimo progresso, estamos quase na metade.</p>
              <div className={styles.field}>
                <input
                  autoFocus
                  placeholder="Nome de quem está preenchendo o formulário"
                  className={errors.userName ? styles.inputError : ''}
                  {...formRegister('userName')}
                />
                {errors.userName && <span>{errors.userName.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'email' && (
            <section className={styles.stepContent}>
              <h2>E-mail</h2>
              <p className={styles.subtitle}>Perfeito, esse será seu acesso principal.</p>
              <div className={styles.field}>
                <input
                  autoFocus
                  type="email"
                  placeholder="Digite seu e-mail"
                  className={errors.email ? styles.inputError : ''}
                  {...formRegister('email')}
                />
                {errors.email && <span>{errors.email.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'phone' && (
            <section className={styles.stepContent}>
              <h2>WhatsApp de contato</h2>
              <p className={styles.subtitle}>
                Ótimo, assim seus clientes conseguem falar com você rapidinho.
              </p>
              <div className={styles.field}>
                <Controller
                  name="mobile_number"
                  control={control}
                  render={({ field }) => (
                    <PatternFormat
                      {...field}
                      autoFocus
                      format="(##) #####-####"
                      mask="_"
                      type="tel"
                      placeholder="WhatsApp: (00) 00000-0000"
                      className={errors.mobile_number ? styles.inputError : ''}
                    />
                  )}
                />
                {errors.mobile_number && <span>{errors.mobile_number.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'cep' && (
            <section className={styles.stepContent}>
              <h2>CEP</h2>
              <p className={styles.subtitle}>Maravilha, agora vamos completar seu endereço.</p>
              <div className={styles.field}>
                <Controller
                  name="cep"
                  control={control}
                  render={({ field }) => (
                    <PatternFormat
                      {...field}
                      autoFocus
                      format="#####-###"
                      mask="_"
                      placeholder="00000-000"
                      className={errors.cep ? styles.inputError : ''}
                      onBlur={(event) => {
                        field.onBlur();
                        void fetchCepData(event.target.value);
                      }}
                    />
                  )}
                />
                {errors.cep && <span>{errors.cep.message}</span>}
              </div>
              {isFetchingCep && <p className={styles.subtitle}>Buscando endereço...</p>}
            </section>
          )}

          {currentStep === 'address_details' && (
            <section className={styles.stepContent}>
              <h2>Endereço</h2>
              <p className={styles.subtitle}>
                Quase pronto! Só confirme os dados e informe o número.
              </p>
              <div className={styles.field}>
                <input
                  readOnly
                  placeholder="Rua"
                  className={`${styles.readonlyField} ${errors.street ? styles.inputError : ''}`}
                  {...formRegister('street')}
                />
                {errors.street && <span>{errors.street.message}</span>}
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <input
                    autoFocus
                    placeholder="Número"
                    className={errors.number ? styles.inputError : ''}
                    {...formRegister('number')}
                  />
                  {errors.number && <span>{errors.number.message}</span>}
                </div>
                <div className={styles.field}>
                  <input placeholder="Complemento (opcional)" {...formRegister('complement')} />
                </div>
              </div>
              <div className={styles.field}>
                <input
                  readOnly
                  placeholder="Bairro"
                  className={`${styles.readonlyField} ${errors.neighborhood ? styles.inputError : ''}`}
                  {...formRegister('neighborhood')}
                />
                {errors.neighborhood && <span>{errors.neighborhood.message}</span>}
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <input
                    readOnly
                    placeholder="Cidade"
                    className={`${styles.readonlyField} ${errors.city ? styles.inputError : ''}`}
                    {...formRegister('city')}
                  />
                  {errors.city && <span>{errors.city.message}</span>}
                </div>
                <div className={styles.field}>
                  <input
                    readOnly
                    maxLength={2}
                    placeholder="UF"
                    className={`${styles.readonlyField} ${errors.state ? styles.inputError : ''}`}
                    {...formRegister('state')}
                  />
                  {errors.state && <span>{errors.state.message}</span>}
                </div>
              </div>
            </section>
          )}

          {currentStep === 'password' && (
            <section className={styles.stepContent}>
              <h2>Senha</h2>
              <p className={styles.subtitle}>Último passo! Sua conta já está quase no ar.</p>
              <div className={styles.field}>
                <input
                  autoFocus
                  type="password"
                  placeholder="Digite sua senha"
                  className={errors.password ? styles.inputError : ''}
                  {...formRegister('password')}
                />
                {errors.password && <span>{errors.password.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'success' && (
            <section className={styles.centerContent}>
              <h1>Conta criada com sucesso</h1>
              <p>Seu estabelecimento já está pronto para começar.</p>
              <p className={styles.subtitle}>Redirecionando para o dashboard em instantes...</p>
              <div className={styles.successTimeoutTrack}>
                <div
                  className={styles.successTimeoutBar}
                  style={{ width: `${successProgress}%` }}
                />
              </div>
            </section>
          )}
        </div>

        {currentStep !== 'welcome' && currentStep !== 'success' && (
          <div className={styles.actions}>
            <button type="button" className={styles.backButton} onClick={handleBack}>
              Voltar
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={goToNextStep}
              disabled={isSubmitting}
            >
              {currentStep === 'logo_upload'
                ? 'Continuar'
                : currentStep === 'password'
                  ? isSubmitting
                    ? 'Criando conta...'
                    : 'Criar conta'
                  : 'Continuar'}
            </button>
            {currentStep === 'logo_upload' && (
              <button type="button" className={styles.skipButton} onClick={goToNextStep}>
                Pular
              </button>
            )}
          </div>
        )}

        {currentStep === 'welcome' && (
          <p className={styles.footerText}>
            Já tem uma conta? <Link href="/login">Faça login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
