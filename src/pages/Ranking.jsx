import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/ranking')
      .then(r => {
        // Filtrar admin do ranking
        const semAdmin = r.data.filter(u => u.role !== 'ADMIN' && u.nome !== 'Admin')
        // Renumerar posições
        const renum = semAdmin.map((u, i) => ({ ...u, posicao: i + 1 }))
        setRanking(renum)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Ranking</h1>
        <p className="text-gray-400 mt-1">Classificação geral do bolão</p>
      </div>

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
            return (
              <div
                key={r.usuarioId}
                className={`grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-gray-800/50 last:border-0 ${
                  isMe ? 'bg-yellow-500/5' : 'hover:bg-gray-800/30'
                } transition-colors`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  {i < 3
                    ? <span className="text-lg">{MEDALS[i]}</span>
                    : <span className="text-gray-500 font-bold text-sm">{r.posicao}</span>
                  }
                </div>
                <div className="col-span-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                    {r.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                      {r.nome} {isMe && <span className="text-xs">(você)</span>}
                    </p>
                    {r.acertosExatos > 0 && (
                      <p className="text-xs text-green-500">{r.acertosExatos} placar(es) exato(s)</p>
                    )}
                  </div>
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

      <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Tabela de Pontuação</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-400">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-green-400 font-bold text-lg">10</p>
            <p>Placar exato</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-yellow-400 font-bold text-lg">5</p>
            <p>Vencedor certo</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-yellow-400 font-bold text-lg">25</p>
            <p>Campeão / Artilheiro / Brasil</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-yellow-400 font-bold text-lg">10</p>
            <p>Neymar gol</p>
          </div>
        </div>
      </div>
    </div>
  )
}