import { useState, useEffect } from 'react'
import api from '../services/api'

const FASES = [
  { key: 'GRUPOS', label: 'Fase de Grupos' },
  { key: 'DEZASSEIS', label: 'Rodada de 16' },
  { key: 'OITAVAS', label: 'Oitavas de Final' },
  { key: 'QUARTAS', label: 'Quartas de Final' },
  { key: 'SEMI', label: 'Semifinal' },
  { key: 'TERCEIRO_LUGAR', label: '3º Lugar' },
  { key: 'FINAL', label: 'Final' },
]

const BANDEIRAS = {
  MEX: '🇲🇽', RSA: '🇿🇦', KOR: '🇰🇷', CZE: '🇨🇿',
  CAN: '🇨🇦', BIH: '🇧🇦', QAT: '🇶🇦', SUI: '🇨🇭',
  BRA: '🇧🇷', MAR: '🇲🇦', HAI: '🇭🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  USA: '🇺🇸', PAR: '🇵🇾', AUS: '🇦🇺', TUR: '🇹🇷',
  GER: '🇩🇪', CUW: '🇨🇼', CIV: '🇨🇮', ECU: '🇪🇨',
  NED: '🇳🇱', JPN: '🇯🇵', SWE: '🇸🇪', TUN: '🇹🇳',
  BEL: '🇧🇪', EGY: '🇪🇬', IRN: '🇮🇷', NZL: '🇳🇿',
  ESP: '🇪🇸', CPV: '🇨🇻', KSA: '🇸🇦', URU: '🇺🇾',
  FRA: '🇫🇷', SEN: '🇸🇳', IRQ: '🇮🇶', NOR: '🇳🇴',
  ARG: '🇦🇷', ALG: '🇩🇿', AUT: '🇦🇹', JOR: '🇯🇴',
  POR: '🇵🇹', COD: '🇨🇩', UZB: '🇺🇿', COL: '🇨🇴',
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', CRO: '🇭🇷', GHA: '🇬🇭', PAN: '🇵🇦',
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function PartidaCard({ partida }) {
  const casa = partida.selecaoCasa
  const vis = partida.selecaoVisitante

  return (
    <div className={`bg-gray-900 rounded-xl border p-4 ${
      partida.encerrada ? 'border-gray-700 opacity-75' : 'border-gray-800'
    }`}>
      <div className="flex items-center justify-between gap-2">
        {/* Casa */}
        <div className="flex-1 text-right">
          <div className="text-2xl">{BANDEIRAS[casa.codigoFifa] || '🏳️'}</div>
          <p className="text-sm font-medium text-white mt-1 leading-tight">{casa.nome}</p>
        </div>

        {/* Placar */}
        <div className="text-center min-w-[80px]">
          {partida.encerrada ? (
            <div className="text-2xl font-bold text-yellow-400">
              {partida.golsCasa} — {partida.golsVisitante}
            </div>
          ) : (
            <div className="text-gray-500 text-sm font-semibold">VS</div>
          )}
          <div className="text-xs text-gray-500 mt-1">{formatDate(partida.dataHora)}</div>
          {partida.encerrada && (
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Encerrada</span>
          )}
        </div>

        {/* Visitante */}
        <div className="flex-1 text-left">
          <div className="text-2xl">{BANDEIRAS[vis.codigoFifa] || '🏳️'}</div>
          <p className="text-sm font-medium text-white mt-1 leading-tight">{vis.nome}</p>
        </div>
      </div>
    </div>
  )
}

export default function Partidas() {
  const [partidas, setPartidas] = useState([])
  const [faseAtiva, setFaseAtiva] = useState('GRUPOS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/partidas')
      .then(r => setPartidas(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtradas = partidas.filter(p => p.fase === faseAtiva)

  const fasesComPartidas = FASES.filter(f =>
    partidas.some(p => p.fase === f.key)
  )

  const todasFases = fasesComPartidas.length > 0 ? fasesComPartidas : FASES.slice(0, 1)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Partidas</h1>
        <p className="text-gray-400 mt-1">Acompanhe todos os jogos</p>
      </div>

      {/* Tabs de fase */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {todasFases.map(f => (
          <button
            key={f.key}
            onClick={() => setFaseAtiva(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              faseAtiva === f.key
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📅</p>
          <p>Nenhuma partida cadastrada nessa fase ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map(p => <PartidaCard key={p.id} partida={p} />)}
        </div>
      )}
    </div>
  )
}
