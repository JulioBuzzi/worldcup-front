import { useState, useEffect } from 'react'
import api from '../services/api'

function Bandeira({ codigo, size = 20 }) {
  const map = {
    MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
    CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
    BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct',
    USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
    GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
    NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
    BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
    ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
    FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
    ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
    POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
    ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
  }
  const code = map[codigo]
  if (!code) return <span className="text-base">🏳️</span>
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={codigo}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded-sm object-cover inline-block shrink-0"
    />
  )
}

function calcularClassificacao(selecoes, partidas) {
  const tabela = {}
  selecoes.forEach(s => {
    tabela[s.id] = { selecao: s, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 }
  })
  partidas.filter(p => p.encerrada).forEach(p => {
    const casa = tabela[p.selecaoCasa?.id]
    const vis = tabela[p.selecaoVisitante?.id]
    if (!casa || !vis) return
    const gc = p.golsCasa, gv = p.golsVisitante
    casa.j++; vis.j++
    casa.gp += gc; casa.gc += gv; casa.sg += gc - gv
    vis.gp += gv; vis.gc += gc; vis.sg += gv - gc
    if (gc > gv)      { casa.v++; casa.pts += 3; vis.d++ }
    else if (gc < gv) { vis.v++;  vis.pts  += 3; casa.d++ }
    else              { casa.e++; casa.pts++;     vis.e++; vis.pts++ }
  })
  return Object.values(tabela).sort((a, b) =>
    b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || a.selecao.nome.localeCompare(b.selecao.nome)
  )
}

// Calcula os 8 melhores terceiros entre todos os grupos
function calcularMelhoresTerceiros(todosGrupos, todasPartidas) {
  const terceiros = []
  Object.entries(todosGrupos).forEach(([grupo, selecoes]) => {
    const partidasGrupo = todasPartidas.filter(p => {
      const ids = selecoes.map(s => s.id)
      return ids.includes(p.selecaoCasa?.id) || ids.includes(p.selecaoVisitante?.id)
    })
    const class_ = calcularClassificacao(selecoes, partidasGrupo)
    // Só considera terceiro se o grupo terminou (todas as partidas encerradas)
    const totalPartidas = partidasGrupo.length
    const encerradas = partidasGrupo.filter(p => p.encerrada).length
    if (class_.length >= 3 && totalPartidas > 0) {
      terceiros.push({
        ...class_[2],
        grupo,
        grupoCompleto: encerradas === totalPartidas && totalPartidas > 0
      })
    }
  })
  // Ordenar por pts, sg, gp — pegar os 8 melhores
  return terceiros
    .sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp)
    .slice(0, 8)
} 

export default function Grupos() {
  const [grupos, setGrupos] = useState({})
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/selecoes/grupos'), api.get('/partidas')])
      .then(([gRes, pRes]) => { setGrupos(gRes.data); setPartidas(pRes.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  const sortedGrupos = Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b))
  const melhoresTerceiros = calcularMelhoresTerceiros(grupos, partidas)
  const idsMelhoresTerceiros = new Set(melhoresTerceiros.map(t => t.selecao.id))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Grupos </h1>
        <p className="text-gray-400 mt-1">48 seleções</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedGrupos.map(([grupo, selecoes]) => {
          const partidasGrupo = partidas.filter(p => {
            const ids = selecoes.map(s => s.id)
            return ids.includes(p.selecaoCasa?.id) || ids.includes(p.selecaoVisitante?.id)
          })
          const classificacao = calcularClassificacao(selecoes, partidasGrupo)
          const encerradas = partidasGrupo.filter(p => p.encerrada).length
          const total = partidasGrupo.length

          return (
            <div key={grupo} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {/* Header */}
              <div className="bg-yellow-500 px-4 py-2 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm">GRUPO {grupo}</h2>
                {total > 0 && (
                  <span className="text-xs text-gray-700 font-medium">
                    {encerradas}/{total} jogos
                  </span>
                )}
              </div>

              {/* Tabela */}
              <div className="px-3 py-2">
                <div className="grid grid-cols-12 text-xs text-gray-600 font-semibold mb-1 px-1">
                  <div className="col-span-5">Seleção</div>
                  <div className="col-span-1 text-center">J</div>
                  <div className="col-span-1 text-center">V</div>
                  <div className="col-span-1 text-center">E</div>
                  <div className="col-span-1 text-center">D</div>
                  <div className="col-span-1 text-center">SG</div>
                  <div className="col-span-2 text-center font-bold">PTS</div>
                </div>

                {classificacao.map((c, idx) => {
                  const classificado1ou2 = idx < 2 && encerradas > 0
                  const terceiro = idx === 2
                  const melhorTerceiro = terceiro && idsMelhoresTerceiros.has(c.selecao.id)

                  // Cor da bolinha de status
                  const statusColor =
                    classificado1ou2  ? 'bg-green-500' :
                    melhorTerceiro    ? 'bg-blue-400' :
                    terceiro && encerradas > 0 ? 'bg-gray-600' : ''

                  return (
                    <div
                      key={c.selecao.id}
                      className={`grid grid-cols-12 items-center py-1.5 px-1 rounded text-xs transition-colors ${
                        classificado1ou2 ? 'bg-green-900/20' :
                        melhorTerceiro   ? 'bg-blue-900/15' : ''
                      }`}
                    >
                      <div className="col-span-5 flex items-center gap-1.5">
                        <div className="flex items-center gap-1 w-5">
                          <span className={`text-xs font-bold ${
                            classificado1ou2 ? 'text-green-400' :
                            melhorTerceiro   ? 'text-blue-400' : 'text-gray-700'
                          }`}>{idx + 1}</span>
                        </div>
                        {statusColor && (
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
                        )}
                        <Bandeira codigo={c.selecao.codigoFifa} size={18} />
                        <span className="text-white truncate">{c.selecao.nome}</span>
                      </div>
                      <div className="col-span-1 text-center text-gray-400">{c.j}</div>
                      <div className="col-span-1 text-center text-gray-400">{c.v}</div>
                      <div className="col-span-1 text-center text-gray-400">{c.e}</div>
                      <div className="col-span-1 text-center text-gray-400">{c.d}</div>
                      <div className={`col-span-1 text-center ${c.sg > 0 ? 'text-green-400' : c.sg < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {c.sg > 0 ? `+${c.sg}` : c.sg}
                      </div>
                      <div className="col-span-2 text-center font-bold text-yellow-400">{c.pts}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Classificado (1º e 2º)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Melhor 3º (8 vagas)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-600" />
          <span>3º eliminado</span>
        </div>
        <span className="text-gray-600">· Atualiza conforme jogos são encerrados</span>
      </div>

      {/* Tabela dos melhores terceiros */}
      {melhoresTerceiros.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-3">
            🏅 Melhores 3ºs Lugares
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({melhoresTerceiros.length}/8 vagas preenchidas)
            </span>
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="grid grid-cols-12 text-xs text-gray-600 font-semibold px-4 py-2 border-b border-gray-800">
              <div className="col-span-1 text-center">Pos</div>
              <div className="col-span-4">Seleção</div>
              <div className="col-span-1 text-center">Grp</div>
              <div className="col-span-1 text-center">J</div>
              <div className="col-span-1 text-center">V</div>
              <div className="col-span-1 text-center">E</div>
              <div className="col-span-1 text-center">D</div>
              <div className="col-span-1 text-center">SG</div>
              <div className="col-span-2 text-center font-bold">PTS</div>
            </div>
            {melhoresTerceiros.map((t, idx) => (
              <div key={t.selecao.id}
                className="grid grid-cols-12 items-center px-4 py-2.5 border-b border-gray-800/50 last:border-0 bg-blue-900/10 text-xs">
                <div className="col-span-1 text-center text-blue-400 font-bold">{idx + 1}</div>
                <div className="col-span-4 flex items-center gap-2">
                  <Bandeira codigo={t.selecao.codigoFifa} size={18} />
                  <span className="text-white font-medium truncate">{t.selecao.nome}</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-yellow-500 font-bold">{t.grupo}</span>
                </div>
                <div className="col-span-1 text-center text-gray-400">{t.j}</div>
                <div className="col-span-1 text-center text-gray-400">{t.v}</div>
                <div className="col-span-1 text-center text-gray-400">{t.e}</div>
                <div className="col-span-1 text-center text-gray-400">{t.d}</div>
                <div className={`col-span-1 text-center ${t.sg > 0 ? 'text-green-400' : t.sg < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {t.sg > 0 ? `+${t.sg}` : t.sg}
                </div>
                <div className="col-span-2 text-center font-bold text-yellow-400">{t.pts}</div>
              </div>
            ))}
            {melhoresTerceiros.length < 8 && (
              <div className="px-4 py-2 text-xs text-gray-600 italic text-center">
                {8 - melhoresTerceiros.length} vaga(s) ainda não definida(s)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}