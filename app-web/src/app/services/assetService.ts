export type Question = {
  text: string;
  isChecked: boolean;
};

export type AssetFormData = {
  type: string;
  transactionType: 'buy' | 'sell';
  asset: string;
  purchaseDate: string;
  quantity: number;
  price: number;
  totalValue: number;
  isManualPrice: boolean;
  questions: Question[];
};

export class AssetService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async fetchAssetPrice(assetCode: string, date: string): Promise<number> {
    return new Promise<number>((resolve) => {
      setTimeout(() => {
        const price = Math.random() * 990 + 10;
        resolve(Number(price.toFixed(2)));
      }, 500);
    });
  }

  static getQuestionsForAssetType(type: string): Question[] {
    // TODO: Implement real API call to get questions
    return [
      { text: 'Pergunta 1 para ' + type, isChecked: false },
      { text: 'Pergunta 2 para ' + type, isChecked: false },
      { text: 'Pergunta 3 para ' + type, isChecked: false },
    ];
  }

  static calculateTotalValue(quantity: number, price: number): number {
    return quantity * price;
  }

  static validateQuantity(quantity: number): number {
    return Math.max(0.000000001, quantity);
  }

  static async submitAssetForm(data: AssetFormData): Promise<void> {
    // TODO: Implement real API call to submit form
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Submitted asset form:', data);
        resolve();
      }, 500);
    });
  }
}
