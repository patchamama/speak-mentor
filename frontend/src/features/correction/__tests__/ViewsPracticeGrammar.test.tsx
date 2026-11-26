import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ErrorPanel } from '../components/ErrorPanel'
import { PracticeLinks } from '../components/PracticeLinks'
import { clearGrammarCache } from '../grammar/useGrammarExplanation'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { useCorrectionViewStore } from '@/stores/correctionViewStore'

const chat = vi.fn()
vi.mock('@/shared/llm/hooks', () => ({
  useActiveLLMProvider: () => ({ provider: { chat }, locked: null, config: { model: 'm' } }),
}))

const base = { severity: 'major' as const, explanation: 'x' }
const errors = [
  { ...base, original: 'ein Mann', correction: 'einen Mann', type: 'case' },
  { ...base, original: 'das Man', correction: 'der Mann', type: 'case' },
  { ...base, original: 'Shule', correction: 'Schule', type: 'spelling' },
]
const explanation = {
  title: 'El acusativo',
  summary: 'El objeto directo va en acusativo.',
  rules: ['sehen rige acusativo'],
  tables: [{ title: 'Artículos', headers: ['Caso', 'Mask.'], rows: [['Akk', 'einen']] }],
  examples: [{ wrong: 'Ich sehe ein Hund.', correct: 'Ich sehe einen Hund.', why: 'objeto directo' }],
  spanish_comparison: 'En español no cambia el artículo.',
  tips: ['Pregunta ¿a quién?'],
}

const renderPanel = (layout: 'cards' | 'detailed' = 'cards') =>
  render(<ErrorPanel errors={errors} activeIdx={null} onSelect={vi.fn()} layout={layout} level="B1" />)

beforeEach(() => {
  localStorage.clear()
  clearGrammarCache()
  chat.mockReset().mockResolvedValue(JSON.stringify(explanation))
})
afterEach(cleanup)

describe('error views', () => {
  it('uses a full-width grid for cards and a list for the detailed view', () => {
    renderPanel('cards')
    expect(screen.getByTestId('error-list').className).toContain('auto-fill')
    cleanup()
    renderPanel('detailed')
    expect(screen.getByTestId('error-list').className).not.toContain('auto-fill')
  })

  it('defaults to cards and remembers the choice', () => {
    expect(useCorrectionViewStore.getState().view).toBe('cards')
    useCorrectionViewStore.getState().setView('detailed')
    expect(localStorage.getItem('speak-mentor-correction-view')).toContain('detailed')
  })
})

describe('practice links', () => {
  it('offers one practice per detected problem, with only its errors', () => {
    const onPractice = vi.fn()
    render(<PracticeLinks errors={errors} onPractice={onPractice} busy={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Caso \(2\)/ }))
    expect(onPractice.mock.calls[0][0].map((e: { type: string }) => e.type)).toEqual(['case', 'case'])
    fireEvent.click(screen.getByRole('button', { name: /Todos los problemas/ }))
    expect(onPractice.mock.calls[1][0]).toHaveLength(3)
  })

  it('is disabled while generating and hidden without errors', () => {
    const { rerender, container } = render(<PracticeLinks errors={errors} onPractice={vi.fn()} busy />)
    expect(screen.getByRole('button', { name: /Caso \(2\)/ })).toHaveProperty('disabled', true)
    rerender(<PracticeLinks errors={[]} onPractice={vi.fn()} busy={false} />)
    expect(container.textContent).toBe('')
  })
})

describe('grammar explanation', () => {
  const open = () => fireEvent.click(screen.getAllByRole('button', { name: 'Explicar gramática' })[0])

  it('is offered for grammar problems only', () => {
    renderPanel()
    expect(screen.getAllByRole('button', { name: 'Explicar gramática' })).toHaveLength(2)
  })

  it('shows the explanation, its tables and the curated reference tables', async () => {
    renderPanel()
    open()
    expect(await screen.findByText('El objeto directo va en acusativo.')).toBeDefined()
    expect(screen.getByText('Artículos')).toBeDefined()
    expect(screen.getByText('Ich sehe einen Hund.')).toBeDefined()
    expect(screen.getByText('En español no cambia el artículo.')).toBeDefined()
    expect(screen.getByText('Artículo definido (der / die / das)')).toBeDefined()
    expect(screen.getByText(/generada por IA/)).toBeDefined()
  })

  it('asks the model only once per problem', async () => {
    renderPanel()
    open()
    await screen.findByText('El objeto directo va en acusativo.')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    open()
    await screen.findByText('El objeto directo va en acusativo.')
    expect(chat).toHaveBeenCalledTimes(1)
  })

  it('keeps the reference tables and allows retrying when the model fails', async () => {
    chat.mockResolvedValueOnce('not json')
    renderPanel()
    open()
    const retry = await screen.findByRole('button', { name: 'Reintentar' })
    expect(screen.getByText('Artículo definido (der / die / das)')).toBeDefined()
    fireEvent.click(retry)
    await waitFor(() => expect(screen.getByText('El objeto directo va en acusativo.')).toBeDefined())
  })

  it('asks for an explanation aimed at Spanish speakers', () => {
    const prompt = buildPrompt({ mode: 'grammarExplanation', error: errors[0], level: 'A2', explanationLang: 'de' })
    expect(prompt.system).toContain('native Spanish speaker')
    expect(prompt.system).toContain('German')
    expect(prompt.user).toContain('einen Mann')
  })
})
