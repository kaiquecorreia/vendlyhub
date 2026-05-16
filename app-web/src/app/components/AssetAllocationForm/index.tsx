'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from '../Select';
import { Plus } from 'lucide-react';
import { assetTypes } from '@/app/config/assetTypes';
import { AssetAllocationService } from '@/app/services/assetAllocationService';
import { assetAllocationSchema, type AssetAllocation, type Asset } from './schema';
import styles from './styles.module.scss';

interface AssetAllocationFormProps {
  onAssetsChange?: (assets: Asset[]) => void;
}

export default function AssetAllocationForm({ onAssetsChange }: AssetAllocationFormProps) {
  const [error, setError] = useState<string>('');

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<AssetAllocation>({
    resolver: zodResolver(assetAllocationSchema),
    defaultValues: {
      assets: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'assets',
  });

  const assets = watch('assets');

  const handleAddAsset = () => {
    const nextAssetType = AssetAllocationService.getNextAvailableAssetType(assets, assetTypes);
    if (nextAssetType) {
      append({ type: nextAssetType.value, percentage: 0 });
      setError('');
    }
  };

  const handlePercentageChange = (index: number, newValue: number) => {
    const newAssets = [...assets];
    const oldValue = newAssets[index].percentage;
    newValue = Math.max(0, Math.min(100, newValue));

    if (AssetAllocationService.validateTotal(newAssets, oldValue, newValue)) {
      newAssets[index].percentage = newValue;
      onAssetsChange?.(newAssets);
      setError('');
    } else {
      setError('A soma total não pode exceder 100%');
    }
  };

  const handleTypeChange = (index: number, type: string) => {
    const newAssets = [...assets];
    newAssets[index].type = type;
    onAssetsChange?.(newAssets);
  };

  const handleDeleteAsset = (index: number) => {
    remove(index);
    const newAssets = assets.filter((_, i) => i !== index);
    onAssetsChange?.(newAssets);
    if (AssetAllocationService.calculateTotal(newAssets) <= 100) {
      setError('');
    }
  };

  const onSubmit = async (data: AssetAllocation) => {
    try {
      await AssetAllocationService.saveAssetAllocation(data.assets);
      setError('');
    } catch (err) {
      console.error('Error saving asset allocation:', err);
      setError('Erro ao salvar alocação de ativos');
    }
  };

  const allAssetTypesUsed = assets.length === assetTypes.length;

  return (
    <div className={styles.container}>
      {fields.map((field, index) => (
        <div key={field.id} className={styles.assetRow}>
          <Select
            options={AssetAllocationService.getAvailableAssetTypes(
              assets,
              assets[index]?.type,
              assetTypes,
            )}
            value={assets[index]?.type}
            onChange={(value) => handleTypeChange(index, value)}
          />

          <div className={styles.percentageControl}>
            <input
              type="range"
              min="0"
              max="100"
              value={assets[index]?.percentage || 0}
              onChange={(e) => handlePercentageChange(index, Number(e.target.value))}
              className={styles.slider}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={assets[index]?.percentage || 0}
              onChange={(e) => handlePercentageChange(index, Number(e.target.value))}
              className={styles.numberInput}
            />
            <span>%</span>
          </div>

          <button
            className={styles.deleteButton}
            onClick={() => handleDeleteAsset(index)}
            title="Remover tipo de ativo"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ))}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttonContainer}>
        {!allAssetTypesUsed && (
          <button onClick={handleAddAsset} className={styles.actionButton}>
            <Plus size={16} />
            Adicionar
          </button>
        )}
        <button
          onClick={handleSubmit(onSubmit)}
          className={styles.actionButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
