'use client'
import Navbar from "@/components/NavBar";
import Hero from "@/components/Hero";
import { LineSection } from "@/components/ProcessFlowFeature";
import { BucketsSection } from "@/components/ProcessFlowFeature";
import ProcessFlowVertical from "@/components/ProcessFlowFeature";

import LandingPage from "@/components/NavBar";
export default function Page() {
  return (
    <>
      <Navbar />
      <Hero/>
      <ProcessFlowVertical/>
      

    </>
  );
}



/*
import React, { useState } from 'react'
// import axios from 'axios'
import { useRouter } from 'next/navigation'


export default function Home() {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const router = useRouter()

  const handleSearch = async () => {

    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

    

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>🛒 Price Comparator</h1>
      

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search a product…"
          style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={handleSearch} style={{ marginLeft: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: '#fff', cursor: 'pointer' }}>
          Search
        </button>
      </div>

      
    </div>
  )
}
*/

