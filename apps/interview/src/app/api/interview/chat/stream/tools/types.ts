import type { StageId } from '../stages/types';

/**
 * Конфигурация доступности инструмента по стадиям
 */
export interface ToolAvailability {
  /** Имя инструмента */
  name: string;
  
  /** Стадии на которых инструмент доступен */
  availableOnStages: StageId[];
  
  /** Доступен ли инструмент на всех стадиях */
  availableOnAllStages?: boolean;
}
