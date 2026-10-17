# Passaggio di consegne: evoluzione di Mini Francesco

Questo file riassume una lunga conversazione fatta in una sessione cloud di Claude Code (repository `paryxz93/omino-titoli`). Serve alla nuova sessione sul computer di Francesco per proseguire esattamente da dove siamo arrivati.

**Per la sessione che legge:** leggi tutto il file prima di fare qualsiasi cosa, poi esegui i compiti della sezione 7 nell'ordine indicato.

## 1. Regole di scrittura (preferenze di Francesco)

1. Scrivi sempre in italiano, grammaticalmente corretto.
2. Non usare MAI trattini nel testo, di nessun tipo. Per gli elenchi usa numeri, non trattini.
3. Il verbo essere alla terza persona si scrive "é".
4. Dai sempre il massimo: risposte complete, verificate, di qualità.
5. Separa sempre ciò che hai verificato da ciò che deduci. Nella sessione cloud sono state dette cose dedotte e presentate come vere, e Francesco non si é ritrovato: non ripetere l'errore.

## 2. L'obiettivo di Francesco

Trasformare Mini Francesco in un vero "mini me":

1. **Avatar con cui chiacchierare**, super naturale, che risponde molto velocemente.
2. **Supervisore di Claude:** sa in ogni momento cosa fa ogni sessione di Claude e può chiacchierare con Francesco mentre Claude lavora, senza aspettare Claude e senza disturbarlo. Esempi: "Hai capito?" "Sì, mi hai detto X, lo passo a Claude appena finisce questo passaggio." Oppure: "Come va l'altro task?" "Va bene, Claude ora sta facendo Y."
3. **Assistente dal cellulare (Android):** Francesco detta task, promemoria e appunti anche quando il computer é spento. Le cose vengono salvate in ordine e poi processate correttamente quando possibile.
4. **Niente AI locali:** quelle attuali pesano sulla GPU e sulla batteria del computer. Tutto deve passare online.
5. **Affidabilità massima:** non deve mai cadere, niente server singoli da gestire.
6. **Budget massimo: 10 euro al mese.**

## 3. Cosa sappiamo per certo (verificato nel codice del mod)

Il mod `omino-titoli` (file `hooks/register.ts` del repository `paryxz93/omino-titoli`, versione 0.3.0) é solo il ponte tra Claude Code e il server locale `amico`. Usa lo strumento MCP `mcp__remote-devices__amico__lavora` e fa queste cose:

1. **Titoli degli strumenti:** a ogni strumento usato da Claude manda `titolo:<testo>|25`, con frasi prese da una tabella fissa ("Leggo omino.py", "Cerco sul web: ...", "Lavoro su n8n"). Salta gli strumenti di `amico` stesso.
2. **Stati del turno** (solo conversazione principale): "Leggo il tuo messaggio" (20 secondi), "Ragiono sul prossimo passo" dal secondo passo in poi (20 secondi), "Risposta pronta" oppure "Mi sono fermato" (6 secondi).
3. **Niente ripetizioni:** la stessa frase non viene rimandata entro 4 secondi.
4. **Frasi dette a voce:** dopo uno strumento, al massimo una volta ogni 2 secondi, chiede `interventi:`. Se riceve un testo, lo aggiunge al risultato dello strumento con l'indicazione per Claude di rispondere a Francesco con lo strumento `parla` (o `commenta`) e poi continuare.
5. **Salvataggio degli scambi:** a fine turno manda `ricorda:scambio|DOMANDA: ... RISPOSTA: ...` (domanda fino a 1.500 caratteri, risposta fino a 4.000).
6. **Silenzio senza computer:** al primo invio controlla se lo strumento di `amico` esiste; se non c'é, smette di mandare titoli per tutta la sessione.

Difetti confermati nel codice:

1. Gli eventi non dicono da quale sessione arrivano, quindi con più sessioni aperte non si distinguono.
2. Se all'avvio il computer non c'era, quella sessione non cerca più `amico`.
3. I titoli degli strumenti dei subagenti si mescolano a quelli della conversazione principale.
4. Il controllo delle frasi dette a voce gira anche dentro i subagenti: una frase di Francesco può finire a un subagente e mai alla conversazione principale.
5. Le frasi arrivano a Claude solo alla fine di uno strumento, e tocca a Claude rispondere, interrompendo il lavoro.

Il test del mod rivela che Mini Francesco si trova in `C:\Users\paryx\Documents\Avatar\avatar\` ed é scritto in Python (file `omino.py`).

## 4. Cosa NON sappiamo ancora (da verificare in questa sessione)

Tutto ciò che fa il server `amico` e il resto di Mini Francesco. In particolare:

1. Come mostra i titoli (fumetto, animazione, voce?).
2. Come ascolta Francesco: microfono sempre acceso? Quale motore di trascrizione? Come decide cosa mettere da parte per Claude?
3. Se ha già un cervello suo (un modello di linguaggio locale) e cosa fa.
4. Come funzionano gli strumenti `parla`, `commenta`, `cerca`, `ricorda`, `interventi`, `titolo` e quali altri esistono.
5. Dove e come salva il diario, e cosa contiene.
6. Quali AI locali usa (Francesco ha citato Kokoro per la voce) e quanta GPU consumano.
7. Come gestisce più sessioni di Claude insieme.
8. L'installatore `INSTALLA_AVVIO_RAPIDO.bat` nella cartella `avvio_rapido`, il comando `/mf`, l'hook di fine risposta e il "recupero frasi perse" citati in sessioni precedenti.

## 5. Decisioni prese nella conversazione

Architettura scelta: **nessun server da gestire**, ogni pezzo con una riserva automatica, tetti di spesa controllati.

| Pezzo | Scelta | Riserva | Costo mensile |
|---|---|---|---|
| Server, lavagna in diretta delle sessioni, inbox, memoria | Cloudflare Workers a pagamento (Durable Objects, D1, Vectorize), in un account Cloudflare **separato** da quello dei clienti | Rete Cloudflare | 5 dollari |
| Cervello veloce | Claude Haiku (ultima versione) tramite OpenRouter | Chiave Anthropic diretta se cade OpenRouter | circa 2/3 dollari |
| Cervello pensante | Claude Sonnet (ultima versione), massimo circa 5 volte al giorno | Haiku | incluso sopra |
| Orecchie | Riconoscimento vocale di Android in diretta, poi Groq Whisper per il testo finale | Riconoscimento offline di Android | pochi centesimi |
| Voce | Azure Speech, voce neurale italiana con visemi per il labiale: prima i 500.000 caratteri gratuiti, poi a consumo con tetto | Voce offline di Android | 0, tetto 1 dollaro |
| Corpo | App Android nativa (Francesco ha Android, probabilmente un Galaxy S23 Ultra, da confermare) | | 0 |
| Notifiche | Firebase | | 0 |
| Domande "perché" a Claude | `$.model.fork` dentro il mod, con l'abbonamento Claude | | 0 |
| **Totale** | | | **circa 9 euro, tetto 10** |

Funzioni previste:

1. **App Android:** servizio in primo piano con parola di attivazione "Ehi Francesco" sul telefono (openWakeWord), impostabile come assistente predefinito, notifiche con pulsanti per rispondere alle domande di Claude, cancellazione dell'eco, coda offline, widget.
2. **Conversazione sotto il secondo:** testo parziale in diretta, ragionamento anticipato, fine del turno basata sul senso della frase, streaming frase per frase, segnali di ascolto ("mh mh") generati dal telefono, caching del prompt.
3. **Lavagna per sessione:** nome e obiettivo, fase, ultimi passi, frasi visibili di Claude tra uno strumento e l'altro, piano dei task, file toccati, errori, domande in attesa. Il cervello risponde solo con ciò che c'é sulla lavagna.
4. **Smistamento** di ogni frase di Francesco: chiacchiera, domanda di stato, istruzione per una sessione, risposta a una domanda di Claude, nuovo task, promemoria. Consegna a tre velocità: urgente (`$.turn.abort` più nuovo prompt), al passo successivo (`$.session.append`), a fine turno. Claude non deve più rispondere a voce: conferma Mini Francesco.
5. **Domande di Claude:** il mod intercetta AskUserQuestion e la gira al telefono.
6. **Inbox dal telefono:** ogni voce salvata subito con numero d'ordine; i riferimenti ("anche quell'altro") risolti subito; classificazione in tre gruppi (lo fa Mini Francesco da solo, serve Claude, serve il computer); consegna in ordine alle sessioni con `$.clock.every` e `$.prompt.submit`; attività programmata nel cloud per svuotarla quando non ci sono sessioni aperte; nessuna voce eseguita due volte.
7. **Memoria:** diario con ricerca per significato, apprendimento notturno del profilo, collegamento al database Notion AZIONI.
8. **Affidabilità:** controlli di salute ogni 5 minuti con passaggio alle riserve, tetti di spesa nel Worker con avviso all'80%, resoconto settimanale della spesa, test automatici del mod.
9. **Sicurezza e privacy:** Cloudflare Access, chiave segreta tra mod e Worker, conferma con impronta per i comandi importanti, mascheramento dei dati personali dei clienti, dati in Europa dove possibile. Le chiavi API vanno solo nei segreti di Cloudflare, mai in chat né nel codice.

Opzioni scartate e perché:

1. **Edge TTS:** gratuito ma non ufficiale, si rompe spesso, peggio ancora da un server.
2. **Server proprio** (Oracle gratuito, DigitalOcean): é un punto singolo che può cadere e va mantenuto. Il server DigitalOcean esistente (1 core, 2 GB, 12 dollari, con n8n) é troppo piccolo e serve ai clienti.
3. **Solo modelli gratuiti:** più lenti nelle ore di punta, cambiano senza preavviso, alcuni usano i dati per l'addestramento.
4. **Modelli che parlano direttamente e voci premium:** troppo costosi per un uso quotidiano.
5. **Microfono sempre aperto verso il cloud:** costerebbe centinaia di euro al mese; si usa la parola di attivazione sul telefono.

API dei mod verificate nella documentazione di Claude Code e utili al progetto: `$.http.fetch`, `$.session.id`, `$.session.append`, `$.prompt.submit`, `$.clock.every`, `$.turn.abort`, `$.model.fork`, `$.model.complete`, intercettazione di `tool.call` su AskUserQuestion. `$.session.append` durante un turno va provato sul campo.

## 6. Limiti accettati

1. Le chat normali di claude.ai restano invisibili a Mini Francesco: vede solo le sessioni di Claude Code con il mod.
2. L'avvio immediato di una nuova sessione di Claude da zero é da verificare; garantito solo all'attività programmata successiva.
3. La parola di attivazione consuma un po' di batteria, da misurare sul telefono.
4. La voce é una voce neurale di Azure, non quella di Francesco.

## 7. Compiti per questa sessione, in ordine

**Compito 1: inventario reale di Mini Francesco (solo lettura, non modificare nulla).**

1. Elenca tutta la struttura di `C:\Users\paryx\Documents\Avatar` con le dimensioni di file e cartelle.
2. Leggi tutto il codice e rispondi a ogni domanda della sezione 4, citando file e righe.
3. Elenca tutti gli strumenti del server `amico` con cosa fanno davvero.
4. Indica quali modelli AI locali ci sono, dove sono, quanto pesano e quando vengono usati.
5. Indica dove sono chiavi, password o token (solo il nome del file, MAI il contenuto).
6. Indica dove sono i dati personali (diario, registrazioni, memoria) e quanto pesano.

**Compito 2: rapporto per Francesco.**

Scrivi un file `INVENTARIO_MINI_FRANCESCO.md` nella cartella `Avatar` con:

1. La lista reale di cosa fa Mini Francesco oggi, funzione per funzione, separando ciò che hai verificato da ciò che deduci.
2. Il confronto con quanto scritto nelle sezioni 3 e 4 di questo file: cosa era giusto, cosa era sbagliato.
3. Per ogni funzione esistente: cosa si può riusare nella versione online e cosa va rifatto.

**Compito 3: preparare il caricamento su GitHub (chiedi conferma a Francesco prima di caricare).**

1. Prepara un `.gitignore` che escluda chiavi e password (per esempio `.env`), modelli AI, ambienti Python (`venv`, `__pycache__`), file audio, file sopra i 50 MB e, salvo diversa indicazione di Francesco, il diario.
2. Mostra a Francesco l'elenco esatto di cosa verrebbe caricato.
3. Solo dopo il suo via, carica tutto in un repository **privato** `paryxz93/minifrancesco`.

**Compito 4: proposta aggiornata.**

Con i dati reali, aggiorna il piano della sezione 5: cosa cambia rispetto a quanto deciso, e da quale fase conviene partire. Le fasi previste erano: 1 lavagna e mod collegato al Worker; 2 cervello; 3 app Android con voce; 4 inbox; 5 domande di Claude e notifiche; 6 memoria.

Non installare, disinstallare, spostare o cancellare nulla senza il permesso esplicito di Francesco.
