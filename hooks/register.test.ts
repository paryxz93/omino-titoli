import { test, expect } from 'claude-code/testing'

const AMICO = 'mcp__remote-devices__amico__lavora'

test('una lettura di file manda il titolo "Leggo omino.py" all omino', async ($, on) => {
  const chiamate: any[] = []
  // sotto il mod: lo strumento dell'omino risponde ok e registra cosa riceve
  on('tool.call', { tool: AMICO }, (_$, e) => { chiamate.push(e); return { result: 'ok' } })
  on('tool.call', { tool: 'Read' }, () => ({ result: 'contenuto' }))
  await $.tool.call({ tool: 'Read', file_path: 'C:\\Users\\paryx\\Documents\\Avatar\\avatar\\omino.py' } as any)
  await new Promise(r => setTimeout(r, 80))
  expect(chiamate.some(c => String(c.descrizione).startsWith('titolo:Leggo omino.py'))).toBe(true)
})
