import { type Asset } from '@/app/components/AssetAllocationForm/schema';
import { type AssetType } from '@/app/config/assetTypes';

export class AssetAllocationService {
  static calculateTotal(assets: Asset[]): number {
    return assets.reduce((sum, asset) => sum + asset.percentage, 0);
  }

  static validateTotal(assets: Asset[], oldValue: number, newValue: number): boolean {
    const total = this.calculateTotal(assets);
    return total - oldValue + newValue <= 100;
  }

  static getAvailableAssetTypes(
    assets: Asset[],
    currentAssetType: string | null,
    assetTypes: AssetType[],
  ): AssetType[] {
    const selectedTypes = assets.map((asset) => asset.type);
    return assetTypes.filter(
      (type) => type.value === currentAssetType || !selectedTypes.includes(type.value),
    );
  }

  static getNextAvailableAssetType(assets: Asset[], assetTypes: AssetType[]): AssetType | null {
    const selectedTypes = assets.map((asset) => asset.type);
    return assetTypes.find((type) => !selectedTypes.includes(type.value)) || null;
  }

  static async saveAssetAllocation(assets: Asset[]): Promise<void> {
    try {
      const response = await fetch('/api/asset-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assets }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar alocação de ativos');
      }
    } catch (error) {
      console.error('Error saving asset allocation:', error);
      throw error;
    }
  }
}
