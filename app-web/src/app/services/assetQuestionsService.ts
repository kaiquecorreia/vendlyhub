import { assetTypes } from '@/app/config/assetTypes';

export type Question = {
  text: string;
  weight: number;
};

export type AssetQuestionGroup = {
  assetType: string;
  questions: Question[];
};

export class AssetQuestionsService {
  getAvailableAssetTypes(questionGroups: AssetQuestionGroup[]) {
    const usedTypes = questionGroups.map((group) => group.assetType);
    return assetTypes.filter((type) => !usedTypes.includes(type.value));
  }

  addQuestionGroup(
    questionGroups: AssetQuestionGroup[],
    selectedAssetType: string,
  ): AssetQuestionGroup[] {
    if (
      selectedAssetType &&
      !questionGroups.find((group) => group.assetType === selectedAssetType)
    ) {
      return [
        ...questionGroups,
        {
          assetType: selectedAssetType,
          questions: [],
        },
      ];
    }
    return questionGroups;
  }

  addQuestion(
    questionGroups: AssetQuestionGroup[],
    groupIndex: number,
    newQuestion: Question,
  ): AssetQuestionGroup[] {
    if (newQuestion.text.trim() && newQuestion.weight >= 0 && newQuestion.weight <= 10) {
      const updatedGroups = [...questionGroups];
      updatedGroups[groupIndex].questions.push({ ...newQuestion });
      return updatedGroups;
    }
    return questionGroups;
  }

  removeQuestion(
    questionGroups: AssetQuestionGroup[],
    groupIndex: number,
    questionIndex: number,
  ): AssetQuestionGroup[] {
    const updatedGroups = [...questionGroups];
    updatedGroups[groupIndex].questions.splice(questionIndex, 1);
    return updatedGroups;
  }

  removeGroup(questionGroups: AssetQuestionGroup[], groupIndex: number): AssetQuestionGroup[] {
    const updatedGroups = [...questionGroups];
    updatedGroups.splice(groupIndex, 1);
    return updatedGroups;
  }

  async saveQuestions(questionGroups: AssetQuestionGroup[]): Promise<void> {
    // TODO: Implementar a lógica de salvamento na API
    console.log('Grupos de perguntas:', questionGroups);
  }
}

export const assetQuestionsService = new AssetQuestionsService();
