"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import {
  Calendar,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { GigResponse, GigContextData } from "./types";

interface PricingCardProps {
  response: GigResponse;
  gig?: GigContextData;
  onAccept?: () => void;
  onNegotiate?: () => void;
}

export function PricingCard({
  response,
  gig,
  onAccept,
  onNegotiate,
}: PricingCardProps) {
  const price = response.proposedPrice;
  const deliveryDays = response.proposedDeliveryDays;

  if (!price && !deliveryDays) {
    return null;
  }

  // Расчет стоимости за день (если есть оба параметра)
  const pricePerDay =
    price && deliveryDays ? Math.round(price / deliveryDays) : null;

  // Используем данные из gig если доступны, иначе - средние значения
  const marketAveragePrice =
    gig?.budgetMin && gig?.budgetMax
      ? (gig.budgetMin + gig.budgetMax) / 2
      : 15000;

  // Parse estimatedDuration to number (e.g., "1-2 дня" -> 2, "неделя" -> 7)
  const parseDurationToDays = (duration: string | null): number => {
    if (!duration) return 7;
    const match = duration.match(/(\d+)/);
    if (match?.[1]) return parseInt(match[1], 10);
    if (duration.toLowerCase().includes("недел")) return 7;
    if (
      duration.toLowerCase().includes("день") ||
      duration.toLowerCase().includes("дней")
    )
      return 1;
    if (duration.toLowerCase().includes("месяц")) return 30;
    return 7;
  };

  const marketAverageDays = gig
    ? parseDurationToDays(gig.estimatedDuration)
    : 7;

  const getPriceComparison = () => {
    if (!price) return null;

    const difference =
      ((price - marketAveragePrice) / marketAveragePrice) * 100;

    if (Math.abs(difference) < 10) {
      return {
        icon: CheckCircle,
        text: "В рынке",
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-300",
      };
    }

    if (difference < 0) {
      return {
        icon: TrendingDown,
        text: `${Math.abs(difference).toFixed(0)}% ниже рынка`,
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-300",
      };
    }

    return {
      icon: TrendingUp,
      text: `+${difference.toFixed(0)}% выше рынка`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300",
    };
  };

  const getDeliveryComparison = () => {
    if (!deliveryDays) return null;

    const difference = deliveryDays - marketAverageDays;

    if (Math.abs(difference) <= 1) {
      return {
        icon: CheckCircle,
        text: "Стандартные сроки",
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-300",
      };
    }

    if (difference < 0) {
      return {
        icon: TrendingUp,
        text: `Быстрее на ${Math.abs(difference)} дней`,
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-300",
      };
    }

    return {
      icon: Clock,
      text: `Дольше на ${difference} дней`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300",
    };
  };

  const priceComparison = getPriceComparison();
  const deliveryComparison = getDeliveryComparison();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Ценовое предложение
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Основная цена и сроки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {price && (
            <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600 mb-1">
                {price.toLocaleString("ru-RU")} ₽
              </div>
              <div className="text-sm text-emerald-700 mb-2">
                Общая стоимость
              </div>
              {priceComparison && (
                <Badge
                  variant="outline"
                  className={`${priceComparison.bgColor} ${priceComparison.color} ${priceComparison.borderColor} text-xs`}
                >
                  <priceComparison.icon className="h-3 w-3 mr-1" />
                  {priceComparison.text}
                </Badge>
              )}
            </div>
          )}

          {deliveryDays && (
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {deliveryDays} дней
              </div>
              <div className="text-sm text-blue-700 mb-2">Срок выполнения</div>
              {deliveryComparison && (
                <Badge
                  variant="outline"
                  className={`${deliveryComparison.bgColor} ${deliveryComparison.color} ${deliveryComparison.borderColor} text-xs`}
                >
                  <deliveryComparison.icon className="h-3 w-3 mr-1" />
                  {deliveryComparison.text}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Стоимость за день */}
        {pricePerDay && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-purple-900">
                  {pricePerDay.toLocaleString("ru-RU")} ₽/день
                </div>
                <div className="text-sm text-purple-700">
                  Средняя стоимость работы в день
                </div>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        )}

        {/* Рыночное сравнение */}
        {(price || deliveryDays) && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">
              Сравнение с рынком
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600">Средняя цена</div>
                <div className="font-semibold">
                  {marketAveragePrice.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Средние сроки</div>
                <div className="font-semibold">{marketAverageDays} дней</div>
              </div>
            </div>
          </div>
        )}

        {/* Действия */}
        {(onAccept || onNegotiate) && (
          <div className="flex gap-3 pt-2">
            {onNegotiate && (
              <Button
                variant="outline"
                onClick={onNegotiate}
                className="flex-1"
              >
                Обсудить условия
              </Button>
            )}
            {onAccept && (
              <Button onClick={onAccept} className="flex-1">
                Принять предложение
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Предложение действительно 24 часа с момента отклика
        </div>
      </CardContent>
    </Card>
  );
}
