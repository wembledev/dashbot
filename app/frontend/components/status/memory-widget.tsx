import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Brain, Database, Search, HardDrive, Clock, FolderOpen, AlertTriangle, CheckCircle } from 'lucide-react'
import HelpButton from './help-button'
import type { MemoryData } from '@/types/status'

interface Props {
  data: MemoryData
}

function QmdView({ data }: Props) {
  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
          <Database className="size-3 sm:size-3.5" />
          Files Indexed
        </span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.file_count}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
          <Search className="size-3 sm:size-3.5" />
          Vectors
        </span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.vector_count}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
          <HardDrive className="size-3 sm:size-3.5" />
          Index Size
        </span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.index_size}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
          <Clock className="size-3 sm:size-3.5" />
          Last Updated
        </span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.updated}</span>
      </div>

      {data.collections.length > 0 && (
        <div className="pt-1.5 sm:pt-2 border-t border-dashbot-border">
          <span className="text-dashbot-muted text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            <FolderOpen className="size-2.5 sm:size-3" />
            Collections
          </span>
          {data.collections.map((col) => (
            <div key={col.name} className="flex items-center justify-between py-0.5 sm:py-1">
              <span className="text-dashbot-text text-xs sm:text-sm font-medium">
                {col.name}
                <span className="text-dashbot-muted font-normal ml-1 sm:ml-1.5 text-[10px] sm:text-xs">{col.pattern}</span>
              </span>
              <span className="text-dashbot-muted text-[10px] sm:text-xs">
                {col.files} files · {col.updated}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OpenclawView({ data }: Props) {
  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
          <Database className="size-3 sm:size-3.5" />
          Files Indexed
        </span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.file_count}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm">Chunks</span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.chunk_count}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm">Sync Status</span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          {data.dirty ? (
            <>
              <AlertTriangle className="size-3 sm:size-3.5 text-yellow-400" />
              <span className="text-yellow-400 text-xs sm:text-sm font-medium">Dirty</span>
            </>
          ) : (
            <>
              <CheckCircle className="size-3 sm:size-3.5 text-green-400" />
              <span className="text-green-400 text-xs sm:text-sm font-medium">Clean</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
          <Search className="size-3 sm:size-3.5" />
          Vector Search
        </span>
        <span className={`text-xs sm:text-sm font-medium ${data.vector_ready ? 'text-green-400' : 'text-red-400'}`}>
          {data.vector_ready ? 'Ready' : 'Not Ready'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm">Full-Text Search</span>
        <span className={`text-xs sm:text-sm font-medium ${data.fts_ready ? 'text-green-400' : 'text-red-400'}`}>
          {data.fts_ready ? 'Ready' : 'Not Ready'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm">Sources</span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.sources}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-dashbot-muted text-xs sm:text-sm">Cache Entries</span>
        <span className="text-dashbot-text text-xs sm:text-sm font-medium">{data.cache_count}</span>
      </div>
    </div>
  )
}

export default function MemoryWidget({ data }: Props) {
  const isQmd = data.backend === 'qmd'
  const title = isQmd ? 'Memory (QMD)' : 'Memory State'
  const description = isQmd
    ? 'Local search index powered by QMD'
    : 'OpenClaw memory index health and status'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <Brain className="size-4 sm:size-5 text-cyan-400" />
          {title}
          <HelpButton topic="Memory" description="Search index health, files indexed, vector embeddings" />
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isQmd ? <QmdView data={data} /> : <OpenclawView data={data} />}
      </CardContent>
    </Card>
  )
}
