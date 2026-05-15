export interface CommonErrorExample {
  id: string
  wrong: string
  correct: string
  explanation: string
  rule: string
  tip: string
}

export interface CommonErrorCategory {
  id: string
  title: string
  subtitle: string
  errorType: string
  examples: CommonErrorExample[]
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
        explanation: '"interessiert an" rige Dativo: "an die" → "an der" (fem. Dat.). Además, el adjetivo predicativo va al final con el verbo.',
        rule: 'AN + Dativo cuando es fijo (interessiert an, schuld an)',
        tip: 'Distinguí las preposiciones de dos valencias (an, in, auf…): destino → Akk, ubicación → Dat.',
      },
      {
        id: 'prep_4',
        wrong: 'Ich denke an mein Zukunft.',
        correct: 'Ich denke an meine Zukunft.',
        explanation: '"Zukunft" es femenino (die Zukunft). "an" + Akk → "meine" (fem. Akk = nominativo fem.).',
        rule: 'denken an + Akk: mein → meine (fem.)',
        tip: 'Verbos con preposición fija: "denken an" (Akk), "träumen von" (Dat), "warten auf" (Akk).',
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
        explanation: '"hängen" sin objeto directo = estado (Wo?). La preposición "an" + Dat para ubicación: "an der" (fem.).',
        rule: 'hängen (estado, sin Obj.) → Wo? → Dat: an der Wand',
        tip: 'hängen/liegen/stehen/sitzen = estado → Dat. hängen/legen/stellen/setzen = acción → Akk.',
      },
      {
        id: 'wp_4',
        wrong: 'Ich wohne in die Stadtmitte.',
        correct: 'Ich wohne in der Stadtmitte.',
        explanation: '"wohnen" indica ubicación estática (Wo?). "in" + Dat para ubicación: "in der" (fem.).',
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
        explanation: 'El Futur I usa un solo "werden" conjugado + infinitivo al final. El doble "werden" es un error típico.',
        rule: 'Futur I: werden (conjugado) + Infinitiv',
        tip: 'En alemán hablado el Futur I se expresa frecuentemente con Präsens + adverbio temporal.',
      },
      {
        id: 'conj_4',
        wrong: 'Er gebt mir das Buch.',
        correct: 'Er gibt mir das Buch.',
        explanation: '"geben" tiene cambio vocálico e→i en 2ª y 3ª persona singular: du gibst, er gibt.',
        rule: 'Verbos fuertes con vokalwechsel: geben → gibt, sehen → sieht, fahren → fährt',
        tip: 'Memorizá los verbos de cambio vocálico más frecuentes: geben, sehen, lesen, fahren, laufen, essen.',
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
        explanation: '"waschen" es transitivo (tiene objeto directo "das Auto") → usa "haben" en Perfekt.',
        rule: 'Verbos transitivos (con objeto directo) → haben',
        tip: 'Si el verbo tiene objeto directo (Akkusativobjekt) → siempre haben.',
      },
      {
        id: 'sh_3',
        wrong: 'Sie hat eingeschlafen.',
        correct: 'Sie ist eingeschlafen.',
        explanation: '"einschlafen" es un cambio de estado (dormirse) → usa "sein" en Perfekt.',
        rule: 'Cambio de estado: aufwachen, einschlafen, sterben, werden → sein',
        tip: 'Verbos de cambio de estado (algo le "pasa" al sujeto sin que lo dirija) → sein.',
      },
      {
        id: 'sh_4',
        wrong: 'Ich habe gestern geblieben.',
        correct: 'Ich bin gestern geblieben.',
        explanation: '"bleiben" (quedarse, permanecer) usa "sein" aunque no haya movimiento.',
        rule: 'Excepciones con sein sin movimiento: bleiben, sein, werden, passieren, geschehen',
        tip: 'Hay excepciones: "bleiben", "sein" y "werden" usan sein aunque no haya movimiento ni cambio.',
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
        explanation: '"anrufen" es separable: el prefijo "an" va al final de la oración en Hauptsatz.',
        rule: 'Prefijo separable → va al final: ich rufe … an',
        tip: 'Prefijos siempre separables: an-, auf-, aus-, bei-, ein-, mit-, nach-, vor-, zu-, ab-, los-.',
      },
      {
        id: 'sep_2',
        wrong: 'Er aufsteht um 7 Uhr.',
        correct: 'Er steht um 7 Uhr auf.',
        explanation: '"aufstehen" es separable. En Hauptsatz el verbo conjugado "steht" va en pos.2 y el prefijo "auf" al final.',
        rule: 'aufstehen → er steht … auf (el prefijo siempre al final)',
        tip: 'En Nebensatz, el verbo separable va JUNTO al final: "weil er früh aufsteht" (no separado).',
      },
      {
        id: 'sep_3',
        wrong: 'Weil er aufsteht früh.',
        correct: 'Weil er früh aufsteht.',
        explanation: 'En Nebensatz el verbo separable NO se separa: "aufsteht" va entero al final.',
        rule: 'NS: Subj + … + [Verb completo al final] → weil er früh aufsteht',
        tip: 'La separación solo ocurre en Hauptsatz. En Nebensatz el verbo va unido al final.',
      },
      {
        id: 'sep_4',
        wrong: 'Ich habe angeruft.',
        correct: 'Ich habe angerufen.',
        explanation: 'El Partizip II de verbos separables se forma con: prefijo + ge + Stamm: an+ge+rufen = angerufen.',
        rule: 'Partizip II separables: Präfix + ge + Stamm: angerufen, aufgestanden, eingekauft',
        tip: 'No "angeruft" sino "angerufen". El "ge-" va entre el prefijo y el Stamm.',
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
        explanation: '"sich fühlen" es reflexivo en alemán. El pronombre reflexivo "mich" (Akk, 1ª sg.) es obligatorio.',
        rule: 'sich fühlen: ich fühle mich | du fühlst dich | er/sie fühlt sich',
        tip: 'Verbos reflexivos frecuentes: sich fühlen, sich freuen, sich erinnern, sich befinden, sich entscheiden.',
      },
      {
        id: 'ref_2',
        wrong: 'Er interessiert an Sport.',
        correct: 'Er interessiert sich für Sport.',
        explanation: '"sich interessieren für" es reflexivo y lleva preposición "für" + Akk.',
        rule: 'sich interessieren für + Akk: ich interessiere mich für Musik',
        tip: 'El reflexivo alemán no siempre coincide con el español: "recordar" ≠ "sich erinnern an".',
      },
      {
        id: 'ref_3',
        wrong: 'Ich erinnere die Ferien.',
        correct: 'Ich erinnere mich an die Ferien.',
        explanation: '"sich erinnern an" es reflexivo y lleva "an + Akk". No se omite ni el pronombre ni la preposición.',
        rule: 'sich erinnern an + Akk: ich erinnere mich an die Ferien',
        tip: '"Erinnern" sin reflexivo significa "recordarle algo a alguien": "Ich erinnere dich an die Ferien."',
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
        explanation: 'Después de un Nebensatz inicial, el verbo del Hauptsatz ocupa la posición 1 (inversión V-S).',
        rule: '[NS], [Verb] [Subjekt]… — el verbo del HS va antes del sujeto',
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
        explanation: '"sollst" (presente) tiene connotación de mandato bíblico. Para consejo/sugerencia se usa "solltest" (Konjunktiv II).',
        rule: 'sollen Präsens = mandato fuerte. sollten (Konj. II) = consejo/recomendación',
        tip: 'Para dar consejos usá "solltest": "Du solltest mehr schlafen." No "sollst".',
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
        explanation: 'V2: el verbo conjugado SIEMPRE va en posición 2, sin importar qué elemento inicia la oración.',
        rule: 'V2-Regel: Pos.1 [cualquier cosa] | Pos.2 [Verb] | Pos.3+ [Subjekt…]',
        tip: 'Nunca puede haber dos elementos antes del verbo conjugado en Hauptsatz.',
      },
      {
        id: 'wo_2',
        wrong: 'Ich habe eine Konferenz besucht sehr interessante.',
        correct: 'Ich habe eine sehr interessante Konferenz besucht.',
        explanation: 'En alemán el adjetivo va ANTES del sustantivo, nunca después.',
        rule: 'Adj. siempre ANTES del sustantivo: eine interessante Konferenz',
        tip: '"una conferencia muy interesante" → "eine sehr interessante Konferenz" en alemán.',
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
        explanation: 'TeKaMoLo: Temporal → Kausal → Modal → Lokal. El modo ("schnell") va antes del lugar ("mit dem Bus").',
        rule: 'TeKaMoLo: Zeit → Grund → Art & Weise → Ort',
        tip: 'Memorizá: Te-Ka-Mo-Lo. "Ich fahre morgen (Te) wegen Arbeit (Ka) schnell (Mo) nach Berlin (Lo)."',
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
        explanation: 'V2: después de "Gestern" (adverbio temporal), el verbo conjugado ocupa la posición 2, y el sujeto va después.',
        rule: 'V2-Regel: [Adv.] [Verb] [Subjekt] …',
        tip: 'Si algo distinto al sujeto ocupa la posición 1, el verbo igual va en posición 2.',
      },
      {
        id: 'tense_2',
        wrong: 'Wenn ich Zeit haben werde, lerne ich.',
        correct: 'Wenn ich Zeit habe, lerne ich.',
        explanation: 'Las oraciones condicionales reales con "wenn" usan Präsens en la prótasis, no Futur.',
        rule: 'Wenn + Präsens → Präsens/Futur en Hauptsatz',
        tip: 'Reservá el Futur I para predicciones; en condiciones futuras posibles usá Präsens.',
      },
      {
        id: 'tense_3',
        wrong: 'Als ich klein war, ich spielte oft Fußball.',
        correct: 'Als ich klein war, spielte ich oft Fußball.',
        explanation: 'Después de un Nebensatz inicial, el Hauptsatz invierte V-S (verbo antes del sujeto).',
        rule: 'NS, V-S en HS: … war, spielte ich',
        tip: '"Als" introduce Nebensatz en Präteritum; el HS que sigue invierte V-S.',
      },
      {
        id: 'tense_4',
        wrong: 'Ich bin in Berlin letzte Woche.',
        correct: 'Ich war letzte Woche in Berlin.',
        explanation: 'Para eventos pasados se usa Präteritum de "sein": "war". El Präsens "bin" indica estado actual.',
        rule: 'sein en pasado: ich war, du warst, er war (Präteritum, no Perfekt)',
        tip: '"sein" y "haben" se usan en Präteritum en el habla cotidiana, no en Perfekt.',
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
        explanation: '"Tisch" es masculino (der Tisch). Usaste el artículo femenino "die" por influencia del español ("la mesa").',
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
        tip: 'Palabras griegas en -ma/-em → neutras: das Problem, das Thema, das System.',
      },
      {
        id: 'gen_4',
        wrong: 'Die Entscheidung war schwer, und er hat die bereut.',
        correct: 'Die Entscheidung war schwer, und er hat sie bereut.',
        explanation: '"Entscheidung" es femenino → el pronombre de reemplazo es "sie" (no "die", que es artículo/demostrativo).',
        rule: 'Pronombre personal: er (mask.) | sie (fem.) | es (neut.)',
        tip: 'El pronombre personal concuerda en género con el sustantivo al que refiere.',
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
        rule: 'La mayúscula no depende de la posición en la oración, sino de la categoría gramatical',
        tip: 'A diferencia del español, en alemán NO importa si la palabra está al inicio o en el medio.',
      },
      {
        id: 'cap_3',
        wrong: 'Ich liebe das lernen.',
        correct: 'Ich liebe das Lernen.',
        explanation: 'Los infinitivos sustantivados también llevan mayúscula: "das Lernen", "das Essen", "das Schreiben".',
        rule: 'Infinitivo sustantivado = Nomen → mayúscula: das Lernen, das Schreiben',
        tip: 'Cuando un infinitivo funciona como sustantivo (con "das"), siempre va con mayúscula.',
      },
    ],
  },

  // ─── 14. ORACIONES SUBORDINADAS (Relativsätze) ───────────────────────────
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
        explanation: 'El pronombre relativo necesita el caso de su función en la oración: "ich gesehen habe" → Akk → "den".',
        rule: 'Relativpronomen: Nom=der, Akk=den, Dat=dem, Gen=dessen',
        tip: 'Identificá la función del relativo en SU oración: ¿sujeto? → der. ¿objeto directo? → den.',
      },
      {
        id: 'sub_2',
        wrong: 'Ich verstehe nicht warum er handelt.',
        correct: 'Ich verstehe nicht, warum er so handelt.',
        explanation: 'Falta la coma antes de la oración subordinada introducida por "warum".',
        rule: 'Coma obligatoria antes de: dass, ob, warum, weil, wenn, obwohl…',
        tip: 'En alemán la coma ante subordinada no es opcional: es una regla ortográfica.',
      },
      {
        id: 'sub_3',
        wrong: 'Die Frau, die ich habe gestern getroffen, ist sehr nett.',
        correct: 'Die Frau, die ich gestern getroffen habe, ist sehr nett.',
        explanation: 'En el Relativsatz (Nebensatz), el auxiliar "habe" va al final, después del participio.',
        rule: 'NS Perfekt: … Partizip II + Auxiliar (final)',
        tip: 'Dentro de una oración de relativo, las reglas del Nebensatz aplican igual: verbo al final.',
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
        explanation: 'Dos errores: V2 (werde debe ser pos.2) y la forma del infinitivo "gehen", no "gehe".',
        rule: 'Futur I: werden(pos.2) + … + Infinitiv(final)',
        tip: 'En Futur I: "werden" conjugado en pos.2, infinitivo al final. Igual que con modales.',
      },
      {
        id: 'fut_2',
        wrong: 'Ich werde meinen Bruder besuchen werden.',
        correct: 'Ich werde meinen Bruder besuchen.',
        explanation: '"werden" aparece solo una vez como auxiliar del Futur. El doble "werden" es incorrecto.',
        rule: 'Futur I = 1× werden + Infinitiv',
        tip: 'Si ya pusiste "werde/wirst/wird…", no pongas otro "werden" al final.',
      },
    ],
  },
]
