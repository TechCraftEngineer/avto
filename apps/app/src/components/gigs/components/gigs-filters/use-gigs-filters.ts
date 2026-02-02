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
}

export interface GigsFilters {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  sortBy: string;
}

export interface GigsStats {
  totalGigs: number;
  activeGigs: number;
  totalResponses: number;
  newResponses: number;
}

export function useGigsFilters(gigs: Gig[] | undefined, filters: GigsFilters) {
  const { searchQuery, typeFilter, statusFilter, sortBy } = filters;

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

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "responses":
          return (b.responses ?? 0) - (a.responses ?? 0);
        case "newResponses":
          return (b.newResponses ?? 0) - (a.newResponses ?? 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.getTime() - b.deadline.getTime();
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return filtered;
  }, [gigs, searchQuery, typeFilter, statusFilter, sortBy]);

  const stats = useMemo((): GigsStats => {
    if (!gigs) {
      return {
        totalGigs: 0,
        activeGigs: 0,
        totalResponses: 0,
        newResponses: 0,
      };
    }

    return {
      totalGigs: gigs.length,
      activeGigs: gigs.filter((g) => g.isActive === true).length,
      totalResponses: gigs.reduce((sum, g) => sum + (g.responses ?? 0), 0),
      newResponses: gigs.reduce((sum, g) => sum + (g.newResponses ?? 0), 0),
    };
  }, [gigs]);

  return {
    filteredAndSortedGigs,
    stats,
  };
}
