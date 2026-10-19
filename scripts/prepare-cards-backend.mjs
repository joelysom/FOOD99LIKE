import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
const directory = '.cards-test/vercel-backend'
for (const part of ['api', 'functions', 'public']) mkdirSync(`${directory}/${part}`, { recursive: true })
for (const file of ['cards-service.mjs', 'cards-http.mjs', 'contact-profile.mjs', 'vercel-runtime.mjs', 'package.json', 'package-lock.json']) copyFileSync(`functions/${file}`, `${directory}/functions/${file}`)
copyFileSync('server/cards-entry.js', `${directory}/api/cards.js`)
writeFileSync(`${directory}/package.json`, JSON.stringify({ name: 'tokka-cards-api', private: true, type: 'module', engines: { node: '22.x' } }))
writeFileSync(`${directory}/vercel.json`, JSON.stringify({ buildCommand: 'npm ci --prefix functions', outputDirectory: 'public', functions: { 'api/cards.js': { maxDuration: 120 } } }))
writeFileSync(`${directory}/public/robots.txt`, 'User-agent: *\nDisallow: /\n')
writeFileSync(`${directory}/.vercelignore`, '.vercel/\nnode_modules/\nfunctions/node_modules/\n.env*\n')
console.log('Prepared server source without frontend assets or private credentials.')
