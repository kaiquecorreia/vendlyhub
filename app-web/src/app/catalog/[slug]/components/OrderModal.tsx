'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/app/components/Modal';
import { feedback } from '@/app/services/feedback';
import { Cart, OrderFormData } from '@/app/types/catalog';
import { Copy, Send, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import styles from '../catalog.module.scss';

const orderSchema = z.object({
  customerName: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  whatsapp: z
    .string()
    .min(1, 'WhatsApp é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (00) 00000-0000'),
  address: z.string().min(1, 'Endereço é obrigatório').max(300, 'Endereço muito longo'),
});

type OrderSchemaType = z.infer<typeof orderSchema>;

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  onGenerateOrder: (data: OrderFormData) => void;
  onSendOrder: () => void;
  generating: boolean;
  sending: boolean;
  orderGenerated: boolean;
  pixCopyPaste?: string;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export function OrderModal({
  isOpen,
  onClose,
  cart,
  onGenerateOrder,
  onSendOrder,
  generating,
  sending,
  orderGenerated,
  pixCopyPaste,
}: OrderModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrderSchemaType>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: '',
      whatsapp: '',
      address: '',
    },
  });

  const whatsappValue = watch('whatsapp');
  const canGenerateOrder = Boolean(pixCopyPaste?.trim());

  const { ref: whatsappRef, ...whatsappField } = register('whatsapp');

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('whatsapp', formatted);
  };

  const handleFormSubmit = (data: OrderSchemaType) => {
    onGenerateOrder(data);
  };

  const handleCopyPixCode = async () => {
    const pixCode = pixCopyPaste?.trim();
    if (!pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCode);
      feedback.success('Código Pix copiado!');
    } catch {
      feedback.error('Não foi possível copiar automaticamente.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.orderModal}>
        <div className={styles.modalHeader}>
          <h2>Finalizar Pedido</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.orderForm}>
          <div className={styles.formSection}>
            <h3>Seus Dados</h3>
            <div className={styles.inputGroup}>
              <label htmlFor="customerName">Nome *</label>
              <input
                id="customerName"
                type="text"
                placeholder="Seu nome completo"
                className={errors.customerName ? styles.inputError : ''}
                {...register('customerName')}
              />
              {errors.customerName && (
                <span className={styles.errorMessage}>{errors.customerName.message}</span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="whatsapp">WhatsApp *</label>
              <input
                id="whatsapp"
                type="text"
                placeholder="(00) 00000-0000"
                value={whatsappValue}
                onChange={handleWhatsappChange}
                className={errors.whatsapp ? styles.inputError : ''}
                name={whatsappField.name}
                onBlur={whatsappField.onBlur}
                ref={whatsappRef}
              />
              {errors.whatsapp && (
                <span className={styles.errorMessage}>{errors.whatsapp.message}</span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="address">Endereço de Entrega *</label>
              <textarea
                id="address"
                placeholder="Rua, número, bairro, cidade..."
                rows={3}
                className={errors.address ? styles.inputError : ''}
                {...register('address')}
              />
              {errors.address && (
                <span className={styles.errorMessage}>{errors.address.message}</span>
              )}
            </div>
          </div>
          <div className={styles.formSection}>
            <h3>Resumo do Pedido</h3>
            <div className={styles.orderSummary}>
              {cart.items.map((item) => {
                const price =
                  item.product.discount > 0
                    ? item.product.salePrice * (1 - item.product.discount / 100)
                    : item.product.salePrice;
                return (
                  <div key={item.product.id} className={styles.orderItem}>
                    <span className={styles.itemQty}>{item.quantity}x</span>
                    <span className={styles.itemName}>{item.product.name}</span>
                    <span className={styles.itemPrice}>
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
              <div className={styles.orderTotal}>
                <span>Total</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
            </div>
          </div>
          {orderGenerated && pixCopyPaste?.trim() && (
            <div className={styles.formSection}>
              <h3>Pagamento Pix</h3>
              <div className={styles.pixInstruction}>
                Após realizar o pagamento, clique em Enviar pedido.
              </div>
              <div className={styles.pixQrWrap}>
                <QRCodeSVG value={pixCopyPaste.trim()} size={220} />
              </div>
              <div className={styles.pixCodeBox}>{pixCopyPaste.trim()}</div>
              <button
                type="button"
                onClick={() => void handleCopyPixCode()}
                className={styles.cancelBtn}
              >
                <Copy size={16} />
                Copiar código Pix
              </button>
            </div>
          )}
          {!canGenerateOrder && (
            <div className={styles.pixMissingWarning}>
              O estabelecimento ainda não cadastrou o código Pix. Cadastre no dashboard ou no
              preview para gerar o pedido.
            </div>
          )}
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Fechar
            </button>
            {!orderGenerated ? (
              <button
                type="submit"
                disabled={generating || !canGenerateOrder}
                className={styles.submitBtn}
              >
                {generating ? 'Gerando...' : 'Gerar pedido'}
              </button>
            ) : (
              <button
                type="button"
                disabled={sending}
                className={styles.submitBtn}
                onClick={onSendOrder}
              >
                <Send size={16} />
                {sending ? 'Enviando...' : 'Enviar pedido'}
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
