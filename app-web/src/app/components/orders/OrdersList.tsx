'use client';

import { ManagedOrder } from '@/app/types/order';
import styles from './orders-list.module.scss';

interface OrdersListProps {
  orders: ManagedOrder[];
  loading: boolean;
  error: string | null;
  confirmingOrderId?: string | null;
  onConfirmSale: (orderId: string) => void;
  title?: string;
  emptyMessage?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusLabelMap: Record<ManagedOrder['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

export function OrdersList({
  orders,
  loading,
  error,
  confirmingOrderId,
  onConfirmSale,
  title = 'Pedidos',
  emptyMessage = 'Nenhum pedido encontrado.',
}: OrdersListProps) {
  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2>{title}</h2>
      </div>

      {loading ? (
        <div className={styles.feedback}>Carregando pedidos...</div>
      ) : error ? (
        <div className={styles.feedbackError}>{error}</div>
      ) : orders.length === 0 ? (
        <div className={styles.feedback}>{emptyMessage}</div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <article key={order.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <p className={styles.orderNumber}>Pedido {order.orderNumber}</p>
                  <p className={styles.meta}>
                    {order.customerName} - {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                  {statusLabelMap[order.status]}
                </span>
              </div>

              <p className={styles.total}>Total: {formatCurrency(order.totalAmount)}</p>

              <ul className={styles.items}>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {`${item.quantity}x ${item.productName ?? 'Produto'} - ${formatCurrency(item.lineTotal)}`}
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.confirmButton}
                  disabled={order.status !== 'pending' || confirmingOrderId === order.id}
                  onClick={() => onConfirmSale(order.id)}
                >
                  {confirmingOrderId === order.id ? 'Confirmando...' : 'Confirmar venda'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
