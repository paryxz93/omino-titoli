import type { Register } from 'claude-code'

// Il ponte verso l'omino: lo strumento MCP "lavora" del server locale "amico"
// accetta il formato "titolo:<testo>|<secondi>". Non passa dal modello, quindi
// non consuma contesto e non allunga le risposte.
const AMICO = 'mcp__remote-devices__amico__lavora'
const PREFISSO_AMICO = 'mcp__remote-devices__amico__'

const NOMI: Record<string, (e: any) => string> = {
  Read: e => `Leggo ${base(e.file_path)}`,
  Write: e => `Scrivo ${base(e.file_path)}`,
  Edit: e => `Modifico ${base(e.file_path)}`,
  Glob: () => 'Cerco tra i file',
  Grep: e => `Cerco "${corto(e.pattern, 18)}"`,
  Bash: e => `Eseguo: ${corto(e.description || e.command, 34)}`,
  WebSearch: e => `Cerco sul web: ${corto(e.query, 28)}`,
  WebFetch: () => 'Leggo una pagina web',
  Agent: e => `Mando un aiutante: ${corto(e.description, 26)}`,
  TaskCreate: () => 'Organizzo il lavoro',
  TaskUpdate: () => 'Aggiorno il piano',
  AskUserQuestion: () => 'Ti faccio una domanda',
  SendUserMessage: () => 'Ti scrivo in chat',
  Skill: e => `Uso la skill ${corto(e.skill, 24)}`,
  ToolSearch: () => 'Carico uno strumento',
}

function base(p: unknown): string {
  const s = String(p ?? '')
  return s.split(/[\\/]/).pop() || s
}
function corto(v: unknown, n: number): string {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
function titoloDi(e: any): string {
  const t = String(e.tool)
  if (NOMI[t]) return NOMI[t](e)
  if (t.startsWith('mcp__remote-devices__device_')) return 'Lavoro sul tuo computer'
  if (t.startsWith('mcp__remote-devices__computer_')) return 'Uso mouse e tastiera'
  if (t.startsWith('mcp__Google_Drive')) return 'Guardo su Google Drive'
  if (t.startsWith('mcp__Google_Calendar')) return 'Guardo il calendario'
  if (t.startsWith('mcp__Notion')) return 'Lavoro su Notion'
  if (t.startsWith('mcp__Braccio_N8N') || t.includes('N8N')) return 'Lavoro su n8n'
  if (t.startsWith('mcp__Cloudflare') || t.includes('Cloudflare')) return 'Lavoro su Cloudflare'
  if (t.startsWith('mcp__Zoho')) return 'Guardo la posta'
  if (t.startsWith('Projects') || t === 'Projects') return 'Consulto la memoria'
  if (t.startsWith('Artifact')) return 'Preparo un artefatto'
  const corto_ = t.replace(/^mcp__/, '').split('__').pop() || t
  return `Uso ${corto(corto_.replace(/_/g, ' '), 30)}`
}

let ultimo = 0
let ultimoTesto = ''
let haAmico: boolean | undefined

async function manda($: any, testo: string, secondi = 15) {
  try {
    if (haAmico === undefined) {
      // se il server "amico" non c'e' (computer non collegato) resto in silenzio;
      // una lista vuota (ambiente di prova) non decide niente
      let nomi: string[] = []
      try { nomi = (await $.tool.list()).map((t: any) => t.name) } catch { nomi = [] }
      haAmico = nomi.length === 0 ? undefined : nomi.includes(AMICO)
      if (haAmico === false) return
    }
    const ora = Date.now()
    if (testo === ultimoTesto && ora - ultimo < 4000) return
    ultimo = ora; ultimoTesto = testo
    // non aspetto la risposta: l'omino si aggiorna in sottofondo
    void $.tool.call({ tool: AMICO, descrizione: `titolo:${testo}|${secondi}` }).catch(() => {})
  } catch {}
}

let ultimoControllo = 0

async function interventi($: any): Promise<string> {
  // al massimo un controllo ogni due secondi, per non rallentare il lavoro
  const ora = Date.now()
  if (haAmico === false || ora - ultimoControllo < 2000) return ''
  ultimoControllo = ora
  try {
    const r: any = await $.tool.call({ tool: AMICO, descrizione: 'interventi:' })
    let testo = String(r?.text ?? r?.result ?? '').trim()
    // il server risponde con un JSON {"result": "..."}: tiro fuori il testo
    try { const j = JSON.parse(testo); if (j && typeof j.result === 'string') testo = j.result } catch {}
    testo = testo.trim()
    if (!testo || testo === 'ok' || testo.startsWith('Errore') || testo.startsWith('Il motore')) return ''
    return testo.replace(/\s+/g, ' ').slice(0, 500)
  } catch {
    return ''
  }
}

export const register: Register = (on) => {
  // Inizio del turno principale: sto leggendo il messaggio
  on('turn.start', ($, e, next) => {
    if (e.agentId === undefined) {
      void manda($, 'Leggo il tuo messaggio', 20)
      ultimoPrompt = String(e.text ?? '').trim()
    }
    return next(e)
  })

  // Ogni richiesta al modello: sto ragionando (solo sul ciclo principale)
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined && e.index > 0) void manda($, 'Ragiono sul prossimo passo', 20)
    return yield* next(e)
  })

  // Ogni strumento: il titolo di cosa faccio
  on('tool.call', async ($, e, next) => {
    const t = String((e as any).tool)
    const mio = t.startsWith(PREFISSO_AMICO) || (next as any).origin === 'omino-titoli'
    if (!mio) void manda($, titoloDi(e), 25)
    const esito: any = await next(e)
    if (mio || esito?.deny !== undefined) return esito
    // Francesco ha parlato a voce mentre lavoravo? L'orecchio del computer lo ha messo da parte:
    // lo consegno al modello come contesto del risultato, senza toccare il risultato stesso.
    const detto = await interventi($)
    if (!detto) return esito
    const nota = `[Francesco ti ha parlato a voce mentre lavoravi: "${detto}"] Rispondigli subito a voce con lo strumento parla (o commenta se breve), solo a questo, poi continua il lavoro tenendo conto di quello che ha detto.`
    return { ...esito, context: [...(esito?.context ?? []), nota] }
  }).catch(($, e, next) => next(e))

  // Fine del turno: risposta pronta
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) void manda($, e.reason === 'answer' ? 'Risposta pronta' : 'Mi sono fermato', 6)
    const esito: any = await next(e)
    // Memoria: ogni scambio (domanda e risposta) finisce nel diario locale sul computer di Francesco,
    // cosi' nessuna conversazione va persa e si puo' ricercare in seguito.
    if (e.agentId === undefined && e.reason === 'answer') {
      const risposta = String(esito?.text ?? '').trim()
      if (risposta || ultimoPrompt) {
        const corpo = `DOMANDA: ${taglia(ultimoPrompt, 1500)}\nRISPOSTA: ${taglia(risposta, 4000)}`
        void $.tool.call({ tool: AMICO, descrizione: `ricorda:scambio|${corpo}` }).catch(() => {})
      }
    }
    return esito
  })
}

let ultimoPrompt = ''
function taglia(s: string, n: number): string {
  const t = String(s ?? '').replace(/\s+\n/g, '\n').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}
