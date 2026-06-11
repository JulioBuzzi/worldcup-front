import { useState, useEffect } from 'react'
import api from '../services/api'

// Bandeiras via flagcdn.com (evita problema com emojis regionais)
function Bandeira({ codigo, size = 24 }) {
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
  if (!code) return <span className="text-lg">🏳️</span>
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={codigo}
      width={size}
      height={size * 0.67}
      className="rounded-sm object-cover"
    />
  )
}

function calcularClassificacao(selecoes, partidas) {
  const tabela = {}
  selecoes.forEach(s => {
    tabela[s.id] = {
      selecao: s,
      pts: 0, j: 0, v: 0, e: 0, d: 0,
      gp: 0, gc: 0, sg: 0
    }
  })

  partidas.filter(p => p.encerrada).forEach(p => {
    const casa = tabela[p.selecaoCasa?.id]
    const vis = tabela[p.selecaoVisitante?.id]
    if (!casa || !vis) return

    const gc = p.golsCasa
    const gv = p.golsVisitante

    casa.j++; vis.j++
    casa.gp += gc; casa.gc += gv; casa.sg += gc - gv
    vis.gp += gv; vis.gc += gc; vis.sg += gv - gc

    if (gc > gv) {
      casa.v++; casa.pts += 3; vis.d++
    } else if (gc < gv) {
      vis.v++; vis.pts += 3; casa.d++
    } else {
      casa.e++; casa.pts++; vis.e++; vis.pts++
    }
  })

  return Object.values(tabela).sort((a, b) =>
    b.pts - a.pts || b.sg - a.sg || b.gp - a.gp
  )
}

export default function Grupos() {
  const [grupos, setGrupos] = useState({})
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/selecoes/grupos'),
      api.get('/partidas')
    ])
      .then(([gRes, pRes]) => {
        setGrupos(gRes.data)
        setPartidas(pRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
    </div>
  )

  const sortedGrupos = Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Grupos</h1>
        <p className="text-gray-400 mt-1">48 seleções</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedGrupos.map(([grupo, selecoes]) => {
          const partidasGrupo = partidas.filter(p => {
            const ids = selecoes.map(s => s.id)
            return ids.includes(p.selecaoCasa?.id) || ids.includes(p.selecaoVisitante?.id)
          })
          const classificacao = calcularClassificacao(selecoes, partidasGrupo)
          const temJogos = partidasGrupo.some(p => p.encerrada)

          return (
            <div key={grupo} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {/* Header */}
              <div className="bg-yellow-500 px-4 py-2">
                <h2 className="font-bold text-gray-900 text-sm">GRUPO {grupo}</h2>
              </div>

              {/* Tabela de classificação */}
              <div className="px-3 py-2">
                <div className="grid grid-cols-12 text-xs text-gray-500 font-semibold mb-1 px-1">
                  <div className="col-span-5">Seleção</div>
                  <div className="col-span-1 text-center">J</div>
                  <div className="col-span-1 text-center">V</div>
                  <div className="col-span-1 text-center">E</div>
                  <div className="col-span-1 text-center">D</div>
                  <div className="col-span-1 text-center">SG</div>
                  <div className="col-span-2 text-center font-bold text-gray-400">PTS</div>
                </div>

                {classificacao.map((c, idx) => (
                  <div
                    key={c.selecao.id}
                    className={`grid grid-cols-12 items-center py-1.5 px-1 rounded text-xs ${
                      idx < 2 ? 'bg-green-900/20' : ''
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-2">
                      <span className={`text-xs font-bold w-3 ${idx < 2 ? 'text-green-400' : 'text-gray-600'}`}>
                        {idx + 1}
                      </span>
                      <Bandeira codigo={c.selecao.codigoFifa} size={20} />
                      <span className="text-white truncate">{c.selecao.nome}</span>
                    </div>
                    <div className="col-span-1 text-center text-gray-400">{c.j}</div>
                    <div className="col-span-1 text-center text-gray-400">{c.v}</div>
                    <div className="col-span-1 text-center text-gray-400">{c.e}</div>
                    <div className="col-span-1 text-center text-gray-400">{c.d}</div>
                    <div className={`col-span-1 text-center ${c.sg > 0 ? 'text-green-400' : c.sg < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {c.sg > 0 ? `+${c.sg}` : c.sg}
                    </div>
                    <div className="col-span-2 text-center font-bold text-yellow-400">{c.pts}</div>
                  </div>
                ))}

                {!temJogos && (
                  <p className="text-xs text-gray-600 text-center py-1 italic">Sem jogos encerrados</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <div className="w-3 h-3 rounded bg-green-900/40 border border-green-700/30"></div>
        <span>Classificados para o Mata-mata (top 2 + melhores 3ºs)</span>
      </div>
    </div>
  )
}