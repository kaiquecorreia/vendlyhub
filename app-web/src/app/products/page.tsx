'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  LayoutGrid,
  List,
  Search,
  FolderPlus,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { NumericFormat } from 'react-number-format';
import styles from './styles.module.scss';
import { productSchema, type ProductSchemaType } from './schema';
import { categorySchema, type CategorySchemaType } from '../categories/schema';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { profileService } from '../services/profileService';
import { normalizeApiError } from '../services/apiClient';
import { resolveMediaUrl, resolveProductImageUrl } from '../services/mediaUrl';
import { consumeHighlightShareCatalogFlag } from '../lib/postOnboarding';
import { buildCatalogUrl } from '../lib/mobileSlug';
import { Product, Category, UNITS } from '../types/product';
import Modal from '../components/Modal';
import categoryStyles from '../categories/styles.module.scss';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [isCatalogLinkModalOpen, setIsCatalogLinkModalOpen] = useState(false);
  const [catalogLinkCopied, setCatalogLinkCopied] = useState(false);
  const [catalogLink, setCatalogLink] = useState('');
  const [highlightShareCatalog, setHighlightShareCatalog] = useState(false);
  const [minimalProfileCompleted, setMinimalProfileCompleted] = useState(true);
  const [establishmentLogo, setEstablishmentLogo] = useState<string | null>(null);
  const [establishmentName, setEstablishmentName] = useState('');

  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategory,
    formState: { errors: categoryErrors },
  } = useForm<CategorySchemaType>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      brand: '',
      model: '',
      description: '',
      salePrice: 0,
      discount: 0,
      cost: 0,
      unit: 'Unidade',
      stockQuantity: 0,
      minStock: 0,
      supplier: '',
      supplierCode: '',
      ean: '',
      status: 'active',
      image: null,
    },
  });

  const salePrice = watch('salePrice');
  const cost = watch('cost');

  const margin = cost > 0 ? ((salePrice - cost) / cost) * 100 : 0;
  const formattedMargin = margin.toFixed(2);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.listProducts(),
        categoryService.listCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error(normalizeApiError(error, 'Erro ao carregar dados'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (consumeHighlightShareCatalogFlag()) {
      setHighlightShareCatalog(true);
    }
  }, []);

  const loadCatalogLink = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setCatalogLink('');
      setMinimalProfileCompleted(false);
      return;
    }

    try {
      const profile = await profileService.getProfile(accessToken);
      setMinimalProfileCompleted(profile.minimalProfileCompleted ?? true);
      setEstablishmentLogo(profile.establishment?.logo ?? null);
      setEstablishmentName(profile.establishment?.name ?? '');
      const nextCatalogLink = buildCatalogUrl(
        window.location.origin,
        profile.establishment?.mobile_number,
      );
      setCatalogLink(nextCatalogLink ?? '');
    } catch {
      setCatalogLink('');
      setMinimalProfileCompleted(false);
      setEstablishmentLogo(null);
      setEstablishmentName('');
    }
  }, []);

  useEffect(() => {
    void loadCatalogLink();
  }, [loadCatalogLink]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void loadCatalogLink();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadCatalogLink();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadCatalogLink]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setImagePreview(resolveMediaUrl(product.imageUrl) ?? null);
      reset({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        brand: product.brand,
        model: product.model,
        description: product.description,
        salePrice: product.salePrice,
        discount: product.discount || 0,
        cost: product.cost,
        unit: product.unit,
        stockQuantity: product.stockQuantity,
        minStock: product.minStock,
        supplier: product.supplier,
        supplierCode: product.supplierCode,
        ean: product.ean,
        status: product.status,
        image: null,
      });
    } else {
      setEditingProduct(null);
      setImagePreview(null);
      reset({
        name: '',
        sku: '',
        categoryId: '',
        brand: '',
        model: '',
        description: '',
        salePrice: 0,
        discount: 0,
        cost: 0,
        unit: 'Unidade',
        stockQuantity: 0,
        minStock: 0,
        supplier: '',
        supplierCode: '',
        ean: '',
        status: 'active',
        image: null,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImagePreview(null);
    reset();
  };

  const onSubmit = async (data: ProductSchemaType) => {
    setSubmitting(true);
    try {
      const formData = {
        ...data,
        salePrice: Number(data.salePrice),
        discount: Number(data.discount),
        cost: Number(data.cost),
        stockQuantity: Number(data.stockQuantity),
        reservedStock: editingProduct?.reservedStock || 0,
        soldQuantity: editingProduct?.soldQuantity || 0,
        minStock: Number(data.minStock),
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await productService.createProduct(formData);
        toast.success('Produto cadastrado com sucesso!');
      }
      await loadData();
      closeModal();
    } catch (error) {
      toast.error(normalizeApiError(error, 'Erro ao salvar produto'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await productService.deleteProduct(id);
      toast.success('Produto excluído com sucesso!');
      await loadData();
    } catch (error) {
      toast.error(normalizeApiError(error, 'Erro ao excluir produto'));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCategoryOptions = () => {
    return categories.map((c) => ({ id: c.id, name: c.name }));
  };

  const openCategoryModal = () => {
    resetCategory({
      name: '',
      description: '',
      status: 'active',
    });
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    resetCategory();
  };

  const onCategorySubmit = async (data: CategorySchemaType) => {
    setSubmittingCategory(true);
    try {
      await categoryService.createCategory({
        name: data.name,
        description: data.description,
        status: data.status,
      });
      toast.success('Categoria criada com sucesso!');
      await loadData();
      closeCategoryModal();
    } catch (error) {
      toast.error(normalizeApiError(error, 'Erro ao criar categoria'));
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleCopyCatalogLink = async () => {
    const link = catalogLink;
    if (!link) {
      toast.error('Link do catálogo indisponível no momento');
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCatalogLinkCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCatalogLinkCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const getStockLevel = (product: Product): 'normal' | 'medium' | 'low' => {
    if (product.minStock === 0) return 'normal';
    const percentage = (product.stockQuantity / product.minStock) * 100;
    if (percentage < 30) return 'low';
    if (percentage < 50) return 'medium';
    return 'normal';
  };

  const getProductImageUrl = (product: Product) =>
    resolveProductImageUrl(product.imageUrl, establishmentLogo);

  const hasProductOwnImage = (product: Product) => Boolean(product.imageUrl?.trim());

  const establishmentInitial = establishmentName.trim().charAt(0).toUpperCase() || '?';

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || p.categoryId === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'price') comparison = a.salePrice - b.salePrice;
      else if (sortBy === 'stock') comparison = a.stockQuantity - b.stockQuantity;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const groupedProducts = groupByCategory
    ? categories.reduce(
        (acc, cat) => {
          const catProducts = filteredProducts.filter((p) => p.categoryId === cat.id);
          if (catProducts.length > 0) {
            acc.push({ category: cat, products: catProducts });
          }
          return acc;
        },
        [] as { category: Category; products: Product[] }[],
      )
    : null;

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gerenciamento de Produtos</h1>
        <div className={styles.headerButtons}>
          <button
            className={highlightShareCatalog ? styles.shareCatalogCta : styles.secondaryButton}
            disabled={!catalogLink}
            onClick={() => {
              if (!minimalProfileCompleted) {
                toast.info('Complete nome, WhatsApp e senha para liberar o compartilhamento.');
                return;
              }
              if (!catalogLink) {
                toast.info(
                  'Cadastre um WhatsApp com DDD no formato nacional para gerar o link público do catálogo.',
                );
                return;
              }
              setIsCatalogLinkModalOpen(true);
            }}
          >
            <Link2 size={18} />
            <span>{highlightShareCatalog ? 'Compartilhar catálogo' : 'Link do Catálogo'}</span>
          </button>
          <button className={styles.secondaryButton} onClick={openCategoryModal}>
            <FolderPlus size={18} />
            <span>Nova Categoria</span>
          </button>
          <button className={styles.addButton} onClick={() => openModal()}>
            <Plus size={18} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todas as categorias</option>
            {getCategoryOptions().map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
            className={styles.filterSelect}
          >
            <option value="name">Ordenar por nome</option>
            <option value="price">Ordenar por preço</option>
            <option value="stock">Ordenar por estoque</option>
          </select>
          <button
            className={styles.sortButton}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        <div className={styles.viewOptions}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={groupByCategory}
              onChange={(e) => setGroupByCategory(e.target.checked)}
            />
            Agrupar por categoria
          </label>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
              title="Visualização em tabela"
            >
              <List size={18} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'cards' ? styles.active : ''}`}
              onClick={() => setViewMode('cards')}
              title="Visualização em cards"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            {products.length === 0
              ? 'Nenhum produto cadastrado. Clique em "Novo Produto" para começar.'
              : 'Nenhum produto encontrado com os filtros aplicados.'}
          </div>
        </div>
      ) : groupByCategory && groupedProducts ? (
        <div className={styles.groupedView}>
          {groupedProducts.map(({ category, products: catProducts }) => (
            <div key={category.id} className={styles.categoryGroup}>
              <h3 className={styles.categoryGroupTitle}>{category.name}</h3>
              {viewMode === 'table' ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th></th>
                        <th>Nome</th>
                        <th>SKU</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Reservado</th>
                        <th>Vendidos</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className={styles.productImageStack}>
                              {getProductImageUrl(product) ? (
                                <img
                                  src={getProductImageUrl(product)}
                                  alt={product.name}
                                  className={styles.productImage}
                                />
                              ) : (
                                <div className={styles.productImagePlaceholder}>
                                  <span className={styles.productImageFallbackInitial}>
                                    {establishmentInitial}
                                  </span>
                                </div>
                              )}
                              {!hasProductOwnImage(product) && (
                                <span className={styles.missingProductPhotoNotice}>
                                  Produto sem foto
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{product.name}</td>
                          <td>{product.sku}</td>
                          <td className={styles.price}>{formatCurrency(product.salePrice)}</td>
                          <td
                            className={
                              styles[
                                `stock${getStockLevel(product).charAt(0).toUpperCase() + getStockLevel(product).slice(1)}`
                              ]
                            }
                          >
                            {product.stockQuantity} {product.unit}
                          </td>
                          <td>{product.reservedStock}</td>
                          <td>{product.soldQuantity}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[product.status]}`}>
                              {product.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className={styles.actionButton}
                                onClick={() => openModal(product)}
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className={`${styles.actionButton} ${styles.delete}`}
                                onClick={() => handleDelete(product.id)}
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.cardsGrid}>
                  {catProducts.map((product) => (
                    <div key={product.id} className={styles.productCard}>
                      <div className={styles.productCardImage}>
                        {getProductImageUrl(product) ? (
                          <img src={getProductImageUrl(product)} alt={product.name} />
                        ) : (
                          <div className={styles.productImagePlaceholder}>
                            <span className={styles.productImageFallbackInitial}>
                              {establishmentInitial}
                            </span>
                          </div>
                        )}
                      </div>
                      {!hasProductOwnImage(product) && (
                        <p className={styles.missingProductPhotoNotice}>Produto sem foto</p>
                      )}
                      <div className={styles.productCardContent}>
                        <h4>{product.name}</h4>
                        <p className={styles.sku}>{product.sku}</p>
                        <p className={styles.price}>{formatCurrency(product.salePrice)}</p>
                        <div className={styles.stockInfo}>
                          <span
                            className={
                              styles[
                                `stock${getStockLevel(product).charAt(0).toUpperCase() + getStockLevel(product).slice(1)}`
                              ]
                            }
                          >
                            Estoque: {product.stockQuantity}
                          </span>
                          <span>Reservado: {product.reservedStock}</span>
                          <span>Vendidos: {product.soldQuantity}</span>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[product.status]}`}>
                          {product.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className={styles.productCardActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => openModal(product)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.delete}`}
                          onClick={() => handleDelete(product.id)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Nome</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Reservado</th>
                  <th>Vendidos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productImageStack}>
                        {getProductImageUrl(product) ? (
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className={styles.productImage}
                          />
                        ) : (
                          <div className={styles.productImagePlaceholder}>
                            <span className={styles.productImageFallbackInitial}>
                              {establishmentInitial}
                            </span>
                          </div>
                        )}
                        {!hasProductOwnImage(product) && (
                          <span className={styles.missingProductPhotoNotice}>Produto sem foto</span>
                        )}
                      </div>
                    </td>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.categoryName}</td>
                    <td className={styles.price}>{formatCurrency(product.salePrice)}</td>
                    <td
                      className={
                        styles[
                          `stock${getStockLevel(product).charAt(0).toUpperCase() + getStockLevel(product).slice(1)}`
                        ]
                      }
                    >
                      {product.stockQuantity} {product.unit}
                    </td>
                    <td>{product.reservedStock}</td>
                    <td>{product.soldQuantity}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[product.status]}`}>
                        {product.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => openModal(product)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.delete}`}
                          onClick={() => handleDelete(product.id)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.mobileCards}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.productImageStack}>
                    {getProductImageUrl(product) ? (
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.productImagePlaceholder}>
                        <span className={styles.productImageFallbackInitial}>
                          {establishmentInitial}
                        </span>
                      </div>
                    )}
                    {!hasProductOwnImage(product) && (
                      <span className={styles.missingProductPhotoNotice}>Produto sem foto</span>
                    )}
                  </div>
                  <div className={styles.mobileCardInfo}>
                    <h4>{product.name}</h4>
                    <span>{product.sku}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[product.status]}`}>
                    {product.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardField}>
                    <label>Categoria</label>
                    <span>{product.categoryName}</span>
                  </div>
                  <div className={styles.mobileCardField}>
                    <label>Preço</label>
                    <span className={styles.price}>{formatCurrency(product.salePrice)}</span>
                  </div>
                  <div className={styles.mobileCardField}>
                    <label>Estoque</label>
                    <span
                      className={
                        styles[
                          `stock${getStockLevel(product).charAt(0).toUpperCase() + getStockLevel(product).slice(1)}`
                        ]
                      }
                    >
                      {product.stockQuantity} {product.unit}
                    </span>
                  </div>
                  <div className={styles.mobileCardField}>
                    <label>Reservado</label>
                    <span>{product.reservedStock}</span>
                  </div>
                </div>
                <div className={styles.mobileCardFooter}>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => openModal(product)}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.delete}`}
                      onClick={() => handleDelete(product.id)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.cardsGrid}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productCardImage}>
                {getProductImageUrl(product) ? (
                  <img src={getProductImageUrl(product)} alt={product.name} />
                ) : (
                  <div className={styles.productImagePlaceholder}>
                    <span className={styles.productImageFallbackInitial}>
                      {establishmentInitial}
                    </span>
                  </div>
                )}
              </div>
              {!hasProductOwnImage(product) && (
                <p className={styles.missingProductPhotoNotice}>Produto sem foto</p>
              )}
              <div className={styles.productCardContent}>
                <h4>{product.name}</h4>
                <p className={styles.sku}>{product.sku}</p>
                <p className={styles.categoryName}>{product.categoryName}</p>
                <p className={styles.price}>{formatCurrency(product.salePrice)}</p>
                <div className={styles.stockInfo}>
                  <span
                    className={
                      styles[
                        `stock${getStockLevel(product).charAt(0).toUpperCase() + getStockLevel(product).slice(1)}`
                      ]
                    }
                  >
                    Estoque: {product.stockQuantity}
                  </span>
                  <span>Reservado: {product.reservedStock}</span>
                  <span>Vendidos: {product.soldQuantity}</span>
                </div>
                <span className={`${styles.statusBadge} ${styles[product.status]}`}>
                  {product.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className={styles.productCardActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => openModal(product)}
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className={`${styles.actionButton} ${styles.delete}`}
                  onClick={() => handleDelete(product.id)}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className={styles.modalContent}>
          <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.formSection}>
              <h3>Imagem do Produto</h3>
              <div className={styles.imageUpload}>
                <div className={styles.imagePreviewContainer}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <ImageIcon size={32} />
                      <span>Clique para adicionar</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className={styles.imageInput}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Informações Básicas</h3>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Nome do produto *</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Ex: Coca-Cola 2L"
                    className={errors.name ? styles.inputError : ''}
                    {...register('name')}
                  />
                  {errors.name && (
                    <span className={styles.errorMessage}>{errors.name.message}</span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="sku">SKU / Código interno *</label>
                  <input
                    type="text"
                    id="sku"
                    placeholder="Ex: BEB-COCA-2L"
                    className={errors.sku ? styles.inputError : ''}
                    {...register('sku')}
                  />
                  {errors.sku && <span className={styles.errorMessage}>{errors.sku.message}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="categoryId">Categoria *</label>
                  <select
                    id="categoryId"
                    className={errors.categoryId ? styles.inputError : ''}
                    {...register('categoryId')}
                  >
                    <option value="">Selecione uma categoria</option>
                    {getCategoryOptions().map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <span className={styles.errorMessage}>{errors.categoryId.message}</span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="unit">Unidade de medida *</label>
                  <select
                    id="unit"
                    className={errors.unit ? styles.inputError : ''}
                    {...register('unit')}
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  {errors.unit && (
                    <span className={styles.errorMessage}>{errors.unit.message}</span>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="brand">Marca *</label>
                  <input
                    type="text"
                    id="brand"
                    placeholder="Ex: Coca-Cola"
                    className={errors.brand ? styles.inputError : ''}
                    {...register('brand')}
                  />
                  {errors.brand && (
                    <span className={styles.errorMessage}>{errors.brand.message}</span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="model">Modelo *</label>
                  <input
                    type="text"
                    id="model"
                    placeholder="Ex: Garrafa PET 2 Litros"
                    className={errors.model ? styles.inputError : ''}
                    {...register('model')}
                  />
                  {errors.model && (
                    <span className={styles.errorMessage}>{errors.model.message}</span>
                  )}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="description">Descrição *</label>
                <textarea
                  id="description"
                  placeholder="Descreva o produto..."
                  className={errors.description ? styles.inputError : ''}
                  {...register('description')}
                />
                {errors.description && (
                  <span className={styles.errorMessage}>{errors.description.message}</span>
                )}
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Preços e Margem</h3>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="salePrice">Preço de venda *</label>
                  <Controller
                    name="salePrice"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <NumericFormat
                        {...field}
                        value={value}
                        onValueChange={(values) => onChange(values.floatValue || 0)}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        placeholder="R$ 0,00"
                        className={errors.salePrice ? styles.inputError : ''}
                      />
                    )}
                  />
                  {errors.salePrice && (
                    <span className={styles.errorMessage}>{errors.salePrice.message}</span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="discount">Desconto (%)</label>
                  <Controller
                    name="discount"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <NumericFormat
                        {...field}
                        value={value}
                        onValueChange={(values) => onChange(values.floatValue || 0)}
                        decimalSeparator=","
                        suffix="%"
                        decimalScale={2}
                        allowNegative={false}
                        isAllowed={(values) => !values.floatValue || values.floatValue <= 100}
                        placeholder="0%"
                        className={errors.discount ? styles.inputError : ''}
                      />
                    )}
                  />
                  {errors.discount && (
                    <span className={styles.errorMessage}>{errors.discount.message}</span>
                  )}
                </div>
              </div>
              <div className={styles.formRow3}>
                <div className={styles.inputGroup}>
                  <label htmlFor="cost">Custo *</label>
                  <Controller
                    name="cost"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <NumericFormat
                        {...field}
                        value={value}
                        onValueChange={(values) => onChange(values.floatValue || 0)}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        placeholder="R$ 0,00"
                        className={errors.cost ? styles.inputError : ''}
                      />
                    )}
                  />
                  {errors.cost && (
                    <span className={styles.errorMessage}>{errors.cost.message}</span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label>Margem</label>
                  <div
                    className={`${styles.marginDisplay} ${margin >= 0 ? styles.positive : styles.negative}`}
                  >
                    {formattedMargin}%
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Estoque</h3>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="stockQuantity">Quantidade em estoque *</label>
                  <Controller
                    name="stockQuantity"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <NumericFormat
                        {...field}
                        value={value}
                        onValueChange={(values) => onChange(values.floatValue || 0)}
                        decimalScale={0}
                        allowNegative={false}
                        placeholder="0"
                        className={errors.stockQuantity ? styles.inputError : ''}
                      />
                    )}
                  />
                  {errors.stockQuantity && (
                    <span className={styles.errorMessage}>{errors.stockQuantity.message}</span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="minStock">Estoque mínimo *</label>
                  <Controller
                    name="minStock"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <NumericFormat
                        {...field}
                        value={value}
                        onValueChange={(values) => onChange(values.floatValue || 0)}
                        decimalScale={0}
                        allowNegative={false}
                        placeholder="0"
                        className={errors.minStock ? styles.inputError : ''}
                      />
                    )}
                  />
                  {errors.minStock && (
                    <span className={styles.errorMessage}>{errors.minStock.message}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Fornecedor e Códigos</h3>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="supplier">Fornecedor *</label>
                  <input
                    type="text"
                    id="supplier"
                    placeholder="Ex: Distribuidora Bebidas"
                    className={errors.supplier ? styles.inputError : ''}
                    {...register('supplier')}
                  />
                  {errors.supplier && (
                    <span className={styles.errorMessage}>{errors.supplier.message}</span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="supplierCode">Código do fornecedor</label>
                  <input
                    type="text"
                    id="supplierCode"
                    placeholder="Ex: COCA-2L-001"
                    className={errors.supplierCode ? styles.inputError : ''}
                    {...register('supplierCode')}
                  />
                  {errors.supplierCode && (
                    <span className={styles.errorMessage}>{errors.supplierCode.message}</span>
                  )}
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="ean">EAN / Código de barras</label>
                  <Controller
                    name="ean"
                    control={control}
                    render={({ field }) => (
                      <NumericFormat
                        {...field}
                        decimalScale={0}
                        allowNegative={false}
                        maxLength={13}
                        placeholder="7891234567890"
                        className={errors.ean ? styles.inputError : ''}
                      />
                    )}
                  />
                  {errors.ean && <span className={styles.errorMessage}>{errors.ean.message}</span>}
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Status</h3>
              <div className={styles.inputGroup}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" value="active" {...register('status')} />
                    <span>Ativo</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" value="inactive" {...register('status')} />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={closeModal}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitButton} disabled={submitting}>
                {submitting ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal}>
        <div className={categoryStyles.modalContent}>
          <h2>Nova Categoria</h2>
          <form className={categoryStyles.form} onSubmit={handleSubmitCategory(onCategorySubmit)}>
            <div className={categoryStyles.inputGroup}>
              <label htmlFor="categoryName">Nome da categoria *</label>
              <input
                type="text"
                id="categoryName"
                placeholder="Ex: Bebidas"
                className={categoryErrors.name ? categoryStyles.inputError : ''}
                {...registerCategory('name')}
              />
              {categoryErrors.name && (
                <span className={categoryStyles.errorMessage}>{categoryErrors.name.message}</span>
              )}
            </div>

            <div className={categoryStyles.inputGroup}>
              <label htmlFor="categoryDescription">Descrição</label>
              <textarea
                id="categoryDescription"
                placeholder="Descrição da categoria (opcional)"
                className={categoryErrors.description ? categoryStyles.inputError : ''}
                {...registerCategory('description')}
              />
              {categoryErrors.description && (
                <span className={categoryStyles.errorMessage}>
                  {categoryErrors.description.message}
                </span>
              )}
            </div>

            <div className={categoryStyles.inputGroup}>
              <label>Status</label>
              <div className={categoryStyles.radioGroup}>
                <label className={categoryStyles.radioLabel}>
                  <input type="radio" value="active" {...registerCategory('status')} />
                  <span>Ativo</span>
                </label>
                <label className={categoryStyles.radioLabel}>
                  <input type="radio" value="inactive" {...registerCategory('status')} />
                  <span>Inativo</span>
                </label>
              </div>
            </div>

            <div className={categoryStyles.formActions}>
              <button
                type="button"
                className={categoryStyles.cancelButton}
                onClick={closeCategoryModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={categoryStyles.submitButton}
                disabled={submittingCategory}
              >
                {submittingCategory ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isCatalogLinkModalOpen} onClose={() => setIsCatalogLinkModalOpen(false)}>
        <div className={categoryStyles.modalContent}>
          <h2>{highlightShareCatalog ? 'Compartilhar catálogo' : 'Link do Catálogo'}</h2>
          <p
            style={{
              marginBottom: '1rem',
              color: 'var(--secondary-text-color)',
              fontSize: '0.875rem',
            }}
          >
            Compartilhe este link com seus clientes para que possam visualizar seu catálogo e fazer
            pedidos.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={catalogLink}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--alternative-bg-color)',
                color: 'var(--text-color)',
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={handleCopyCatalogLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '8px',
                background: catalogLinkCopied
                  ? 'var(--color-success)'
                  : 'var(--color-brand-primary)',
                color: 'var(--color-text-inverse)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
            >
              {catalogLinkCopied ? <Check size={18} /> : <Copy size={18} />}
              {catalogLinkCopied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsCatalogLinkModalOpen(false)}
              style={{
                padding: '0.5rem 1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'none',
                color: 'var(--text-color)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
