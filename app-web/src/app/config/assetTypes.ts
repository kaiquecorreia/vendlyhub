export type AssetType = {
  value: string;
  label: string;
};

export const assetTypes: AssetType[] = [
  { value: 'tesouro-direto', label: 'Tesouro direto' },
  { value: 'acoes', label: 'Ações' },
  { value: 'fiis', label: 'FIIs' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'etfs', label: 'ETFs Internacionais' },
  { value: 'crypto', label: 'Cripto moedas' },
];
