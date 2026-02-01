/**
 * Типы для компонента {{componentName}}
 */

export interface {{componentName}}Props {
  /** Дополнительные CSS классы */
  className?: string;

  /** Callback для действий */
  onAction?: () => void;

  /** Данные для отображения */
  data?: {{componentName}}Data;

  /** Флаг загрузки */
  loading?: boolean;
}

export interface {{componentName}}Data {
  id: string;
  name: string;
  // Добавить другие поля данных
}

export interface {{componentName}}State {
  isActive: boolean;
  error?: string;
  // Добавить другие поля состояния
}