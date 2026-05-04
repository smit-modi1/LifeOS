import { useState } from 'react'
import type { ReactNode } from 'react'

export const ShellCard = ({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'soft'
}) => <section className={`shell-card shell-card--${tone}`}>{children}</section>

export const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) => (
  <header className="section-header">
    <p className="section-header__eyebrow">LifeOS</p>
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </header>
)

export const Tabs = <T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: T; label: string }>
  active: T
  onChange: (id: T) => void
}) => (
  <div className="tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={tab.id === active ? 'tabs__button tabs__button--active' : 'tabs__button'}
        onClick={() => onChange(tab.id)}
        type="button"
      >
        {tab.label}
      </button>
    ))}
  </div>
)

export const AddRow = ({
  placeholder,
  onAdd,
}: {
  placeholder: string
  onAdd: (value: string) => void
}) => {
  const [value, setValue] = useState('')

  const submit = () => {
    const next = value.trim()

    if (!next) {
      return
    }

    onAdd(next)
    setValue('')
  }

  return (
    <form className="add-row" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
      />
      <button className="button button--primary" type="submit" onPointerDown={(e) => { e.preventDefault(); submit(); }}>
        Add
      </button>
    </form>
  )
}

export const Field = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="field" />
)

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className="field field--textarea" />
)

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className="field" />
)

export const EmptyState = ({ text }: { text: string }) => (
  <div className="empty-state">{text}</div>
)

export const StatGrid = ({
  children,
}: {
  children: ReactNode
}) => <div className="stat-grid">{children}</div>

export const StatCard = ({
  title,
  value,
  subtitle,
  onClick,
}: {
  title: string
  value: string | number
  subtitle: string
  onClick?: () => void
}) => (
  <button className="stat-card" onClick={onClick} type="button">
    <div className="stat-card__value">{value}</div>
    <div className="stat-card__title">{title}</div>
    <div className="stat-card__subtitle">{subtitle}</div>
  </button>
)

export const ProgressBar = ({ value }: { value: number }) => (
  <div className="progress">
    <div className="progress__track">
      <div className="progress__fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
    <span>{Math.round(value)}%</span>
  </div>
)
