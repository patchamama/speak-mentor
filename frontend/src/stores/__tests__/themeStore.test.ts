import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useThemeStore } from '../themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ dark: false })
    document.documentElement.classList.remove('dark')
  })

  it('starts with dark: false', () => {
    expect(useThemeStore.getState().dark).toBe(false)
  })

  it('toggle sets dark: true and adds .dark class', () => {
    act(() => useThemeStore.getState().toggle())
    expect(useThemeStore.getState().dark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggle twice returns to light', () => {
    act(() => useThemeStore.getState().toggle())
    act(() => useThemeStore.getState().toggle())
    expect(useThemeStore.getState().dark).toBe(false)
  })
})
