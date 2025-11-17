type DashboardStatCardProps = {
  title: string
  value: string
  description?: string
}

const DashboardStatCard = ({
  title,
  value,
  description,
}: DashboardStatCardProps) => {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-muted-fg text-sm">{title}</p>
      <p className="mt-2 font-semibold text-2xl">{value}</p>
      {description && (
        <p className="mt-1 text-muted-fg text-xs">{description}</p>
      )}
    </div>
  )
}

export default DashboardStatCard
