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
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null)
  const [palpitesVendo, setPalpitesVendo] = useState([])
  const [loadingPalpites, setLoadingPalpites] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([api.get('/ranking'), api.get('/partidas')])
      .then(([rRes, pRes]) => {
        setRanking(rRes.data)
        setPartidas(pRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const verPalpites = async (r) => {
    if (usuarioSelecionado?.usuarioId === r.usuarioId) {
      setUsuarioSelecionado(null)
      setPalpitesVendo([])
      return
    }
    setUsuarioSelecionado(r)
    setLoadingPalpites(true)
    try {
      const { data } = await api.get(`/ranking/palpites/${r.usuarioId}`)
      setPalpitesVendo(data)
    } catch {
      setPalpitesVendo([])
    } finally {
      setLoadingPalpites(false)
    }
  }

  const partidasFechadas = partidas.filter(p => isEncerrada(p))

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  // Outros jogadores (não o próprio usuário)
  const outrosJogadores = ranking.filter(r => r.nome !== user?.nome)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Ranking</h1>
          <p className="text-gray-400 mt-1">Classificação geral do bolão</p>
        </div>
        <div className="hidden sm:flex gap-3 text-xs text-gray-500 mt-1 shrink-0">
          <span><span className="text-green-400 font-bold text-sm">10</span> exato</span>
          <span><span className="text-yellow-400 font-bold text-sm">5</span> vencedor</span>
          <span><span className="text-yellow-400 font-bold text-sm">25</span> campeão/artilheiro/🇧🇷</span>
          <span><span className="text-yellow-400 font-bold text-sm">10</span> Neymar</span>
        </div>
      </div>

      <div className={`flex gap-6 ${usuarioSelecionado ? 'flex-col lg:flex-row' : ''}`}>

        {/* Tabela de ranking */}
        <div className={usuarioSelecionado ? 'lg:w-1/2' : 'w-full'}>
          {ranking.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📊</p>
              <p>Nenhum palpite registrado ainda.</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Jogador</div>
                <div className="col-span-2 text-center">Partidas</div>
                <div className="col-span-2 text-center">Bônus</div>
                <div className="col-span-2 text-center">Total</div>
              </div>

              {ranking.map((r, i) => {
                const isMe = user?.nome === r.nome
                const isSelected = usuarioSelecionado?.usuarioId === r.usuarioId
                const podeVer = !isMe && outrosJogadores.some(o => o.usuarioId === r.usuarioId)

                return (
                  <div
                    key={r.usuarioId}
                    className={`grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-gray-800/50 last:border-0 transition-colors ${
                      isSelected ? 'bg-yellow-500/10 border-yellow-500/20' :
                      isMe ? 'bg-yellow-500/5' :
                      podeVer ? 'hover:bg-gray-800/40 cursor-pointer' : ''
                    }`}
                    onClick={() => podeVer && verPalpites(r)}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      {i < 3
                        ? <span className="text-lg">{MEDALS[i]}</span>
                        : <span className="text-gray-500 font-bold text-sm">{r.posicao}</span>
                      }
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected ? 'bg-yellow-500/30 text-yellow-300' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {r.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isMe ? 'text-yellow-400' : isSelected ? 'text-yellow-300' : 'text-white'}`}>
                          {r.nome}
                          {isMe && <span className="text-xs font-normal text-yellow-500/70 ml-1">(você)</span>}
                        </p>
                        {r.acertosExatos > 0 && (
                          <p className="text-xs text-green-500">{r.acertosExatos} exatos</p>
                        )}
                      </div>
                      {podeVer && !isMe && (
                        <span className="ml-auto text-xs text-gray-600 hover:text-gray-400">
                          {isSelected ? '✕' : '👁'}
                        </span>
                      )}
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
                )
              })}
            </div>
          )}
        </div>

        {/* Painel lateral de palpites */}
        {usuarioSelecionado && (
          <div className="lg:w-1/2">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden sticky top-20">
              {/* Header do painel */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center justify-center font-bold text-sm">
                    {usuarioSelecionado.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{usuarioSelecionado.nome}</p>
                    <p className="text-xs text-gray-500">{usuarioSelecionado.totalPontos} pts totais</p>
                  </div>
                </div>
                <button
                  onClick={() => { setUsuarioSelecionado(null); setPalpitesVendo([]) }}
                  className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Lista de palpites */}
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {loadingPalpites ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500" />
                  </div>
                ) : partidasFechadas.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">Nenhuma partida encerrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {partidasFechadas.map(p => {
                      const palpite = palpitesVendo.find(x => x.partida?.id === p.id)
                      const ptClass = palpite?.pontosGanhos != null
                        ? palpite.pontosGanhos === 10 ? 'border-green-700/40 bg-green-900/10'
                        : palpite.pontosGanhos === 5  ? 'border-yellow-700/40 bg-yellow-900/10'
                        : 'border-red-700/30 bg-red-900/10'
                        : 'border-gray-700/30'

                      const ptText = palpite?.pontosGanhos != null
                        ? palpite.pontosGanhos === 10 ? 'text-green-400'
                        : palpite.pontosGanhos === 5  ? 'text-yellow-400'
                        : 'text-red-400'
                        : 'text-gray-600'

                      return (
                        <div key={p.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${ptClass}`}>
                          {/* Casa */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Bandeira codigo={p.selecaoCasa?.codigoFifa} size={16} />
                            <span className="text-xs text-gray-300 truncate">{p.selecaoCasa?.nome}</span>
                          </div>

                          {/* Placar palpite */}
                          <div className="text-center shrink-0">
                            {palpite ? (
                              <span className={`text-sm font-bold ${ptText}`}>
                                {palpite.golsCasa} × {palpite.golsVisitante}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-700">sem palpite</span>
                            )}
                          </div>

                          {/* Visitante */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                            <span className="text-xs text-gray-300 truncate">{p.selecaoVisitante?.nome}</span>
                            <Bandeira codigo={p.selecaoVisitante?.codigoFifa} size={16} />
                          </div>

                          {/* Pts */}
                          {palpite?.pontosGanhos != null && (
                            <span className={`text-xs font-bold shrink-0 w-10 text-right ${ptText}`}>
                              {palpite.pontosGanhos}pts
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}