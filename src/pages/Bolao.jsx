import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import Bandeira from '../components/Bandeira'

const DEADLINE_BONUS = new Date('2026-06-14T23:59:00-03:00')
const FASES_BRASIL = ['GRUPOS', 'DEZASSEIS', 'OITAVAS', 'QUARTAS', 'SEMI', 'FINAL', 'CAMPEAO']

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
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

  const statusEl = {
    saving: <span className="text-xs text-gray-400 animate-pulse">Salvando...</span>,
    saved:  <span className="text-xs text-green-400">✅ Salvo</span>,
    error:  <span className="text-xs text-red-400">❌ Erro</span>,
  }

  return (
    <div className={`bg-gray-900 rounded-xl border p-4 transition-all ${
      aberta ? 'border-gray-700' : 'border-gray-800 opacity-75'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex-1 flex flex-col items-center gap-1 text-center">
          <Bandeira codigo={casa.codigoFifa} size={28} />
          <p className="text-xs text-gray-300 leading-tight">{casa.nome}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min="0" max="20"
            value={gols.casa}
            onChange={e => handleChange('casa', e.target.value)}
            disabled={!aberta}
            className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold text-lg focus:outline-none focus:border-yellow-500 disabled:opacity-40"
          />
          <span className="text-gray-500 font-bold text-xl">×</span>
          <input type="number" min="0" max="20"
            value={gols.vis}
            onChange={e => handleChange('vis', e.target.value)}
            disabled={!aberta}
            className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold text-lg focus:outline-none focus:border-yellow-500 disabled:opacity-40"
          />
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 text-center">
          <Bandeira codigo={vis.codigoFifa} size={28} />
          <p className="text-xs text-gray-300 leading-tight">{vis.nome}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">{formatDate(partida.dataHora)}</p>
        <div className="flex items-center gap-2">
          {palpite?.pontosGanhos != null ? (
            <span className={`text-sm font-bold ${ptClass}`}>{palpite.pontosGanhos} pts</span>
          ) : aberta ? (
            <>
              {statusEl[status] || (
                <span className="text-xs text-gray-600">{temPalpite ? '' : 'Digite o placar'}</span>
              )}
              {temPalpite && !status && (
                <button
                  onClick={handleDeletar}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    confirmDelete ? 'bg-red-600 text-white hover:bg-red-500' : 'text-gray-500 hover:text-red-400'
                  }`}
                >
                  {confirmDelete ? 'Confirmar?' : '🗑'}
                </button>
              )}
              {confirmDelete && (
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-white px-1">
                  ✕
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-600">Encerrada</span>
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
      if (bRes.data) {
        setBonusForm({
          campeao: bRes.data.campeao || '',
          neymarGol: bRes.data.neymarGol != null ? String(bRes.data.neymarGol) : '',
          artilheiro: bRes.data.artilheiro || '',
          brasilFase: bRes.data.brasilFase || ''
        })
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
  const historico = partidas.filter(p =>
    !isAberta(p) && palpites.find(x => x.partida?.id === p.id)
  )

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Meu Bolão</h1>
        <p className="text-gray-400 mt-1">Palpites fecham 1h antes · salva automaticamente · 🗑 para excluir</p>
      </div>

      {/* BÔNUS — accordion */}
      <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 overflow-hidden">

        {/* Header clicável */}
        <button
          onClick={() => setBonusOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌟</span>
            <div className="text-left">
              <h2 className="text-lg font-bold text-white">Palpites Bônus</h2>
              <p className="text-xs text-gray-400">
                {bonusAberto ? 'Prazo: 14/06/2026 às 23:59' : '⛔ Prazo encerrado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex text-xs text-gray-500 gap-3">
              <span>🏆 25pts</span>
              <span>⚽ 10pts</span>
              <span>👟 25pts</span>
              <span>🇧🇷 25pts</span>
            </div>
            <span className={`text-gray-400 text-xs transition-transform duration-200 inline-block ${bonusOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>

        {/* Conteúdo expansível */}
        {bonusOpen && (
          <div className="px-6 pb-6 border-t border-yellow-500/20 pt-4">
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
                  {savingBonus ? 'Salvando...' : 'Salvar Bônus'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ABERTAS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">⚽ Partidas Abertas ({abertas.length})</h2>
        <p className="text-xs text-gray-500 mb-4">Salva ao digitar · clique 🗑 para excluir um palpite</p>
        {abertas.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
            <p className="text-3xl mb-2">🔒</p>
            <p>Nenhuma partida disponível para palpite no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {abertas.map(p => (
              <PalpiteCard key={p.id} partida={p}
                palpite={palpites.find(x => x.partida?.id === p.id)}
                onSalvar={loadData} onDeletar={loadData} />
            ))}
          </div>
        )}
      </div>

      {/* HISTÓRICO */}
      {historico.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">📋 Meus Palpites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historico.map(p => (
              <PalpiteCard key={p.id} partida={p}
                palpite={palpites.find(x => x.partida?.id === p.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}