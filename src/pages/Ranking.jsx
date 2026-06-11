import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Bandeira from '../components/Bandeira'

const MEDALS = ['🥇', '🥈', '🥉']

function isEncerrada(partida) {
  const deadline = new Date(partida.dataHora).getTime() - 60 * 60 * 1000
  return partida.encerrada || Date.now() >= deadline
}

export default function Ranking() {
  const [ranking, setRanking] = useState([])
  const [partidas, setPartidas] = useState([])
  const [todosPalpites, setTodosPalpites] = useState({}) // { usuarioId: [palpites] }
  const [expanded, setExpanded] = useState(null)
  const [loadingPalpites, setLoadingPalpites] = useState({})
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([
      api.get('/ranking'),
      api.get('/partidas')
    ])
      .then(([rRes, pRes]) => {
        setRanking(rRes.data)
        setPartidas(pRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggleExpanded = async (usuarioId) => {
    if (expanded === usuarioId) {
      setExpanded(null)
      return
    }
    setExpanded(usuarioId)
    if (todosPalpites[usuarioId]) return

    setLoadingPalpites(prev => ({ ...prev, [usuarioId]: true }))
    try {
      const { data } = await api.get(`/ranking/palpites/${usuarioId}`)
      setTodosPalpites(prev => ({ ...prev, [usuarioId]: data }))
    } catch {
      setTodosPalpites(prev => ({ ...prev, [usuarioId]: [] }))
    } finally {
      setLoadingPalpites(prev => ({ ...prev, [usuarioId]: false }))
    }
  }

  // Só partidas que já fecharam para palpite
  const partidasFechadas = partidas.filter(p => isEncerrada(p))

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  return (
    <div>
      {/* Header com pontuação minimalista */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Ranking</h1>
          <p className="text-gray-400 mt-1">Classificação geral do bolão</p>
        </div>
        <div className="flex gap-3 text-xs text-gray-500 mt-1 shrink-0">
          <span><span className="text-green-400 font-bold text-sm">10</span> exato</span>
          <span><span className="text-yellow-400 font-bold text-sm">5</span> vencedor</span>
          <span><span className="text-yellow-400 font-bold text-sm">25</span> campeão/artilheiro/🇧🇷</span>
          <span><span className="text-yellow-400 font-bold text-sm">10</span> Neymar</span>
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📊</p>
          <p>Nenhum palpite registrado ainda.</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Jogador</div>
            <div className="col-span-2 text-center">Partidas</div>
            <div className="col-span-2 text-center">Bônus</div>
            <div className="col-span-2 text-center">Total</div>
          </div>

          {ranking.map((r, i) => {
            const isMe = user?.nome === r.nome
            const isOpen = expanded === r.usuarioId
            const palpitesUsuario = todosPalpites[r.usuarioId] || []
            const loadingThis = loadingPalpites[r.usuarioId]

            return (
              <div key={r.usuarioId} className="border-b border-gray-800/50 last:border-0">
                {/* Linha principal */}
                <div
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 cursor-pointer transition-colors ${
                    isMe ? 'bg-yellow-500/5' : 'hover:bg-gray-800/30'
                  }`}
                  onClick={() => toggleExpanded(r.usuarioId)}
                >
                  <div className="col-span-1 flex items-center justify-center">
                    {i < 3
                      ? <span className="text-lg">{MEDALS[i]}</span>
                      : <span className="text-gray-500 font-bold text-sm">{r.posicao}</span>
                    }
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                      {r.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                        {r.nome} {isMe && <span className="text-xs font-normal">(você)</span>}
                      </p>
                      {r.acertosExatos > 0 && (
                        <p className="text-xs text-green-500">{r.acertosExatos} placar(es) exato(s)</p>
                      )}
                    </div>
                    <span className="text-gray-600 text-xs ml-auto mr-2">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-white font-semibold">{r.pontosPartidas}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-yellow-400 font-semibold">{r.pontosBonus}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-white font-bold text-base">{r.totalPontos}</span>
                  </div>
                </div>

                {/* Palpites expandidos */}
                {isOpen && (
                  <div className="bg-gray-950/50 px-6 pb-4 pt-3 border-t border-gray-800/50">
                    {loadingThis ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
                      </div>
                    ) : partidasFechadas.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">Nenhuma partida encerrada ainda.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {partidasFechadas.map(p => {
                          const palpite = palpitesUsuario.find(x => x.partida?.id === p.id)
                          const ptClass = palpite?.pontosGanhos != null
                            ? palpite.pontosGanhos === 10 ? 'text-green-400 bg-green-400/10 border-green-700/30'
                            : palpite.pontosGanhos === 5  ? 'text-yellow-400 bg-yellow-400/10 border-yellow-700/30'
                            : 'text-red-400 bg-red-400/10 border-red-700/30'
                            : 'text-gray-600 bg-gray-800/50 border-gray-700/30'

                          return (
                            <div key={p.id} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border text-xs ${ptClass}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Bandeira codigo={p.selecaoCasa?.codigoFifa} size={14} />
                                <span className="text-gray-300 truncate">{p.selecaoCasa?.nome}</span>
                              </div>
                              <div className="text-center shrink-0 font-bold">
                                {palpite
                                  ? <span>{palpite.golsCasa} × {palpite.golsVisitante}</span>
                                  : <span className="text-gray-600">—</span>
                                }
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                                <span className="text-gray-300 truncate">{p.selecaoVisitante?.nome}</span>
                                <Bandeira codigo={p.selecaoVisitante?.codigoFifa} size={14} />
                              </div>
                              {palpite?.pontosGanhos != null && (
                                <span className="font-bold shrink-0 ml-1">{palpite.pontosGanhos}pts</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}