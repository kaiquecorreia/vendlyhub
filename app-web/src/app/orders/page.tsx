'use client';

import { useCallback, useEffect, useState } from 'react';
import { OrdersList } from '@/app/components/orders/OrdersList';
import { normalizeApiError } from '@/app/services/apiClient';
import { feedback } from '@/app/services/feedback';
import { orderService } from '@/app/services/orderService';
import { ManagedOrder } from '@/app/types/order';
import styles from './styles.module.scss';

export default function OrdersPage() {
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await orderService.listOrders({ limit: 100 });
      setOrders(list);
    } catch (err) {
      setError(normalizeApiError(err, 'Erro ao carregar pedidos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleConfirmSale = async (orderId: string) => {
    setConfirmingOrderId(orderId);
    try {
      const updated = await orderService.confirmOrder(orderId);
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      feedback.success('Venda confirmada com sucesso.');
    } catch (err) {
      feedback.error(normalizeApiError(err, 'Não foi possível confirmar a venda.'));
    } finally {
      setConfirmingOrderId(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gestão de pedidos</h1>
        <p>Confirme pedidos pendentes para contabilizar venda e movimentar estoque.</p>
      </header>

      <OrdersList
        orders={orders}
        loading={loading}
        error={error}
        confirmingOrderId={confirmingOrderId}
        onConfirmSale={handleConfirmSale}
        title="Pedidos do estabelecimento"
        emptyMessage="Nenhum pedido recebido ainda."
      />
    </div>
  );
}
