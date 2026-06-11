import { useState, useEffect } from 'react'
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

function PalpiteCard({ partida, palpite, onSalvar }) {
  const [gols, setGols] = useState({
    casa: palpite?.golsCasa ?? '',
    vis: palpite?.golsVisitante ?? ''
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const aberta = isAberta(partida)
  const casa = partida.selecaoCasa
  const vis = partida.selecaoVisitante

  const handleSalvar = async () => {
    if (gols.casa === '' || gols.vis === '') return
    setSaving(true)
    setMsg('')
    try {
      await api.post('/palpites', {
        partidaId: partida.id,
        golsCasa: Number(gols.casa),
        golsVisitante: Number(gols.vis)
      })
      setMsg('✅ Salvo!')
      onSalvar?.()
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Erro ao salvar'))
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const ptClass = palpite?.pontosGanhos != null
    ? palpite.pontosGanhos === 10 ? 'text-green-400' :
      palpite.pontosGanhos === 5 ? 'text-yellow-400' : 'text-red-400'
    : ''

  return (
    <div className={`bg-gray-900 rounded-xl border p-4 ${aberta ? 'border-gray-700' : 'border-gray-800 opacity-70'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex-1 flex flex-col items-center gap-1 text-center">
          <Bandeira codigo={casa.codigoFifa} size={28} />
          <p className="text-xs text-gray-300 leading-tight">{casa.nome}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number" min="0" max="20"
            value={gols.casa}
            onChange={e => setGols({ ...gols, casa: e.target.value })}
            disabled={!aberta}
            className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-yellow-500 disabled:opacity-40"
          />
          <span className="text-gray-500 font-bold text-lg">×</span>
          <input
            type="number" min="0" max="20"
            value={gols.vis}
            onChange={e => setGols({ ...gols, vis: e.target.value })}
            disabled={!aberta}
            className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-yellow-500 disabled:opacity-40"
          />
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 text-center">
          <Bandeira codigo={vis.codigoFifa} size={28} />
          <p className="text-xs text-gray-300 leading-tight">{vis.nome}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{formatDate(partida.dataHora)}</p>
        {palpite?.pontosGanhos != null ? (
          <span className={`text-sm font-bold ${ptClass}`}>
            {palpite.pontosGanhos} pts
          </span>
        ) : aberta ? (
          <div className="flex items-center gap-2">
            {msg && <span className="text-xs">{msg}</span>}
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="text-xs bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-900 font-bold px-3 py-1 rounded-lg transition-colors"
            >
              {saving ? '...' : 'Salvar'}
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-600">Encerrada</span>
        )}
      </div>
    </div>
  )
}

export default function Bolao() {
  const [partidas, setPartidas] = useState([])
  const [palpites, setPalpites] = useState([])
  const [selecoes, setSelecoes] = useState([])
  const [bonusForm, setBonusForm] = useState({
    campeao: '', neymarGol: '', artilheiro: '', brasilFase: ''
  })
  const [loading, setLoading] = useState(true)
  const [savingBonus, setSavingBonus] = useState(false)
  const [bonusMsg, setBonusMsg] = useState('')
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
      setBonusMsg('✅ Palpites bônus salvos!')
      loadData()
    } catch {
      setBonusMsg('❌ Erro ao salvar')
    } finally {
      setSavingBonus(false)
      setTimeout(() => setBonusMsg(''), 4000)
    }
  }

  const abertas = partidas.filter(p => isAberta(p))
  const comPalpites = partidas.filter(p =>
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
        <p className="text-gray-400 mt-1">Palpites fecham 1h antes de cada jogo</p>
      </div>

      {/* BÔNUS */}
      <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">🌟 Palpites Bônus</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {bonusAberto
                ? 'Prazo: 14/06/2026 às 23:59'
                : '⛔ Prazo encerrado em 14/06/2026'}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-0.5 shrink-0">
            <div>🏆 Campeão = 25 pts</div>
            <div>⚽ Neymar gol = 10 pts</div>
            <div>👟 Artilheiro = 25 pts</div>
            <div>🇧🇷 Fase do Brasil = 25 pts</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">🏆 Campeão do Mundo</label>
            <select
              value={bonusForm.campeao}
              onChange={e => setBonusForm({ ...bonusForm, campeao: e.target.value })}
              disabled={!bonusAberto}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40"
            >
              <option value="">Selecione...</option>
              {selecoes.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                <option key={s.id} value={s.nome}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">⚽ Neymar marca gol na Copa?</label>
            <select
              value={bonusForm.neymarGol}
              onChange={e => setBonusForm({ ...bonusForm, neymarGol: e.target.value })}
              disabled={!bonusAberto}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40"
            >
              <option value="">Selecione...</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">👟 Artilheiro da Copa</label>
            <input
              type="text"
              value={bonusForm.artilheiro}
              onChange={e => setBonusForm({ ...bonusForm, artilheiro: e.target.value })}
              disabled={!bonusAberto}
              placeholder="Nome do jogador"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500 disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">🇧🇷 Até onde o Brasil vai?</label>
            <select
              value={bonusForm.brasilFase}
              onChange={e => setBonusForm({ ...bonusForm, brasilFase: e.target.value })}
              disabled={!bonusAberto}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40"
            >
              <option value="">Selecione...</option>
              {FASES_BRASIL.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {bonusAberto && (
          <div className="flex items-center gap-3 mt-4">
            {bonusMsg && <span className="text-sm">{bonusMsg}</span>}
            <button
              onClick={handleSalvarBonus}
              disabled={savingBonus}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-900 font-bold px-6 py-2 rounded-lg text-sm transition-colors"
            >
              {savingBonus ? 'Salvando...' : 'Salvar Bônus'}
            </button>
          </div>
        )}
      </div>

      {/* ABERTAS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">⚽ Partidas Abertas ({abertas.length})</h2>
        {abertas.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
            <p className="text-3xl mb-2">🔒</p>
            <p>Nenhuma partida disponível para palpite no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {abertas.map(p => (
              <PalpiteCard key={p.id} partida={p} palpite={palpites.find(x => x.partida?.id === p.id)} onSalvar={loadData} />
            ))}
          </div>
        )}
      </div>

      {comPalpites.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">📋 Meus Palpites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comPalpites.map(p => (
              <PalpiteCard key={p.id} partida={p} palpite={palpites.find(x => x.partida?.id === p.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}