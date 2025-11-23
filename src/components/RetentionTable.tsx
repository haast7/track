interface RetentionData {
  date: string
  formattedDate: string
  entries: number
  exits: number
  retention: number
}

interface RetentionTableProps {
  data: RetentionData[]
}

export default function RetentionTable({ data }: RetentionTableProps) {
  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Retenção por Dia
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                Data
              </th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                Entradas
              </th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                Saídas
              </th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                Taxa de Retenção
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  Nenhum dado disponível
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.date} className="border-b border-border">
                  <td className="p-3 text-sm text-foreground">{row.formattedDate}</td>
                  <td className="p-3 text-sm text-right text-foreground">
                    {row.entries}
                  </td>
                  <td className="p-3 text-sm text-right text-foreground">
                    {row.exits}
                  </td>
                  <td className="p-3 text-sm text-right font-medium text-foreground">
                    {row.retention.toFixed(2)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


