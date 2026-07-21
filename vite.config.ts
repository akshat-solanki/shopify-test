import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { z } from 'zod'
import {
  GEMINI_STUDIO_RESPONSE_JSON_SCHEMA,
  buildStudioAiPrompt,
  resolveStudioAiResult,
  studioAiRequestSchema,
} from './app/lib/studio-ai'

const backendTarget = process.env.VYPARI_BACKEND_URL ?? 'http://localhost:3003'
const devPort = 5173

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'app/assets', filename)
      }
    },
  }
}

function shopifyIframeProtection() {
  return {
    name: 'shopify-iframe-protection',
    configureServer(server: { middlewares: { use: (handler: (req: { url?: string }, res: { setHeader: (name: string, value: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = req.url ?? '/'
        const url = new URL(requestUrl, 'http://localhost')
        const shop = url.searchParams.get('shop')

        const frameAncestors = shop
          ? `frame-ancestors https://${shop} https://admin.shopify.com;`
          : "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"

        res.setHeader('Content-Security-Policy', frameAncestors)
        next()
      })
    },
  }
}

function studioAiRoute() {
  return {
    name: 'studio-ai-route',
    configureServer(server: {
      middlewares: {
        use: (
          route: string,
          handler: (
            req: {
              method?: string
              on: (event: 'data' | 'end' | 'error', listener: (...args: any[]) => void) => void
            },
            res: {
              statusCode: number
              setHeader: (name: string, value: string) => void
              end: (body?: string) => void
            },
            next: () => void,
          ) => void | Promise<void>,
        ) => void
      }
    }) {
      server.middlewares.use('/api/ai/showcase-config', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        try {
          const body = await readJsonBody(req)
          const { prompt, currentSettings } = studioAiRequestSchema.parse(body)
          const apiKey = process.env.GEMINI_API_KEY

          if (!apiKey) {
            throw new Error('Missing GEMINI_API_KEY in the local environment.')
          }

          const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: buildStudioAiPrompt({ prompt, currentSettings }),
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.35,
                responseFormat: {
                  text: {
                    mimeType: 'application/json',
                    schema: GEMINI_STUDIO_RESPONSE_JSON_SCHEMA,
                  },
                },
              },
            }),
          })

          const payload = await geminiResponse.json().catch(async () => ({
            raw: await geminiResponse.text(),
          }))

          if (!geminiResponse.ok) {
            throw new Error(
              payload && typeof payload === 'object' && 'error' in payload
                ? JSON.stringify(payload.error)
                : `Gemini request failed with ${geminiResponse.status}`,
            )
          }

          const rawText = collectGeminiText(payload)
          const result = resolveStudioAiResult({ currentSettings, rawText })

          res.statusCode = 200
          res.end(JSON.stringify(result))
        } catch (error) {
          const message = error instanceof z.ZodError
            ? error.issues.map((issue) => issue.message).join('; ')
            : error instanceof Error
              ? error.message
              : 'Unknown AI route failure'

          res.statusCode = 400
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

function readJsonBody(req: {
  on: (event: 'data' | 'end' | 'error', listener: (...args: any[]) => void) => void
}) {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = []

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
    })

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

function collectGeminiText(payload: unknown) {
  const candidates = Array.isArray((payload as { candidates?: unknown[] })?.candidates)
    ? (payload as { candidates: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates
    : []

  const text = candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('Gemini returned an empty response.')
  }

  return text
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    shopifyIframeProtection(),
    studioAiRoute(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
  server: {
    port: devPort,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/auth': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/proxy': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
