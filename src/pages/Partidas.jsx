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

function isHoje(iso) {
  const jogo = new Date(iso)
  const agora = new Date()
  return jogo.getTime() - agora.getTime() < 24 * 60 * 60 * 1000 &&
         jogo.getTime() > agora.getTime() - 3 * 60 * 60 * 1000
}

function PartidaCard({ partida }) {
  const casa = partida.selecaoCasa
  const vis = partida.selecaoVisitante
  const hoje = isHoje(partida.dataHora)

  return (
    <div className={`bg-gray-900 rounded-xl border p-4 ${
      hoje ? 'border-yellow-500/40' :
      partida.encerrada ? 'border-gray-700 opacity-80' : 'border-gray-800'
    }`}>
      {hoje && !partida.encerrada && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
          <span className="text-xs text-yellow-400 font-medium">Em breve</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
          <Bandeira codigo={casa.codigoFifa} size={32} />
          <p className="text-xs font-medium text-white leading-tight">{casa.nome}</p>
        </div>
        <div className="text-center min-w-[90px]">
          {partida.encerrada ? (
            <div className="text-2xl font-bold text-yellow-400">
              {partida.golsCasa} — {partida.golsVisitante}
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

function ListaPartidas({ partidas }) {
  const temRodadas = partidas.some(p => p.fase === 'GRUPOS' && p.rodada)
  if (!temRodadas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {partidas.map(p => <PartidaCard key={p.id} partida={p} />)}
      </div>
    )
  }
  const porRodada = partidas.reduce((acc, p) => {
    const r = p.rodada ?? 0
    if (!acc[r]) acc[r] = []
    acc[r].push(p)
    return acc
  }, {})
  return (
    <div className="space-y-8">
      {Object.entries(porRodada).sort(([a], [b]) => Number(a) - Number(b)).map(([rodada, jogos]) => (
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
  )
}

export default function Partidas() {
  const [hoje, setHoje] = useState([])
  const [todas, setTodas] = useState([])
  const [faseAtiva, setFaseAtiva] = useState('GRUPOS')
  const [loadingHoje, setLoadingHoje] = useState(true)
  const [loadingTodas, setLoadingTodas] = useState(false)
  const [todasCarregadas, setTodasCarregadas] = useState(false)

  // 1. Carrega jogos de hoje primeiro (rápido)
  useEffect(() => {
    api.get('/partidas/abertas')
      .then(r => {
        const proximas24h = r.data.filter(p => isHoje(p.dataHora))
        setHoje(proximas24h)
      })
      .catch(console.error)
      .finally(() => {
        setLoadingHoje(false)
        // 2. Depois carrega todos os jogos em background
        setLoadingTodas(true)
        api.get('/partidas')
          .then(r => {
            setTodas(r.data)
            setTodasCarregadas(true)
          })
          .catch(console.error)
          .finally(() => setLoadingTodas(false))
      })
  }, [])

  const filtradas = todas.filter(p => p.fase === faseAtiva)
  const fasesComPartidas = FASES.filter(f => todas.some(p => p.fase === f.key))
  const fasesVisiveis = fasesComPartidas.length > 0 ? fasesComPartidas : [FASES[0]]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Partidas</h1>
        <p className="text-gray-400 mt-1">Acompanhe todos os jogos</p>
      </div>

      {/* JOGOS DE HOJE */}
      {loadingHoje ? (
        <div className="bg-gray-900 rounded-xl border border-yellow-500/20 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <h2 className="text-sm font-bold text-yellow-400">Jogos nas próximas 24h</h2>
          </div>
          <div className="flex gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex-1 h-24 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : hoje.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-yellow-500/20 p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <h2 className="text-sm font-bold text-yellow-400">Jogos nas próximas 24h</h2>
            <span className="text-xs text-gray-500">({hoje.length} {hoje.length === 1 ? 'jogo' : 'jogos'})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {hoje.map(p => <PartidaCard key={p.id} partida={p} />)}
          </div>
        </div>
      )}

      {/* TODAS AS PARTIDAS */}
      {!todasCarregadas ? (
        <div>
          {/* Tabs skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {[1,2].map(i => (
              <div key={i} className="h-9 w-24 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
            Carregando todas as partidas...
          </div>
        </div>
      ) : (
        <div>
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

          {filtradas.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📅</p>
              <p>Nenhuma partida cadastrada nessa fase ainda.</p>
            </div>
          ) : (
            <ListaPartidas partidas={filtradas} />
          )}
        </div>
      )}
    </div>
  )
}