/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import {
  createContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  KeyboardSensor,
  type Modifiers,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core"
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Slot } from "radix-ui"
import { createPortal } from "react-dom"

import { cn } from ".."

interface KanbanContextProps<T> {
  columns: Record<string, T[]>
  setColumns: (columns: Record<string, T[]>) => void
  getItemId: (item: T) => string
  columnIds: string[]
  activeId: UniqueIdentifier | null
  setActiveId: (id: UniqueIdentifier | null) => void
  findContainer: (id: UniqueIdentifier) => string | undefined
  isColumn: (id: UniqueIdentifier) => boolean
  modifiers?: Modifiers
}

const KanbanContext = createContext<KanbanContextProps<any>>({
  columns: {},
  setColumns: () => {},
  getItemId: () => "",
  columnIds: [],
  activeId: null,
  setActiveId: () => {},
  findContainer: () => undefined,
  isColumn: () => false,
  modifiers: undefined,
})

const ColumnContext = createContext<{
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners | undefined
  isDragging?: boolean
  disabled?: boolean
}>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
  isDragging: false,
  disabled: false,
})

const ItemContext = createContext<{
  listeners: DraggableSyntheticListeners | undefined
  isDragging?: boolean
  disabled?: boolean
}>({
  listeners: undefined,
  isDragging: false,
  disabled: false,
})

const IsOverlayContext = createContext(false)

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
}

export interface KanbanMoveEvent<T = unknown> {
  event: DragEndEvent
  activeContainer: string
  activeIndex: number
  overContainer: string
  overIndex: number
}

export interface KanbanRootProps<T = unknown>
  extends HTMLAttributes<HTMLDivElement> {
  value: Record<string, T[]>
  onValueChange: (value: Record<string, T[]>) => void
  getItemValue: (item: T) => string
  children: ReactNode
  onMove?: (event: KanbanMoveEvent<T>) => void
  asChild?: boolean
  modifiers?: Modifiers
}

function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  children,
  className,
  asChild = false,
  onMove,
  modifiers,
  ...props
}: KanbanRootProps<T>) {
  const columns = value
  const setColumns = onValueChange
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const dragStartRef = React.useRef<{
    activeContainer: string
    activeIndex: number
    item: T
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const columnIds = useMemo(() => Object.keys(columns), [columns])

  const isColumn = useCallback(
    (id: UniqueIdentifier) => columnIds.includes(id as string),
    [columnIds],
  )

  const findContainer = useCallback(
    (id: UniqueIdentifier) => {
      if (isColumn(id)) return id as string
      return columnIds.find(
        (key) =>
          (columns[key] ?? []).some((item: T) => getItemValue(item) === id),
      )
    },
    [columns, columnIds, getItemValue, isColumn],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id)
      if (!isColumn(event.active.id)) {
        const container = findContainer(event.active.id)
        if (container) {
          const items = columns[container] ?? []
          const idx = items.findIndex(
            (item: T) => getItemValue(item) === event.active.id,
          )
          if (idx >= 0) {
            const item = items[idx]
            if (item !== undefined) {
              dragStartRef.current = {
                activeContainer: container,
                activeIndex: idx,
                item,
              }
            }
            return
          }
        }
      }
      dragStartRef.current = null
    },
    [columns, findContainer, getItemValue, isColumn],
  )

  const getInsertIndex = useCallback(
    (
      event: DragOverEvent,
      overIndex: number,
      overItemsLength: number,
    ): number => {
      const { active, over, delta } = event
      if (!over || isColumn(over.id)) return overItemsLength
      if (overIndex < 0) return overItemsLength

      const rectRef = active.rect as React.RefObject<{
        initial: { top: number; height: number } | null
        translated: { top: number; height: number } | null
      }> | null
      const rectData = rectRef?.current ?? (active.rect as { initial?: { top: number; height: number }; translated?: { top: number; height: number } })
      const rect = rectData?.translated ?? rectData?.initial
      const overRect = over.rect as { top: number; height: number } | undefined

      if (!rect || !overRect) return overIndex

      const currentTop = rectData?.translated
        ? rect.top
        : rect.top + (delta?.y ?? 0)
      const activeCenterY = currentTop + rect.height / 2
      const overCenterY = overRect.top + overRect.height / 2

      return activeCenterY < overCenterY ? overIndex : overIndex + 1
    },
    [isColumn],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      if (isColumn(active.id)) return

      const activeContainer = findContainer(active.id)
      const overContainer = findContainer(over.id)

      if (!activeContainer || !overContainer) {
        return
      }

      if (activeContainer !== overContainer) {
        const activeItems = columns[activeContainer] ?? []
        const overItems = columns[overContainer] ?? []

        const activeIndex = activeItems.findIndex(
          (item: T) => getItemValue(item) === active.id,
        )
        if (activeIndex < 0) return

        let overIndex = overItems.findIndex(
          (item: T) => getItemValue(item) === over.id,
        )

        if (isColumn(over.id)) {
          overIndex = overItems.length
        } else {
          overIndex = getInsertIndex(event, overIndex, overItems.length)
        }

        const newActiveItems = [...activeItems]
        const newOverItems = [...overItems]
        const [movedItem] = newActiveItems.splice(activeIndex, 1)
        if (movedItem === undefined) return
        newOverItems.splice(overIndex, 0, movedItem)

        setColumns({
          ...columns,
          [activeContainer]: newActiveItems,
          [overContainer]: newOverItems,
        })
      } else {
        const container = activeContainer
        const containerItems = columns[container] ?? []
        const activeIndex = containerItems.findIndex(
          (item: T) => getItemValue(item) === active.id,
        )
        const baseOverIndex = containerItems.findIndex(
          (item: T) => getItemValue(item) === over.id,
        )
        if (baseOverIndex < 0) return

        const insertIndex = getInsertIndex(
          event,
          baseOverIndex,
          containerItems.length,
        )

        if (activeIndex !== insertIndex) {
          const toIndex =
            activeIndex < insertIndex ? insertIndex - 1 : insertIndex
          if (toIndex < 0) return
          setColumns({
            ...columns,
            [container]: arrayMove(containerItems, activeIndex, toIndex),
          })
        }
      }
    },
    [
      findContainer,
      getInsertIndex,
      getItemValue,
      isColumn,
      setColumns,
      columns,
    ],
  )

  const handleDragCancel = useCallback(() => {
    const dragStart = dragStartRef.current
    if (dragStart && activeId) {
      const currentContainer = findContainer(activeId)
      if (currentContainer && currentContainer !== dragStart.activeContainer) {
        const next = { ...columns }
        const fromItems = [...(next[currentContainer] ?? [])]
        const toItems = [...(next[dragStart.activeContainer] ?? [])]
        const idx = fromItems.findIndex(
          (item: T) => getItemValue(item) === activeId,
        )
        if (idx >= 0) {
          const [moved] = fromItems.splice(idx, 1)
          if (moved !== undefined) {
            toItems.splice(dragStart.activeIndex, 0, moved)
            next[currentContainer] = fromItems
            next[dragStart.activeContainer] = toItems
            setColumns(next)
          }
        }
      }
    }
    setActiveId(null)
    dragStartRef.current = null
  }, [activeId, columns, findContainer, getItemValue, setColumns])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      if (onMove && !isColumn(active.id)) {
        const dragStart = dragStartRef.current
        const overContainer = findContainer(over.id)

        if (dragStart && overContainer && dragStart.activeContainer !== overContainer) {
          const overItems = columns[overContainer] ?? []
          const baseOverIndex = isColumn(over.id)
            ? overItems.length
            : overItems.findIndex(
                (item: T) => getItemValue(item) === over.id,
              )
          const overIndex = getInsertIndex(
            event as unknown as DragOverEvent,
            baseOverIndex,
            overItems.length,
          )

          onMove({
            event,
            activeContainer: dragStart.activeContainer,
            activeIndex: dragStart.activeIndex,
            overContainer,
            overIndex,
          })
        }
        dragStartRef.current = null
        return
      }

      dragStartRef.current = null

      if (isColumn(active.id) && isColumn(over.id)) {
        const activeIndex = columnIds.indexOf(active.id as string)
        const overIndex = columnIds.indexOf(over.id as string)
        if (activeIndex !== overIndex) {
          const newOrder = arrayMove(columnIds, activeIndex, overIndex)
          const newColumns: Record<string, T[]> = {}
          newOrder.forEach((key) => {
            newColumns[key] = columns[key] ?? []
          })
          setColumns(newColumns)
        }
        return
      }

      const activeContainer = findContainer(active.id)
      const overContainer = findContainer(over.id)

      if (
        activeContainer &&
        overContainer &&
        activeContainer === overContainer
      ) {
        const container = activeContainer
        const containerItems = columns[container] ?? []
        const activeIndex = containerItems.findIndex(
          (item: T) => getItemValue(item) === active.id,
        )
        const baseOverIndex = containerItems.findIndex(
          (item: T) => getItemValue(item) === over.id,
        )
        const insertIndex = getInsertIndex(
          event as unknown as DragOverEvent,
          baseOverIndex,
          containerItems.length,
        )

        if (activeIndex !== insertIndex) {
          const toIndex =
            activeIndex < insertIndex ? insertIndex - 1 : insertIndex
          setColumns({
            ...columns,
            [container]: arrayMove(containerItems, activeIndex, toIndex),
          })
        }
      }
    },
    [
      columnIds,
      columns,
      findContainer,
      getInsertIndex,
      getItemValue,
      isColumn,
      setColumns,
      onMove,
    ],
  )

  const contextValue = useMemo(
    () => ({
      columns,
      setColumns,
      getItemId: getItemValue,
      columnIds,
      activeId,
      setActiveId,
      findContainer,
      isColumn,
      modifiers,
    }),
    [
      columns,
      setColumns,
      getItemValue,
      columnIds,
      activeId,
      findContainer,
      isColumn,
      modifiers,
    ],
  )

  const Comp = asChild ? Slot.Root : "div"

  return (
    <KanbanContext.Provider value={contextValue as KanbanContextProps<any>}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={modifiers}
      >
        <Comp className={cn(className)} data-slot="kanban" {...props}>
          {children}
        </Comp>
      </DndContext>
    </KanbanContext.Provider>
  )
}

export interface KanbanBoardProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

function KanbanBoard({
  className,
  asChild = false,
  children,
  ...props
}: KanbanBoardProps) {
  const { columnIds } = useContext(KanbanContext)
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp className={cn(className)} data-slot="kanban-board" {...props}>
      {children}
    </Comp>
  )
}

export interface KanbanColumnProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
  asChild?: boolean
}

function KanbanColumn({
  value,
  className,
  asChild = false,
  disabled,
  children,
  ...props
}: KanbanColumnProps) {
  const isOverlay = useContext(IsOverlayContext)

  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
    animateLayoutChanges,
  })

  const { activeId, isColumn } = useContext(KanbanContext)
  const isColumnDragging = activeId ? isColumn(activeId) : false

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    ...(isSortableDragging ? { zIndex: 50 } : {}),
  } as CSSProperties

  const Comp = asChild ? Slot.Root : "div"

  const columnContextValue = useMemo(
    () => ({
      attributes,
      listeners,
      isDragging: isSortableDragging,
      disabled,
    }),
    [attributes, listeners, isSortableDragging, disabled],
  )

  if (isOverlay) {
    return (
      <Comp className={cn(className)} data-slot="kanban-column" {...props}>
        {children}
      </Comp>
    )
  }

  return (
    <ColumnContext.Provider value={columnContextValue}>
      <Comp
        ref={setNodeRef}
        style={style}
        className={cn(className)}
        data-slot="kanban-column"
        data-dragging={isColumnDragging}
        {...props}
      >
        {children}
      </Comp>
    </ColumnContext.Provider>
  )
}

export interface KanbanColumnHandleProps extends HTMLAttributes<HTMLDivElement> {
  cursor?: boolean
  asChild?: boolean
  render?: (props: DraggableAttributes & { listeners?: DraggableSyntheticListeners }) => ReactNode
}

function KanbanColumnHandle({
  className,
  asChild = false,
  cursor = true,
  children,
  render,
  ...props
}: KanbanColumnHandleProps) {
  const { attributes, listeners, isDragging, disabled } =
    useContext(ColumnContext)

  const Comp = asChild ? Slot.Root : "div"

  if (render) {
    return <>{render({ ...attributes, listeners })}</>
  }

  return (
    <Comp
      className={cn(cursor && "cursor-grab active:cursor-grabbing", className)}
      data-slot="kanban-column-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...attributes}
      {...(listeners ?? {})}
      {...props}
    >
      {children}
    </Comp>
  )
}

export interface KanbanItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
  asChild?: boolean
}

function KanbanItem({
  value,
  className,
  asChild = false,
  disabled,
  children,
  ...props
}: KanbanItemProps) {
  const isOverlay = useContext(IsOverlayContext)

  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
    animateLayoutChanges,
  })

  const { activeId, isColumn } = useContext(KanbanContext)
  const isItemDragging = activeId ? !isColumn(activeId) : false

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    ...(isSortableDragging ? { zIndex: 50 } : {}),
  } as CSSProperties

  const Comp = asChild ? Slot.Root : "div"

  const itemContextValue = useMemo(
    () => ({
      listeners,
      isDragging: isSortableDragging,
      disabled,
    }),
    [listeners, isSortableDragging, disabled],
  )

  if (isOverlay) {
    return (
      <Comp className={cn(className)} data-slot="kanban-item" {...props}>
        {children}
      </Comp>
    )
  }

  return (
    <ItemContext.Provider value={itemContextValue}>
      <Comp
        ref={setNodeRef}
        style={style}
        className={cn(className)}
        data-slot="kanban-item"
        data-dragging={isItemDragging}
        {...props}
      >
        {children}
      </Comp>
    </ItemContext.Provider>
  )
}

export interface KanbanItemHandleProps extends HTMLAttributes<HTMLDivElement> {
  cursor?: boolean
  asChild?: boolean
}

function KanbanItemHandle({
  className,
  asChild = false,
  cursor = true,
  children,
  ...props
}: KanbanItemHandleProps) {
  const { listeners, isDragging, disabled } = useContext(ItemContext)

  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      className={cn(cursor && "cursor-grab active:cursor-grabbing", className)}
      data-slot="kanban-item-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...(listeners ?? {})}
      {...props}
    >
      {children}
    </Comp>
  )
}

export interface KanbanColumnContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  asChild?: boolean
}

function KanbanColumnContent({
  value,
  className,
  asChild = false,
  children,
  ...props
}: KanbanColumnContentProps) {
  const { columns, getItemId } = useContext(KanbanContext)

  const itemIds = useMemo(
    () => (columns[value] ?? []).map(getItemId),
    [columns, getItemId, value],
  )

  const Comp = asChild ? Slot.Root : "div"

  return (
    <SortableContext
      items={itemIds}
      strategy={verticalListSortingStrategy}
    >
      <Comp className={cn(className)} data-slot="kanban-column-content" {...props}>
        {children}
      </Comp>
    </SortableContext>
  )
}

export interface KanbanOverlayProps
  extends Omit<React.ComponentProps<typeof DragOverlay>, "children"> {
  children?:
    | ReactNode
    | ((params: {
        value: UniqueIdentifier
        variant: "column" | "item"
      }) => ReactNode)
}

function KanbanOverlay({
  children,
  className,
  dropAnimation = dropAnimationConfig,
  ...props
}: KanbanOverlayProps) {
  const { activeId, isColumn, modifiers } = useContext(KanbanContext)
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => setMounted(true), [])

  const variant = activeId ? (isColumn(activeId) ? "column" : "item") : "item"

  const content =
    activeId && children
      ? typeof children === "function"
        ? children({ value: activeId, variant })
        : children
      : null

  if (!mounted) return null

  return createPortal(
    <IsOverlayContext.Provider value={true}>
      <DragOverlay dropAnimation={dropAnimation} className={className} {...props}>
        {content}
      </DragOverlay>
    </IsOverlayContext.Provider>,
    document.body,
  )
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanColumnContent,
  KanbanOverlay,
}
