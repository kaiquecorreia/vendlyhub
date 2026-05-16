'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Modal from '@/app/components/Modal';
import { OrdersList } from '@/app/components/orders/OrdersList';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  buildCatalogFromApiProducts,
  buildPreviewCatalogFromDraft,
  clearPendingProductDraft,
  dataUrlByteLength,
  dataUrlToFile,
  loadPendingProductDraft,
  savePendingProductDraft,
  type PendingProductDraft,
} from '@/app/lib/pendingProductDraft';
import { buildCatalogUrl } from '@/app/lib/mobileSlug';
import { productService } from '@/app/services/productService';
import { profileService, type UserProfile } from '@/app/services/profileService';
import { normalizeApiError } from '@/app/services/apiClient';
import { orderService } from '@/app/services/orderService';
import type { CatalogCategory, CatalogProduct, Company } from '@/app/types/catalog';
import type { ManagedOrder } from '@/app/types/order';
import { CatalogView } from '../[slug]/components/CatalogView';
import { PreviewProductModal, type PreviewProductModalResult } from './PreviewProductModal';
import styles from '@/app/catalog/[slug]/catalog.module.scss';

interface AuthCatalogData {
  company: Company;
  categories: CatalogCategory[];
  highlightedProducts: CatalogProduct[];
  catalogUrl: string;
}

export default function CatalogPreviewPage() {
  const { registerMinimal, refreshUser, logout, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [draft, setDraft] = useState<PendingProductDraft | null | undefined>(undefined);
  const [authCatalog, setAuthCatalog] = useState<AuthCatalogData | null>(null);
  const [authDataLoading, setAuthDataLoading] = useState(false);
  const [authDataError, setAuthDataError] = useState<string | null>(null);
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const profileRef = useRef<UserProfile | null>(null);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingPix, setIsSavingPix] = useState(false);
  const [pixCopyPaste, setPixCopyPaste] = useState('');
  const [form, setForm] = useState({
    establishmentName: '',
    whatsapp: '',
    password: '',
    logo: null as File | null,
    pixCopyPaste: '',
  });

  const hasSession =
    Boolean(user) ||
    (typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken')));
  const isProfileReady = Boolean(user?.minimalProfileCompleted);

  useEffect(() => {
    if (!authLoading && !hasSession && draft === null) {
      router.replace('/fast-onboarding');
    }
  }, [authLoading, hasSession, draft, router]);

  const buildAndSetCatalog = useCallback(
    (products: Awaited<ReturnType<typeof productService.listProducts>>, profile: UserProfile) => {
      const { company, categories, highlightedProducts } = buildCatalogFromApiProducts(
        products,
        profile,
      );

      const catalogUrl =
        buildCatalogUrl(window.location.origin, profile.establishment?.mobile_number) ?? '';

      setAuthCatalog({ company, categories, highlightedProducts, catalogUrl });
    },
    [],
  );

  const loadAuthCatalogData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setAuthCatalog(null);
      return;
    }

    setAuthDataError(null);
    setAuthDataLoading(true);
    try {
      const [products, profile] = await Promise.all([
        productService.listProducts(),
        profileService.getProfile(token),
      ]);

      profileRef.current = profile;
      setPixCopyPaste(profile.establishment?.pixCopyPaste ?? '');
      buildAndSetCatalog(products, profile);
    } catch (err) {
      console.error('Failed to load authenticated catalog data:', err);
      setAuthCatalog(null);
      setAuthDataError('Erro ao carregar dados do catálogo.');
      toast.error('Erro ao carregar dados do catálogo.');
    } finally {
      setAuthDataLoading(false);
    }
  }, [buildAndSetCatalog]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const nextOrders = await orderService.listOrders({ limit: 20 });
      setOrders(nextOrders);
    } catch (err) {
      setOrdersError(normalizeApiError(err, 'Erro ao carregar pedidos.'));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const reloadProducts = useCallback(async (): Promise<boolean> => {
    try {
      let profile = profileRef.current;

      if (!profile) {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          toast.error('Sua sessão expirou. Faça login novamente.');
          return false;
        }
        profile = await profileService.getProfile(token);
        profileRef.current = profile;
      }

      const products = await productService.listProducts();
      buildAndSetCatalog(products, profile);
      return true;
    } catch (err) {
      console.error('Failed to reload products:', err);
      toast.error('Erro ao atualizar produtos.');
      return false;
    }
  }, [buildAndSetCatalog]);

  useEffect(() => {
    if (!authLoading && !hasSession) {
      setDraft(loadPendingProductDraft());
    }
  }, [authLoading, hasSession]);

  useEffect(() => {
    if (!authLoading && hasSession) {
      void loadAuthCatalogData();
      void loadOrders();
    }
  }, [authLoading, hasSession, loadAuthCatalogData, loadOrders]);

  const handleConfirmSale = async (orderId: string) => {
    setConfirmingOrderId(orderId);
    try {
      const updated = await orderService.confirmOrder(orderId);
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await reloadProducts();
      toast.success('Venda confirmada e estoque atualizado.');
    } catch (err) {
      toast.error(normalizeApiError(err, 'Não foi possível confirmar a venda.'));
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const toDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Falha ao ler imagem'));
      reader.readAsDataURL(file);
    });

  const updateDraft = (nextDraft: PendingProductDraft) => {
    setDraft(nextDraft);
    savePendingProductDraft(nextDraft);
  };

  // --- Draft mode handlers ---

  const handleDraftAddProductSubmit = (data: PreviewProductModalResult) => {
    if (!draft) return;
    const nextDraft: PendingProductDraft = {
      ...draft,
      products: [
        ...draft.products,
        {
          id: `preview-product-${Date.now()}`,
          name: data.name,
          salePrice: data.salePrice,
          stockQuantity: data.stockQuantity,
          imageDataUrl: data.imageDataUrl,
        },
      ],
    };
    updateDraft(nextDraft);
    toast.success('Produto adicionado à prévia');
  };

  const handlePreviewStockChange = (productId: string, nextStock: number) => {
    if (!draft) return;
    const nextDraft: PendingProductDraft = {
      ...draft,
      products: draft.products.map((product) =>
        product.id === productId ? { ...product, stockQuantity: nextStock } : product,
      ),
    };
    updateDraft(nextDraft);
  };

  const handlePreviewImageChange = async (productId: string, file: File) => {
    const imageDataUrl = await toDataUrl(file);
    if (!draft) return;
    const nextDraft: PendingProductDraft = {
      ...draft,
      products: draft.products.map((product) =>
        product.id === productId ? { ...product, imageDataUrl } : product,
      ),
    };
    updateDraft(nextDraft);
  };

  const handlePickStoreLogo = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5 MB');
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      toast.error('Use JPG, PNG ou WebP');
      return;
    }
    const dataUrl = await toDataUrl(file);
    if (dataUrlByteLength(dataUrl) > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5 MB');
      return;
    }
    if (!draft) return;
    updateDraft({ ...draft, storeLogoDataUrl: dataUrl });
  };

  const handleStoreDisplayNameChange = (name: string) => {
    if (!draft) return;
    updateDraft({ ...draft, storeDisplayName: name });
  };

  const handleDraftPixCopyPasteChange = (value: string) => {
    if (!draft) return;
    updateDraft({ ...draft, pixCopyPaste: value });
  };

  // --- Auth mode handlers ---

  const handleAuthPickLogo = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2 MB');
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      toast.error('Use JPG, PNG ou WebP');
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await profileService.updateEstablishmentLogo(file, token);
      toast.success('Foto atualizada!');
      await loadAuthCatalogData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar a foto.');
    }
  };

  const handleAuthStockChange = async (productId: string, nextStock: number) => {
    try {
      await productService.updateProductStock(productId, nextStock);
      const reloaded = await reloadProducts();
      if (!reloaded) return;
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar estoque.');
    }
  };

  const handleAuthImageChange = async (productId: string, file: File) => {
    try {
      await productService.updateProductImage(productId, file);
      const reloaded = await reloadProducts();
      if (!reloaded) return;
      toast.success('Foto atualizada!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar a foto.');
    }
  };

  const handleAuthAddProductSubmit = async (data: PreviewProductModalResult) => {
    try {
      const imageFile =
        data.imageDataUrl && data.imageDataUrl.length > 0
          ? dataUrlToFile(data.imageDataUrl, 'product-image.webp')
          : null;

      await productService.createProduct({
        name: data.name,
        salePrice: data.salePrice,
        stockQuantity: data.stockQuantity,
        sku: '',
        categoryId: '',
        brand: '',
        model: '',
        description: '',
        discount: 0,
        cost: 0,
        unit: '',
        reservedStock: 0,
        soldQuantity: 0,
        minStock: 0,
        supplier: '',
        status: 'active',
        image: imageFile,
      });
      const reloaded = await reloadProducts();
      if (!reloaded) return;
      toast.success('Produto criado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar produto.');
    }
  };

  // --- Registration flow ---

  const handleMinimalRegister = async () => {
    if (!draft) return;
    const establishmentName = form.establishmentName.trim();
    const whatsapp = form.whatsapp.trim();
    const password = form.password.trim();
    if (!establishmentName || !whatsapp || password.length < 8) {
      toast.error('Preencha nome, WhatsApp e senha (mínimo 8 caracteres).');
      return;
    }

    setIsSubmitting(true);
    try {
      let logoFile = form.logo;
      if (!logoFile && draft.storeLogoDataUrl) {
        logoFile = dataUrlToFile(draft.storeLogoDataUrl, 'logo.webp') ?? null;
      }

      await registerMinimal({
        establishmentName,
        whatsapp,
        password,
        logo: logoFile ?? undefined,
        pixCopyPaste: form.pixCopyPaste.trim() || undefined,
      });
      await productService.createProductsFromPendingDraft(draft);

      const refreshedUser = await refreshUser();
      if (!refreshedUser) {
        throw new Error('Sessão não encontrada');
      }

      const reloaded = await reloadProducts();
      if (!reloaded) {
        throw new Error('Falha ao recarregar catálogo após cadastro');
      }

      clearPendingProductDraft();
      setDraft(null);
      setIsRegisterModalOpen(false);
      toast.success('Cadastro concluído! Seu catálogo está ativo.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível concluir agora. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCatalogUrl = async () => {
    const url = authCatalog?.catalogUrl;
    if (!url) {
      toast.info(
        'Cadastre um celular com DDD no formato nacional para gerar o link público do catálogo.',
      );
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado!');
        return;
      }
    } catch {
      /* fallback below */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success('Link copiado!');
    } catch {
      toast.error('Selecione o link e copie manualmente.');
    }
  };

  const handleOpenLogoutConfirm = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutConfirmOpen(false);
    } catch {
      toast.error('Não foi possível sair agora. Tente novamente.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const openRegisterModal = () => {
    setForm((prev) => ({
      ...prev,
      establishmentName: draft?.storeDisplayName?.trim() ?? prev.establishmentName,
      pixCopyPaste: draft?.pixCopyPaste?.trim() ?? prev.pixCopyPaste,
    }));
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  const handleSavePixFromPreview = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Não foi possível localizar seu estabelecimento.');
      return;
    }

    setIsSavingPix(true);
    try {
      await profileService.updateEstablishmentPix(
        { pixCopyPaste: pixCopyPaste.trim() || null },
        token,
      );
      await loadAuthCatalogData();
      toast.success('Código Pix atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível atualizar o Pix.');
    } finally {
      setIsSavingPix(false);
    }
  };

  // --- Loading states ---

  if (authLoading || (hasSession && authDataLoading && !authCatalog)) {
    return (
      <div className={styles.catalogContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <h2>Carregando catálogo...</h2>
        </div>
      </div>
    );
  }

  // --- Authenticated mode ---

  if (hasSession && authCatalog) {
    return (
      <>
        <CatalogView
          slug="preview"
          company={authCatalog.company}
          categories={authCatalog.categories}
          highlightedProducts={authCatalog.highlightedProducts}
          disableCartActions
          preProductsContent={
            <>
              <section className={styles.previewPixSection}>
                <div className={styles.previewPixCardHeader}>
                  <h2>Pagamento via Pix</h2>
                  <p>Cadastre aqui o código Pix Copia e Cola usado no checkout do catálogo.</p>
                </div>
                <div className={styles.previewPixCardBody}>
                  <label htmlFor="previewPixCode">Código Pix Copia e Cola</label>
                  <textarea
                    id="previewPixCode"
                    rows={4}
                    className={styles.previewPixTextarea}
                    value={pixCopyPaste}
                    onChange={(event) => setPixCopyPaste(event.target.value)}
                    placeholder="Cole aqui o código Pix Copia e Cola"
                  />
                </div>
                <div className={styles.previewPixCardActions}>
                  <button
                    type="button"
                    className={styles.previewPixSaveButton}
                    onClick={() => void handleSavePixFromPreview()}
                    disabled={isSavingPix}
                  >
                    {isSavingPix ? 'Salvando...' : 'Salvar chave Pix'}
                  </button>
                </div>
              </section>
              <OrdersList
                orders={orders}
                loading={ordersLoading}
                error={ordersError}
                confirmingOrderId={confirmingOrderId}
                onConfirmSale={handleConfirmSale}
                title="Pedidos recentes"
                emptyMessage="Nenhum pedido realizado por enquanto."
              />
            </>
          }
          previewCta={{
            label: 'Copiar link do catálogo',
            onClick: () => void copyCatalogUrl(),
            variant: 'copy' as const,
          }}
          previewAdmin={{
            onAddProduct: () => setIsAddProductModalOpen(true),
            onPreviewImageChange: (productId, file) => void handleAuthImageChange(productId, file),
            onPreviewStockChange: (productId, nextStock) =>
              void handleAuthStockChange(productId, nextStock),
          }}
          onPickLogo={(file) => void handleAuthPickLogo(file)}
          authActions={{
            onLogout: handleOpenLogoutConfirm,
            userName: user?.name,
          }}
          dashboardHref="/"
        />
        <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)}>
          <PreviewProductModal
            onClose={() => setIsAddProductModalOpen(false)}
            onSubmit={(data) => void handleAuthAddProductSubmit(data)}
          />
        </Modal>
        <Modal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)}>
          <div className={styles.logoutConfirmModal}>
            <div className={styles.modalHeader}>
              <h2>Confirmar saída</h2>
            </div>
            <p className={styles.logoutConfirmText}>
              Tem certeza que deseja sair da sua conta agora?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.logoutConfirmButton}
                onClick={() => void handleConfirmLogout()}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Saindo...' : 'Confirmar saída'}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  if (hasSession && !authCatalog && !authDataLoading) {
    return (
      <div className={styles.catalogContainer}>
        <div className={styles.errorState}>
          <h2>{isProfileReady ? 'Erro ao carregar catálogo' : 'Finalizando seu cadastro'}</h2>
          <p>{authDataError ?? 'Não foi possível carregar seus produtos agora.'}</p>
          <button
            type="button"
            className={styles.previewCtaButton}
            style={{ marginTop: '1rem' }}
            onClick={() => {
              void loadAuthCatalogData();
              void loadOrders();
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // --- Draft mode (unauthenticated) ---

  if (draft === undefined) {
    return (
      <div className={styles.catalogContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <h2>Carregando prévia...</h2>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className={styles.catalogContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <h2>Redirecionando...</h2>
        </div>
      </div>
    );
  }

  const { company, categories, highlightedProducts } = buildPreviewCatalogFromDraft(draft);

  return (
    <>
      <CatalogView
        slug="preview"
        company={company}
        categories={categories}
        highlightedProducts={highlightedProducts}
        previewMode
        disableCartActions
        previewBanner="Esta é uma prévia do seu catálogo — complete o cadastro para ativar"
        previewCta={{
          label: 'Compartilhar e começar a vender',
          onClick: openRegisterModal,
          variant: 'share' as const,
        }}
        previewStoreEdit={{
          onPickLogo: handlePickStoreLogo,
          storeDisplayName: draft.storeDisplayName ?? '',
          onStoreDisplayNameChange: handleStoreDisplayNameChange,
        }}
        previewAdmin={{
          onAddProduct: () => setIsAddProductModalOpen(true),
          onPreviewStockChange: handlePreviewStockChange,
          onPreviewImageChange: handlePreviewImageChange,
        }}
      />
      {!isRegisterModalOpen && (
        <div className={styles.previewBottomBar}>
          <p className={styles.previewBottomBarText}>
            Complete suas informações e comece a vender já.
          </p>
          <button
            type="button"
            className={styles.previewBottomBarButton}
            onClick={openRegisterModal}
          >
            Completar cadastro
          </button>
        </div>
      )}

      <section className={styles.previewPixSectionDraft}>
        <div className={styles.previewPixCardHeader}>
          <h2>Pagamento via Pix</h2>
          <p>Você pode cadastrar seu código Pix Copia e Cola agora e finalizar depois.</p>
        </div>
        <div className={styles.previewPixCardBody}>
          <label htmlFor="previewDraftPixCode">Código Pix Copia e Cola</label>
          <textarea
            id="previewDraftPixCode"
            rows={4}
            className={styles.previewPixTextarea}
            value={draft.pixCopyPaste ?? ''}
            onChange={(event) => handleDraftPixCopyPasteChange(event.target.value)}
            placeholder="Cole aqui o código Pix Copia e Cola"
          />
        </div>
      </section>

      <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)}>
        <PreviewProductModal
          onClose={() => setIsAddProductModalOpen(false)}
          onSubmit={handleDraftAddProductSubmit}
        />
      </Modal>

      <Modal isOpen={isRegisterModalOpen} onClose={closeRegisterModal}>
        <div className={styles.minimalRegisterModal}>
          <div className={styles.modalHeader}>
            <h2>Complete seu cadastro</h2>
          </div>
          <div className={styles.orderForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="establishmentName">Nome do estabelecimento *</label>
              <input
                id="establishmentName"
                value={form.establishmentName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, establishmentName: event.target.value }))
                }
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="whatsapp">WhatsApp *</label>
              <input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(event) => setForm((prev) => ({ ...prev, whatsapp: event.target.value }))}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Senha *</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="logo">Foto do estabelecimento (opcional)</label>
              <input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, logo: event.target.files?.[0] ?? null }))
                }
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="pixCopyPaste">Código Pix Copia e Cola (opcional)</label>
              <textarea
                id="pixCopyPaste"
                rows={4}
                value={form.pixCopyPaste}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, pixCopyPaste: event.target.value }))
                }
                placeholder="Cole aqui o código Pix Copia e Cola"
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsRegisterModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleMinimalRegister}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar e liberar catálogo'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
