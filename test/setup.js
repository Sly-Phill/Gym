import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET ||= 'test-secret-'.padEnd(48, 'x')
