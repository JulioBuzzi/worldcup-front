import { useState, useEffect } from 'react'
import api from '../../services/api'
import Bandeira from '../../components/Bandeira'

const FASES = ['GRUPOS', 'DEZASSEIS', 'OITAVAS', 'QUARTAS', 'SEMI', 'TERCEIRO_LUGAR', 'FINAL']
const TABS = ['Partidas', 'Placar', 'Bônus']

export default function Admin() {
  const [tab, setTab] = useState('Partidas')
  const [selecoes, setSelecoes] = useState([])
  const [partidas, setPartidas] = useState([])
  const [bonus, setBonus] = useState([])
  const [loading, setLoading] = useState(true)

  const [novaPartida, setNovaPartida] = useState({
    selecaoCasaId: '', selecaoVisitanteId: '', fase: 'GRUPOS', dataHora: '', rodada: ''
  })
  const [msgPartida, setMsgPartida] = useState('')

  // placar[id] = { golsCasa, golsVisitante, encerrada }
  const [placar, setPlacar] = useState({})
  const [msgPlacar, setMsgPlacar] = useState({})

  // gabarito final do bônus (único para todos)
  const [gabarito, setGabarito] = useState({ campeao: '', neymarGol: '', artilheiro: '', brasilFase: '' })
  const [aplicandoGabarito, setAplicandoGabarito] = useState(false)
  const [msgGabarito, setMsgGabarito] = useState('')

  // correções individuais
  const [correcoes, setCorrecoes] = useState({})
  const [msgBonus, setMsgBonus] = useState({})

  const FASES_BRASIL = ['GRUPOS', 'DEZASSEIS', 'OITAVAS', 'QUARTAS', 'SEMI', 'FINAL', 'CAMPEAO']

  const loadAll = async () => {
    try {
      const [s, p, b] = await Promise.all([
        api.get('/selecoes'),
        api.get('/partidas'),
        api.get('/admin/bonus')
      ])
      setSelecoes(s.data)
      setPartidas(p.data)
      setBonus(b.data)

      // Inicializar placar com valores atuais
      const initPlacar = {}
      p.data.forEach(pt => {
        initPlacar[pt.id] = {
          golsCasa: pt.golsCasa,
          golsVisitante: pt.golsVisitante,
          encerrada: pt.encerrada
        }
      })
      setPlacar(initPlacar)

      // Inicializar correções individuais
      const initCorr = {}
      b.data.forEach(bx => {
        initCorr[bx.id] = {
          campeaoAcertou: bx.campeaoAcertou ?? false,
          neymarGolAcertou: bx.neymarGolAcertou ?? false,
          artilheiroAcertou: bx.artilheiroAcertou ?? false,
          brasilFaseAcertou: bx.brasilFaseAcertou ?? false,
        }
      })
      setCorrecoes(initCorr)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  // ── CRIAR PARTIDA ──
  const criarPartida = async () => {
    if (!novaPartida.selecaoCasaId || !novaPartida.selecaoVisitanteId || !novaPartida.dataHora) {
      setMsgPartida('❌ Preencha todos os campos obrigatórios')
      setTimeout(() => setMsgPartida(''), 3000)
      return
    }
    try {
      await api.post('/admin/partidas', {
        ...novaPartida,
        rodada: novaPartida.rodada ? Number(novaPartida.rodada) : null,
        dataHora: new Date(novaPartida.dataHora).toISOString()
      })
      setMsgPartida('✅ Partida criada!')
      await loadAll()
      setNovaPartida({ selecaoCasaId: '', selecaoVisitanteId: '', fase: 'GRUPOS', dataHora: '', rodada: '' })
    } catch (err) {
      setMsgPartida('❌ ' + (err.response?.data?.message || 'Erro ao criar'))
    }
    setTimeout(() => setMsgPartida(''), 4000)
  }

  // ── ATUALIZAR PLACAR ──
  const atualizarPlacar = async (id) => {
    const p = placar[id] || {}
    try {
      await api.put(`/admin/partidas/${id}/placar`, {
        golsCasa: Number(p.golsCasa ?? 0),
        golsVisitante: Number(p.golsVisitante ?? 0),
        encerrada: p.encerrada ?? false
      })
      setMsgPlacar(prev => ({ ...prev, [id]: '✅ Salvo!' }))
      await loadAll()
    } catch {
      setMsgPlacar(prev => ({ ...prev, [id]: '❌ Erro' }))
    }
    setTimeout(() => setMsgPlacar(prev => ({ ...prev, [id]: '' })), 3000)
  }

  // ── APLICAR GABARITO AUTOMÁTICO ──
  const aplicarGabarito = async () => {
    if (!gabarito.campeao && gabarito.neymarGol === '' && !gabarito.artilheiro && !gabarito.brasilFase) {
      setMsgGabarito('❌ Preencha pelo menos um campo do gabarito')
      setTimeout(() => setMsgGabarito(''), 3000)
      return
    }
    setAplicandoGabarito(true)
    setMsgGabarito('')
    let acertos = 0
    try {
      for (const b of bonus) {
        const corr = {
          campeaoAcertou: gabarito.campeao
            ? b.campeao?.toLowerCase().trim() === gabarito.campeao.toLowerCase().trim()
            : correcoes[b.id]?.campeaoAcertou ?? false,
          neymarGolAcertou: gabarito.neymarGol !== ''
            ? String(b.neymarGol) === gabarito.neymarGol
            : correcoes[b.id]?.neymarGolAcertou ?? false,
          artilheiroAcertou: gabarito.artilheiro
            ? b.artilheiro?.toLowerCase().trim() === gabarito.artilheiro.toLowerCase().trim()
            : correcoes[b.id]?.artilheiroAcertou ?? false,
          brasilFaseAcertou: gabarito.brasilFase
            ? b.brasilFase === gabarito.brasilFase
            : correcoes[b.id]?.brasilFaseAcertou ?? false,
        }
        await api.put('/admin/bonus/corrigir', { usuarioId: b.usuario.id, ...corr })
        acertos++
      }
      setMsgGabarito(`✅ Gabarito aplicado para ${acertos} participantes!`)
      await loadAll()
    } catch {
      setMsgGabarito('❌ Erro ao aplicar gabarito')
    } finally {
      setAplicandoGabarito(false)
      setTimeout(() => setMsgGabarito(''), 5000)
    }
  }

  // ── SALVAR CORREÇÃO INDIVIDUAL ──
  const corrigirBonus = async (b) => {
    const corr = correcoes[b.id] || {}
    try {
      await api.put('/admin/bonus/corrigir', { usuarioId: b.usuario.id, ...corr })
      setMsgBonus(prev => ({ ...prev, [b.id]: '✅ Salvo!' }))
      await loadAll()
    } catch {
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

      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}>{t}</button>
        ))}
      </div>

      {/* ── ABA PARTIDAS ── */}
      {tab === 'Partidas' && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Nova Partida</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mandante *</label>
                <select value={novaPartida.selecaoCasaId}
                  onChange={e => setNovaPartida({ ...novaPartida, selecaoCasaId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                  <option value="">Selecione...</option>
                  {selecoes.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.grupo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Visitante *</label>
                <select value={novaPartida.selecaoVisitanteId}
                  onChange={e => setNovaPartida({ ...novaPartida, selecaoVisitanteId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                  <option value="">Selecione...</option>
                  {selecoes.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.grupo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fase *</label>
                <select value={novaPartida.fase}
                  onChange={e => setNovaPartida({ ...novaPartida, fase: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data e Hora *</label>
                <input type="datetime-local" value={novaPartida.dataHora}
                  onChange={e => setNovaPartida({ ...novaPartida, dataHora: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rodada</label>
                <input type="number" value={novaPartida.rodada}
                  onChange={e => setNovaPartida({ ...novaPartida, rodada: e.target.value })}
                  placeholder="Ex: 1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {msgPartida && <span className="text-sm">{msgPartida}</span>}
              <button onClick={criarPartida}
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-6 py-2 rounded-lg text-sm transition-colors">
                Criar Partida
              </button>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-sm text-gray-400">{partidas.length} partidas cadastradas.</p>
          </div>
        </div>
      )}

      {/* ── ABA PLACAR ── */}
      {tab === 'Placar' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 mb-2">
            Edite o placar a qualquer momento. Marque "Encerrar" para calcular os pontos automaticamente.
          </p>
          {partidas.length === 0 && <p className="text-gray-500 text-center py-10">Nenhuma partida cadastrada.</p>}
          {partidas.map(p => {
            const ph = placar[p.id] || {}
            return (
              <div key={p.id} className={`bg-gray-900 rounded-xl border p-4 ${
                ph.encerrada ? 'border-green-900/50' : 'border-gray-800'
              }`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bandeira codigo={p.selecaoCasa.codigoFifa} size={20} />
                      <span className="text-sm text-white font-medium">{p.selecaoCasa.nome}</span>
                      <span className="text-gray-600 text-xs">vs</span>
                      <Bandeira codigo={p.selecaoVisitante.codigoFifa} size={20} />
                      <span className="text-sm text-white font-medium">{p.selecaoVisitante.nome}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.fase} · {new Date(p.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      {ph.encerrada && <span className="ml-2 text-green-500 font-medium">✓ Encerrada</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="number" min="0" max="20"
                      value={ph.golsCasa ?? 0}
                      onChange={e => setPlacar(prev => ({ ...prev, [p.id]: { ...prev[p.id], golsCasa: e.target.value } }))}
                      className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-yellow-500 text-sm" />
                    <span className="text-gray-500 font-bold">×</span>
                    <input type="number" min="0" max="20"
                      value={ph.golsVisitante ?? 0}
                      onChange={e => setPlacar(prev => ({ ...prev, [p.id]: { ...prev[p.id], golsVisitante: e.target.value } }))}
                      className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-bold focus:outline-none focus:border-yellow-500 text-sm" />
                    <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer select-none">
                      <input type="checkbox"
                        checked={ph.encerrada ?? false}
                        onChange={e => setPlacar(prev => ({ ...prev, [p.id]: { ...prev[p.id], encerrada: e.target.checked } }))}
                        className="accent-yellow-500 w-4 h-4" />
                      Encerrar
                    </label>
                    <button onClick={() => atualizarPlacar(p.id)}
                      className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors">
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

      {/* ── ABA BÔNUS ── */}
      {tab === 'Bônus' && (
        <div className="space-y-6">

          {/* GABARITO FINAL — aplica para todos de uma vez */}
          <div className="bg-gray-900 rounded-2xl border border-yellow-500/40 p-6">
            <h2 className="text-lg font-bold text-white mb-1">🏆 Gabarito Final</h2>
            <p className="text-sm text-gray-400 mb-4">
              Preencha o resultado real e clique em "Aplicar para Todos" — o sistema corrige automaticamente todos os participantes.
              Deixe em branco os campos que ainda não foram decididos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">🏆 Campeão real</label>
                <select value={gabarito.campeao}
                  onChange={e => setGabarito({ ...gabarito, campeao: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                  <option value="">Não definido ainda</option>
                  {selecoes.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">⚽ Neymar marcou gol?</label>
                <select value={gabarito.neymarGol}
                  onChange={e => setGabarito({ ...gabarito, neymarGol: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                  <option value="">Não definido ainda</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">👟 Artilheiro real</label>
                <input type="text" value={gabarito.artilheiro}
                  onChange={e => setGabarito({ ...gabarito, artilheiro: e.target.value })}
                  placeholder="Nome do artilheiro"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">🇧🇷 Fase que Brasil foi eliminado</label>
                <select value={gabarito.brasilFase}
                  onChange={e => setGabarito({ ...gabarito, brasilFase: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                  <option value="">Não definido ainda</option>
                  {FASES_BRASIL.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {msgGabarito && <span className="text-sm">{msgGabarito}</span>}
              <button onClick={aplicarGabarito} disabled={aplicandoGabarito}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-900 font-bold px-6 py-2 rounded-lg text-sm transition-colors">
                {aplicandoGabarito ? 'Aplicando...' : `Aplicar para Todos (${bonus.length} participantes)`}
              </button>
            </div>
          </div>

          {/* CORREÇÕES INDIVIDUAIS */}
          <div>
            <h2 className="text-lg font-bold text-white mb-3">✏️ Correção Individual</h2>
            {bonus.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum palpite bônus registrado ainda.</p>
            )}
            <div className="space-y-3">
              {bonus.map(b => {
                const corr = correcoes[b.id] || {}
                const setCorr = (field, val) =>
                  setCorrecoes(prev => ({ ...prev, [b.id]: { ...prev[b.id], [field]: val } }))

                const ptsPrev = (corr.campeaoAcertou ? 25 : 0) +
                                (corr.neymarGolAcertou ? 10 : 0) +
                                (corr.artilheiroAcertou ? 25 : 0) +
                                (corr.brasilFaseAcertou ? 25 : 0)

                return (
                  <div key={b.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">{b.usuario?.nome}</p>
                        <p className="text-xs text-gray-500">{b.usuario?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold">{b.pontosBonus} pts</p>
                        {ptsPrev !== b.pontosBonus && (
                          <p className="text-xs text-gray-500">→ {ptsPrev} pts ao salvar</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {[
                        { key: 'campeaoAcertou',      label: '🏆 Campeão',     val: b.campeao, pts: 25 },
                        { key: 'neymarGolAcertou',    label: '⚽ Neymar gol',  val: b.neymarGol != null ? (b.neymarGol ? 'Sim' : 'Não') : '-', pts: 10 },
                        { key: 'artilheiroAcertou',   label: '👟 Artilheiro',  val: b.artilheiro, pts: 25 },
                        { key: 'brasilFaseAcertou',   label: '🇧🇷 Brasil fase', val: b.brasilFase, pts: 25 },
                      ].map(item => (
                        <label key={item.key}
                          className={`flex items-start gap-2 cursor-pointer rounded-lg p-2 transition-colors ${
                            corr[item.key] ? 'bg-green-900/30 border border-green-700/40' : 'bg-gray-800'
                          }`}>
                          <input type="checkbox"
                            checked={corr[item.key] || false}
                            onChange={e => setCorr(item.key, e.target.checked)}
                            className="accent-yellow-500 mt-0.5 w-4 h-4 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">{item.label}</p>
                            <p className="text-white text-xs font-medium">{item.val || '-'}</p>
                            <p className="text-xs text-yellow-500">{item.pts} pts</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      {msgBonus[b.id] && <span className="text-xs">{msgBonus[b.id]}</span>}
                      <button onClick={() => corrigirBonus(b)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors">
                        Salvar Correção
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}