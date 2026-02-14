import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));


export { Avatar, AvatarFallback, AvatarImage } from './avatar'

// Accordion components
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

// Alert components
export { Alert, AlertTitle, AlertDescription } from "./alert";

// Alert Dialog components
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

// Badge components
export { Badge, badgeVariants } from "./badge";

// Button components
export { Button, buttonVariants } from "./button";

// Carousel components
export { useCarousel, type CarouselApi } from "./carousel";

// Chart components
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle
} from "./chart";
export type { ChartConfig } from "./chart";


export { CandidateAvatar } from "./candidate-avatar"

export { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
// Checkbox components
export { Checkbox } from "./checkbox";

// Collapsible components
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./collapsible";

// Command components
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command";

// Context Menu components
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from "./context-menu";



// Dialog components
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

// Drawer components
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "./drawer";

// Dropdown Menu components
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./dropdown-menu";

// Empty components
export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "./empty";

// Field components
export {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
  FieldError,
} from "./field";

// Form components
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "./form";

// Hover Card components
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./hover-card";

// Info tooltip components
export { InfoTooltip } from "./info-tooltip";

// Input components
export { Input } from "./input";

// Input Group components
export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "./input-group";

// Input OTP components
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "./input-otp";

// Integration Icon components
export { IntegrationIcon } from "./integration-icon";

// Item components
export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
} from "./item";

// KBD components
export { Kbd, KbdGroup } from "./kbd";

// Label components
export { Label } from "./label";

// Menubar components
export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "./menubar";

// Navigation Menu components
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

// Pagination components
export { Pagination } from "./pagination";

// Password Input components
export { PasswordInput } from "./password-input";

// Popover components
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./popover";

// Progress components
export { Progress } from "./progress";

// Radio Group components
export { RadioGroup, RadioGroupItem } from "./radio-group";

// Resizable components
export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable";

// Scroll Area components
export { ScrollArea, ScrollBar } from "./scroll-area";

// Select components
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

// Separator components
export { Separator } from "./separator";

// Sheet components
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./sheet";

// Sidebar components
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";

// Skeleton components
export { Skeleton } from "./skeleton";

// Slider components
export { Slider } from "./slider";

// Sonner components
export { Toaster } from "./sonner";

// Spinner components
export { Spinner } from "./spinner";

// Switch components
export { Switch } from "./switch";

// Table components
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";

// Tabs components
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

// Textarea components
export { Textarea } from "./textarea";

// Theme components
export type { ThemeMode, ResolvedTheme } from "./theme";
export { ThemeProvider, useTheme, ThemeToggle } from "./theme";

// Toast components
export type { ToastProps, ToastActionElement } from "./radix-toast";
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "./radix-toast";

// Toggle components
export { Toggle, toggleVariants } from "./toggle";

// Toggle Group components
export { ToggleGroup, ToggleGroupItem } from "./toggle-group";

// Tooltip components
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

// Tooltip Markdown components
export { TooltipMarkdown } from "./tooltip-markdown";

// Utility hooks
export { useIsMobile } from "./use-mobile";
export { useToast, toast } from "./use-toast";
