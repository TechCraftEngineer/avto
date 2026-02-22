#!/usr/bin/env bun

/**
 * Скрипт для миграции импортов из @qbs-autonaim/ui
 *
 * Преобразует:
 * import { Button, Card } from "@qbs-autonaim/ui"
 *
 * В:
 * import { Button } from "@qbs-autonaim/ui/components/button"
 * import { Card } from "@qbs-autonaim/ui/components/card"
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Маппинг компонентов на файлы
const componentToFile: Record<string, string> = {
  // Utilities
  cn: "index",
  useIsMobile: "use-mobile",
  useToast: "use-toast",
  toast: "use-toast",

  // Types
  ToastProps: "radix-toast",
  ToastActionElement: "radix-toast",
  ChartConfig: "chart",
  CarouselApi: "carousel",
  PasswordRequirement: "password-requirements",
  PasswordRequirementsProps: "password-requirements",
  ThemeMode: "theme",
  ResolvedTheme: "theme",

  // Components
  Accordion: "accordion",
  AccordionItem: "accordion",
  AccordionTrigger: "accordion",
  AccordionContent: "accordion",

  Alert: "alert",
  AlertTitle: "alert",
  AlertDescription: "alert",

  AlertDialog: "alert-dialog",
  AlertDialogPortal: "alert-dialog",
  AlertDialogOverlay: "alert-dialog",
  AlertDialogTrigger: "alert-dialog",
  AlertDialogContent: "alert-dialog",
  AlertDialogHeader: "alert-dialog",
  AlertDialogFooter: "alert-dialog",
  AlertDialogTitle: "alert-dialog",
  AlertDialogDescription: "alert-dialog",
  AlertDialogAction: "alert-dialog",
  AlertDialogCancel: "alert-dialog",

  Avatar: "avatar",
  AvatarFallback: "avatar",
  AvatarImage: "avatar",

  Badge: "badge",
  badgeVariants: "badge",

  Button: "button",
  buttonVariants: "button",

  Calendar: "calendar",
  CalendarDayButton: "calendar",

  CandidateAvatar: "candidate-avatar",

  Card: "card",
  CardAction: "card",
  CardHeader: "card",
  CardTitle: "card",
  CardDescription: "card",
  CardContent: "card",
  CardFooter: "card",

  Carousel: "carousel",
  useCarousel: "carousel",

  Chart: "chart",
  ChartContainer: "chart",
  ChartTooltip: "chart",
  ChartTooltipContent: "chart",
  ChartLegend: "chart",
  ChartLegendContent: "chart",
  ChartStyle: "chart",

  Checkbox: "checkbox",

  Collapsible: "collapsible",
  CollapsibleTrigger: "collapsible",
  CollapsibleContent: "collapsible",

  Command: "command",
  CommandDialog: "command",
  CommandInput: "command",
  CommandList: "command",
  CommandEmpty: "command",
  CommandGroup: "command",
  CommandItem: "command",
  CommandShortcut: "command",
  CommandSeparator: "command",

  ContextMenu: "context-menu",
  ContextMenuTrigger: "context-menu",
  ContextMenuContent: "context-menu",
  ContextMenuItem: "context-menu",
  ContextMenuCheckboxItem: "context-menu",
  ContextMenuRadioItem: "context-menu",
  ContextMenuLabel: "context-menu",
  ContextMenuSeparator: "context-menu",
  ContextMenuShortcut: "context-menu",
  ContextMenuGroup: "context-menu",
  ContextMenuPortal: "context-menu",
  ContextMenuSub: "context-menu",
  ContextMenuSubContent: "context-menu",
  ContextMenuSubTrigger: "context-menu",
  ContextMenuRadioGroup: "context-menu",

  DataGrid: "reui/data-grid",
  DataGridContainer: "reui/data-grid",
  DataGridProvider: "reui/data-grid",
  useDataGrid: "reui/data-grid",
  DataGridTableDnd: "reui/data-grid",
  DataGridPagination: "reui/data-grid",
  DataGridTable: "reui/data-grid",
  DataGridTableBase: "reui/data-grid",
  DataGridTableBody: "reui/data-grid",
  DataGridTableBodyRow: "reui/data-grid",
  DataGridTableBodyRowCell: "reui/data-grid",
  DataGridTableBodyRowExpandded: "reui/data-grid",
  DataGridTableBodyRowSkeleton: "reui/data-grid",
  DataGridTableBodyRowSkeletonCell: "reui/data-grid",
  DataGridTableEmpty: "reui/data-grid",
  DataGridTableHead: "reui/data-grid",
  DataGridTableHeadRow: "reui/data-grid",
  DataGridTableHeadRowCell: "reui/data-grid",
  DataGridTableHeadRowCellResize: "reui/data-grid",
  DataGridTableRowSpacer: "reui/data-grid",

  Dialog: "dialog",
  DialogClose: "dialog",
  DialogContent: "dialog",
  DialogDescription: "dialog",
  DialogFooter: "dialog",
  DialogHeader: "dialog",
  DialogOverlay: "dialog",
  DialogPortal: "dialog",
  DialogTitle: "dialog",
  DialogTrigger: "dialog",

  Drawer: "drawer",
  DrawerPortal: "drawer",
  DrawerOverlay: "drawer",
  DrawerTrigger: "drawer",
  DrawerClose: "drawer",
  DrawerContent: "drawer",
  DrawerHeader: "drawer",
  DrawerFooter: "drawer",
  DrawerTitle: "drawer",
  DrawerDescription: "drawer",

  DropdownMenu: "dropdown-menu",
  DropdownMenuPortal: "dropdown-menu",
  DropdownMenuTrigger: "dropdown-menu",
  DropdownMenuContent: "dropdown-menu",
  DropdownMenuGroup: "dropdown-menu",
  DropdownMenuItem: "dropdown-menu",
  DropdownMenuCheckboxItem: "dropdown-menu",
  DropdownMenuRadioGroup: "dropdown-menu",
  DropdownMenuRadioItem: "dropdown-menu",
  DropdownMenuLabel: "dropdown-menu",
  DropdownMenuSeparator: "dropdown-menu",
  DropdownMenuShortcut: "dropdown-menu",
  DropdownMenuSub: "dropdown-menu",
  DropdownMenuSubTrigger: "dropdown-menu",
  DropdownMenuSubContent: "dropdown-menu",

  Empty: "empty",
  EmptyHeader: "empty",
  EmptyTitle: "empty",
  EmptyDescription: "empty",
  EmptyContent: "empty",
  EmptyMedia: "empty",

  FieldSet: "field",
  FieldLegend: "field",
  FieldGroup: "field",
  Field: "field",
  FieldContent: "field",
  FieldLabel: "field",
  FieldTitle: "field",
  FieldDescription: "field",
  FieldSeparator: "field",
  FieldError: "field",

  Form: "form",
  useFormField: "form",
  FormItem: "form",
  FormLabel: "form",
  FormControl: "form",
  FormDescription: "form",
  FormMessage: "form",
  FormField: "form",

  HoverCard: "hover-card",
  HoverCardTrigger: "hover-card",
  HoverCardContent: "hover-card",

  InfoTooltip: "info-tooltip",

  Input: "input",

  InputGroup: "input-group",
  InputGroupAddon: "input-group",
  InputGroupButton: "input-group",
  InputGroupText: "input-group",
  InputGroupInput: "input-group",
  InputGroupTextarea: "input-group",

  InputOTP: "input-otp",
  InputOTPGroup: "input-otp",
  InputOTPSlot: "input-otp",
  InputOTPSeparator: "input-otp",

  IntegrationIcon: "integration-icon",

  Item: "item",
  ItemMedia: "item",
  ItemContent: "item",
  ItemActions: "item",
  ItemGroup: "item",
  ItemSeparator: "item",
  ItemTitle: "item",
  ItemDescription: "item",
  ItemHeader: "item",
  ItemFooter: "item",

  Kanban: "reui/kanban",
  KanbanBoard: "reui/kanban",
  KanbanColumn: "reui/kanban",
  KanbanColumnContent: "reui/kanban",
  KanbanColumnHandle: "reui/kanban",
  KanbanItem: "reui/kanban",
  KanbanItemHandle: "reui/kanban",
  KanbanOverlay: "reui/kanban",

  Kbd: "kbd",
  KbdGroup: "kbd",

  Label: "label",

  Menubar: "menubar",
  MenubarPortal: "menubar",
  MenubarMenu: "menubar",
  MenubarTrigger: "menubar",
  MenubarContent: "menubar",
  MenubarGroup: "menubar",
  MenubarSeparator: "menubar",
  MenubarLabel: "menubar",
  MenubarItem: "menubar",
  MenubarShortcut: "menubar",
  MenubarCheckboxItem: "menubar",
  MenubarRadioGroup: "menubar",
  MenubarRadioItem: "menubar",
  MenubarSub: "menubar",
  MenubarSubTrigger: "menubar",
  MenubarSubContent: "menubar",

  NavigationMenu: "navigation-menu",
  NavigationMenuList: "navigation-menu",
  NavigationMenuItem: "navigation-menu",
  NavigationMenuContent: "navigation-menu",
  NavigationMenuTrigger: "navigation-menu",
  NavigationMenuLink: "navigation-menu",
  NavigationMenuIndicator: "navigation-menu",
  NavigationMenuViewport: "navigation-menu",
  navigationMenuTriggerStyle: "navigation-menu",

  Pagination: "pagination",

  PasswordInput: "password-input",

  PasswordRequirements: "password-requirements",
  usePasswordRequirements: "password-requirements",
  isPasswordValid: "password-requirements",

  Popover: "popover",
  PopoverTrigger: "popover",
  PopoverContent: "popover",
  PopoverAnchor: "popover",

  Progress: "progress",

  RadioGroup: "radio-group",
  RadioGroupItem: "radio-group",

  ResizablePanelGroup: "resizable",
  ResizablePanel: "resizable",
  ResizableHandle: "resizable",

  ScrollArea: "scroll-area",
  ScrollBar: "scroll-area",

  Select: "select",
  SelectContent: "select",
  SelectGroup: "select",
  SelectItem: "select",
  SelectLabel: "select",
  SelectScrollDownButton: "select",
  SelectScrollUpButton: "select",
  SelectSeparator: "select",
  SelectTrigger: "select",
  SelectValue: "select",

  Separator: "separator",

  Sheet: "sheet",
  SheetTrigger: "sheet",
  SheetClose: "sheet",
  SheetContent: "sheet",
  SheetHeader: "sheet",
  SheetFooter: "sheet",
  SheetTitle: "sheet",
  SheetDescription: "sheet",

  Sidebar: "sidebar",
  SidebarContent: "sidebar",
  SidebarFooter: "sidebar",
  SidebarGroup: "sidebar",
  SidebarGroupAction: "sidebar",
  SidebarGroupContent: "sidebar",
  SidebarGroupLabel: "sidebar",
  SidebarHeader: "sidebar",
  SidebarInput: "sidebar",
  SidebarInset: "sidebar",
  SidebarMenu: "sidebar",
  SidebarMenuAction: "sidebar",
  SidebarMenuBadge: "sidebar",
  SidebarMenuButton: "sidebar",
  SidebarMenuItem: "sidebar",
  SidebarMenuSkeleton: "sidebar",
  SidebarMenuSub: "sidebar",
  SidebarMenuSubButton: "sidebar",
  SidebarMenuSubItem: "sidebar",
  SidebarProvider: "sidebar",
  SidebarRail: "sidebar",
  SidebarSeparator: "sidebar",
  SidebarTrigger: "sidebar",
  useSidebar: "sidebar",

  Skeleton: "skeleton",

  Slider: "slider",

  Toaster: "sonner",

  Spinner: "spinner",

  Switch: "switch",

  Table: "table",
  TableHeader: "table",
  TableBody: "table",
  TableFooter: "table",
  TableHead: "table",
  TableRow: "table",
  TableCell: "table",
  TableCaption: "table",

  Tabs: "tabs",
  TabsList: "tabs",
  TabsTrigger: "tabs",
  TabsContent: "tabs",

  Textarea: "textarea",

  ThemeProvider: "theme",
  useTheme: "theme",
  ThemeToggle: "theme",

  ToastProvider: "radix-toast",
  ToastViewport: "radix-toast",
  Toast: "radix-toast",
  ToastTitle: "radix-toast",
  ToastDescription: "radix-toast",
  ToastClose: "radix-toast",
  ToastAction: "radix-toast",

  Toggle: "toggle",
  toggleVariants: "toggle",

  ToggleGroup: "toggle-group",
  ToggleGroupItem: "toggle-group",

  Tooltip: "tooltip",
  TooltipTrigger: "tooltip",
  TooltipContent: "tooltip",
  TooltipProvider: "tooltip",

  TooltipMarkdown: "tooltip-markdown",
};

async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".turbo"
      ) {
        continue;
      }
      yield* walkDirectory(path);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
    ) {
      yield path;
    }
  }
}

function migrateImports(content: string): {
  content: string;
  changed: boolean;
} {
  const importRegex =
    /import\s+(?:type\s+)?{([^}]+)}\s+from\s+["']@qbs-autonaim\/ui["']/g;

  let changed = false;
  const newContent = content.replace(importRegex, (_match, imports) => {
    changed = true;

    // Парсим импорты
    const importList = imports
      .split(",")
      .map((imp: string) => imp.trim())
      .filter((imp: string) => imp.length > 0);

    // Группируем по файлам
    const fileGroups = new Map<string, string[]>();

    for (const imp of importList) {
      // Обрабатываем type imports
      const isType = imp.startsWith("type ");
      const cleanImp = isType ? imp.slice(5).trim() : imp;

      const file = componentToFile[cleanImp];
      if (!file) {
        console.warn(`⚠️  Неизвестный компонент: ${cleanImp}`);
        continue;
      }

      if (!fileGroups.has(file)) {
        fileGroups.set(file, []);
      }
      fileGroups.get(file)?.push(imp);
    }

    // Генерируем новые импорты
    const newImports: string[] = [];
    for (const [file, imports] of fileGroups) {
      const path =
        file === "index"
          ? "@qbs-autonaim/ui/utils"
          : `@qbs-autonaim/ui/components/${file}`;

      newImports.push(`import { ${imports.join(", ")} } from "${path}"`);
    }

    return newImports.join("\n");
  });

  return { content: newContent, changed };
}

async function main() {
  const rootDir = process.cwd();
  const appsDir = join(rootDir, "apps");

  let totalFiles = 0;
  let changedFiles = 0;

  console.log("🔍 Поиск файлов для миграции...\n");

  for await (const filePath of walkDirectory(appsDir)) {
    totalFiles++;

    const content = await readFile(filePath, "utf-8");
    const { content: newContent, changed } = migrateImports(content);

    if (changed) {
      await writeFile(filePath, newContent, "utf-8");
      changedFiles++;
      console.log(`✅ ${filePath.replace(rootDir, "")}`);
    }
  }

  console.log(`\n✨ Готово!`);
  console.log(`📊 Обработано файлов: ${totalFiles}`);
  console.log(`🔄 Изменено файлов: ${changedFiles}`);
}

main().catch(console.error);
