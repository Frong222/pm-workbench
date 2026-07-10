import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

function webdavProxyPlugin() {
  return {
    name: 'webdav-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/webdav-proxy', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let rawBody = ''
        req.on('data', (chunk: string) => (rawBody += chunk))
        req.on('end', () => {
          try {
            const parsed = JSON.parse(rawBody)
            const { targetUrl, method: reqMethod, headers: customHeaders, body: requestBody } = parsed
            if (!targetUrl) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing targetUrl' }))
              return
            }

            const urlObj = new URL(targetUrl)
            const httpModule = urlObj.protocol === 'https:' ? await import('https') : await import('http')
            const mod = httpModule.default || httpModule

            const options: any = {
              method: reqMethod || 'GET',
              hostname: urlObj.hostname,
              port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
              path: urlObj.pathname + urlObj.search,
              headers: {
                ...customHeaders,
                'Content-Type': 'application/json',
              },
            }

            const proxyReq = mod.request(options, (proxyRes: any) => {
              let data = ''
              proxyRes.on('data', (chunk: any) => (data += chunk))
              proxyRes.on('end', () => {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  status: proxyRes.statusCode,
                  body: data,
                  headers: proxyRes.headers,
                }))
              })
            })

            proxyReq.on('error', (err: Error) => {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            })

            if (requestBody) {
              proxyReq.write(requestBody)
            }
            proxyReq.end()
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), webdavProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: mode === 'production' ? '/pm-workbench/' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
}))
