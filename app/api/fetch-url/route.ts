import { NextRequest, NextResponse } from 'next/server'

function extractMeta(html: string, property: string): string | undefined {
  return (
    html.match(new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, 'i'))?.[1] ||
    html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*property="${property}"`, 'i'))?.[1]
  )?.trim()
}

function detectPlatform(url: string): { platform: string; domain: string; region: string } {
  const domain = new URL(url).hostname.replace(/^www\./, '')
  const platform =
    domain.includes('shopee') ? 'Shopee' :
    domain.includes('lazada') ? 'Lazada' :
    domain.includes('1688') ? '1688' :
    domain.includes('taobao') ? 'Taobao' :
    domain.includes('tmall') ? 'Tmall' :
    domain.includes('pinduoduo') || domain.includes('yangkeduo') ? 'Pinduoduo' :
    domain.includes('amazon') ? 'Amazon' :
    domain.includes('aliexpress') ? 'AliExpress' :
    domain.includes('alibaba') ? 'Alibaba' :
    domain

  const region =
    domain.includes('.my') || domain.includes('shopee.com.my') ? 'MY' :
    domain.includes('.cn') || ['1688', 'taobao', 'tmall', 'pinduoduo', 'yangkeduo'].some(p => domain.includes(p)) ? 'CN' :
    domain.includes('.sg') ? 'SG' :
    domain.includes('.th') ? 'TH' :
    'MY'

  return { platform, domain, region }
}

// ── Dummy product data for prototype (replace with real API later) ─────────────
// Simulates what TMAPI / Taoke MCP would return for each platform.
// Keyed by platform name.
const DUMMY_PRODUCTS: Record<string, {
  title: string
  description: string
  price: string
  currency: string
  image?: string
  shop?: string
  specs?: string
}> = {
  '1688': {
    title: 'A4 Copy Paper 70gsm (Box of 5 Reams / 2500 Sheets) — Office Supplies Wholesale',
    description: 'High quality A4 copy paper suitable for all printers and photocopiers. 70gsm, 210×297mm, 500 sheets per ream, 5 reams per box. MOQ: 1 box.',
    price: '38.00',
    currency: 'CNY',
    shop: 'Guangzhou Office Supplies Co., Ltd.',
    specs: 'Size: A4 (210×297mm) | Weight: 70gsm | Sheets: 2500/box | Color: White',
  },
  'Taobao': {
    title: 'Logitech MX Keys Wireless Keyboard — Full Size Backlit Multi-Device',
    description: 'Logitech MX Keys advanced wireless illuminated keyboard. Works with up to 3 devices, USB-C rechargeable, compatible with Mac, Windows, Linux.',
    price: '539.00',
    currency: 'CNY',
    shop: '罗技官方旗舰店 (Logitech Official Flagship)',
    specs: 'Connectivity: Bluetooth + USB receiver | Battery: Rechargeable | OS: Windows/Mac/Linux',
  },
  'Tmall': {
    title: 'Dell Latitude 5540 Laptop — Intel Core i5-1345U 16GB RAM 512GB SSD 15.6" FHD',
    description: 'Dell Latitude 5540 business laptop. Intel Core i5-1345U, 16GB DDR4, 512GB NVMe SSD, 15.6" FHD IPS display, Windows 11 Pro, 3-year warranty.',
    price: '4899.00',
    currency: 'CNY',
    shop: 'Dell官方旗舰店 (Dell Official Flagship)',
    specs: 'CPU: Intel Core i5-1345U | RAM: 16GB | Storage: 512GB SSD | Display: 15.6" FHD',
  },
  'Pinduoduo': {
    title: 'HP LaserJet Pro M404dn Monochrome Laser Printer — Duplex + Network',
    description: 'HP LaserJet Pro M404dn mono laser printer with automatic duplex printing and wired network. 40 ppm, 1200 dpi, 350-sheet input. Ideal for office use.',
    price: '1299.00',
    currency: 'CNY',
    shop: 'HP惠普官方旗舰店',
    specs: 'Type: Mono Laser | Speed: 40 ppm | Duplex: Auto | Connectivity: USB + Ethernet',
  },
  'Shopee': {
    title: 'Logitech MX Keys Advanced Wireless Illuminated Keyboard',
    description: 'Perfect keystrokes, every time. MX Keys is crafted for efficient and comfortable typing with perfectly-shaped, backlit keys.',
    price: '399.00',
    currency: 'MYR',
    shop: 'Logitech Official Store MY',
    specs: 'Connectivity: Bluetooth + Unifying receiver | Backlit: Yes | Multi-device: 3 devices',
  },
  'Lazada': {
    title: 'Samsung 27" ViewFinity S6 QHD Monitor — IPS 165Hz USB-C',
    description: 'Samsung 27 inch QHD (2560×1440) monitor, IPS panel, 165Hz refresh rate, USB-C 65W power delivery, HDR10, AMD FreeSync Premium.',
    price: '1299.00',
    currency: 'MYR',
    shop: 'Samsung Official Store',
    specs: 'Size: 27" | Resolution: 2560×1440 QHD | Panel: IPS | Refresh: 165Hz | USB-C: 65W PD',
  },
}

// ── JSON-LD parser — extracts Product schema from <script type="application/ld+json"> ──
function extractJsonLd(html: string): { title?: string; description?: string; price?: string; image?: string; brand?: string } | null {
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const type = item['@type']
        if (type === 'Product' || type === 'product') {
          const offers = item.offers ?? (Array.isArray(item.offers) ? item.offers[0] : null)
          const price =
            (offers && (offers.price ?? offers.lowPrice)) ??
            item.price
          return {
            title: item.name ?? item.title,
            description: item.description,
            image: typeof item.image === 'string' ? item.image : (Array.isArray(item.image) ? item.image[0] : undefined),
            price: price != null ? String(price) : undefined,
            brand: typeof item.brand === 'string' ? item.brand : item.brand?.name,
          }
        }
      }
    } catch { /* malformed JSON-LD, skip */ }
  }
  return null
}

// ── Direct HTML fetch ─────────────────────────────────────────────────────────
async function fetchViaDirectHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  return res.text()
}

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({}))
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const { platform, domain, region } = detectPlatform(url)
  const currency = region === 'CN' ? 'CNY' : 'MYR'

  // ── Strategy 1: Fetch HTML → JSON-LD → OG tags ───────────────────────────
  try {
    const html = await fetchViaDirectHtml(url)
    if (html) {
      // 1a. JSON-LD Product schema (richest — Shopify, WooCommerce, most structured sites)
      const ld = extractJsonLd(html)
      if (ld?.title) {
        const description =
          ld.description ||
          extractMeta(html, 'og:description') ||
          extractMeta(html, 'description')
        const price = ld.price || extractMeta(html, 'product:price:amount') || extractMeta(html, 'og:price:amount')
        return NextResponse.json({ title: ld.title, description, image: ld.image, price, currency, platform, domain, region, source: 'jsonld' })
      }

      // 1b. OG tags fallback (most sites have at least og:title)
      const title =
        extractMeta(html, 'og:title') ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
      const description =
        extractMeta(html, 'og:description') ||
        extractMeta(html, 'description')
      const image = extractMeta(html, 'og:image')
      const price =
        extractMeta(html, 'product:price:amount') ||
        extractMeta(html, 'og:price:amount')
      if (title) {
        return NextResponse.json({ title, description, image, price, currency, platform, domain, region, source: 'og' })
      }
    }
  } catch { /* fall through */ }

  // ── Strategy 2: Dummy data — placeholder until TMAPI / Taoke MCP is wired ──
  if (DUMMY_PRODUCTS[platform]) {
    const dummy = DUMMY_PRODUCTS[platform]
    return NextResponse.json({ ...dummy, platform, domain, region, source: 'demo' })
  }

  // Nothing worked — return metadata only so caller can handle gracefully
  return NextResponse.json({ platform, domain, region, source: 'failed' }, { status: 200 })
}
