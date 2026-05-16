'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from './styles.module.scss';
import { categorySchema, type CategorySchemaType } from './schema';
import { categoryService } from '../services/categoryService';
import { normalizeApiError } from '../services/apiClient';
import { Category } from '../types/product';
import Modal from '../components/Modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategorySchemaType>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
    },
  });

  const loadCategories = async () => {
    try {
      const data = await categoryService.listCategories();
      setCategories(data);
    } catch (error) {
      toast.error(normalizeApiError(error, 'Erro ao carregar categorias'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        description: category.description || '',
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      reset({
        name: '',
        description: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data: CategorySchemaType) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await categoryService.createCategory(data);
        toast.success('Categoria criada com sucesso!');
      }
      await loadCategories();
      closeModal();
    } catch (error) {
      toast.error(normalizeApiError(error, 'Erro ao salvar categoria'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await categoryService.deleteCategory(id);
      toast.success('Categoria excluída com sucesso!');
      await loadCategories();
    } catch (error) {
      toast.error(normalizeApiError(error, 'Erro ao excluir categoria'));
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Categorias de Produtos</h1>
        <button className={styles.addButton} onClick={() => openModal()}>
          <Plus size={18} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            Nenhuma categoria cadastrada. Clique em &quot;Nova Categoria&quot; para começar.
          </div>
        </div>
      ) : (
        <>
          <div className={`${styles.tableContainer} ${styles.desktopOnly}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[category.status]}`}>
                        {category.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => openModal(category)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.delete}`}
                          onClick={() => handleDelete(category.id)}
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
            {categories.map((category) => (
              <div key={category.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <h4>{category.name}</h4>
                  <span className={`${styles.statusBadge} ${styles[category.status]}`}>
                    {category.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {category.description && (
                  <div className={styles.mobileCardBody}>
                    <p>{category.description}</p>
                  </div>
                )}
                <div className={styles.mobileCardFooter}>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => openModal(category)}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.delete}`}
                      onClick={() => handleDelete(category.id)}
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
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className={styles.modalContent}>
          <h2>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Nome da categoria *</label>
              <input
                type="text"
                id="name"
                placeholder="Ex: Bebidas"
                className={errors.name ? styles.inputError : ''}
                {...register('name')}
              />
              {errors.name && <span className={styles.errorMessage}>{errors.name.message}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                placeholder="Descrição da categoria (opcional)"
                className={errors.description ? styles.inputError : ''}
                {...register('description')}
              />
              {errors.description && (
                <span className={styles.errorMessage}>{errors.description.message}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label>Status</label>
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

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={closeModal}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitButton} disabled={submitting}>
                {submitting ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
