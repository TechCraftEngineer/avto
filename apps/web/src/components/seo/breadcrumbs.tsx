"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { structuredData } from "@/lib/seo"
import { StructuredData } from "./structured-data"

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems = [{ name: "Главная", url: "/" }, ...items]

  return (
    <>
      <StructuredData data={structuredData.breadcrumb(allItems)} />
      <nav aria-label="Навигация" className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1

            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="mx-2 h-4 w-4" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
