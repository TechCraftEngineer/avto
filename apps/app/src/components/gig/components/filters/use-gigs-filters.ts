import type { SortDirection } from "@qbs-autonaim/shared";
import { useMemo } from "react";

export interface Gig {
  id: string;
  title: string;
  type: string;
  isActive: boolean | null;
  responses?: number | null;
  newResponses?: number | null;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  source: string;
  description?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string | null;
  externalId?: string | null;
  views?: number | null;
  url?: string | null;
}

export interface GigsFilters {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  sortBy: string;
  sortDirection?: SortDirection;
  quickFilter?: string;
  groupBy?: "none" | "urgency";
}

export interface GigsStats {
  totalGigs: number;
  activeGigs: number;
  totalResponses: number;
  newResponses: number;
  overdueCount: number;
}

function getUrgencyOrder(g: Gig, now: number) {
  const deadline = g.deadline ? new Date(g.deadline).getTime() : null;
  const isActive = g.isActive === true;
  if (!deadline || !isActive) return 4; // Остальные
  if (deadline < now) return 0; // Просрочено
  const diff = deadline - now;
  if (diff <= 24 * 60 * 60 * 1000) return 1; // < 24ч
  if (diff <= 72 * 60 * 60 * 1000) return 2; // < 72ч
  return 3; // Скоро
}

export function useGigsFilters(gigs: Gig[] | undefined, filters: GigsFilters) {
  const {
    searchQuery,
    typeFilter,
    statusFilter,
    sortBy,
    sortDirection = "desc",
    quickFilter = "",
    groupBy = "none",
  } = filters;

  const filteredAndSortedGigs = useMemo(() => {
    if (!gigs) return [];

    let filtered = [...gigs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((g) => g.title.toLowerCase().includes(query));
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((g) => g.type === typeFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((g) => g.isActive === true);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(
        (g) => g.isActive === false || g.isActive === null,
      );
    }

    if (quickFilter) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const threeDays = 3 * day;

      if (quickFilter === "needsAttention") {
        filtered = filtered.filter((g) => {
          const hasNew = (g.newResponses ?? 0) > 0;
          const deadline = g.deadline ? new Date(g.deadline).getTime() : null;
          const isOverdue = deadline && deadline < now && g.isActive === true;
          const isUrgent =
            deadline &&
            g.isActive === true &&
            !isOverdue &&
            deadline - now <= threeDays &&
            deadline - now > 0;
          return hasNew || isOverdue || isUrgent;
        });
      } else if (quickFilter === "hasNewResponses") {
        filtered = filtered.filter((g) => (g.newResponses ?? 0) > 0);
      } else if (quickFilter === "deadlineSoon") {
        filtered = filtered.filter((g) => {
          if (!g.deadline || g.isActive !== true) return false;
          const deadline = new Date(g.deadline).getTime();
          return deadline > now && deadline - now <= 7 * day;
        });
      }
    }

    const dir = sortDirection === "asc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      let cmp: number;
      if (groupBy === "urgency" || sortBy === "urgency") {
        const now = Date.now();
        const orderA = getUrgencyOrder(a, now);
        const orderB = getUrgencyOrder(b, now);
        cmp = orderA !== orderB ? orderA - orderB : 0;
        if (cmp === 0)
          cmp =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        switch (sortBy) {
          case "responses":
            cmp = (b.responses ?? 0) - (a.responses ?? 0);
            break;
          case "newResponses":
            cmp = (b.newResponses ?? 0) - (a.newResponses ?? 0);
            break;
          case "title":
            cmp = a.title.localeCompare(b.title);
            break;
          case "deadline":
            if (!a.deadline && !b.deadline) cmp = 0;
            else if (!a.deadline) cmp = 1;
            else if (!b.deadline) cmp = -1;
            else cmp = a.deadline.getTime() - b.deadline.getTime();
            break;
          case "budgetMin":
            cmp = (a.budgetMin ?? 0) - (b.budgetMin ?? 0);
            break;
          case "budgetMax":
            cmp = (b.budgetMax ?? 0) - (a.budgetMax ?? 0);
            break;
          default:
            cmp =
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      }
      return cmp * dir;
    });

    return filtered;
  }, [
    gigs,
    searchQuery,
    typeFilter,
    statusFilter,
    sortBy,
    sortDirection,
    quickFilter,
    groupBy,
  ]);

  const stats = useMemo((): GigsStats => {
    if (!gigs) {
      return {
        totalGigs: 0,
        activeGigs: 0,
        totalResponses: 0,
        newResponses: 0,
        overdueCount: 0,
      };
    }

    const now = Date.now();
    const overdueCount = gigs.filter((g) => {
      if (!g.deadline || g.isActive !== true) return false;
      return new Date(g.deadline).getTime() < now;
    }).length;

    return {
      totalGigs: gigs.length,
      activeGigs: gigs.filter((g) => g.isActive === true).length,
      totalResponses: gigs.reduce((sum, g) => sum + (g.responses ?? 0), 0),
      newResponses: gigs.reduce((sum, g) => sum + (g.newResponses ?? 0), 0),
      overdueCount,
    };
  }, [gigs]);

  return {
    filteredAndSortedGigs,
    stats,
  };
}
