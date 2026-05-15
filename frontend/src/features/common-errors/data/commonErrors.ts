export interface CommonErrorExample {
  id: string
  wrong: string
  correct: string
  explanation: string
  rule: string
  tip: string
}

export interface ReferenceTable {
  title: string
  headers: string[]
  rows: string[][]
  note?: string
}

export interface CommonErrorCategory {
  id: string
  title: string
  subtitle: string
  errorType: string
  examples: CommonErrorExample[]
  referenceTables?: ReferenceTable[]
}

export const COMMON_ERRORS_DATA: CommonErrorCategory[] = [
  // ─── 1. CASOS GRAMATICALES ───────────────────────────────────────────────
  {
    id: 'case',
    title: 'Casos gramaticales',
    subtitle: 'Nom / Akk / Dat / Gen',
    errorType: 'case',
    examples: [
      {
        id: 'case_1',
        wrong: 'Ich sehe ein Mann.',
        correct: 'Ich sehe einen Mann.',
        explanation: 'El verbo sehen pide Acusativo. El artículo indefinido masculino en Akk es "einen", no "ein".',
        rule: 'Nom: ein | Akk: einen | Dat: einem | Gen: eines',
        tip: 'Después de sehen, kaufen, haben → siempre Acusativo.',
      },
      {
        id: 'case_2',
        wrong: 'Das Buch von mein Vater.',
        correct: 'Das Buch meines Vaters.',
        explanation: '"von" puede sustituir al Genitivo coloquialmente, pero el posesivo también necesita Genitivo: mein → meines.',
        rule: 'Nom: mein | Akk: meinen | Dat: meinem | Gen: meines',
        tip: 'Usá "meines Vaters" en texto formal; "von meinem Vater" es válido en habla informal.',
      },
      {
        id: 'case_3',
        wrong: 'Ich helfe mein Freund.',
        correct: 'Ich helfe meinem Freund.',
        explanation: 'helfen, danken, gefallen, folgen → rigen Dativo, no Acusativo.',
        rule: 'Nom: mein | Akk: meinen | Dat: meinem | Gen: meines',
        tip: 'Memorizá los verbos que rigen Dativo: HELFEN, DANKEN, FOLGEN, GLAUBEN, VERTRAUEN.',
      },
      {
        id: 'case_4',
        wrong: 'Er kauft ein Buch für sein Mutter.',
        correct: 'Er kauft ein Buch für seine Mutter.',
        explanation: '"für" rige Acusativo. "Mutter" es femenino → artículo posesivo fem. Akk: "seine".',
        rule: 'für + Akk: sein → seine (fem.), einen (mask.), sein (neut.)',
        tip: 'DURCH, FÜR, GEGEN, OHNE, UM → siempre Acusativo.',
      },
      {
        id: 'case_5',
        wrong: 'Er fährt mit der Auto.',
        correct: 'Er fährt mit dem Auto.',
        explanation: '"mit" rige Dativo. "Auto" es neutro → artículo definido neutro Dat: "dem".',
        rule: 'AUS, BEI, MIT, NACH, VON, ZU, SEIT → siempre Dativo',
        tip: 'Acordate del acrónimo: AUS BEI MIT NACH VON ZU SEIT = Dativo siempre.',
      },
    ],
    referenceTables: [
      {
        title: 'Artículo definido (der / die / das)',
        headers: ['Caso', 'Mask. (der)', 'Fem. (die)', 'Neut. (das)', 'Plural (die)'],
        rows: [
          ['Nominativ', 'der', 'die', 'das', 'die'],
          ['Akkusativ', 'den', 'die', 'das', 'die'],
          ['Dativ', 'dem', 'der', 'dem', 'den (+n)'],
          ['Genitiv', 'des (+s)', 'der', 'des (+s)', 'der'],
        ],
        note: 'En Dativ plural, el sustantivo añade -n si no termina ya en -n o -s: den Männern, den Kindern.',
      },
      {
        title: 'Artículo indefinido (ein / eine / ein)',
        headers: ['Caso', 'Mask. (ein)', 'Fem. (eine)', 'Neut. (ein)', 'Plural (—)'],
        rows: [
          ['Nominativ', 'ein', 'eine', 'ein', '—'],
          ['Akkusativ', 'einen', 'eine', 'ein', '—'],
          ['Dativ', 'einem', 'einer', 'einem', '—'],
          ['Genitiv', 'eines', 'einer', 'eines', '—'],
        ],
        note: 'Los posesivos (mein, dein, sein, ihr…) siguen exactamente la misma tabla.',
      },
      {
        title: 'Adjetivo con artículo definido (schwache Deklination)',
        headers: ['Caso', 'Mask.', 'Fem.', 'Neut.', 'Plural'],
        rows: [
          ['Nominativ', 'der alte Mann', 'die alte Frau', 'das alte Kind', 'die alten Leute'],
          ['Akkusativ', 'den alten Mann', 'die alte Frau', 'das alte Kind', 'die alten Leute'],
          ['Dativ', 'dem alten Mann', 'der alten Frau', 'dem alten Kind', 'den alten Leuten'],
          ['Genitiv', 'des alten Mannes', 'der alten Frau', 'des alten Kindes', 'der alten Leute'],
        ],
        note: 'Con artículo definido el adjetivo casi siempre termina en -en. Solo Nom. mask./fem./neut. y Akk. fem./neut. toman -e.',
      },
      {
        title: 'Adjetivo con artículo indefinido (gemischte Deklination)',
        headers: ['Caso', 'Mask.', 'Fem.', 'Neut.', 'Plural (kein)'],
        rows: [
          ['Nominativ', 'ein alter Mann', 'eine alte Frau', 'ein altes Kind', 'keine alten Leute'],
          ['Akkusativ', 'einen alten Mann', 'eine alte Frau', 'ein altes Kind', 'keine alten Leute'],
          ['Dativ', 'einem alten Mann', 'einer alten Frau', 'einem alten Kind', 'keinen alten Leuten'],
          ['Genitiv', 'eines alten Mannes', 'einer alten Frau', 'eines alten Kindes', 'keiner alten Leute'],
        ],
        note: 'El adjetivo "compensa" la info de caso/género que el artículo indefinido no proporciona (Nom. mask. ein → alter, Nom. neut. ein → altes).',
      },
      {
        title: 'Adjetivo sin artículo (starke Deklination)',
        headers: ['Caso', 'Mask.', 'Fem.', 'Neut.', 'Plural'],
        rows: [
          ['Nominativ', 'kalter Kaffee', 'frische Milch', 'altes Brot', 'alte Bücher'],
          ['Akkusativ', 'kalten Kaffee', 'frische Milch', 'altes Brot', 'alte Bücher'],
          ['Dativ', 'kaltem Kaffee', 'frischer Milch', 'altem Brot', 'alten Büchern'],
          ['Genitiv', 'kalten Kaffees', 'frischer Milch', 'alten Brotes', 'alter Bücher'],
        ],
        note: 'Sin artículo el adjetivo porta toda la información de caso y género, por eso las terminaciones son más "fuertes" (similares a las del artículo definido).',
      },
    ],
  },

  // ─── 2. PREPOSICIONES ─────────────────────────────────────────────────────
  {
    id: 'preposition',
    title: 'Preposiciones y casos',
    subtitle: 'Präpositionen',
    errorType: 'preposition',
    examples: [
      {
        id: 'prep_1',
        wrong: 'Ich warte seit eine Stunde.',
        correct: 'Ich warte seit einer Stunde.',
        explanation: '"seit" siempre rige Dativo. "eine Stunde" → "einer Stunde" (fem. Dat.).',
        rule: 'AUS · BEI · MIT · NACH · VON · ZU · SEIT → siempre Dativo',
        tip: 'Memorizá el acrónimo: AUS BEI MIT NACH VON ZU SEIT = Dativo siempre.',
      },
      {
        id: 'prep_2',
        wrong: 'Ich gehe in die Schule mit Zug.',
        correct: 'Ich gehe mit dem Zug in die Schule.',
        explanation: '"mit" requiere Dativo y artículo: "mit dem Zug". Además TeKaMoLo: el medio va antes del lugar.',
        rule: 'mit + Dativo (artículo obligatorio)',
        tip: 'En alemán el artículo casi nunca se omite después de preposición.',
      },
      {
        id: 'prep_3',
        wrong: 'Er ist interessiert an die Technologie.',
        correct: 'Er ist an der Technologie interessiert.',
        explanation: '"interessiert an" rige Dativo: "an die" → "an der" (fem. Dat.).',
        rule: 'AN + Dativo cuando es fijo (interessiert an, schuld an)',
        tip: 'Distinguí las preposiciones de dos valencias (an, in, auf…): destino → Akk, ubicación → Dat.',
      },
      {
        id: 'prep_4',
        wrong: 'Ich denke an mein Zukunft.',
        correct: 'Ich denke an meine Zukunft.',
        explanation: '"Zukunft" es femenino (die Zukunft). "an" + Akk → "meine" (fem. Akk).',
        rule: 'denken an + Akk: mein → meine (fem.)',
        tip: 'Verbos con preposición fija: "denken an" (Akk), "träumen von" (Dat), "warten auf" (Akk).',
      },
    ],
    referenceTables: [
      {
        title: 'Preposiciones que rigen solo Acusativo',
        headers: ['Preposición', 'Significado', 'Ejemplo'],
        rows: [
          ['durch', 'a través de', 'Er geht durch den Park.'],
          ['für', 'para', 'Das Geschenk ist für meinen Bruder.'],
          ['gegen', 'contra / hacia', 'Er ist gegen die Wand gelaufen.'],
          ['ohne', 'sin', 'Sie kommt ohne ihren Mann.'],
          ['um', 'alrededor de / a (hora)', 'Wir gehen um den See. / Um 8 Uhr.'],
          ['bis', 'hasta', 'Ich arbeite bis nächsten Freitag.'],
          ['entlang', 'a lo largo de', 'Wir gehen den Fluss entlang.'],
        ],
      },
      {
        title: 'Preposiciones que rigen solo Dativo',
        headers: ['Preposición', 'Significado', 'Ejemplo'],
        rows: [
          ['aus', 'de (origen)', 'Sie kommt aus der Schweiz.'],
          ['bei', 'en casa de / en (empresa)', 'Ich arbeite bei einem Unternehmen.'],
          ['mit', 'con', 'Er fährt mit dem Zug.'],
          ['nach', 'después de / hacia (ciudades)', 'Nach dem Essen. / Ich fahre nach Berlin.'],
          ['seit', 'desde hace', 'Ich lerne seit drei Jahren Deutsch.'],
          ['von', 'de (procedencia/autor)', 'Das Buch von dem Autor.'],
          ['zu', 'a (personas/lugares)', 'Ich gehe zum Arzt. / zu Hause.'],
          ['außer', 'excepto', 'Außer mir war niemand da.'],
          ['gegenüber', 'frente a', 'Das Café ist gegenüber dem Bahnhof.'],
        ],
        note: 'Acrónimo: AUS BEI MIT NACH SEIT VON ZU + außer, gegenüber',
      },
      {
        title: 'Verbos que rigen Acusativo (transitivos frecuentes)',
        headers: ['Verbo', 'Significado', 'Ejemplo'],
        rows: [
          ['haben', 'tener', 'Ich habe einen Bruder.'],
          ['sehen', 'ver', 'Ich sehe den Mann.'],
          ['kennen', 'conocer', 'Ich kenne die Frau.'],
          ['finden', 'encontrar', 'Ich finde das Buch.'],
          ['lieben', 'amar', 'Ich liebe meinen Hund.'],
          ['kaufen', 'comprar', 'Er kauft ein Auto.'],
          ['brauchen', 'necesitar', 'Ich brauche Hilfe.'],
          ['nehmen', 'tomar', 'Er nimmt den Bus.'],
          ['lesen', 'leer', 'Ich lese einen Roman.'],
          ['schreiben', 'escribir', 'Sie schreibt eine E-Mail.'],
          ['hören', 'escuchar', 'Er hört die Musik.'],
          ['besuchen', 'visitar', 'Wir besuchen unsere Freunde.'],
        ],
      },
      {
        title: 'Verbos que rigen Dativo',
        headers: ['Verbo', 'Significado', 'Ejemplo'],
        rows: [
          ['helfen', 'ayudar', 'Ich helfe meinem Freund.'],
          ['danken', 'agradecer', 'Ich danke meiner Mutter.'],
          ['gefallen', 'gustar', 'Das Buch gefällt mir.'],
          ['folgen', 'seguir', 'Er folgt dem Lehrer.'],
          ['gehören', 'pertenecer', 'Das Buch gehört meiner Schwester.'],
          ['glauben', 'creer (a alguien)', 'Ich glaube dir.'],
          ['vertrauen', 'confiar', 'Sie vertraut ihrem Mann.'],
          ['antworten', 'responder', 'Er antwortet dem Chef.'],
          ['begegnen', 'encontrarse con', 'Ich bin ihm begegnet.'],
          ['schmecken', 'saber bien', 'Das Essen schmeckt mir.'],
          ['passieren', 'pasarle a alguien', 'Was ist dir passiert?'],
          ['fehlen', 'hacer falta', 'Du fehlst mir.'],
        ],
      },
      {
        title: 'Verbos que rigen Genitivo (uso formal/literario)',
        headers: ['Verbo', 'Significado', 'Ejemplo'],
        rows: [
          ['bedürfen', 'necesitar', 'Es bedarf großer Geduld.'],
          ['gedenken', 'recordar (conmemorar)', 'Wir gedenken der Opfer.'],
          ['sich erinnern (an+Akk)', 'recordar', 'Ich erinnere mich an die Ferien.'],
          ['sich bedienen', 'servirse de', 'Er bediente sich des Wörterbuchs.'],
          ['anklagen', 'acusar de', 'Er wurde des Diebstahls angeklagt.'],
        ],
        note: 'En alemán coloquial muchos verbos de Genitivo se reemplazan por construcciones con Dativ o preposición. Solo son frecuentes en contextos formales o legales.',
      },
    ],
  },

  // ─── 3. WECHSELPRÄPOSITIONEN (Wo? vs Wohin?) ─────────────────────────────
  {
    id: 'wechselpraep',
    title: 'Preposiciones de dos casos',
    subtitle: 'Wechselpräpositionen: Wo? / Wohin?',
    errorType: 'preposition',
    examples: [
      {
        id: 'wp_1',
        wrong: 'Ich lege das Buch auf dem Tisch.',
        correct: 'Ich lege das Buch auf den Tisch.',
        explanation: '"legen" indica movimiento hacia un destino (Wohin?). Las Wechselpräpositionen usan Akk para destino y Dat para ubicación.',
        rule: 'Wohin? → Akk: auf den Tisch | Wo? → Dat: auf dem Tisch',
        tip: 'Preguntate: ¿adónde va algo? → Akk. ¿dónde está algo? → Dat.',
      },
      {
        id: 'wp_2',
        wrong: 'Er geht in der Schule.',
        correct: 'Er geht in die Schule.',
        explanation: '"gehen in" indica dirección (Wohin?). La preposición "in" + Akk para destino: "in die" (fem.).',
        rule: 'gehen/fahren/legen + in/auf/an/über/unter/vor/hinter/neben/zwischen → Akk',
        tip: 'Verbos de movimiento con destino (gehen, fahren, legen, stellen, hängen) → siempre Akk.',
      },
      {
        id: 'wp_3',
        wrong: 'Das Bild hängt an die Wand.',
        correct: 'Das Bild hängt an der Wand.',
        explanation: '"hängen" sin objeto directo = estado (Wo?). La preposición "an" + Dat para ubicación.',
        rule: 'hängen (estado, sin Obj.) → Wo? → Dat: an der Wand',
        tip: 'hängen/liegen/stehen/sitzen = estado → Dat. hängen/legen/stellen/setzen = acción → Akk.',
      },
      {
        id: 'wp_4',
        wrong: 'Ich wohne in die Stadtmitte.',
        correct: 'Ich wohne in der Stadtmitte.',
        explanation: '"wohnen" indica ubicación estática (Wo?). "in" + Dat para ubicación.',
        rule: 'wohnen/sein/arbeiten + in → Wo? → Dat',
        tip: 'Verbos de estado (wohnen, sein, arbeiten, schlafen) + preposición → siempre Dat.',
      },
    ],
  },

  // ─── 4. CONJUGACIÓN VERBAL ────────────────────────────────────────────────
  {
    id: 'conjugation',
    title: 'Conjugación verbal',
    subtitle: 'Konjugation',
    errorType: 'conjugation',
    examples: [
      {
        id: 'conj_1',
        wrong: 'Er haben drei Kinder.',
        correct: 'Er hat drei Kinder.',
        explanation: 'La 3ª persona singular de "haben" es "hat", no "haben" (infinitivo/plural).',
        rule: 'ich habe | du hast | er/sie/es hat | wir haben | ihr habt | sie haben',
        tip: 'Conjugá mentalmente antes de escribir: ¿quién hace la acción? → elegí la forma correcta.',
      },
      {
        id: 'conj_2',
        wrong: 'Ich muss zu gehen.',
        correct: 'Ich muss gehen.',
        explanation: 'Los verbos modales se combinan con infinitivo SIN "zu".',
        rule: 'Modal + Infinitiv (sin zu): muss gehen, kann kommen, will lernen',
        tip: '"zu" solo aparece con infinitivos después de verbos no modales: "Ich versuche zu gehen."',
      },
      {
        id: 'conj_3',
        wrong: 'Ich werde ihn besuchen werden.',
        correct: 'Ich werde ihn besuchen.',
        explanation: 'El Futur I usa un solo "werden" conjugado + infinitivo al final.',
        rule: 'Futur I: werden (conjugado) + Infinitiv',
        tip: 'En alemán hablado el Futur I se expresa frecuentemente con Präsens + adverbio temporal.',
      },
      {
        id: 'conj_4',
        wrong: 'Er gebt mir das Buch.',
        correct: 'Er gibt mir das Buch.',
        explanation: '"geben" tiene cambio vocálico e→i en 2ª y 3ª persona singular.',
        rule: 'Verbos fuertes con vokalwechsel: geben → gibt, sehen → sieht, fahren → fährt',
        tip: 'Memorizá los verbos de cambio vocálico: geben, sehen, lesen, fahren, laufen, essen.',
      },
    ],
    referenceTables: [
      {
        title: 'Verbos regulares (schwache Verben) — Präsens',
        headers: ['Persona', 'machen (hacer)', 'lernen (aprender)', 'arbeiten (trabajar)', 'reden (hablar)'],
        rows: [
          ['ich', 'mache', 'lerne', 'arbeite', 'rede'],
          ['du', 'machst', 'lernst', 'arbeitest', 'redest'],
          ['er/sie/es', 'macht', 'lernt', 'arbeitet', 'redet'],
          ['wir', 'machen', 'lernen', 'arbeiten', 'reden'],
          ['ihr', 'macht', 'lernt', 'arbeitet', 'redet'],
          ['sie/Sie', 'machen', 'lernen', 'arbeiten', 'reden'],
        ],
        note: 'Verbos cuyo Stamm termina en -t/-d/-fn/-gn añaden -e- antes de las desinencias de du/er/ihr: arbeite-st, arbeite-t.',
      },
      {
        title: 'Verbos irregulares frecuentes (starke Verben) — Präsens + Partizip II',
        headers: ['Infinitiv', 'er/sie/es', 'Partizip II', 'Hilfsverb', 'Significado'],
        rows: [
          ['sein', 'ist', 'gewesen', 'sein', 'ser/estar'],
          ['haben', 'hat', 'gehabt', 'haben', 'tener'],
          ['werden', 'wird', 'geworden', 'sein', 'volverse/futuro'],
          ['gehen', 'geht', 'gegangen', 'sein', 'ir'],
          ['kommen', 'kommt', 'gekommen', 'sein', 'venir'],
          ['fahren', 'fährt', 'gefahren', 'sein', 'ir (vehículo)'],
          ['laufen', 'läuft', 'gelaufen', 'sein', 'correr/caminar'],
          ['fliegen', 'fliegt', 'geflogen', 'sein', 'volar'],
          ['sehen', 'sieht', 'gesehen', 'haben', 'ver'],
          ['lesen', 'liest', 'gelesen', 'haben', 'leer'],
          ['essen', 'isst', 'gegessen', 'haben', 'comer'],
          ['trinken', 'trinkt', 'getrunken', 'haben', 'beber'],
          ['schlafen', 'schläft', 'geschlafen', 'haben', 'dormir'],
          ['sprechen', 'spricht', 'gesprochen', 'haben', 'hablar'],
          ['schreiben', 'schreibt', 'geschrieben', 'haben', 'escribir'],
          ['nehmen', 'nimmt', 'genommen', 'haben', 'tomar'],
          ['geben', 'gibt', 'gegeben', 'haben', 'dar'],
          ['finden', 'findet', 'gefunden', 'haben', 'encontrar'],
          ['wissen', 'weiß', 'gewusst', 'haben', 'saber (hecho)'],
          ['denken', 'denkt', 'gedacht', 'haben', 'pensar'],
          ['bringen', 'bringt', 'gebracht', 'haben', 'traer'],
          ['stehen', 'steht', 'gestanden', 'haben', 'estar de pie'],
          ['liegen', 'liegt', 'gelegen', 'haben', 'estar acostado'],
          ['sitzen', 'sitzt', 'gesessen', 'haben', 'estar sentado'],
          ['halten', 'hält', 'gehalten', 'haben', 'sostener/parar'],
        ],
        note: 'Los verbos de movimiento A→B y cambio de estado usan "sein" como auxiliar. Los demás usan "haben".',
      },
    ],
  },

  // ─── 5. SEIN vs HABEN EN PERFEKT ──────────────────────────────────────────
  {
    id: 'sein_haben',
    title: 'sein vs haben en Perfekt',
    subtitle: 'Perfekt: Hilfsverb',
    errorType: 'conjugation',
    examples: [
      {
        id: 'sh_1',
        wrong: 'Ich habe nach Berlin gefahren.',
        correct: 'Ich bin nach Berlin gefahren.',
        explanation: '"fahren" indica movimiento de A a B → usa "sein" como auxiliar en Perfekt.',
        rule: 'Verbos de movimiento (A→B) y cambio de estado → sein. Otros → haben.',
        tip: 'Regla práctica: si el verbo responde "¿adónde?" o "¿qué le pasó?" → sein.',
      },
      {
        id: 'sh_2',
        wrong: 'Er ist das Auto gewaschen.',
        correct: 'Er hat das Auto gewaschen.',
        explanation: '"waschen" es transitivo (tiene objeto directo) → usa "haben" en Perfekt.',
        rule: 'Verbos transitivos (con objeto directo) → haben',
        tip: 'Si el verbo tiene objeto directo (Akkusativobjekt) → siempre haben.',
      },
      {
        id: 'sh_3',
        wrong: 'Sie hat eingeschlafen.',
        correct: 'Sie ist eingeschlafen.',
        explanation: '"einschlafen" es un cambio de estado → usa "sein" en Perfekt.',
        rule: 'Cambio de estado: aufwachen, einschlafen, sterben, werden → sein',
        tip: 'Verbos de cambio de estado (algo le "pasa" al sujeto) → sein.',
      },
      {
        id: 'sh_4',
        wrong: 'Ich habe gestern geblieben.',
        correct: 'Ich bin gestern geblieben.',
        explanation: '"bleiben" usa "sein" aunque no haya movimiento.',
        rule: 'Excepciones con sein sin movimiento: bleiben, sein, werden, passieren, geschehen',
        tip: 'bleiben, sein y werden usan sein aunque no haya movimiento ni cambio visible.',
      },
    ],
  },

  // ─── 6. VERBOS SEPARABLES ─────────────────────────────────────────────────
  {
    id: 'separable_verb',
    title: 'Verbos separables',
    subtitle: 'Trennbare Verben',
    errorType: 'separable_verb',
    examples: [
      {
        id: 'sep_1',
        wrong: 'Ich anrufe dich morgen.',
        correct: 'Ich rufe dich morgen an.',
        explanation: '"anrufen" es separable: el prefijo "an" va al final en Hauptsatz.',
        rule: 'Prefijo separable → va al final: ich rufe … an',
        tip: 'Prefijos siempre separables: an-, auf-, aus-, bei-, ein-, mit-, nach-, vor-, zu-, ab-, los-.',
      },
      {
        id: 'sep_2',
        wrong: 'Er aufsteht um 7 Uhr.',
        correct: 'Er steht um 7 Uhr auf.',
        explanation: '"aufstehen" es separable. En Hauptsatz el verbo conjugado va en pos.2 y el prefijo "auf" al final.',
        rule: 'aufstehen → er steht … auf (el prefijo siempre al final)',
        tip: 'En Nebensatz, el verbo separable va JUNTO al final: "weil er früh aufsteht".',
      },
      {
        id: 'sep_3',
        wrong: 'Weil er aufsteht früh.',
        correct: 'Weil er früh aufsteht.',
        explanation: 'En Nebensatz el verbo separable NO se separa: va entero al final.',
        rule: 'NS: Subj + … + [Verb completo al final] → weil er früh aufsteht',
        tip: 'La separación solo ocurre en Hauptsatz. En Nebensatz el verbo va unido al final.',
      },
      {
        id: 'sep_4',
        wrong: 'Ich habe angeruft.',
        correct: 'Ich habe angerufen.',
        explanation: 'El Partizip II de verbos separables se forma con: prefijo + ge + Stamm.',
        rule: 'Partizip II separables: Präfix + ge + Stamm: angerufen, aufgestanden, eingekauft',
        tip: 'No "angeruft" sino "angerufen". El "ge-" va entre el prefijo y el Stamm.',
      },
    ],
    referenceTables: [
      {
        title: 'Verbos separables más comunes',
        headers: ['Verbo', 'Präsens er/sie', 'Partizip II', 'Significado', 'Ejemplo'],
        rows: [
          ['anrufen', 'ruft an', 'angerufen', 'llamar (tel.)', 'Ich rufe dich morgen an.'],
          ['aufstehen', 'steht auf', 'aufgestanden', 'levantarse', 'Er steht um 7 Uhr auf.'],
          ['aufmachen', 'macht auf', 'aufgemacht', 'abrir', 'Sie macht die Tür auf.'],
          ['zumachen', 'macht zu', 'zugemacht', 'cerrar', 'Mach bitte das Fenster zu.'],
          ['einschlafen', 'schläft ein', 'eingeschlafen', 'dormirse', 'Er schläft schnell ein.'],
          ['aufwachen', 'wacht auf', 'aufgewacht', 'despertarse', 'Ich wache früh auf.'],
          ['ankommen', 'kommt an', 'angekommen', 'llegar', 'Der Zug kommt um 9 an.'],
          ['abfahren', 'fährt ab', 'abgefahren', 'partir (tren)', 'Der Bus fährt um 8 ab.'],
          ['einsteigen', 'steigt ein', 'eingestiegen', 'subir (transp.)', 'Wir steigen in den Bus ein.'],
          ['aussteigen', 'steigt aus', 'ausgestiegen', 'bajar (transp.)', 'Ich steige an der nächsten Haltestelle aus.'],
          ['anfangen', 'fängt an', 'angefangen', 'empezar', 'Der Film fängt um 20 Uhr an.'],
          ['aufhören', 'hört auf', 'aufgehört', 'parar/dejar', 'Hör bitte auf!'],
          ['mitkommen', 'kommt mit', 'mitgekommen', 'venir también', 'Kommst du mit?'],
          ['vorbereiten', 'bereitet vor', 'vorbereitet', 'preparar', 'Ich bereite das Essen vor.'],
          ['einkaufen', 'kauft ein', 'eingekauft', 'hacer compras', 'Wir kaufen jeden Samstag ein.'],
          ['aufräumen', 'räumt auf', 'aufgeräumt', 'ordenar', 'Räum bitte dein Zimmer auf.'],
          ['abholen', 'holt ab', 'abgeholt', 'recoger (a alguien)', 'Ich hole dich vom Bahnhof ab.'],
          ['ausfüllen', 'füllt aus', 'ausgefüllt', 'rellenar (formulario)', 'Bitte füllen Sie das Formular aus.'],
          ['vorstellen', 'stellt vor', 'vorgestellt', 'presentar/imaginar', 'Ich stelle mich vor.'],
          ['nachdenken', 'denkt nach', 'nachgedacht', 'reflexionar', 'Ich denke darüber nach.'],
        ],
        note: 'Los prefijos an-, auf-, aus-, ab-, ein-, mit-, nach-, vor-, zu-, los- son SIEMPRE separables. Los prefijos be-, ge-, er-, ver-, zer-, ent- NUNCA son separables.',
      },
    ],
  },

  // ─── 7. VERBOS REFLEXIVOS ─────────────────────────────────────────────────
  {
    id: 'reflexive',
    title: 'Verbos reflexivos',
    subtitle: 'Reflexive Verben',
    errorType: 'conjugation',
    examples: [
      {
        id: 'ref_1',
        wrong: 'Ich fühle sehr motiviert.',
        correct: 'Ich fühle mich sehr motiviert.',
        explanation: '"sich fühlen" es reflexivo. El pronombre "mich" (Akk, 1ª sg.) es obligatorio.',
        rule: 'sich fühlen: ich fühle mich | du fühlst dich | er/sie fühlt sich',
        tip: 'Verbos reflexivos frecuentes: sich fühlen, sich freuen, sich erinnern, sich befinden.',
      },
      {
        id: 'ref_2',
        wrong: 'Er interessiert an Sport.',
        correct: 'Er interessiert sich für Sport.',
        explanation: '"sich interessieren für" es reflexivo y lleva preposición "für" + Akk.',
        rule: 'sich interessieren für + Akk: ich interessiere mich für Musik',
        tip: 'El reflexivo alemán no siempre coincide con el español.',
      },
      {
        id: 'ref_3',
        wrong: 'Ich erinnere die Ferien.',
        correct: 'Ich erinnere mich an die Ferien.',
        explanation: '"sich erinnern an" es reflexivo y lleva "an + Akk". No se omite ni el pronombre ni la preposición.',
        rule: 'sich erinnern an + Akk: ich erinnere mich an die Ferien',
        tip: '"Erinnern" sin reflexivo significa "recordarle algo a alguien": "Ich erinnere dich daran."',
      },
    ],
    referenceTables: [
      {
        title: 'Pronombres reflexivos',
        headers: ['Persona', 'Akkusativ (directo)', 'Dativ (indirecto)'],
        rows: [
          ['ich', 'mich', 'mir'],
          ['du', 'dich', 'dir'],
          ['er/sie/es', 'sich', 'sich'],
          ['wir', 'uns', 'uns'],
          ['ihr', 'euch', 'euch'],
          ['sie/Sie', 'sich', 'sich'],
        ],
        note: 'Usar Dativ cuando hay otro objeto Acusativo en la misma oración: "Ich wasche mir die Hände." (mir = Dat, die Hände = Akk)',
      },
      {
        title: 'Verbos reflexivos más comunes',
        headers: ['Verbo', 'Preposición', 'Caso', 'Significado', 'Ejemplo'],
        rows: [
          ['sich fühlen', '—', 'Akk', 'sentirse', 'Ich fühle mich gut.'],
          ['sich freuen auf', 'auf', 'Akk', 'alegrarse (futuro)', 'Ich freue mich auf die Ferien.'],
          ['sich freuen über', 'über', 'Akk', 'alegrarse (presente/pasado)', 'Ich freue mich über das Geschenk.'],
          ['sich erinnern an', 'an', 'Akk', 'recordar', 'Ich erinnere mich an dich.'],
          ['sich interessieren für', 'für', 'Akk', 'interesarse por', 'Er interessiert sich für Musik.'],
          ['sich kümmern um', 'um', 'Akk', 'ocuparse de', 'Sie kümmert sich um die Kinder.'],
          ['sich bewerben um', 'um', 'Akk', 'postularse para', 'Ich bewerbe mich um die Stelle.'],
          ['sich ärgern über', 'über', 'Akk', 'enojarse por', 'Er ärgert sich über den Stau.'],
          ['sich gewöhnen an', 'an', 'Akk', 'acostumbrarse a', 'Ich gewöhne mich an das Klima.'],
          ['sich entscheiden für', 'für', 'Akk', 'decidirse por', 'Sie entscheidet sich für das rote Kleid.'],
          ['sich bedanken bei', 'bei', 'Dat', 'agradecer a', 'Ich bedanke mich bei dir.'],
          ['sich befinden', '—', 'Akk', 'encontrarse/estar', 'Das Hotel befindet sich im Zentrum.'],
          ['sich vorstellen', '—', 'Akk', 'presentarse/imaginarse', 'Ich stelle mich vor.'],
          ['sich setzen', '—', 'Akk', 'sentarse', 'Setz dich bitte.'],
          ['sich waschen', '—', 'Akk/Dat', 'lavarse', 'Ich wasche mich. / Ich wasche mir die Hände.'],
        ],
      },
    ],
  },

  // ─── 8. ORDEN EN ORACIONES SUBORDINADAS ──────────────────────────────────
  {
    id: 'word_order_nebensatz',
    title: 'Orden en oraciones subordinadas',
    subtitle: 'Nebensatz-Wortstellung',
    errorType: 'word_order',
    examples: [
      {
        id: 'ns_1',
        wrong: 'Ich glaube, dass er kommt nicht.',
        correct: 'Ich glaube, dass er nicht kommt.',
        explanation: 'En Nebensatz el verbo conjugado va AL FINAL. "nicht" va antes del verbo final.',
        rule: 'Nebensatz: Subjekt + … + Verb (final)',
        tip: 'Después de: dass, weil, obwohl, wenn, ob → el verbo va al final.',
      },
      {
        id: 'ns_2',
        wrong: 'Obwohl es regnet, er geht spazieren.',
        correct: 'Obwohl es regnet, geht er spazieren.',
        explanation: 'Después de un Nebensatz inicial, el verbo del Hauptsatz va antes del sujeto.',
        rule: '[NS], [Verb] [Subjekt]… — inversión V-S en el Hauptsatz',
        tip: 'Si la oración empieza con subordinada, el verbo del Hauptsatz va ANTES del sujeto.',
      },
      {
        id: 'ns_3',
        wrong: 'Ich weiß nicht, ob er hat das gemacht.',
        correct: 'Ich weiß nicht, ob er das gemacht hat.',
        explanation: 'En Nebensatz con Perfekt, el auxiliar va AL FINAL, después del participio.',
        rule: 'NS con Perfekt: … Partizip II + Auxiliar (final)',
        tip: 'Orden en NS con Perfekt: Subj + Obj + Partizip II + hat/ist',
      },
      {
        id: 'ns_4',
        wrong: 'Weil er muss arbeiten.',
        correct: 'Weil er arbeiten muss.',
        explanation: 'En Nebensatz con modal, el modal va AL FINAL. El infinitivo va antes del modal.',
        rule: 'NS con modal: … Infinitiv + Modal (final)',
        tip: 'En Nebensatz con modal: Infinitivo → Modal, siempre en ese orden al final.',
      },
    ],
  },

  // ─── 9. VERBOS MODALES ────────────────────────────────────────────────────
  {
    id: 'modal_verbs',
    title: 'Verbos modales',
    subtitle: 'Modalverben',
    errorType: 'conjugation',
    examples: [
      {
        id: 'modal_1',
        wrong: 'Ich muss zu gehen zum Arzt.',
        correct: 'Ich muss zum Arzt gehen.',
        explanation: 'Dos errores: (1) Modal + infinitivo sin "zu". (2) Infinitivo al final (Satzklammer).',
        rule: 'Modal(pos.2) + … + Infinitiv(final)',
        tip: 'La Satzklammer "encuadra" la oración: modal al inicio, infinitivo al final.',
      },
      {
        id: 'modal_2',
        wrong: 'Du sollst das nicht machen.',
        correct: 'Du solltest das nicht machen.',
        explanation: '"sollst" tiene connotación de mandato bíblico. Para consejo se usa "solltest" (Konjunktiv II).',
        rule: 'sollen Präsens = mandato. sollten (Konj. II) = consejo/recomendación',
        tip: 'Para dar consejos usá "solltest": "Du solltest mehr schlafen."',
      },
      {
        id: 'modal_3',
        wrong: 'Ich kann nicht kommen, weil ich muss arbeiten.',
        correct: 'Ich kann nicht kommen, weil ich arbeiten muss.',
        explanation: 'En Nebensatz con modal, el modal va al final: "arbeiten muss".',
        rule: 'NS: … Infinitiv + Modal (final): weil ich arbeiten muss',
        tip: 'La regla V-final del Nebensatz aplica también a los modales.',
      },
    ],
    referenceTables: [
      {
        title: 'Conjugación de los 6 verbos modales — Präsens',
        headers: ['Persona', 'können (poder)', 'müssen (deber/tener que)', 'dürfen (tener permiso)', 'wollen (querer)', 'sollen (deber según otro)', 'mögen / möchten (gustar/quisiera)'],
        rows: [
          ['ich', 'kann', 'muss', 'darf', 'will', 'soll', 'mag / möchte'],
          ['du', 'kannst', 'musst', 'darfst', 'willst', 'sollst', 'magst / möchtest'],
          ['er/sie/es', 'kann', 'muss', 'darf', 'will', 'soll', 'mag / möchte'],
          ['wir', 'können', 'müssen', 'dürfen', 'wollen', 'sollen', 'mögen / möchten'],
          ['ihr', 'könnt', 'müsst', 'dürft', 'wollt', 'sollt', 'mögt / möchtet'],
          ['sie/Sie', 'können', 'müssen', 'dürfen', 'wollen', 'sollen', 'mögen / möchten'],
        ],
        note: 'Los modales tienen Umlaut en singular (kann, muss, darf, will) que desaparece en plural. La 1ª y 3ª persona del singular son idénticas (sin -t final).',
      },
      {
        title: 'Usos y matices de cada modal',
        headers: ['Modal', 'Uso principal', 'Ejemplo', 'Konjunktiv II (cortesía/hipótesis)'],
        rows: [
          ['können', 'Capacidad / posibilidad', 'Ich kann Deutsch sprechen.', 'könnte — Könntest du mir helfen?'],
          ['müssen', 'Obligación interna / necesidad', 'Ich muss jetzt gehen.', 'müsste — Du müsstest das wissen.'],
          ['dürfen', 'Permiso / prohibición (no dürfen)', 'Hier darf man nicht rauchen.', 'dürfte — Das dürfte schwierig sein.'],
          ['wollen', 'Deseo / intención propia', 'Ich will Arzt werden.', 'wollte (Prät.) — Ich wollte dich fragen.'],
          ['sollen', 'Obligación externa / encargo', 'Du sollst um 8 Uhr da sein.', 'sollte — Du solltest mehr schlafen.'],
          ['mögen', 'Gusto (afirmación)', 'Ich mag Kaffee.', 'möchte — Ich möchte einen Kaffee bitte.'],
        ],
        note: '"möchten" es técnicamente el Konjunktiv II de "mögen" pero se usa como modal independiente para expresar deseos de forma educada. Es el modal más útil para principiantes.',
      },
    ],
  },

  // ─── 10. REGLA V2 y TeKaMoLo ──────────────────────────────────────────────
  {
    id: 'word_order_v2',
    title: 'Regla V2 y TeKaMoLo',
    subtitle: 'Hauptsatz-Wortstellung',
    errorType: 'word_order',
    examples: [
      {
        id: 'wo_1',
        wrong: 'Jeden Tag ich gehe in die Schule.',
        correct: 'Jeden Tag gehe ich in die Schule.',
        explanation: 'V2: el verbo conjugado SIEMPRE va en posición 2.',
        rule: 'V2-Regel: Pos.1 [cualquier cosa] | Pos.2 [Verb] | Pos.3+ [Subjekt…]',
        tip: 'Nunca puede haber dos elementos antes del verbo conjugado en Hauptsatz.',
      },
      {
        id: 'wo_2',
        wrong: 'Ich habe eine Konferenz besucht sehr interessante.',
        correct: 'Ich habe eine sehr interessante Konferenz besucht.',
        explanation: 'En alemán el adjetivo va ANTES del sustantivo, nunca después.',
        rule: 'Adj. siempre ANTES del sustantivo: eine interessante Konferenz',
        tip: '"una conferencia muy interesante" → "eine sehr interessante Konferenz".',
      },
      {
        id: 'wo_3',
        wrong: 'Er hat gegeben mir das Buch.',
        correct: 'Er hat mir das Buch gegeben.',
        explanation: 'Satzklammer: el participio va AL FINAL. Los objetos van entre el auxiliar y el participio.',
        rule: 'Satzklammer: hat [Obj.Dat.] [Obj.Akk.] gegeben',
        tip: 'Imaginá la oración como una grapa: "hat … gegeben" encuadra todo lo demás.',
      },
      {
        id: 'wo_4',
        wrong: 'Ich gehe morgen mit dem Bus schnell.',
        correct: 'Ich gehe morgen schnell mit dem Bus.',
        explanation: 'TeKaMoLo: Temporal → Kausal → Modal → Lokal.',
        rule: 'TeKaMoLo: Zeit → Grund → Art & Weise → Ort',
        tip: '"Ich fahre morgen (Te) wegen Arbeit (Ka) schnell (Mo) nach Berlin (Lo)."',
      },
    ],
  },

  // ─── 11. TIEMPOS VERBALES ────────────────────────────────────────────────
  {
    id: 'tense',
    title: 'Tiempos verbales',
    subtitle: 'Tempus: Präteritum / Perfekt / Futur',
    errorType: 'tense',
    examples: [
      {
        id: 'tense_1',
        wrong: 'Gestern ich habe gegessen.',
        correct: 'Gestern habe ich gegessen.',
        explanation: 'V2: después de "Gestern", el verbo va en pos.2 y el sujeto después.',
        rule: 'V2-Regel: [Adv.] [Verb] [Subjekt] …',
        tip: 'Si algo distinto al sujeto ocupa la posición 1, el verbo igual va en posición 2.',
      },
      {
        id: 'tense_2',
        wrong: 'Wenn ich Zeit haben werde, lerne ich.',
        correct: 'Wenn ich Zeit habe, lerne ich.',
        explanation: 'Las oraciones condicionales reales con "wenn" usan Präsens, no Futur.',
        rule: 'Wenn + Präsens → Präsens/Futur en Hauptsatz',
        tip: 'Reservá el Futur I para predicciones; en condiciones futuras posibles usá Präsens.',
      },
      {
        id: 'tense_3',
        wrong: 'Als ich klein war, ich spielte oft Fußball.',
        correct: 'Als ich klein war, spielte ich oft Fußball.',
        explanation: 'Después de un Nebensatz inicial, el Hauptsatz invierte V-S.',
        rule: 'NS, V-S en HS: … war, spielte ich',
        tip: '"Als" introduce Nebensatz en Präteritum; el HS que sigue invierte V-S.',
      },
      {
        id: 'tense_4',
        wrong: 'Ich bin in Berlin letzte Woche.',
        correct: 'Ich war letzte Woche in Berlin.',
        explanation: 'Para eventos pasados se usa Präteritum de "sein": "war".',
        rule: 'sein en pasado: ich war, du warst, er war',
        tip: '"sein" y "haben" se usan preferiblemente en Präteritum, no en Perfekt.',
      },
    ],
  },

  // ─── 12. GÉNERO GRAMATICAL ───────────────────────────────────────────────
  {
    id: 'gender',
    title: 'Género gramatical',
    subtitle: 'Grammatisches Genus',
    errorType: 'gender',
    examples: [
      {
        id: 'gen_1',
        wrong: 'Die Tisch ist groß.',
        correct: 'Der Tisch ist groß.',
        explanation: '"Tisch" es masculino (der Tisch). Usaste el artículo femenino "die" por interferencia del español.',
        rule: 'der Tisch | die Frau | das Kind — sin correlación confiable con el español',
        tip: 'Memorizá cada sustantivo CON su artículo: no "Tisch" sino "der Tisch".',
      },
      {
        id: 'gen_2',
        wrong: 'Ich kaufe eine neues Auto.',
        correct: 'Ich kaufe ein neues Auto.',
        explanation: '"Auto" es neutro (das Auto). El artículo indefinido neutro Nom/Akk es "ein".',
        rule: 'Nom: ein (mask./neut.) | eine (fem.)',
        tip: 'Palabras en -chen, -lein, -ment, -um → casi siempre neutro.',
      },
      {
        id: 'gen_3',
        wrong: 'Der Problem ist schwierig.',
        correct: 'Das Problem ist schwierig.',
        explanation: '"Problem" es neutro (das Problem), aunque en español sea masculino.',
        rule: 'Palabras en -lem, -em de origen griego → generalmente neutro',
        tip: 'das Problem, das Thema, das System, das Programm — todas neutras.',
      },
      {
        id: 'gen_4',
        wrong: 'Die Entscheidung war schwer, und er hat die bereut.',
        correct: 'Die Entscheidung war schwer, und er hat sie bereut.',
        explanation: '"Entscheidung" es femenino → el pronombre personal es "sie".',
        rule: 'Pronombre personal: er (mask.) | sie (fem.) | es (neut.)',
        tip: 'El pronombre personal concuerda en género con el sustantivo al que refiere.',
      },
    ],
    referenceTables: [
      {
        title: 'Reglas de género por terminación — Masculino (der)',
        headers: ['Terminación', 'Ejemplos', 'Excepciones notables'],
        rows: [
          ['-er (agente)', 'der Lehrer, der Fahrer, der Bäcker', 'das Messer, das Wasser, die Butter'],
          ['-ling', 'der Frühling, der Lehrling, der Schmetterling', '(muy pocas excepciones)'],
          ['-ig', 'der Honig, der König, der Käfig', '(pocas excepciones)'],
          ['-ismus', 'der Kapitalismus, der Tourismus', '(regla casi sin excepciones)'],
          ['-ist', 'der Tourist, der Journalist, der Artist', '(regla casi sin excepciones)'],
          ['-ant / -ent', 'der Student, der Assistent, der Elefant', 'das Talent, das Dokument'],
          ['Días, meses, estaciones', 'der Montag, der Januar, der Sommer', '(regla sin excepciones)'],
          ['Puntos cardinales', 'der Norden, der Süden, der Osten', '(regla sin excepciones)'],
          ['Bebidas alcohólicas', 'der Wein, der Sekt, der Whisky', 'das Bier (excepción importante)'],
        ],
      },
      {
        title: 'Reglas de género por terminación — Femenino (die)',
        headers: ['Terminación', 'Ejemplos', 'Excepciones notables'],
        rows: [
          ['-ung', 'die Zeitung, die Wohnung, die Meinung', '(regla casi sin excepciones)'],
          ['-heit / -keit', 'die Freiheit, die Möglichkeit, die Einheit', '(regla sin excepciones)'],
          ['-schaft', 'die Freundschaft, die Gesellschaft', '(regla sin excepciones)'],
          ['-tion / -sion', 'die Nation, die Situation, die Version', '(regla sin excepciones)'],
          ['-tät / -ität', 'die Qualität, die Universität', '(regla sin excepciones)'],
          ['-ie', 'die Energie, die Melodie, die Philosophie', 'das Knie (rodilla)'],
          ['-ik', 'die Musik, die Politik, die Technik', 'der Atlantik, der Pazifik'],
          ['-e (con raíz)', 'die Schule, die Straße, die Blume', 'der Name, das Ende, der Käse'],
          ['Sustantivos de verbos en -t', 'die Fahrt, die Schrift, die Kunst', 'der Dienst, der Frost'],
        ],
      },
      {
        title: 'Reglas de género por terminación — Neutro (das)',
        headers: ['Terminación', 'Ejemplos', 'Excepciones notables'],
        rows: [
          ['-chen / -lein (diminutivos)', 'das Mädchen, das Büchlein, das Häuschen', '(regla sin excepciones — siempre neutro)'],
          ['-ment', 'das Dokument, das Instrument, das Experiment', 'der Moment, der Zement'],
          ['-um', 'das Museum, das Zentrum, das Datum', 'der Reichtum, der Irrtum'],
          ['-tum', 'das Eigentum, das Wachstum', 'der Reichtum, der Irrtum'],
          ['-nis', 'das Ergebnis, das Zeugnis, das Verhältnis', 'die Kenntnis, die Erlaubnis'],
          ['Infinitivos sustantivados', 'das Essen, das Lernen, das Schreiben', '(regla sin excepciones)'],
          ['-ma (griego)', 'das Thema, das Programm, das System', '(regla casi sin excepciones)'],
          ['Metales y elementos', 'das Gold, das Silber, das Eisen', 'der Stahl, die Bronze'],
          ['Colores como sustantivos', 'das Blau, das Rot, das Grün', '(regla sin excepciones)'],
        ],
        note: 'Regla de oro: si una palabra tiene -chen o -lein, es SIEMPRE neutro, incluso si el ser vivo es femenino: das Mädchen (la chica), das Fräulein (la señorita).',
      },
    ],
  },

  // ─── 13. MAYÚSCULAS EN SUSTANTIVOS ────────────────────────────────────────
  {
    id: 'capitalization',
    title: 'Mayúscula en sustantivos',
    subtitle: 'Großschreibung der Nomen',
    errorType: 'spelling',
    examples: [
      {
        id: 'cap_1',
        wrong: 'Ich gehe in die schule.',
        correct: 'Ich gehe in die Schule.',
        explanation: 'En alemán TODOS los sustantivos se escriben con mayúscula, sin excepción.',
        rule: 'Todos los Nomen con mayúscula: Schule, Tisch, Liebe, Freiheit, Deutschland',
        tip: 'Si dudás si una palabra es sustantivo, preguntate: ¿puede tener artículo? → mayúscula.',
      },
      {
        id: 'cap_2',
        wrong: 'Das ist ein großes problem.',
        correct: 'Das ist ein großes Problem.',
        explanation: '"Problem" es sustantivo → mayúscula obligatoria, incluso en mitad de oración.',
        rule: 'La mayúscula no depende de la posición, sino de la categoría gramatical',
        tip: 'A diferencia del español, en alemán NO importa si la palabra está al inicio o en el medio.',
      },
      {
        id: 'cap_3',
        wrong: 'Ich liebe das lernen.',
        correct: 'Ich liebe das Lernen.',
        explanation: 'Los infinitivos sustantivados también llevan mayúscula.',
        rule: 'Infinitivo sustantivado = Nomen → mayúscula: das Lernen, das Schreiben',
        tip: 'Cuando un infinitivo funciona como sustantivo (con "das"), siempre va con mayúscula.',
      },
    ],
  },

  // ─── 14. ORACIONES DE RELATIVO ───────────────────────────────────────────
  {
    id: 'subordinate',
    title: 'Oraciones de relativo',
    subtitle: 'Relativsätze & Kausalsätze',
    errorType: 'word_order',
    examples: [
      {
        id: 'sub_1',
        wrong: 'Das ist der Mann, der ich gestern gesehen habe.',
        correct: 'Das ist der Mann, den ich gestern gesehen habe.',
        explanation: 'El pronombre relativo necesita el caso de su función en la oración: objeto directo → Akk → "den".',
        rule: 'Relativpronomen: Nom=der, Akk=den, Dat=dem, Gen=dessen',
        tip: '¿El relativo es sujeto? → der. ¿Objeto directo? → den.',
      },
      {
        id: 'sub_2',
        wrong: 'Ich verstehe nicht warum er handelt.',
        correct: 'Ich verstehe nicht, warum er so handelt.',
        explanation: 'Falta la coma antes de la oración subordinada introducida por "warum".',
        rule: 'Coma obligatoria antes de: dass, ob, warum, weil, wenn, obwohl…',
        tip: 'En alemán la coma ante subordinada es una regla ortográfica, no opcional.',
      },
      {
        id: 'sub_3',
        wrong: 'Die Frau, die ich habe gestern getroffen, ist sehr nett.',
        correct: 'Die Frau, die ich gestern getroffen habe, ist sehr nett.',
        explanation: 'En el Relativsatz, el auxiliar va al final, después del participio.',
        rule: 'NS Perfekt: … Partizip II + Auxiliar (final)',
        tip: 'Dentro de una oración de relativo las reglas del Nebensatz aplican igual.',
      },
    ],
  },

  // ─── 15. FUTURO ──────────────────────────────────────────────────────────
  {
    id: 'future',
    title: 'Futuro',
    subtitle: 'Futur I y II',
    errorType: 'conjugation',
    examples: [
      {
        id: 'fut_1',
        wrong: 'Morgen ich werde gehe in die Stadt.',
        correct: 'Morgen werde ich in die Stadt gehen.',
        explanation: 'Dos errores: V2 (werde en pos.2) y la forma del infinitivo "gehen", no "gehe".',
        rule: 'Futur I: werden(pos.2) + … + Infinitiv(final)',
        tip: '"werden" conjugado en pos.2, infinitivo al final. Igual que con modales.',
      },
      {
        id: 'fut_2',
        wrong: 'Ich werde meinen Bruder besuchen werden.',
        correct: 'Ich werde meinen Bruder besuchen.',
        explanation: '"werden" aparece solo una vez. El doble "werden" es incorrecto.',
        rule: 'Futur I = 1× werden + Infinitiv',
        tip: 'Si ya pusiste "werde/wirst/wird…", no pongas otro "werden" al final.',
      },
    ],
  },
]
