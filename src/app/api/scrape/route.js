// src/app/api/scrape/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import redis from '@/lib/cache/redis';
import { scrapeAmazon } from '@/lib/scrapers/amazon';
import { connect , ProductCache } from '@/lib/db/mongodb';
import { scrapeFlipkart } from '@/lib/scrapers/flipkart';
// import { scrapeMeesho }   from '@/scrapers/meesho';

const scrapers = {
  amazon: scrapeAmazon,
  flipkart: scrapeFlipkart,
  // meesho:   scrapeMeesho,
};

const CACHE_TTL = 60 * 60; // 1 hour

export async function GET(request) {
  await connect()
const { searchParams } = new URL(request.url);
const raw = searchParams.get('q') || '';

// 1) trim ends, 2) collapse all runs of whitespace to one space, 3) lowercase
const searchTerm = raw
  .trim()
  .replace(/\s+/g, ' ')
  .toLowerCase();

  if (!searchTerm) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  // 1. For each source, either get from cache or scrape & cache
  const results = await Promise.all(
    Object.entries(scrapers).map(async ([source, scraperFn]) => {
      const redisKey = `products:${source}:${searchTerm}`;
      // a) Try Redis
      const cached = await redis.get(redisKey);
      if (cached) {
        return { source, products: JSON.parse(cached) };
      }

            // 2️⃣ Mongo lookup
      const doc = await ProductCache.findOne({ source, searchTerm }).lean();
      if (doc) {
        // warm Redis
        await redis.set(redisKey, JSON.stringify(doc.products), 'EX', CACHE_TTL);
        return { source, products: doc.products };
      }

      // c) Miss → scrape now
      try {
        const products = await scraperFn(searchTerm);
        // Cache the fresh data
        await redis.set(redisKey, JSON.stringify(products), 'EX', CACHE_TTL);
        await ProductCache.create({ source, searchTerm, products });
        return { source, products };
      } catch (err) {
        console.error(`Error scraping [${source}]`, err);
        return { source, error: err.message };
      }
    })
  );

  // 2. Combine into an object:
  //    { amazon: [...], flipkart: [...], meesho: [...] }
  const payload = results.reduce((acc, { source, products, error }) => {
    acc[source] = error ? { error } : products;
    return acc;
  }, {});

  // 3. Return 200 OK with everything
  return NextResponse.json(payload, { status: 200 });
}



