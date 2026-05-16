'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import { PENDING_PRODUCT_IMAGE_MAX_BYTES, dataUrlByteLength } from '@/app/lib/pendingProductDraft';
import currencyStyles from '@/app/fast-onboarding/fast-onboarding.module.scss';
import {
  previewProductModalSchema,
  type PreviewProductModalFormData,
} from './previewProductModal.schema';
import styles from '@/app/catalog/[slug]/catalog.module.scss';

export interface PreviewProductModalResult {
  name: string;
  salePrice: number;
  stockQuantity: number;
  imageDataUrl?: string;
}

interface PreviewProductModalProps {
  onClose: () => void;
  onSubmit: (data: PreviewProductModalResult) => void;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
    reader.readAsDataURL(file);
  });

export function PreviewProductModal({ onClose, onSubmit }: PreviewProductModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PreviewProductModalFormData>({
    resolver: zodResolver(previewProductModalSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      salePrice: 0,
      stockQuantity: 100,
    },
  });

  const handleClose = () => {
    reset({ name: '', salePrice: 0, stockQuantity: 100 });
    setImageFile(null);
    setImagePreview(null);
    onClose();
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

  const submit = handleSubmit(async (data) => {
    let imageDataUrl: string | undefined;
    if (imageFile) {
      try {
        const dataUrl = await fileToDataUrl(imageFile);
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

    onSubmit({
      name: data.name.trim(),
      salePrice: data.salePrice,
      stockQuantity: data.stockQuantity,
      imageDataUrl,
    });
    handleClose();
  });

  return (
    <div className={styles.previewProductModal}>
      <div className={styles.modalHeader}>
        <h2>Novo produto</h2>
      </div>
      <form className={styles.orderForm} onSubmit={submit}>
        <div className={styles.inputGroup}>
          <label htmlFor="preview-product-name">Nome do produto *</label>
          <input
            id="preview-product-name"
            autoFocus
            placeholder="Ex.: Café especial 250g"
            className={errors.name ? styles.inputError : ''}
            {...register('name')}
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name.message}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="preview-product-price">Preço de venda *</label>
          <div
            className={`${currencyStyles.currencyInputRow} ${errors.salePrice ? currencyStyles.currencyInputRowError : ''}`}
          >
            <Controller
              name="salePrice"
              control={control}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <NumericFormat
                  id="preview-product-price"
                  name={name}
                  getInputRef={ref}
                  autoComplete="off"
                  inputMode="decimal"
                  value={value}
                  onBlur={onBlur}
                  onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
                  prefix="R$ "
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
          {errors.salePrice && (
            <span className={styles.errorMessage}>{errors.salePrice.message}</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="preview-product-stock">Quantidade em estoque *</label>
          <input
            id="preview-product-stock"
            type="number"
            min={0}
            step={1}
            {...register('stockQuantity', { valueAsNumber: true })}
          />
          {errors.stockQuantity && (
            <span className={styles.errorMessage}>{errors.stockQuantity.message}</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <span className={styles.formSectionLabel}>Foto do produto (opcional)</span>
          <p className={styles.previewProductModalHint}>JPG, PNG ou WebP até 5 MB.</p>
          <div className={styles.previewProductImageUpload}>
            {imagePreview ? (
              <img src={imagePreview} alt="" className={styles.previewProductImagePreview} />
            ) : (
              <div className={styles.previewProductImagePlaceholder}>Toque para adicionar</div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={styles.previewProductImageInput}
              onChange={handleImageChange}
              aria-label="Selecionar foto do produto"
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitBtn}>
            Adicionar ao catálogo
          </button>
        </div>
      </form>
    </div>
  );
}
