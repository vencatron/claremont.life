interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="px-4 pt-8 pb-4">
      <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>{title}</h1>
      {subtitle && <p className="text-gray-600 mt-1 text-base">{subtitle}</p>}
    </div>
  )
}
