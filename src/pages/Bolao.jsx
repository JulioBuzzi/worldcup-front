import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import Bandeira from '../components/Bandeira'

const DEADLINE_BONUS = new Date('2026-06-17T23:59:00-03:00')
const FASES_BRASIL = ['GRUPOS', 'DEZASSEIS', 'OITAVAS', 'QUARTAS', 'SEMI', 'FINAL', 'CAMPEAO']

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function getCountdown(dataHora) {
  const deadline = new Date(dataHora).getTime() - 60 * 60 * 1000
  const diff = deadline - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}min`
  return `${mins}min`
}

function isAberta(partida) {
  const deadline = new Date(partida.dataHora).getTime() - 60 * 60 * 1000
  return !partida.encerrada && Date.now() < deadline
}

function PalpiteCard({ partida, palpite, onSalvar, onDeletar }) {
  const [gols, setGols] = useState({
    casa: palpite?.golsCasa ?? '',
    vis: palpite?.golsVisitante ?? ''
  })
  const [status, setStatus] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [countdown, setCountdown] = useState(() => getCountdown(partida.dataHora))
  const debounceRef = useRef(null)
  const aberta = isAberta(partida)
  const casa = partida.selecaoCasa
  const vis = partida.selecaoVisitante
  const temPalpite = palpite?.id != null

  useEffect(() => {
    setGols({
      casa: palpite?.golsCasa ?? '',
      vis: palpite?.golsVisitante ?? ''
    })
  }, [palpite?.golsCasa, palpite?.golsVisitante])

  useEffect(() => {
    if (!aberta) return
    const timer = setInterval(() => {
      setCountdown(getCountdown(partida.dataHora))
    }, 30000)
    return () => clearInterval(timer)
  }, [aberta, partida.dataHora])

  const autoSave = useCallback(async (casaVal, visVal) => {
    if (casaVal === '' || visVal === '') return
    setStatus('saving')
    try {
      await api.post('/palpites', {
        partidaId: partida.id,
        golsCasa: Number(casaVal),
        golsVisitante: Number(visVal)
      })
      setStatus('saved')
      onSalvar?.()
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus(''), 3000)
    }
  }, [partida.id, onSalvar])

  const handleChange = (field, value) => {
    const next = { ...gols, [field]: value }
    setGols(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => autoSave(next.casa, next.vis), 800)
  }

  const handleDeletar = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await api.delete(`/palpites/${palpite.id}`)
      setGols({ casa: '', vis: '' })
      setConfirmDelete(false)
      onDeletar?.()
    } catch {
      setStatus('error')
      setConfirmDelete(false)
    }
  }

  const ptClass = palpite?.pontosGanhos != null
    ? palpite.pontosGanhos === 10 ? 'text-green-400'
    : palpite.pontosGanhos === 5  ? 'text-yellow-400'
    : 'text-red-400'
    : ''

  return (
    <div className={`bg-gray-900 rounded-xl border p-4 transition-all ${
      aberta ? 'border-gray-700' : 'border-gray-800 opacity-75'
    }`}>
      {/* Times + inputs */}
      <div className="flex items-center gap-3 mb-3">

        {/* Mandante */}
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
          <Bandeira codigo={casa.codigoFifa} size={30} />
          <p className="text-xs text-gray-300 leading-tight font-medium">{casa.nome}</p>
        </div>

        {/* Placar central */}
        <div className="flex items-center gap-2">
          {semPalpite ? (
            // Sem palpite e encerrado — mostra traço
            <>
              <div className="w-14 h-14 bg-gray-800/50 border border-gray-800 rounded-xl flex items-center justify-center text-gray-700 font-bold text-2xl">—</div>
              <span className="text-gray-700 font-bold text-xl select-none">×</span>
              <div className="w-14 h-14 bg-gray-800/50 border border-gray-800 rounded-xl flex items-center justify-center text-gray-700 font-bold text-2xl">—</div>
            </>
          ) : (
            <>
              <input
                type="number" min="0" max="20"
                value={gols.casa}
                onChange={e => handleChange('casa', e.target.value)}
                disabled={!aberta}
                style={{ textAlign: 'center', MozAppearance: 'textfield' }}
                className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-xl text-white font-bold text-2xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 disabled:opacity-40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-gray-600 font-bold text-xl select-none">×</span>
              <input
                type="number" min="0" max="20"
                value={gols.vis}
                onChange={e => handleChange('vis', e.target.value)}
                disabled={!aberta}
                style={{ textAlign: 'center', MozAppearance: 'textfield' }}
                className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-xl text-white font-bold text-2xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 disabled:opacity-40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </>
          )}
        </div>

        {/* Visitante */}
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
          <Bandeira codigo={vis.codigoFifa} size={30} />
          <p className="text-xs text-gray-300 leading-tight font-medium">{vis.nome}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800">
        <div>
          <p className="text-xs text-gray-500">{formatDate(partida.dataHora)}</p>
          {aberta && countdown && (
            <p className="text-xs text-yellow-500/80 font-medium mt-0.5">⏱ Fecha em {countdown}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Pontos (jogo encerrado) */}
          {palpite?.pontosGanhos != null && (
            <span className={`text-sm font-bold ${ptClass}`}>{palpite.pontosGanhos} pts</span>
          )}

          {/* Status do auto-save */}
          {aberta && status === 'saving' && (
            <span className="text-xs text-gray-400 animate-pulse">Salvando...</span>
          )}
          {aberta && status === 'saved' && (
            <span className="text-xs text-green-400">✓ Salvo</span>
          )}
          {aberta && status === 'error' && (
            <span className="text-xs text-red-400">✗ Erro</span>
          )}

          {/* Botão excluir — só se tem palpite e está aberta e não está mostrando status */}
          {aberta && temPalpite && !status && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDeletar}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-500 hover:text-gray-300 px-1.5 py-1 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeletar}
                title="Excluir palpite"
                className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            )
          )}

          {/* Hint quando aberta mas sem palpite */}
          {aberta && !temPalpite && !status && (
            <span className="text-xs text-gray-600 italic">Digite o placar</span>
          )}

          {/* Encerrada sem palpite */}
          {!aberta && !temPalpite && palpite?.pontosGanhos == null && (
            <span className="text-xs text-gray-700">—</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Bolao() {
  const [partidas, setPartidas] = useState([])
  const [palpites, setPalpites] = useState([])
  const [selecoes, setSelecoes] = useState([])
  const [bonusForm, setBonusForm] = useState({ campeao: '', neymarGol: '', artilheiro: '', brasilFase: '' })
  const [temBonus, setTemBonus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingBonus, setSavingBonus] = useState(false)
  const [bonusMsg, setBonusMsg] = useState('')
  const [bonusOpen, setBonusOpen] = useState(false)
  const bonusAberto = Date.now() < DEADLINE_BONUS

  const loadData = async () => {
    try {
      const [pRes, bRes, partRes, selRes] = await Promise.all([
        api.get('/palpites/meus'),
        api.get('/bonus/meu').catch(() => ({ data: null })),
        api.get('/partidas'),
        api.get('/selecoes')
      ])
      setPalpites(pRes.data)
      setPartidas(partRes.data)
      setSelecoes(selRes.data)
      if (bRes.data && bRes.status !== 204) {
        setTemBonus(true)
        setBonusForm({
          campeao: bRes.data.campeao || '',
          neymarGol: bRes.data.neymarGol != null ? String(bRes.data.neymarGol) : '',
          artilheiro: bRes.data.artilheiro || '',
          brasilFase: bRes.data.brasilFase || ''
        })
      } else {
        setTemBonus(false)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleSalvarBonus = async () => {
    setSavingBonus(true)
    setBonusMsg('')
    try {
      await api.post('/bonus', {
        campeao: bonusForm.campeao || null,
        neymarGol: bonusForm.neymarGol !== '' ? bonusForm.neymarGol === 'true' : null,
        artilheiro: bonusForm.artilheiro || null,
        brasilFase: bonusForm.brasilFase || null
      })
      setTemBonus(true)
      setBonusMsg('✅ Bônus salvo!')
      loadData()
    } catch {
      setBonusMsg('❌ Erro ao salvar')
    } finally {
      setSavingBonus(false)
      setTimeout(() => setBonusMsg(''), 4000)
    }
  }

  const abertas = partidas.filter(p => isAberta(p))
  // Partidas que fecharam para palpite (1h antes ou encerradas)
  const encerradas = partidas.filter(p => !isAberta(p))

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Meu Bolão</h1>
        <p className="text-gray-400 mt-1">Palpites fecham 1h antes · salva automaticamente</p>
      </div>

      {/* BÔNUS — accordion */}
      <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 overflow-hidden">
        <button
          onClick={() => setBonusOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌟</span>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Palpites Bônus</h2>
                {temBonus && (
                  <span className="text-xs bg-green-700/40 text-green-400 border border-green-700/50 px-2 py-0.5 rounded-full font-medium">
                    ✓ Preenchido
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {bonusAberto ? 'Prazo: 17/06/2026 às 23:59' : '⛔ Prazo encerrado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex text-xs text-gray-500 gap-3">
              <span>🏆 25pts</span>
              <span>⚽ 10pts</span>
              <span>👟 25pts</span>
              <span>🇧🇷 25pts</span>
            </div>
            <span className={`text-gray-400 text-xs inline-block transition-transform duration-200 ${bonusOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>

        {bonusOpen && (
          <div className="px-6 pb-6 pt-4 border-t border-yellow-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">🏆 Campeão do Mundo</label>
                <select value={bonusForm.campeao}
                  onChange={e => setBonusForm({ ...bonusForm, campeao: e.target.value })}
                  disabled={!bonusAberto}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40">
                  <option value="">Selecione...</option>
                  {selecoes.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">⚽ Neymar marca gol na Copa?</label>
                <select value={bonusForm.neymarGol}
                  onChange={e => setBonusForm({ ...bonusForm, neymarGol: e.target.value })}
                  disabled={!bonusAberto}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40">
                  <option value="">Selecione...</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">👟 Artilheiro da Copa</label>
                <input type="text" value={bonusForm.artilheiro}
                  onChange={e => setBonusForm({ ...bonusForm, artilheiro: e.target.value })}
                  disabled={!bonusAberto} placeholder="Nome do jogador"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500 disabled:opacity-40" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">🇧🇷 Até onde o Brasil vai?</label>
                <select value={bonusForm.brasilFase}
                  onChange={e => setBonusForm({ ...bonusForm, brasilFase: e.target.value })}
                  disabled={!bonusAberto}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40">
                  <option value="">Selecione...</option>
                  {FASES_BRASIL.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            {bonusAberto && (
              <div className="flex items-center gap-3 mt-4">
                {bonusMsg && <span className="text-sm">{bonusMsg}</span>}
                <button onClick={handleSalvarBonus} disabled={savingBonus}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-900 font-bold px-6 py-2 rounded-lg text-sm transition-colors">
                  {savingBonus ? 'Salvando...' : temBonus ? 'Atualizar Bônus' : 'Salvar Bônus'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ABERTAS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">⚽ Partidas Abertas ({abertas.length})</h2>
        <p className="text-xs text-gray-500 mb-4">Salva automaticamente ao digitar</p>
        {abertas.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
            <p className="text-3xl mb-2">🔒</p>
            <p>Nenhuma partida disponível para palpite no momento.</p>
          </div>
        ) : (() => {
          // Agrupar por rodada quando fase de grupos
          const temRodadas = abertas.some(p => p.fase === 'GRUPOS' && p.rodada)
          if (!temRodadas) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {abertas.map(p => (
                  <PalpiteCard key={p.id} partida={p}
                    palpite={palpites.find(x => x.partida?.id === p.id)}
                    onSalvar={loadData} onDeletar={loadData} />
                ))}
              </div>
            )
          }
          const porRodada = abertas.reduce((acc, p) => {
            const r = p.rodada ?? 0
            if (!acc[r]) acc[r] = []
            acc[r].push(p)
            return acc
          }, {})
          return (
            <div className="space-y-6">
              {Object.entries(porRodada)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([rodada, jogos]) => (
                  <div key={rodada}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-gray-300">
                        {rodada === '0' ? 'Sem rodada' : `${rodada}ª Rodada`}
                      </h3>
                      <div className="flex-1 h-px bg-gray-800" />
                      <span className="text-xs text-gray-600">{jogos.length} jogos</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jogos.map(p => (
                        <PalpiteCard key={p.id} partida={p}
                          palpite={palpites.find(x => x.partida?.id === p.id)}
                          onSalvar={loadData} onDeletar={loadData} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )
        })()}
      </div>

      {/* ENCERRADOS */}
      {encerradas.length > 0 && (() => {
        const temRodadas = encerradas.some(p => p.fase === 'GRUPOS' && p.rodada)
        const porRodada = temRodadas
          ? encerradas.reduce((acc, p) => {
              const r = p.rodada ?? 0
              if (!acc[r]) acc[r] = []
              acc[r].push(p)
              return acc
            }, {})
          : null

        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">🔒 Palpites Encerrados</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                {encerradas.length} partidas
              </span>
            </div>

            {porRodada ? (
              <div className="space-y-6">
                {Object.entries(porRodada)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([rodada, jogos]) => (
                    <div key={rodada}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-bold text-gray-400">
                          {rodada === '0' ? 'Sem rodada' : `${rodada}ª Rodada`}
                        </h3>
                        <div className="flex-1 h-px bg-gray-800" />
                        <span className="text-xs text-gray-600">{jogos.length} jogos</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jogos.map(p => (
                          <PalpiteCard key={p.id} partida={p}
                            palpite={palpites.find(x => x.partida?.id === p.id)} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {encerradas.map(p => (
                  <PalpiteCard key={p.id} partida={p}
                    palpite={palpites.find(x => x.partida?.id === p.id)} />
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}