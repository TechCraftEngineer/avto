"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { getAvatarUrl } from "~/lib/avatar";
import { useTRPC } from "~/trpc/react";

interface GeneralTabProps {
  user: RouterOutputs["user"]["me"];
}

export function GeneralTab({ user }: GeneralTabProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { refetch } = authClient.useSession();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.image || null);
    }
  }, [user]);

  const updateUserMutation = trpc.user.update.mutationOptions({
    onSuccess: async () => {
      toast.success("Изменения сохранены");
      await queryClient.invalidateQueries({
        queryKey: trpc.user.me.queryKey(),
      });
      await refetch();
    },
    onError: (err) => {
      const message = err.message || "Не удалось сохранить изменения";
      toast.error(message);
    },
  });

  const { mutateAsync: updateUser } = useMutation(updateUserMutation);

  const handleUpdateName = async () => {
    setIsUpdatingName(true);
    try {
      await updateUser({ name, image: avatar });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateAvatar = async () => {
    setIsUpdatingAvatar(true);
    try {
      await updateUser({ name, image: avatar });
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  return (
    <div className="space-y-6">
      {/* Your Name */}
      <Card>
        <CardHeader>
          <CardTitle>Ваше имя</CardTitle>
          <CardDescription>
            Это ваше отображаемое имя на платформе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              maxLength={32}
            />
            <p className="text-sm text-muted-foreground">
              Максимум 32 символа.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleUpdateName}
            disabled={isUpdatingName || !name || name === user?.name}
          >
            {isUpdatingName ? "Сохранение…" : "Сохранить изменения"}
          </Button>
        </CardFooter>
      </Card>

      {/* Your Email */}
      <Card>
        <CardHeader>
          <CardTitle>Ваш Email</CardTitle>
          <CardDescription>
            Это email, который вы используете для входа и получения уведомлений.
            Для изменения требуется подтверждение.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input
              type="email"
              value={user?.email || ""}
              placeholder="your@email.com"
              disabled
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button disabled>Сохранить изменения</Button>
        </CardFooter>
      </Card>

      {/* Your Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Ваш аватар</CardTitle>
          <CardDescription>
            Это изображение вашего аватара на платформе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getAvatarUrl(avatar, name)} />
              <AvatarFallback className="text-2xl">
                {name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex gap-2">
                <label htmlFor="avatar-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить аватар
                    </span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={!avatar}
                >
                  Удалить
                </Button>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Рекомендуется квадратное изображение. Форматы: .png, .jpg,
                .jpeg. Максимум: 2MB.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleUpdateAvatar}
            disabled={isUpdatingAvatar || avatar === user?.image}
          >
            {isUpdatingAvatar ? "Сохранение…" : "Сохранить изменения"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
