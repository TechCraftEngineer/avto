"use client";

import { paths } from "@qbs-autonaim/config";
import { getInitials } from "@qbs-autonaim/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Kbd,
  KbdGroup,
  Progress,
  Separator,
  SidebarTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Command,
  CreditCard,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "~/auth/client";
import { getAvatarUrl } from "~/lib/avatar";

interface SiteHeaderProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  children?: React.ReactNode;
}

export function SiteHeader({ user, children }: SiteHeaderProps) {
  const router = useRouter();

  const initials = getInitials(user.name);
  const avatarUrl = getAvatarUrl(user.avatar, user.name);

  // TODO: Заменить на реальные данные из API
  const hasNotifications = false;

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(paths.auth.signin);
        },
      },
    });
  };

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="lg:flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative hidden max-w-sm flex-1 lg:block">
                <Search
                  className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Поиск…"
                  readOnly
                  className="cursor-pointer pr-20 pl-10"
                  aria-label="Поиск по платформе"
                />
                <KbdGroup className="absolute top-1/2 right-2 -translate-y-1/2">
                  <Kbd>
                    <Command className="size-3" aria-hidden="true" />
                  </Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Скоро будет доступно</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="block lg:hidden">
                <Button variant="ghost" size="icon" className="size-9">
                  <Search aria-hidden="true" />
                  <span className="sr-only">Поиск</span>
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Скоро будет доступно</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {children}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 relative">
                <Bell aria-hidden="true" />
                {hasNotifications && (
                  <span className="bg-destructive absolute end-0.5 top-0.5 block size-1.5 shrink-0 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Уведомления</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Нет новых уведомлений</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="size-8 cursor-pointer">
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="p-0">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8">
                    <AvatarImage src={avatarUrl} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-default">
                  <Sparkles className="size-4" aria-hidden="true" />
                  Обновить до Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <a
                    href={paths.account.settings}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <BadgeCheck className="size-4" aria-hidden="true" />
                    Профиль
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={paths.account.settings}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <CreditCard className="size-4" aria-hidden="true" />
                    Настройки
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="size-4" aria-hidden="true" />
                  Уведомления
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" aria-hidden="true" />
                Выйти
              </DropdownMenuItem>
              <div className="bg-muted mt-1.5 rounded-md border">
                <div className="space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Кредиты</h4>
                    <div className="text-muted-foreground flex cursor-pointer items-center text-sm">
                      <span>5 осталось</span>
                      <ChevronRight
                        className="ml-1 h-4 w-4"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <Progress value={40} className="h-2" />
                  <div className="text-muted-foreground flex items-center text-sm">
                    Ежедневные кредиты используются первыми
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
