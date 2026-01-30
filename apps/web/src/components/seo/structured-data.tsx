interface StructuredDataProps {
  data: Record<string, unknown>
}

export function StructuredData({ data }: StructuredDataProps) {
  // Sanitize JSON to prevent XSS in dangerouslySetInnerHTML
  const jsonString = JSON.stringify(data)
    .replace(/<\/script/gi, '\\u003c/script') // Escape </script tags
    .replace(/</g, '\\u003c') // Escape <
    .replace(/>/g, '\\u003e') // Escape >
    .replace(/&/g, '\\u0026') // Escape &
    .replace(/\u2028/g, '\\u2028') // Escape U+2028
    .replace(/\u2029/g, '\\u2029'); // Escape U+2029

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonString,
      }}
    />
  )
}
