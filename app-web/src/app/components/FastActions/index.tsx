'use client';

import { useState } from 'react';
import styles from './styles.module.scss';
import Modal from '../Modal';
import AddAssetForm from '../AddAssetForm';

type AssetFormData = {
  type: string;
  asset: string;
  purchaseDate: string;
  quantity: number;
  price: number;
  questions: Array<{ text: string; isChecked: boolean }>;
};

export default function FastActions() {
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);

  const handleAddAsset = (data: AssetFormData) => {
    console.log('Novo ativo:', data);
    setIsAddAssetModalOpen(false);
  };

  return (
    <>
      <div className={styles.menuContainer}>
        <button className={styles.actionButton} onClick={() => setIsAddAssetModalOpen(true)}>
          Lançar ativo
        </button>
      </div>

      <Modal isOpen={isAddAssetModalOpen} onClose={() => setIsAddAssetModalOpen(false)}>
        <AddAssetForm onSubmit={handleAddAsset} onCancel={() => setIsAddAssetModalOpen(false)} />
      </Modal>
    </>
  );
}
