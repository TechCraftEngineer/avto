"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@qbs-autonaim/ui";

/**
 * Свойства компонента RestorePrompt
 */
interface RestorePromptProps {
  /**
   * Состояние открытия модального окна
   */
  open: boolean;

  /**
   * Обработчик изменения состояния открытия
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Обработчик выбора "Продолжить работу"
   */
  onRestore: () => void;

  /**
   * Обработчик выбора "Начать заново"
   */
  onStartNew: () => void;
}

/**
 * Компонент модального окна восстановления черновика
 *
 * Отображается при обнаружении существующего черновика вакансии.
 * Предлагает пользователю продолжить работу над черновиком или начать создание новой вакансии.
 *
 * Требования: 2.2, 9.3, 9.4
 * Свойство 4: Восстановление черновика при возврате
 * Свойство 16: Русскоязычный интерфейс без англицизмов
 *
 * @example
 * ```tsx
 * <RestorePrompt
 *   open={showRestorePrompt}
 *   onOpenChange={setShowRestorePrompt}
 *   onRestore={handleRestore}
 *   onStartNew={handleStartNew}
 * />
 * ```
 */
export function RestorePrompt({
  open,
  onOpenChange,
  onRestore,
  onStartNew,
}: RestorePromptProps) {
  /**
   * Обработчик клика на кнопку "Продолжить работу"
   */
  const handleRestore = () => {
    onRestore();
    onOpenChange(false);
  };

  /**
   * Обработчик клика на кнопку "Начать заново"
   */
  const handleStartNew = () => {
    onStartNew();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>У вас есть несохраненная вакансия</AlertDialogTitle>
          <AlertDialogDescription>
            Хотите продолжить работу над ней или начать создание новой вакансии?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleStartNew}>
            Начать заново
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore}>
            Продолжить работу
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
