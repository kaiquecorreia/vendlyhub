'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, KeyboardEvent, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import Logo from '../components/Logo/Logo';
import OnboardingMascotVideo from '../components/OnboardingMascotVideo';
import { fireSuccessConfetti } from '../lib/confetti';
import {
  PENDING_PRODUCT_IMAGE_MAX_BYTES,
  dataUrlByteLength,
  savePendingProductDraft,
} from '../lib/pendingProductDraft';
import { productWizardSchema, type ProductWizardFormData } from './schema';
import currencyStyles from './fast-onboarding.module.scss';
import styles from '../onboarding-flow/styles.module.scss';

type StepId = 'welcome' | 'name' | 'price' | 'image' | 'success';

const steps: StepId[] = ['welcome', 'name', 'price', 'image', 'success'];
const SUCCESS_REDIRECT_SECONDS = 4;

const progressSteps = steps.filter((step) => step !== 'welcome' && step !== 'success');

const stepMessages: Record<StepId, string> = {
  welcome: 'Oi! Vamos cadastrar seu primeiro produto em poucos passos.',
  name: 'Vamos começar pelo nome do produto — assim seus clientes encontram rápido.',
  price: 'Agora defina o preço de venda em reais.',
  image: 'Quer adicionar uma foto? Ajuda a vender mais. Você pode pular esta etapa.',
  success: 'Você cadastrou seu primeiro produto, já está pronto para começar!',
};

const stepFields: Partial<Record<StepId, (keyof ProductWizardFormData)[]>> = {
  name: ['name'],
  price: ['salePrice'],
};

export default function FastOnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(SUCCESS_REDIRECT_SECONDS);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const hasPositionedInitialPriceCaret = useRef(false);
  const successConfettiFiredRef = useRef(false);

  const currentStep = steps[stepIndex];
  const successProgress = useMemo(
    () =>
      Math.round(((SUCCESS_REDIRECT_SECONDS - redirectCountdown) / SUCCESS_REDIRECT_SECONDS) * 100),
    [redirectCountdown],
  );

  const progress = useMemo(() => {
    if (currentStep === 'welcome') return 0;
    const completed = progressSteps.indexOf(currentStep) + 1;
    return Math.round((completed / progressSteps.length) * 100);
  }, [currentStep]);

  const {
    register,
    control,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductWizardFormData>({
    resolver: zodResolver(productWizardSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      salePrice: 0,
    },
  });

  const validateCurrentStep = async () => {
    const fields = stepFields[currentStep];
    if (!fields?.length) return true;
    return trigger(fields);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
      reader.readAsDataURL(file);
    });

  const persistAndGoPreview = async (
    data: ProductWizardFormData,
    imageOverride: File | null | undefined,
  ) => {
    const file = imageOverride !== undefined ? imageOverride : imageFile;
    let imageDataUrl: string | undefined;
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        if (dataUrlByteLength(dataUrl) > PENDING_PRODUCT_IMAGE_MAX_BYTES) {
          toast.error('A imagem deve ter no máximo 5 MB');
          return;
        }
        imageDataUrl = dataUrl;
      } catch {
        toast.error('Não foi possível usar esta imagem');
        return;
      }
    }

    savePendingProductDraft({
      version: 2,
      products: [
        {
          id: 'preview-product-1',
          name: data.name.trim(),
          salePrice: data.salePrice,
          stockQuantity: 100,
          imageDataUrl,
        },
      ],
    });
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goToNextStep = async () => {
    if (currentStep === 'welcome') {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      return;
    }

    if (currentStep === 'image') {
      await handleSubmit((data) => persistAndGoPreview(data, undefined))();
      return;
    }

    const ok = await validateCurrentStep();
    if (!ok) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > PENDING_PRODUCT_IMAGE_MAX_BYTES) {
      toast.error('A imagem deve ter no máximo 5 MB');
      return;
    }

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      toast.error('Use JPG, PNG ou WebP');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSkipImage = () => {
    setImageFile(null);
    setImagePreview(null);
    void handleSubmit((data) => persistAndGoPreview(data, null))();
  };

  const handleEnterNext = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
    event.preventDefault();
    void goToNextStep();
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const updatePointerType = () => setIsCoarsePointer(mediaQuery.matches);
    updatePointerType();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePointerType);
      return () => mediaQuery.removeEventListener('change', updatePointerType);
    }

    mediaQuery.addListener(updatePointerType);
    return () => mediaQuery.removeListener(updatePointerType);
  }, []);

  useEffect(() => {
    if (currentStep !== 'price' || hasPositionedInitialPriceCaret.current) return;
    if (isCoarsePointer) {
      hasPositionedInitialPriceCaret.current = true;
      return;
    }

    let timeoutId: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      const input = priceInputRef.current;
      if (!input || document.activeElement !== input) return;
      timeoutId = window.setTimeout(() => {
        if (document.activeElement !== input) return;
        input.setSelectionRange(0, 0);
        hasPositionedInitialPriceCaret.current = true;
      }, 0);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 'success') return;

    if (!successConfettiFiredRef.current) {
      fireSuccessConfetti();
      successConfettiFiredRef.current = true;
    }

    setRedirectCountdown(SUCCESS_REDIRECT_SECONDS);
    const interval = window.setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          router.push('/catalog/preview');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentStep, router]);

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

        <div key={currentStep} className={styles.step} onKeyDown={handleEnterNext}>
          {currentStep === 'welcome' && (
            <section className={styles.centerContent}>
              <h1>Comece a vender com já!</h1>
              <p>Leva menos de um minuto</p>
              <button type="button" className={styles.welcomeButton} onClick={goToNextStep}>
                Começar
              </button>
            </section>
          )}

          {currentStep === 'name' && (
            <section className={styles.stepContent}>
              <h2>Nome do produto</h2>
              <p className={styles.subtitle}>Um nome claro ajuda na busca e nas vendas.</p>
              <div className={styles.field}>
                <input
                  autoFocus
                  placeholder="Ex.: Café especial 250g"
                  className={errors.name ? styles.inputError : ''}
                  {...register('name')}
                />
                {errors.name && <span>{errors.name.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'price' && (
            <section className={styles.stepContent}>
              <h2>Preço de venda</h2>
              <p className={styles.subtitle}>
                Padrão brasileiro: milhar com ponto e centavos com vírgula (ex.: R$ 1.000.000,00).
              </p>
              <div className={styles.field}>
                <div
                  className={`${currencyStyles.currencyInputRow} ${errors.salePrice ? currencyStyles.currencyInputRowError : ''}`}
                >
                  <span className={currencyStyles.currencyPrefix} aria-hidden="true">
                    R$
                  </span>
                  <Controller
                    name="salePrice"
                    control={control}
                    render={({ field: { onChange, onBlur, value, name, ref } }) => (
                      <NumericFormat
                        name={name}
                        getInputRef={(input) => {
                          ref(input);
                          priceInputRef.current = input;
                        }}
                        autoFocus={!isCoarsePointer}
                        autoComplete="off"
                        inputMode="decimal"
                        value={value}
                        onBlur={onBlur}
                        onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        placeholder="R$ 0,00"
                        className={currencyStyles.currencyInput}
                      />
                    )}
                  />
                </div>
                {errors.salePrice && <span>{errors.salePrice.message}</span>}
              </div>
            </section>
          )}

          {currentStep === 'image' && (
            <section className={styles.stepContent}>
              <h2>Foto do produto</h2>
              <p className={styles.subtitle}>Opcional: JPG, PNG ou WebP até 5 MB.</p>
              <div className={styles.logoUploadContainer}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Pré-visualização" className={styles.logoPreview} />
                ) : (
                  <div className={styles.logoPlaceholder}>Toque para adicionar</div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={styles.fileInput}
                  onChange={handleImageChange}
                />
              </div>
            </section>
          )}

          {currentStep === 'success' && (
            <section className={styles.stepContent}>
              <h2>Você cadastrou seu primeiro produto, já está pronto para começar!</h2>
              <p className={styles.subtitle}>Está sendo redirecionado para o catálogo...</p>
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
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
              disabled={stepIndex === 0}
            >
              Voltar
            </button>
            <button type="button" className={styles.primaryButton} onClick={goToNextStep}>
              {currentStep === 'image' ? 'Ver prévia do catálogo' : 'Continuar'}
            </button>
            {currentStep === 'image' && (
              <button type="button" className={styles.skipButton} onClick={handleSkipImage}>
                Pular
              </button>
            )}
          </div>
        )}

        {currentStep === 'welcome' && (
          <p className={styles.footerText}>
            Já tem conta? <Link href="/login">Faça login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
