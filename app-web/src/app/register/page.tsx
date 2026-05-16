'use client';

import Logo from '../components/Logo/Logo';
import Link from 'next/link';
import styles from './styles.module.scss';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData, establishmentTypes } from './schema';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { PatternFormat } from 'react-number-format';
import { Controller } from 'react-hook-form';
import { generateDevFakeCompany } from './devFakeCompany';
import { buildFakeCategories, buildFakeProducts } from './devFakeCatalog';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { Category } from '../types/product';

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [devCredentials, setDevCredentials] = useState<{ email: string; password: string } | null>(
    null,
  );

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      logo: null,
      userName: '',
      establishmentName: '',
      documentType: 'cnpj',
      document: '',
      establishmentTypes: [],
      email: '',
      phone_number: '',
      mobile_number: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      password: '',
      terms: false,
    },
  });

  const documentType = watch('documentType');

  const isDevFakeEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_FILL === 'true';

  const seedFakeCatalog = async () => {
    const categoryInputs = buildFakeCategories();
    const createdCategories: Category[] = [];
    for (const category of categoryInputs) {
      const created = await categoryService.createCategory(category);
      createdCategories.push(created);
    }

    const categoriesByName = createdCategories.reduce<Record<string, string>>((acc, category) => {
      acc[category.name] = category.id;
      return acc;
    }, {});

    const skuSuffix = Date.now().toString().slice(-6);
    const productInputs = buildFakeProducts(categoriesByName, skuSuffix);

    for (const product of productInputs) {
      await productService.createProduct(product);
    }

    return {
      categories: createdCategories.length,
      products: productInputs.length,
    };
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      setValue('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const onSubmit = async (data: RegisterFormData) => {
    setError('');

    const registerData = {
      userName: data.userName.trim(),
      establishmentName: data.establishmentName,
      documentType: data.documentType,
      document: data.document.replace(/\D/g, ''),
      establishmentTypes: data.establishmentTypes,
      email: data.email,
      phone_number: data.phone_number.replace(/\D/g, ''),
      mobile_number: data.mobile_number.replace(/\D/g, ''),
      cep: data.cep.replace(/\D/g, ''),
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      password: data.password,
      logo: data.logo,
    };

    const promise = register(registerData);

    toast.promise(promise, {
      loading: 'Criando sua conta...',
      success: 'Conta criada com sucesso!',
      error: 'Falha ao criar conta. Tente novamente.',
    });

    try {
      await promise;
    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message || 'Falha ao criar conta. Tente novamente.';
        setError(errorMessage);
      } else {
        setError('Falha ao criar conta. Tente novamente.');
      }
      console.log('[page.tsx] error: ', err);
    }
  };

  const handleDevFakeRegister = async () => {
    if (!isDevFakeEnabled) return;

    setError('');
    setDevCredentials(null);

    const { payload, credentials } = generateDevFakeCompany();

    const registerData = {
      userName: payload.userName.trim(),
      establishmentName: payload.establishmentName,
      documentType: payload.documentType,
      document: payload.document.replace(/\D/g, ''),
      establishmentTypes: payload.establishmentTypes,
      email: payload.email,
      phone_number: payload.phone_number.replace(/\D/g, ''),
      mobile_number: payload.mobile_number.replace(/\D/g, ''),
      cep: payload.cep.replace(/\D/g, ''),
      street: payload.street,
      number: payload.number,
      complement: payload.complement ?? '',
      neighborhood: payload.neighborhood,
      city: payload.city,
      state: payload.state,
      password: payload.password,
      logo: payload.logo ?? null,
    };

    try {
      toast.loading('Criando empresa fake...');
      await register(registerData, { redirectToHome: false });
      const seeded = await seedFakeCatalog();
      toast.dismiss();
      toast.success(
        `Empresa fake criada com ${seeded.categories} categorias e ${seeded.products} produtos.`,
      );
      setDevCredentials(credentials);
    } catch (err) {
      toast.dismiss();
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message || 'Falha ao criar empresa fake. Tente novamente.';
        setError(errorMessage);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao criar empresa fake. Tente novamente.');
      }
      console.log('[page.tsx] dev fake error: ', err);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerBox}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>

        {/* <button className={styles.googleButton} onClick={handleGoogleRegister}>
          <FcGoogle size={24} />
          <span>Cadastrar com o Google</span>
        </button>

        <div className={styles.divider}>
          <span>ou</span>
        </div> */}

        {error && <div className={styles.error}>{error}</div>}

        {isDevFakeEnabled && (
          <div className={styles.devSection}>
            <button type="button" className={styles.devButton} onClick={handleDevFakeRegister}>
              Gerar empresa fake para teste
            </button>
            {devCredentials && (
              <div className={styles.devCredentials}>
                <p>
                  <strong>E-mail:</strong> {devCredentials.email}
                </p>
                <p>
                  <strong>Senha:</strong> {devCredentials.password}
                </p>
              </div>
            )}
          </div>
        )}

        <form className={styles.registerForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.logoUploadSection}>
            <label>Logo do estabelecimento (opcional)</label>
            <p className={styles.logoHint}>Resolução recomendada: 200x200px (máx. 2MB)</p>
            <div className={styles.logoUploadContainer}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className={styles.logoPreview} />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <span>Clique para adicionar</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
                className={styles.logoInput}
              />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Dados do Estabelecimento</h3>

          <div className={styles.inputGroup}>
            <label htmlFor="establishmentName">Nome do estabelecimento</label>
            <input
              type="text"
              id="establishmentName"
              placeholder="Digite o nome do estabelecimento"
              className={errors.establishmentName ? styles.inputError : ''}
              {...formRegister('establishmentName')}
            />
            {errors.establishmentName && (
              <span className={styles.errorMessage}>{errors.establishmentName.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Tipo de documento</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" value="cpf" {...formRegister('documentType')} />
                <span>CPF</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="cnpj" {...formRegister('documentType')} />
                <span>CNPJ</span>
              </label>
            </div>
          </div>

          <div className={styles.inputGroup}>
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
                  placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  className={errors.document ? styles.inputError : ''}
                />
              )}
            />
            {errors.document && (
              <span className={styles.errorMessage}>{errors.document.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.fieldLabel}>Tipos de estabelecimento</span>
            <p className={styles.sectionHint}>
              Selecione um ou mais tipos que representem seu negócio.
            </p>
            <Controller
              name="establishmentTypes"
              control={control}
              render={({ field }) => (
                <div
                  className={
                    errors.establishmentTypes
                      ? `${styles.typesCheckboxList} ${styles.inputError}`
                      : styles.typesCheckboxList
                  }
                  role="group"
                  aria-label="Tipos de estabelecimento"
                >
                  {establishmentTypes.map((type) => (
                    <label key={type} className={styles.typeCheckboxLabel}>
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
              <span className={styles.errorMessage}>{errors.establishmentTypes.message}</span>
            )}
          </div>

          <h3 className={styles.sectionTitle}>Informações pessoais</h3>
          <p className={styles.sectionHint}>
            O nome completo identifica quem está realizando o cadastro e será usado como nome da sua
            conta.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="userName">Nome completo</label>
            <input
              type="text"
              id="userName"
              placeholder="Nome de quem está preenchendo o formulário"
              autoComplete="name"
              className={errors.userName ? styles.inputError : ''}
              {...formRegister('userName')}
            />
            {errors.userName && (
              <span className={styles.errorMessage}>{errors.userName.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="Digite seu e-mail"
              className={errors.email ? styles.inputError : ''}
              {...formRegister('email')}
            />
            {errors.email && <span className={styles.errorMessage}>{errors.email.message}</span>}
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
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
                    placeholder="(00) 0000-0000"
                    className={errors.phone_number ? styles.inputError : ''}
                  />
                )}
              />
              {errors.phone_number && (
                <span className={styles.errorMessage}>{errors.phone_number.message}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="mobile_number">Celular (Whatsapp)</label>
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
                    placeholder="(00) 00000-0000"
                    className={errors.mobile_number ? styles.inputError : ''}
                  />
                )}
              />
              {errors.mobile_number && (
                <span className={styles.errorMessage}>{errors.mobile_number.message}</span>
              )}
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Endereço</h3>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup} style={{ flex: '0 0 40%' }}>
              <label htmlFor="cep">CEP</label>
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <PatternFormat
                    {...field}
                    format="#####-###"
                    mask="_"
                    id="cep"
                    placeholder="00000-000"
                    className={errors.cep ? styles.inputError : ''}
                    onBlur={(e) => {
                      field.onBlur();
                      handleCepBlur(e.target.value);
                    }}
                  />
                )}
              />
              {errors.cep && <span className={styles.errorMessage}>{errors.cep.message}</span>}
            </div>
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup} style={{ flex: '1' }}>
              <label htmlFor="street">Rua</label>
              <input
                type="text"
                id="street"
                placeholder="Preenchido automaticamente pelo CEP"
                className={`${errors.street ? styles.inputError : ''} ${styles.readonlyInput}`}
                readOnly
                {...formRegister('street')}
              />
              {errors.street && (
                <span className={styles.errorMessage}>{errors.street.message}</span>
              )}
            </div>

            <div className={styles.inputGroup} style={{ flex: '0 0 100px' }}>
              <label htmlFor="number">Número</label>
              <input
                type="text"
                id="number"
                placeholder="Nº"
                className={errors.number ? styles.inputError : ''}
                {...formRegister('number')}
              />
              {errors.number && (
                <span className={styles.errorMessage}>{errors.number.message}</span>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="complement">Complemento</label>
            <input
              type="text"
              id="complement"
              placeholder="Apto, sala, bloco (opcional)"
              {...formRegister('complement')}
            />
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="neighborhood">Bairro</label>
              <input
                type="text"
                id="neighborhood"
                placeholder="Preenchido automaticamente pelo CEP"
                className={`${errors.neighborhood ? styles.inputError : ''} ${styles.readonlyInput}`}
                readOnly
                {...formRegister('neighborhood')}
              />
              {errors.neighborhood && (
                <span className={styles.errorMessage}>{errors.neighborhood.message}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="city">Cidade</label>
              <input
                type="text"
                id="city"
                placeholder="Preenchido automaticamente pelo CEP"
                className={`${errors.city ? styles.inputError : ''} ${styles.readonlyInput}`}
                readOnly
                {...formRegister('city')}
              />
              {errors.city && <span className={styles.errorMessage}>{errors.city.message}</span>}
            </div>

            <div className={styles.inputGroupSmall}>
              <label htmlFor="state">Estado</label>
              <input
                type="text"
                id="state"
                placeholder="UF"
                maxLength={2}
                className={`${errors.state ? styles.inputError : ''} ${styles.readonlyInput}`}
                readOnly
                {...formRegister('state')}
              />
              {errors.state && <span className={styles.errorMessage}>{errors.state.message}</span>}
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Segurança</h3>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="Digite sua senha"
              className={errors.password ? styles.inputError : ''}
              {...formRegister('password')}
            />
            {errors.password && (
              <span className={styles.errorMessage}>{errors.password.message}</span>
            )}
          </div>

          <div className={styles.termsGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={errors.terms ? styles.inputError : ''}
                {...formRegister('terms')}
              />
              <span>
                Li e concordo com os{' '}
                <Link href="/termos-de-uso" target="_blank">
                  termos de uso
                </Link>{' '}
                e{' '}
                <Link href="/politica-de-privacidade" target="_blank">
                  política de privacidade
                </Link>
              </span>
            </label>
            {errors.terms && <span className={styles.errorMessage}>{errors.terms.message}</span>}
          </div>

          <button type="submit" className={styles.registerButton}>
            Concluir Cadastro
          </button>
        </form>

        <p className={styles.loginText}>
          Já tem uma conta? <Link href="/login">Faça login</Link>
        </p>
      </div>
    </div>
  );
}
