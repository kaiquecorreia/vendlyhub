'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './styles.module.scss';
import { Plus, Save } from 'lucide-react';
import Select from '../Select';
import { assetTypes } from '@/app/config/assetTypes';
import { assetQuestionsService } from '@/app/services/assetQuestionsService';
import {
  type QuestionFormData,
  type AssetQuestionGroupFormData,
  questionSchema,
  assetQuestionGroupSchema,
} from '@/app/components/AssetQuestions/schema';

type QuestionGroupForm = {
  groups: AssetQuestionGroupFormData[];
};

export default function AssetQuestions() {
  const [selectedAssetType, setSelectedAssetType] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<QuestionGroupForm>({
    defaultValues: {
      groups: [],
    },
    resolver: zodResolver(
      z.object({
        groups: z.array(assetQuestionGroupSchema),
      }),
    ),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'groups',
  });

  const groups = watch('groups');

  const handleAddQuestionGroup = () => {
    if (!selectedAssetType) return;

    append({
      assetType: selectedAssetType,
      questions: [],
    });
    setSelectedAssetType('');
  };

  const handleAddQuestion = (groupIndex: number, question: QuestionFormData) => {
    const currentGroup = groups[groupIndex];
    if (!currentGroup) return;

    const updatedQuestions = [...currentGroup.questions, question];
    setValue(`groups.${groupIndex}.questions`, updatedQuestions);
  };

  const handleRemoveQuestion = (groupIndex: number, questionIndex: number) => {
    const currentGroup = groups[groupIndex];
    if (!currentGroup) return;

    const updatedQuestions = currentGroup.questions.filter((_, index) => index !== questionIndex);
    setValue(`groups.${groupIndex}.questions`, updatedQuestions);
  };

  const onSubmit = async (data: QuestionGroupForm) => {
    await assetQuestionsService.saveQuestions(data.groups);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.container}>
      <div className={styles.addGroupSection}>
        <Select
          options={assetQuestionsService.getAvailableAssetTypes(groups)}
          value={selectedAssetType}
          onChange={setSelectedAssetType}
        />
        <button
          type="button"
          onClick={handleAddQuestionGroup}
          className={styles.addButton}
          disabled={!selectedAssetType}
        >
          <Plus size={16} />
          Adicionar Grupo
        </button>
      </div>

      {fields.map((field, groupIndex) => {
        const groupErrors = errors.groups?.[groupIndex];
        const currentGroup = groups[groupIndex];

        return (
          <div key={field.id} className={styles.questionGroup}>
            <div className={styles.groupHeader}>
              <h3>{assetTypes.find((type) => type.value === field.assetType)?.label}</h3>
              <button
                type="button"
                onClick={() => remove(groupIndex)}
                className={styles.removeButton}
              >
                Remover Grupo
              </button>
            </div>

            <div className={styles.questions}>
              {currentGroup?.questions.map((question, questionIndex) => (
                <div key={questionIndex} className={styles.questionItem}>
                  <span className={styles.questionText}>{question.text}</span>
                  <span className={styles.questionWeight}>Nota: {question.weight}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(groupIndex, questionIndex)}
                    className={styles.removeButton}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <QuestionForm
              groupIndex={groupIndex}
              onAddQuestion={(question) => handleAddQuestion(groupIndex, question)}
            />

            {groupErrors && (
              <div className={styles.errorMessage}>
                {groupErrors.assetType?.message}
                {groupErrors.questions?.message}
              </div>
            )}
          </div>
        );
      })}

      {fields.length > 0 && (
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.saveButton}>
            <Save size={16} />
            Salvar Perguntas
          </button>
        </div>
      )}
    </form>
  );
}

type QuestionFormProps = {
  groupIndex: number;
  onAddQuestion: (question: QuestionFormData) => void;
};

function QuestionForm({ onAddQuestion }: QuestionFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: '',
      weight: 0,
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    onAddQuestion(data);
    reset();
  };

  return (
    <div className={styles.addQuestionForm}>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="Digite a pergunta"
          className={styles.questionInput}
          {...register('text')}
        />
        {errors.text && <span className={styles.errorMessage}>{errors.text.message}</span>}
      </div>

      <div className={styles.inputGroup}>
        <input
          type="number"
          min="0"
          max="10"
          placeholder="Nota"
          className={styles.weightInput}
          {...register('weight', { valueAsNumber: true })}
        />
        {errors.weight && <span className={styles.errorMessage}>{errors.weight.message}</span>}
      </div>

      <button type="button" onClick={handleSubmit(onSubmit)} className={styles.addButton}>
        <Plus size={16} />
        Adicionar Pergunta
      </button>
    </div>
  );
}
