// src/app/search/page.jsx
'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
// import { ThemeProvider } from '../theme-provider'
import EcommerceCard from '@/components/Ecommercecard'

export default function SearchPage() {
  const router = useRouter()
  const params = useSearchParams()
  const q = params.get('q') || ''

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setError('')
    axios
      .get(`/api/scrape?q=${encodeURIComponent(q)}`)
      .then(({ data }) => setResults(data))
      .catch(() => setError('Failed to fetch products.'))
      .finally(() => setLoading(false))
  }, [q])

  const handleNewSearch = term => {
    if (!term.trim()) return
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  return (

      <div className="p-8 max-w-screen-xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4">Search Results for “{q}”</h1>
        <div className="flex items-center mb-6">
          <input
            type="text"
            defaultValue={q}
            placeholder="Search a product…"
            className="px-4 py-2 w-72 border rounded"
            onKeyDown={e => e.key === 'Enter' && handleNewSearch(e.target.value)}
          />
          <button
            onClick={() => handleNewSearch(q)}
            className="ml-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {loading && <p>Loading products…</p>}
        {error && <p className="text-red-500">{error}</p>}

        {results &&
          Object.entries(results).map(([source, payload]) => (
            <section key={source} className="mb-8">
              <h2 className="text-2xl font-medium capitalize mb-4">{source}</h2>
              {'error' in payload ? (
                <p className="text-yellow-600">⚠️ {payload.error}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {payload.map(p => (
                    <EcommerceCard
                      key={`${source}-${p.asin}`}
                      image={p.image}
                      title={p.title}
                      price={p.price}
                      description={p.title}
                      onClick={() => router.push(`/product/${source}/${p.asin}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
      </div>
  
  )
}









// 'use client'

// import React, { useEffect, useState } from 'react'
// import { useSearchParams, useRouter } from 'next/navigation'
// import axios from 'axios'
// import EcommerceCard from '@/components/Ecommercecard'

// export default function SearchPage() {
//   const router = useRouter()
//   const params = useSearchParams()
//   const q = params.get('q') || ''

//   const [results, setResults] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     if (!q) return
//     setLoading(true)
//     setError('')
//     axios.get(`/api/scrape?q=${encodeURIComponent(q)}`)
//       .then(({ data }) => setResults(data))
//       .catch(() => setError('Failed to fetch products.'))
//       .finally(() => setLoading(false))
//   }, [q])

//   const handleNewSearch = term => {
//     if (!term.trim()) return
//     router.push(`/search?q=${encodeURIComponent(term)}`)
//   }

//   return (
//     <div style={{ padding: '2rem', maxWidth: '1200px', margin: 'auto' }}>
//       <h1>Search Results for “{q}”</h1>
//       <div style={{ marginBottom: '1rem' }}>
//         <input
//           type="text"
//           defaultValue={q}
//           placeholder="Search a product…"
//           style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
//           onKeyDown={e => e.key === 'Enter' && handleNewSearch(e.target.value)}
//         />
//         <button onClick={() => handleNewSearch(q)} style={{ marginLeft: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: '#fff', cursor: 'pointer' }}>
//           Search
//         </button>
//       </div>

//       {loading && <p>Loading products…</p>}
//       {error && <p style={{ color: 'red' }}>{error}</p>}

//       {results && Object.entries(results).map(([source, payload]) => (
//         <section key={source} style={{ marginTop: '2rem' }}>
//           <h2 style={{ textTransform: 'capitalize' }}>{source}</h2>
//           {'error' in payload ? (
//             <p style={{ color: 'orange' }}>⚠️ {payload.error}</p>
//           ) : (
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
//               {payload.map((p, i) => (
//                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
//                   {payload.map((p, i) => (
//                     <EcommerceCard
//                       key={i}
//                       image={p.image}
//                       title={p.title}
//                       price={p.price}
//                       description={p.title}        // or some snippet
//                       onClick={() => router.push(`/product/${source}/${p.asin}`)}
//                     />
//                   ))}
//                 </div>

//               ))}
//             </div>
//           )}
//         </section>
//       ))}
//     </div>
//   )
// }