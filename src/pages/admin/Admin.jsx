import { useState, useEffect } from 'react'
import api from '../../services/api'

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

const FASES = ['GRUPOS', 'DEZASSEIS', 'OITAVAS', 'QUARTAS', 'SEMI', 'TERCEIRO_LUGAR', 'FINAL']

const TABS = ['Partidas', 'Placar', 'Bônus']

export default function Admin() {
  const [tab, setTab] = useState('Partidas')
  const [selecoes, setSelecoes] = useState([])
  const [partidas, setPartidas] = useState([])
  const [bonus, setBonus] = useState([])
  const [loading, setLoading] = useState(true)

  // Criar partida
  const [novaPartida, setNovaPartida] = useState({
    selecaoCasaId: '', selecaoVisitanteId: '',
    fase: 'GRUPOS', dataHora: '', rodada: ''
  })
  const [msgPartida, setMsgPartida] = useState('')

  // Placar
  const [placar, setPlacar] = useState({})
  const [msgPlacar, setMsgPlacar] = useState({})

  // Bônus
  const [msgBonus, setMsgBonus] = useState({})

  useEffect(() => {
    Promise.all([
      api.get('/selecoes'),
      api.get('/partidas'),
      api.get('/admin/bonus')
    ]).then(([s, p, b]) => {
      setSelecoes(s.data)
      setPartidas(p.data)
      setBonus(b.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const criarPartida = async () => {
    try {
      await api.post('/admin/partidas', {
        ...novaPartida,
        rodada: novaPartida.rodada ? Number(novaPartida.rodada) : null,
        dataHora: new Date(novaPartida.dataHora).toISOString()
      })
      setMsgPartida('✅ Partida criada!')
      const { data } = await api.get('/partidas')
      setPartidas(data)
      setNovaPartida({ selecaoCasaId: '', selecaoVisitanteId: '', fase: 'GRUPOS', dataHora: '', rodada: '' })
    } catch (err) {
      setMsgPartida('❌ ' + (err.response?.data?.message || 'Erro'))
    }
    setTimeout(() => setMsgPartida(''), 4000)
  }

  const atualizarPlacar = async (id) => {
    const p = placar[id] || {}
    try {
      await api.put(`/admin/partidas/${id}/placar`, {
        golsCasa: Number(p.golsCasa ?? 0),
        golsVisitante: Number(p.golsVisitante ?? 0),
        encerrada: p.encerrada ?? false
      })
      setMsgPlacar(prev => ({ ...prev, [id]: '✅ Atualizado!' }))
      const { data } = await api.get('/partidas')
      setPartidas(data)
    } catch (err) {
      setMsgPlacar(prev => ({ ...prev, [id]: '❌ Erro' }))
    }
    setTimeout(() => setMsgPlacar(prev => ({ ...prev, [id]: '' })), 3000)
  }

  const corrigirBonus = async (b, correcoesLocal) => {
    try {
      await api.put('/admin/bonus/corrigir', {
        usuarioId: b.usuario.id,
        ...correcoesLocal
      })
      setMsgBonus(prev => ({ ...prev, [b.id]: '✅ Salvo!' }))
      const { data } = await api.get('/admin/bonus')
      setBonus(data)
    } catch (err) {
      setMsgBonus(prev => ({ ...prev, [b.id]: '❌ Erro' }))
    }
    setTimeout(() => setMsgBonus(prev => ({ ...prev, [b.id]: '' })), 3000)
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">⚙️ Admin</h1>
        <p className="text-gray-400 mt-1">Gerenciamento do bolão</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── CRIAR PARTIDA ── */}
      {tab === 'Partidas' && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Nova Partida</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mandante</label>
                <select
                  value={novaPartida.selecaoCasaId}
                  onChange={e => setNovaPartida({ ...novaPartida, selecaoCasaId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  <option value="">Selecione...</option>
                  {selecoes.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                    <option key={s.id} value={s.id}>{BANDEIRAS[s.codigoFifa]} {s.nome} ({s.grupo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Visitante</label>
                <select
                  value={novaPartida.selecaoVisitanteId}
                  onChange={e => setNovaPartida({ ...novaPartida, selecaoVisitanteId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  <option value="">Selecione...</option>
                  {selecoes.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                    <option key={s.id} value={s.id}>{BANDEIRAS[s.codigoFifa]} {s.nome} ({s.grupo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fase</label>
                <select
                  value={novaPartida.fase}
                  onChange={e => setNovaPartida({ ...novaPartida, fase: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={novaPartida.dataHora}
                  onChange={e => setNovaPartida({ ...novaPartida, dataHora: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rodada (opcional)</label>
                <input
                  type="number"
                  value={novaPartida.rodada}
                  onChange={e => setNovaPartida({ ...novaPartida, rodada: e.target.value })}
                  placeholder="Ex: 1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {msgPartida && <span className="text-sm">{msgPartida}</span>}
              <button
                onClick={criarPartida}
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-6 py-2 rounded-lg text-sm transition-colors"
              >
                Criar Partida
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-sm text-gray-400">{partidas.length} partidas cadastradas no total.</p>
          </div>
        </div>
      )}

      {/* ── PLACAR ── */}
      {tab === 'Placar' && (
        <div className="space-y-3">
          {partidas.length === 0 && (
            <p className="text-gray-500 text-center py-10">Nenhuma partida cadastrada.</p>
          )}
          {partidas.map(p => {
            const ph = placar[p.id] || {}
            const casa = p.selecaoCasa
            const vis = p.selecaoVisitante
            return (
              <div key={p.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      {BANDEIRAS[casa.codigoFifa]} {casa.nome}
                      <span className="text-gray-500 mx-2">vs</span>
                      {BANDEIRAS[vis.codigoFifa]} {vis.nome}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.fase} · {new Date(p.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      {p.encerrada && <span className="ml-2 text-green-600">✓ Encerrada</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="20"
                      defaultValue={p.golsCasa}
                      onChange={e => setPlacar(prev => ({ ...prev, [p.id]: { ...prev[p.id], golsCasa: e.target.value } }))}
                      className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-yellow-500 text-sm"
                    />
                    <span className="text-gray-500">×</span>
                    <input
                      type="number" min="0" max="20"
                      defaultValue={p.golsVisitante}
                      onChange={e => setPlacar(prev => ({ ...prev, [p.id]: { ...prev[p.id], golsVisitante: e.target.value } }))}
                      className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-yellow-500 text-sm"
                    />
                    <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={p.encerrada}
                        onChange={e => setPlacar(prev => ({ ...prev, [p.id]: { ...prev[p.id], encerrada: e.target.checked } }))}
                        className="accent-yellow-500"
                      />
                      Encerrar
                    </label>
                    <button
                      onClick={() => atualizarPlacar(p.id)}
                      className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      Salvar
                    </button>
                    {msgPlacar[p.id] && <span className="text-xs">{msgPlacar[p.id]}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BÔNUS ── */}
      {tab === 'Bônus' && (
        <div className="space-y-3">
          {bonus.length === 0 && (
            <p className="text-gray-500 text-center py-10">Nenhum palpite bônus registrado.</p>
          )}
          {bonus.map(b => {
            const [corr, setCorr] = useState({
              campeaoAcertou: b.campeaoAcertou ?? false,
              neymarGolAcertou: b.neymarGolAcertou ?? false,
              artilheiroAcertou: b.artilheiroAcertou ?? false,
              brasilFaseAcertou: b.brasilFaseAcertou ?? false,
            })

            return (
              <div key={b.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">{b.usuario?.nome}</p>
                    <p className="text-xs text-gray-500">{b.usuario?.email}</p>
                  </div>
                  <span className="text-yellow-400 font-bold">{b.pontosBonus} pts bônus</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                  {[
                    { key: 'campeaoAcertou', label: '🏆 Campeão', val: b.campeao },
                    { key: 'neymarGolAcertou', label: '⚽ Neymar gol', val: b.neymarGol != null ? (b.neymarGol ? 'Sim' : 'Não') : '-' },
                    { key: 'artilheiroAcertou', label: '👟 Artilheiro', val: b.artilheiro },
                    { key: 'brasilFaseAcertou', label: '🇧🇷 Brasil fase', val: b.brasilFase },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={corr[item.key]}
                        onChange={e => setCorr(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="accent-yellow-500"
                      />
                      <div>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-white text-xs">{item.val || '-'}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {msgBonus[b.id] && <span className="text-xs">{msgBonus[b.id]}</span>}
                  <button
                    onClick={() => corrigirBonus(b, corr)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Salvar Correção
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
