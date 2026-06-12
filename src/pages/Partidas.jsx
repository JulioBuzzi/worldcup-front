import { useState, useEffect } from 'react'
import api from '../services/api'
import Bandeira from '../components/Bandeira'

const FASES = [
  { key: 'GRUPOS', label: 'Grupos' },
  { key: 'DEZASSEIS', label: 'Rodada de 16' },
  { key: 'OITAVAS', label: 'Oitavas' },
  { key: 'QUARTAS', label: 'Quartas' },
  { key: 'SEMI', label: 'Semifinal' },
  { key: 'TERCEIRO_LUGAR', label: '3º Lugar' },
  { key: 'FINAL', label: 'Final' },
]

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function PartidaCard({ partida }) {
  const casa = partida.selecaoCasa
  const vis = partida.selecaoVisitante

  return (
    <div className={`bg-gray-900 rounded-xl border p-4 ${
      partida.encerrada ? 'border-gray-700 opacity-80' : 'border-gray-800'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
          <Bandeira codigo={casa.codigoFifa} size={32} />
          <p className="text-xs font-medium text-white leading-tight">{casa.nome}</p>
        </div>

        <div className="text-center min-w-[90px]">
          {partida.encerrada ? (
            <div className="text-2xl font-bold text-yellow-400">
              {partida.golsCasa} X {partida.golsVisitante}
            </div>
          ) : (
            <div className="text-gray-500 text-lg font-bold">VS</div>
          )}
          <div className="text-xs text-gray-500 mt-1">{formatDate(partida.dataHora)}</div>
          {partida.encerrada && (
            <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">Encerrada</span>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
          <Bandeira codigo={vis.codigoFifa} size={32} />
          <p className="text-xs font-medium text-white leading-tight">{vis.nome}</p>
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
  const fasesComPartidas = FASES.filter(f => partidas.some(p => p.fase === f.key))
  const fasesVisiveis = fasesComPartidas.length > 0 ? fasesComPartidas : [FASES[0]]

  // Agrupar por rodada (só na fase de grupos)
  const porRodada = faseAtiva === 'GRUPOS'
    ? filtradas.reduce((acc, p) => {
        const r = p.rodada ?? 0
        if (!acc[r]) acc[r] = []
        acc[r].push(p)
        return acc
      }, {})
    : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Partidas</h1>
        <p className="text-gray-400 mt-1">Acompanhe todos os jogos</p>
      </div>

      {/* Tabs de fase */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {fasesVisiveis.map(f => (
          <button key={f.key} onClick={() => setFaseAtiva(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              faseAtiva === f.key
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}>
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
      ) : porRodada ? (
        // Fase de grupos — agrupado por rodada
        <div className="space-y-8">
          {Object.entries(porRodada)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([rodada, jogos]) => (
              <div key={rodada}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-base font-bold text-white">
                    {rodada === '0' ? 'Sem rodada' : `${rodada}ª Rodada`}
                  </h2>
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-xs text-gray-500">{jogos.length} jogos</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jogos.map(p => <PartidaCard key={p.id} partida={p} />)}
                </div>
              </div>
            ))}
        </div>
      ) : (
        // Outras fases — grid normal
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map(p => <PartidaCard key={p.id} partida={p} />)}
        </div>
      )}
    </div>
  )
}