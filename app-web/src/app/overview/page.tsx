'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Eye,
  Settings,
  FileText,
} from 'lucide-react';
import Card from '../components/Card';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import styles from './overview.module.scss';

interface StockAlert {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  status: 'low' | 'medium' | 'normal';
}

interface Request {
  id: string;
  product: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export default function OverviewPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const productsData = await productService.listProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeProducts = products.filter((p) => p.status === 'active').length;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStock).length;

  const stockAlerts: StockAlert[] = products
    .map((p) => {
      let status: 'low' | 'medium' | 'normal' = 'normal';
      if (p.stockQuantity <= p.minStock) status = 'low';
      else if (p.stockQuantity <= p.minStock * 2) status = 'medium';
      return {
        id: p.id,
        name: p.name,
        stock: p.stockQuantity,
        minStock: p.minStock,
        status,
      };
    })
    .filter((a) => a.status !== 'normal')
    .sort((a, b) => {
      if (a.status === 'low' && b.status !== 'low') return -1;
      if (a.status !== 'low' && b.status === 'low') return 1;
      return a.stock - b.stock;
    })
    .slice(0, 5);

  const recentRequests: Request[] = [];

  const getStatusLabel = (status: 'low' | 'medium' | 'normal') => {
    switch (status) {
      case 'low':
        return 'Baixo';
      case 'medium':
        return 'Médio';
      default:
        return 'Normal';
    }
  };

  const getRequestStatusLabel = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovada';
      case 'rejected':
        return 'Rejeitada';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Package className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeProducts}</span>
            <span className={styles.statLabel}>Produtos ativos</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${lowStockProducts > 0 ? styles.warning : ''}`}>
          <AlertTriangle className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{lowStockProducts}</span>
            <span className={styles.statLabel}>Estoque baixo</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <ClipboardList className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Solicitações em aberto</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Calendar className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Solicitações de hoje</span>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <Card title="Alertas de Estoque">
          <div className={styles.tableWrapper}>
            {stockAlerts.length === 0 ? (
              <p className={styles.emptyMessage}>Nenhum alerta de estoque</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Disponível</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.name}</td>
                      <td>{alert.stock}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[alert.status]}`}>
                          {getStatusLabel(alert.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card title="Solicitações Recentes">
          <div className={styles.tableWrapper}>
            {recentRequests.length === 0 ? (
              <p className={styles.emptyMessage}>Nenhuma solicitação recente</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.product}</td>
                      <td>{req.quantity}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[req.status]}`}>
                          {getRequestStatusLabel(req.status)}
                        </span>
                      </td>
                      <td>{req.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </section>

      <section className={styles.quickActions}>
        <h3>Ações Rápidas</h3>
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton} onClick={() => router.push('/products')}>
            <Eye />
            <span>Ver produtos</span>
          </button>
          <button className={styles.actionButton} onClick={() => router.push('/products')}>
            <Settings />
            <span>Ajustar estoque</span>
          </button>
          <button className={styles.actionButton} disabled>
            <FileText />
            <span>Ver solicitações</span>
          </button>
        </div>
      </section>
    </div>
  );
}
