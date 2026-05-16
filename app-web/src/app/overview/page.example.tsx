'use client';

import { ChevronsDown, ChevronsUp, CircleDollarSign, HandCoins } from 'lucide-react';
import Accordion from '../components/Accordion';
import Card from '../components/Card';
import styles from './overview.module.scss';
import DoublePieChart from '../components/Charts/Piechart';
import StackedBarChart from '../components/Charts/StackedBarChart';
import FinanceTable from '../components/FinanceTable';

const mockChartData = [
  { name: 'Tesouro direto', value: 25 },
  { name: 'FIIs', value: 20 },
  { name: 'Ações', value: 20 },
  { name: 'Stocks', value: 15 },
  { name: 'ETFs Internacionais', value: 15 },
  { name: 'Cripto moedas', value: 5 },
];

export default function OverviewPage() {
  return (
    <div className={styles.contentArea}>
      <main className={styles.mainLayout}>
        <section className={styles.rowOne}>
          <Card title="Patrimônio">
            <div className={styles.cardContent}>
              <span>R$ 63.638,50</span>
              <CircleDollarSign />
            </div>
          </Card>
          <Card title="Rentabilidade">
            <div className={styles.cardContent}>
              <span className={styles.positive}>+ 57,80%</span>
              <ChevronsUp className={styles.positive} />
            </div>
          </Card>
          <Card title="Proventos">
            <div className={styles.cardContent}>
              <span>R$ 4.350,58</span>
              <HandCoins />
            </div>
          </Card>
          <Card title="Variação">
            <div className={styles.cardContent}>
              <ChevronsDown className={styles.negative} />
              <span className={styles.negative}>-7,89%</span>
              <span className={styles.negative}>R$ 3.638,50</span>
            </div>
          </Card>
        </section>
        <section className={styles.rowTwo}>
          <Card title="Macro alocação atual">
            <DoublePieChart data={mockChartData} />
          </Card>
          <Card title="Evolução da carteira">
            <StackedBarChart></StackedBarChart>
          </Card>
        </section>

        <section className={styles.rowThree}>
          <Card title="Meus ativos">
            <Accordion title="Ações" enableBorderBottom>
              <FinanceTable></FinanceTable>
            </Accordion>
            <Accordion title="FIIs" enableBorderBottom>
              <FinanceTable></FinanceTable>
            </Accordion>
            <Accordion title="Tesouro direto" enableBorderBottom>
              <FinanceTable></FinanceTable>
            </Accordion>
            <Accordion title="Stocks" enableBorderBottom>
              <FinanceTable></FinanceTable>
            </Accordion>
            <Accordion title="ETFs Internacionais" enableBorderBottom>
              <FinanceTable></FinanceTable>
            </Accordion>
            <Accordion title="Cripto moedas">
              <FinanceTable></FinanceTable>
            </Accordion>
          </Card>
        </section>
      </main>
    </div>
  );
}
