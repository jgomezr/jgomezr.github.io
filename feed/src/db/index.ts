import { dbClient } from './client'
import { makeRepo } from './repo'

/** Repositorio único de la app, sobre el worker sqlite-wasm (OPFS). */
export const repo = makeRepo(dbClient)
