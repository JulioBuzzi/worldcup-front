import { useState, useEffect } from 'react'
import api from '../services/api'

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

export default function Grupos() {
  const [grupos, setGrupos] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/selecoes/grupos')
      .then(r => setGrupos(r.data))
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
        <p className="text-gray-400 mt-1">48 seleções distribuídas em 12 grupos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedGrupos.map(([grupo, selecoes]) => (
          <div key={grupo} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="bg-yellow-500 px-4 py-2">
              <h2 className="font-bold text-gray-900 text-sm">GRUPO {grupo}</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {selecoes.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xl">{BANDEIRAS[s.codigoFifa] || '🏳️'}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{s.nome}</p>
                    <p className="text-gray-500 text-xs">{s.codigoFifa}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
