'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './styles.module.scss';
import { assetTypes } from '@/app/config/assetTypes';
import { format } from 'date-fns';
import { NumericFormat } from 'react-number-format';
import { AssetService } from '@/app/services/assetService';
import { assetFormSchema, type AssetFormData } from './schema';

type AddAssetFormProps = {
  onSubmit: (data: AssetFormData) => void;
  onCancel: () => void;
};

export default function AddAssetForm({ onSubmit, onCancel }: AddAssetFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      type: '',
      transactionType: 'buy',
      asset: '',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      quantity: 1,
      price: 0,
      totalValue: 0,
      isManualPrice: false,
      questions: [],
    },
  });

  const watchedType = watch('type');
  const watchedAsset = watch('asset');
  const watchedDate = watch('purchaseDate');
  const watchedQuantity = watch('quantity');
  const watchedPrice = watch('price');
  const watchedIsManualPrice = watch('isManualPrice');

  // Update questions when asset type changes
  useEffect(() => {
    if (watchedType) {
      const questions = AssetService.getQuestionsForAssetType(watchedType);
      setValue('questions', questions);
    }
  }, [watchedType, setValue]);

  // Update price when asset or date changes
  useEffect(() => {
    if (watchedAsset && watchedDate && !watchedIsManualPrice) {
      AssetService.fetchAssetPrice(watchedAsset, watchedDate).then((price) => {
        setValue('price', price);
        setValue('totalValue', AssetService.calculateTotalValue(watchedQuantity, price));
      });
    }
  }, [watchedAsset, watchedDate, watchedIsManualPrice, watchedQuantity, setValue]);

  // Update total value when quantity or price changes
  useEffect(() => {
    setValue('totalValue', AssetService.calculateTotalValue(watchedQuantity, watchedPrice));
  }, [watchedQuantity, watchedPrice, setValue]);

  const onFormSubmit = handleSubmit(async (data) => {
    await AssetService.submitAssetForm(data);
    onSubmit(data);
  });

  return (
    <form onSubmit={onFormSubmit} className={styles.form}>
      <div className={styles.transactionToggle}>
        <Controller
          name="transactionType"
          control={control}
          render={({ field }) => (
            <>
              <button
                type="button"
                className={`${styles.toggleButton} ${field.value === 'buy' ? styles.active : ''}`}
                onClick={() => field.onChange('buy')}
              >
                Compra
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${field.value === 'sell' ? styles.active : ''}`}
                onClick={() => field.onChange('sell')}
              >
                Venda
              </button>
            </>
          )}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Tipo de ativo</label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <>
              <select {...field} className={styles.select}>
                <option value="">Selecione um tipo</option>
                {assetTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && <span className={styles.errorMessage}>{errors.type.message}</span>}
            </>
          )}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Ativo</label>
        <Controller
          name="asset"
          control={control}
          render={({ field }) => (
            <>
              <input
                {...field}
                type="text"
                placeholder="Digite o código do ativo"
                className={styles.input}
              />
              {errors.asset && <span className={styles.errorMessage}>{errors.asset.message}</span>}
            </>
          )}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Data da compra</label>
          <Controller
            name="purchaseDate"
            control={control}
            render={({ field }) => (
              <>
                <input {...field} type="date" className={styles.input} />
                {errors.purchaseDate && (
                  <span className={styles.errorMessage}>{errors.purchaseDate.message}</span>
                )}
              </>
            )}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Quantidade</label>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue || 0);
                  }}
                  displayType="input"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={9}
                  fixedDecimalScale={false}
                  className={styles.input}
                  allowNegative={false}
                />
                {errors.quantity && (
                  <span className={styles.errorMessage}>{errors.quantity.message}</span>
                )}
              </>
            )}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.priceInputGroup}>
          <label>Preço unitário</label>
          <Controller
            name="isManualPrice"
            control={control}
            render={({ field }) => (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Informar preço manualmente</span>
              </label>
            )}
          />
        </div>
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <>
              <NumericFormat
                value={field.value}
                onValueChange={(values) => {
                  if (watchedIsManualPrice) {
                    field.onChange(values.floatValue || 0);
                  }
                }}
                displayType="input"
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                disabled={!watchedIsManualPrice}
                className={styles.input}
              />
              {errors.price && <span className={styles.errorMessage}>{errors.price.message}</span>}
            </>
          )}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Valor total</label>
        <Controller
          name="totalValue"
          control={control}
          render={({ field }) => (
            <NumericFormat
              value={field.value}
              displayType="input"
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              disabled
              className={`${styles.input} ${styles.totalValue}`}
            />
          )}
        />
      </div>

      {watchedType && watch('questions').length > 0 && (
        <div className={styles.questionsSection}>
          <h3>Perguntas sobre o ativo</h3>
          <div className={styles.questions}>
            <Controller
              name="questions"
              control={control}
              render={({ field }) => (
                <>
                  {field.value.map((question, index) => (
                    <label key={index} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={question.isChecked}
                        onChange={(e) => {
                          const newQuestions = [...field.value];
                          newQuestions[index] = {
                            ...newQuestions[index],
                            isChecked: e.target.checked,
                          };
                          field.onChange(newQuestions);
                        }}
                        className={styles.checkbox}
                      />
                      <span>{question.text}</span>
                    </label>
                  ))}
                </>
              )}
            />
          </div>
        </div>
      )}

      <div className={styles.buttonContainer}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancelar
        </button>
        <button type="submit" disabled={!isValid} className={styles.submitButton}>
          Adicionar Ativo
        </button>
      </div>
    </form>
  );
}
