#!/bin/bash

# Скрипт полной миграции компонентов
# Использование: ./migrate-all.sh [phase]

set -e  # Остановить при ошибке

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPONENTS_DIR="$SCRIPT_DIR"
TOOLS_DIR="$SCRIPT_DIR/migration-tools"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Функция проверки зависимостей
check_dependencies() {
    log "Проверка зависимостей..."

    if ! command -v node &> /dev/null; then
        error "Node.js не установлен"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        error "npm не установлен"
        exit 1
    fi

    log "✅ Зависимости проверены"
}

# Функция создания backup
create_backup() {
    log "Создание резервной копии..."

    BACKUP_DIR="$COMPONENTS_DIR-backup-$(date +%Y%m%d_%H%M%S)"

    if [ -d "$COMPONENTS_DIR" ]; then
        cp -r "$COMPONENTS_DIR" "$BACKUP_DIR"
        log "✅ Резервная копия создана: $BACKUP_DIR"
    else
        error "Директория компонентов не найдена: $COMPONENTS_DIR"
        exit 1
    fi
}

# Функция анализа зависимостей
analyze_dependencies() {
    log "Проверка отчета анализа компонентов..."

    if [ -f "$TOOLS_DIR/migration-report.json" ]; then
        log "✅ Отчет анализа найден: migration-report.json"
    else
        error "Отчет анализа не найден. Запустите: node generate-migration-report.js"
        exit 1
    fi
}

# Функция миграции фазы
migrate_phase() {
    local phase=$1
    log "🚀 Миграция фазы: $phase"

    cd "$TOOLS_DIR"

    # Создание структур доменов
    case $phase in
        phase1)
            log "Создание структур доменов: ui, layout, auth"
            node generate-component-structure.js ui
            node generate-component-structure.js layout
            node generate-component-structure.js auth
            ;;
        phase2)
            log "Создание структур доменов: dashboard, workspace, organization"
            node generate-component-structure.js dashboard
            node generate-component-structure.js workspace
            node generate-component-structure.js organization
            ;;
        phase3)
            log "Создание структур доменов: vacancies, gigs, candidates"
            node generate-component-structure.js vacancies
            node generate-component-structure.js gigs
            node generate-component-structure.js candidates
            ;;
        phase4)
            log "Создание структур доменов: responses, chat, settings"
            node generate-component-structure.js responses
            node generate-component-structure.js chat
            node generate-component-structure.js settings
            ;;
    esac

    # Миграция компонентов
    log "Миграция компонентов фазы $phase..."
    node migrate-components.js "$phase"

    # Обновление импортов
    log "Обновление импортов..."
    node update-imports.js update

    # Валидация
    log "Валидация импортов..."
    if node update-imports.js validate; then
        log "✅ Фаза $phase успешно мигрирована"
    else
        error "❌ Ошибки валидации для фазы $phase"
        exit 1
    fi
}

# Функция тестирования
run_tests() {
    log "Запуск тестов..."

    cd "$SCRIPT_DIR/../../../.."

    if npm run typecheck; then
        log "✅ TypeScript проверка пройдена"
    else
        error "❌ Ошибки TypeScript"
        exit 1
    fi

    if npm run build; then
        log "✅ Сборка пройдена"
    else
        error "❌ Ошибки сборки"
        exit 1
    fi
}

# Функция полной миграции
migrate_all() {
    log "🚀 Начало полной миграции компонентов"

    check_dependencies
    create_backup
    analyze_dependencies

    # Миграция по фазам
    migrate_phase "phase1"
    run_tests

    migrate_phase "phase2"
    run_tests

    migrate_phase "phase3"
    run_tests

    migrate_phase "phase4"
    run_tests

    log "🎉 Миграция успешно завершена!"
    info "Не забудьте:"
    info "1. Проверить работу приложения"
    info "2. Запустить полный набор тестов"
    info "3. Обновить документацию"
    info "4. Удалить резервные копии после подтверждения работоспособности"
}

# Функция миграции одной фазы
migrate_single_phase() {
    local phase=$1

    if [ -z "$phase" ]; then
        error "Укажите фазу миграции: phase1, phase2, phase3, или phase4"
        exit 1
    fi

    log "🚀 Миграция фазы: $phase"

    check_dependencies
    create_backup
    analyze_dependencies
    migrate_phase "$phase"
    run_tests

    log "✅ Фаза $phase успешно мигрирована"
}

# Главная логика
main() {
    local command=${1:-all}
    local phase=$2

    case $command in
        all)
            migrate_all
            ;;
        phase)
            migrate_single_phase "$phase"
            ;;
        analyze)
            check_dependencies
            analyze_dependencies
            ;;
        backup)
            create_backup
            ;;
        test)
            run_tests
            ;;
        *)
            echo "Использование:"
            echo "  $0 all              # Полная миграция"
            echo "  $0 phase <phase>    # Миграция конкретной фазы"
            echo "  $0 analyze          # Только анализ зависимостей"
            echo "  $0 backup           # Создать резервную копию"
            echo "  $0 test             # Запустить тесты"
            exit 1
            ;;
    esac
}

# Запуск
main "$@"