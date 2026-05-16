'use client';

import styles from './finance-table.module.scss';
import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Pencil,
  Trash,
  Info,
} from 'lucide-react';
import { createPortal } from 'react-dom';

type Order = 'asc' | 'desc' | null;

type SortState = {
  key: keyof Asset | null;
  order: Order;
};

type Asset = {
  ativo: string;
  logo: string;
  quantidade: number;
  precoMedio: string;
  precoAtual: string;
  variacao: string;
  rentabilidade: string;
  saldo: string;
  nota: string;
  porcentagemCarteira: string;
  porcentagemIdeal: string;
  comprar: boolean;
};

const mockData: Asset[] = [
  {
    ativo: 'BBAS3',
    logo: '/bbas3.png',
    quantidade: 400,
    precoMedio: 'R$ 27,47',
    precoAtual: 'R$ 27,80',
    variacao: '1,20%',
    rentabilidade: '56,15%',
    saldo: 'R$ 11.120,00',
    nota: '06',
    porcentagemCarteira: '7,24%',
    porcentagemIdeal: '6%',
    comprar: false,
  },
  {
    ativo: 'EGIE3',
    logo: '/egie3.png',
    quantidade: 200,
    precoMedio: 'R$ 40,17',
    precoAtual: 'R$ 39,65',
    variacao: '-1,30%',
    rentabilidade: '22,85%',
    saldo: 'R$ 7.930,00',
    nota: '05',
    porcentagemCarteira: '5,16%',
    porcentagemIdeal: '5%',
    comprar: false,
  },
];

const columns: { key: keyof Asset; label: string }[] = [
  { key: 'ativo', label: 'Ativo' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'precoMedio', label: 'Preço Médio' },
  { key: 'precoAtual', label: 'Preço Atual' },
  { key: 'variacao', label: 'Variação' },
  { key: 'rentabilidade', label: 'Rentabilidade' },
  { key: 'saldo', label: 'Saldo' },
  { key: 'nota', label: 'Nota' },
  { key: 'porcentagemCarteira', label: '% Carteira' },
  { key: 'porcentagemIdeal', label: '% Ideal' },
  { key: 'comprar', label: 'Comprar?' },
];

export default function FinanceTable() {
  const [sort, setSort] = useState<SortState>({ key: null, order: null });
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSort = (key: keyof Asset) => {
    setSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          order: prev.order === 'asc' ? 'desc' : prev.order === 'desc' ? null : 'asc',
        };
      }
      return { key, order: 'asc' };
    });
  };

  const sortedData = [...mockData].sort((a, b) => {
    if (!sort.key || sort.order === null) return 0;

    const aVal = (a[sort.key] ?? '').toString().replace(/[^\d.-]/g, '');
    const bVal = (b[sort.key] ?? '').toString().replace(/[^\d.-]/g, '');
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);

    if (isNaN(aNum) || isNaN(bNum)) {
      return sort.order === 'asc'
        ? String(a[sort.key]).localeCompare(String(b[sort.key]))
        : String(b[sort.key]).localeCompare(String(a[sort.key]));
    }

    return sort.order === 'asc' ? aNum - bNum : bNum - aNum;
  });

  const renderSortIcon = (key: keyof Asset) => {
    if (sort.key !== key) return <ChevronsUpDown size={14} />;
    if (sort.order === 'asc') return <ChevronUp size={14} />;
    if (sort.order === 'desc') return <ChevronDown size={14} />;
    return <ChevronsUpDown size={14} />;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        openDropdown !== null &&
        !dropdownRefs.current[openDropdown]?.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.financeTable}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>
                <button onClick={() => handleSort(col.key)} className={styles.sortButton}>
                  {col.label} {renderSortIcon(col.key)}
                </button>
              </th>
            ))}
            <th>Opções</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((asset, index) => (
            <tr key={index}>
              <td className={styles.assetInfo}>
                <img src={asset.logo} alt={asset.ativo} />
                <span>{asset.ativo}</span>
              </td>
              <td>{asset.quantidade}</td>
              <td>{asset.precoMedio}</td>
              <td>{asset.precoAtual}</td>
              <td className={asset.variacao.startsWith('-') ? styles.negative : styles.positive}>
                {asset.variacao}
              </td>
              <td
                className={asset.rentabilidade.startsWith('-') ? styles.negative : styles.positive}
              >
                {asset.rentabilidade}
              </td>
              <td>{asset.saldo}</td>
              <td>{asset.nota}</td>
              <td>{asset.porcentagemCarteira}</td>
              <td>{asset.porcentagemIdeal}</td>
              <td>
                <span className={asset.comprar ? styles.buyYes : styles.buyNo}>
                  {asset.comprar ? 'Sim' : 'Não'}
                </span>
              </td>
              <td className={styles.options}>
                <button
                  ref={(el) => {
                    dropdownRefs.current[index] = el;
                  }}
                  onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                >
                  <MoreVertical size={18} />
                </button>
                {openDropdown === index &&
                  createPortal(
                    <div
                      className={styles.dropdown}
                      style={{
                        position: 'fixed',
                        top: dropdownRefs.current[index]?.getBoundingClientRect().bottom,
                        left: dropdownRefs.current[index]?.getBoundingClientRect().left,
                      }}
                    >
                      <button>
                        <Pencil size={14} /> Editar
                      </button>
                      <button>
                        <Trash size={14} /> Remover
                      </button>
                      <button>
                        <Info size={14} /> Detalhes
                      </button>
                    </div>,
                    document.body,
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
