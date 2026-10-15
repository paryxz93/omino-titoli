# omino-titoli

Mod per Claude Code: mentre Claude lavora in chat, manda al "Mini Francesco" sul desktop (il server MCP locale `amico`) il titolo di cosa sta facendo: leggo, scrivo, cerco sul web, ragiono, risposta pronta. Non passa dal modello, quindi non allunga le risposte.

## Installazione

```
/plugin install omino-titoli --marketplace paryxz93/omino-titoli
```

Rispondi `y` per aggiungere il marketplace, poi scegli l'ambito (utente, così vale in ogni sessione).

## Come funziona

1. `turn.start`: "Leggo il tuo messaggio".
2. `tool.call`: un titolo in italiano per ogni strumento (Read, Edit, Bash, WebSearch, connettori...).
3. `turn.step`: "Ragiono sul prossimo passo".
4. `turn.complete`: "Risposta pronta".

Ogni titolo arriva all'omino tramite lo strumento `lavora` del server `amico` con il formato `titolo:<testo>|<secondi>`. Se il server non c'é, il mod resta in silenzio.
