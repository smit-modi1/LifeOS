import { act } from 'react'
import type { ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  NotesSection,
  WishesSection,
  WorkSection,
} from './sections'
import { AddRow } from '../components/ui'
import { createEmptyLifeOsData, createRecord } from '../lib/lifeos'
import type { LifeOsData } from '../types/lifeos'

const render = (element: ReactElement) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let root: Root

  act(() => {
    root = createRoot(container)
    root.render(element)
  })

  return {
    container,
    cleanup: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

const setValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const click = (element: HTMLElement) => {
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

test('AddRow submits only once per button click', () => {
  const added: string[] = []
  const { container, cleanup } = render(<AddRow placeholder="Add item" onAdd={(value) => added.push(value)} />)

  const input = container.querySelector('input')!
  const button = container.querySelector('button')!

  act(() => {
    setValue(input, 'Launch plan')
  })
  act(() => {
    click(button)
  })

  expect(added).toEqual(['Launch plan'])
  cleanup()
})

test('adds a project when Work add row submits', () => {
  const data = createEmptyLifeOsData().work
  let nextData: LifeOsData['work'] | undefined
  const { container, cleanup } = render(<WorkSection data={data} onChange={(value) => { nextData = value }} />)

  const input = container.querySelector('input')!
  const button = container.querySelector('button')!

  act(() => {
    setValue(input, 'Family dashboard')
  })
  act(() => {
    click(button)
  })

  const result = nextData as LifeOsData['work']
  expect(result.projects).toHaveLength(1)
  expect(result.projects[0].name).toBe('Family dashboard')
  cleanup()
})

test('creates a new note when New note is clicked', () => {
  const data = createEmptyLifeOsData().notes
  let nextData: LifeOsData['notes'] | undefined
  const { container, cleanup } = render(<NotesSection data={data} onChange={(value) => { nextData = value }} />)

  const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent === 'New note')!

  act(() => {
    click(button)
  })

  const result = nextData as LifeOsData['notes']
  expect(result.items).toHaveLength(1)
  expect(result.items[0].title).toBe('Untitled note')
  cleanup()
})

test('marks a wish done when Mark done is clicked', () => {
  const wish = createRecord({ name: 'Plan family trip', done: false, addedOn: '2026-05-05', doneDate: null })
  const data: LifeOsData['wishes'] = { items: [wish] }
  let nextData: LifeOsData['wishes'] | undefined
  const { container, cleanup } = render(<WishesSection data={data} onChange={(value) => { nextData = value }} />)

  const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent === 'Mark done')!

  act(() => {
    click(button)
  })

  const result = nextData as LifeOsData['wishes']
  expect(result.items[0].done).toBe(true)
  expect(result.items[0].doneDate).toBe('2026-05-05')
  cleanup()
})
