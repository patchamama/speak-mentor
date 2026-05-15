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
    ],
  },
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
        explanation: '"mit" requiere Dativo y el artículo: "mit dem Zug". Además, la posición (TeKaMoLo) va antes del lugar.',
        rule: 'mit + Dativo (artículo obligatorio)',
        tip: 'En alemán el artículo casi nunca se omite después de preposición.',
      },
      {
        id: 'prep_3',
        wrong: 'Er ist interessiert an die Technologie.',
        correct: 'Er ist an der Technologie interessiert.',
        explanation: '"interessiert an" rige Dativo: "an die" → "an der" (fem. Dat.). Además, el adjetivo va al final.',
        rule: 'AN + Dativo cuando es fijo (interessiert an, schuld an)',
        tip: 'Distinguí las preposiciones de dos valencias (an, in, auf…): el destino usa Akk, la ubicación usa Dat.',
      },
    ],
  },
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
        tip: 'Conjugá mentalmente antes de escribir: ¿quién hace la acción? → elige la forma correcta.',
      },
      {
        id: 'conj_2',
        wrong: 'Ich muss zu gehen.',
        correct: 'Ich muss gehen.',
        explanation: 'Los verbos modales (müssen, können, dürfen, wollen, sollen, mögen) se combinan con infinitivo SIN "zu".',
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
    ],
  },
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
        explanation: 'En Nebensatz (oración subordinada), el verbo conjugado va AL FINAL. "nicht" va antes del verbo final.',
        rule: 'Nebensatz: Subjekt + … + Verb (final)',
        tip: 'Después de: dass, weil, obwohl, wenn, ob → el verbo va al final.',
      },
      {
        id: 'ns_2',
        wrong: 'Obwohl es regnet, er geht spazieren.',
        correct: 'Obwohl es regnet, geht er spazieren.',
        explanation: 'Después de un Nebensatz que precede al Hauptsatz, el verbo del HS ocupa la posición 1 (inversión).',
        rule: 'NS, V1-HS S... → [Nebensatz], [Verb] [Subjekt]…',
        tip: 'Si la oración empieza con subordinada, el verbo del Hauptsatz va ANTES del sujeto.',
      },
      {
        id: 'ns_3',
        wrong: 'Ich weiß nicht, ob er hat das gemacht.',
        correct: 'Ich weiß nicht, ob er das gemacht hat.',
        explanation: 'En Nebensatz con verbo auxiliar (hat gemacht), el auxiliar va AL FINAL, después del participio.',
        rule: 'NS con Perfekt: … Partizip + Auxiliar (final)',
        tip: 'Orden en NS con Perfekt: Subjekt + Obj + Partizip II + hat/ist',
      },
    ],
  },
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
        wrong: 'Weil er muss arbeiten.',
        correct: 'Weil er arbeiten muss.',
        explanation: 'En Nebensatz, el modal va al final. El infinitivo va ANTES del modal en posición final.',
        rule: 'NS: … Infinitiv + Modal (final)',
        tip: 'En Nebensatz con modal: Infinitivo → Modal, siempre en ese orden al final.',
      },
    ],
  },
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
        explanation: 'Las oraciones condicionales reales con "wenn" usan Präsens en la prótasis (si-cláusula), no Futur.',
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
    ],
  },
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
        explanation: 'Dos errores: V2 (werde debe ser posición 2) y la forma del infinitivo "gehen", no "gehe".',
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
  {
    id: 'subordinate',
    title: 'Oraciones subordinadas',
    subtitle: 'Relativsätze & Kausalsätze',
    errorType: 'word_order',
    examples: [
      {
        id: 'sub_1',
        wrong: 'Das ist der Mann, der ich gestern gesehen habe.',
        correct: 'Das ist der Mann, den ich gestern gesehen habe.',
        explanation: 'El pronombre relativo necesita el caso que le corresponde en la oración: "ich gesehen habe" → Akk → "den".',
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
    ],
  },
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
        rule: 'V2-Regel: Pos.1 [cualquier cosa] | Pos.2 [Verb] | Pos.3+ [Subjekt, Obj…]',
        tip: 'Nunca puede haber dos elementos antes del verbo conjugado en Hauptsatz.',
      },
      {
        id: 'wo_2',
        wrong: 'Ich habe eine Konferenz besucht sehr interessante.',
        correct: 'Ich habe eine sehr interessante Konferenz besucht.',
        explanation: 'En alemán el adjetivo va ANTES del sustantivo, nunca después (a diferencia del español).',
        rule: 'Adj. siempre ANTES del sustantivo: eine interessante Konferenz',
        tip: 'El español "una conferencia muy interesante" → "eine sehr interessante Konferenz" en alemán.',
      },
      {
        id: 'wo_3',
        wrong: 'Er hat gegeben mir das Buch.',
        correct: 'Er hat mir das Buch gegeben.',
        explanation: 'Satzklammer: el participio (o infinitivo) va AL FINAL. Los objetos van entre el auxiliar y el participio.',
        rule: 'Satzklammer: hat [Obj. Dat.] [Obj. Akk.] gegeben',
        tip: 'Imaginá la oración como una "grapa": hat … gegeben encuadra todo el resto.',
      },
    ],
  },
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
        rule: 'der Tisch | die Frau | das Kind — no hay correlación confiable con el español',
        tip: 'Memorizá cada sustantivo CON su artículo: no "Tisch" sino "der Tisch".',
      },
      {
        id: 'gen_2',
        wrong: 'Ich kaufe eine neues Auto.',
        correct: 'Ich kaufe ein neues Auto.',
        explanation: '"Auto" es neutro (das Auto). El artículo indefinido neutro nominativo es "ein", no "eine".',
        rule: 'Nom.: ein (mask./neut.) | eine (fem.) | — (Pl.)',
        tip: 'Palabras terminadas en -chen, -lein, -ment, -um → casi siempre neutro.',
      },
      {
        id: 'gen_3',
        wrong: 'Der Problem ist schwierig.',
        correct: 'Das Problem ist schwierig.',
        explanation: '"Problem" es neutro (das Problem), aunque en español sea masculino ("el problema").',
        rule: 'Palabras en -lem, -em de origen griego → generalmente neutro',
        tip: 'Palabras de origen griego terminadas en -ma/-em suelen ser neutras: das Problem, das Thema, das System.',
      },
    ],
  },
]
