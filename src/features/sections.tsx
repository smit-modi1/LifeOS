import { useState } from 'react'
import type { HabitCadence, LifeOsData, ReadingCategory, SkillBucket } from '../types/lifeos'
import {
  READING_CATEGORIES,
  calculateDashboardStats,
  createRecord,
  formatCurrency,
  habitTabs,
  removeArrayItem,
  setArrayItem,
  skillTabs,
  todayKey,
  toggleHabitDate,
} from '../lib/lifeos'
import {
  AddRow,
  EmptyState,
  Field,
  ProgressBar,
  SectionHeader,
  Select,
  ShellCard,
  StatCard,
  StatGrid,
  Tabs,
  TextArea,
} from '../components/ui'

const removeTextEntry = (items: string[], value: string) => items.filter((item) => item !== value)

export const DashboardSection = ({
  data,
  goTo,
}: {
  data: LifeOsData
  goTo: (section: keyof LifeOsData | 'dashboard') => void
}) => {
  const stats = calculateDashboardStats(data)

  return (
    <div className="stack">
      <SectionHeader
        title="Your command centre"
        subtitle="Peel back your potential with LifeOS."
      />
      <StatGrid>
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.label}
            value={stat.value}
            subtitle={stat.sublabel}
            onClick={() => goTo(stat.id)}
          />
        ))}
      </StatGrid>
      <div className="split-grid">
        <ShellCard tone="soft">
          <h3>Resume snapshot</h3>
          <p className="muted">
            {data.profile.fullName || 'Add your name'}
            {' · '}
            {data.profile.headline || 'Add your headline'}
          </p>
          <p className="muted">
            {data.profile.experience.length} experience entries · {data.profile.education.length} education entries
          </p>
        </ShellCard>
        <ShellCard tone="soft">
          <h3>Quick focus</h3>
          <p className="muted">
            {data.learning.current.length} active courses · {data.reading.current.length} books in progress ·{' '}
            {data.notes.items.length} saved notes
          </p>
        </ShellCard>
      </div>
    </div>
  )
}

export const ProfileSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['profile']
  onChange: (value: LifeOsData['profile']) => void
}) => {
  const update = <K extends keyof LifeOsData['profile']>(key: K, value: LifeOsData['profile'][K]) =>
    onChange({ ...data, [key]: value })

  const addExperience = () =>
    update('experience', [
      ...data.experience,
      createRecord({
        role: '',
        company: '',
        period: '',
        summary: '',
      }),
    ])

  const addEducation = () =>
    update('education', [
      ...data.education,
      createRecord({
        institution: '',
        degree: '',
        period: '',
        notes: '',
      }),
    ])

  return (
    <div className="stack">
      <SectionHeader
        title="Profile and resume"
        subtitle="Keep the mobile version of your professional story ready to update, review, and share."
      />
      <ShellCard>
        <div className="form-grid">
          <Field placeholder="Full name" value={data.fullName} onChange={(event) => update('fullName', event.target.value)} />
          <Field placeholder="Headline" value={data.headline} onChange={(event) => update('headline', event.target.value)} />
          <Field placeholder="Location" value={data.location} onChange={(event) => update('location', event.target.value)} />
          <Field placeholder="Email" value={data.email} onChange={(event) => update('email', event.target.value)} />
          <Field placeholder="Phone" value={data.phone} onChange={(event) => update('phone', event.target.value)} />
          <Field placeholder="Website" value={data.website} onChange={(event) => update('website', event.target.value)} />
        </div>
        <TextArea
          placeholder="Professional summary"
          value={data.summary}
          onChange={(event) => update('summary', event.target.value)}
        />
      </ShellCard>
      <ShellCard>
        <div className="section-row">
          <h3>Core skills</h3>
          <span className="muted">{data.coreSkills.length} tracked</span>
        </div>
        <AddRow
          placeholder="Add a core skill"
          onAdd={(value) => update('coreSkills', [...data.coreSkills, value])}
        />
        <div className="chip-wrap">
          {data.coreSkills.map((skill) => (
            <button
              key={skill}
              className="chip"
              onClick={() => update('coreSkills', removeTextEntry(data.coreSkills, skill))}
              type="button"
            >
              {skill}
            </button>
          ))}
        </div>
      </ShellCard>
      <ShellCard>
        <div className="section-row">
          <h3>Experience</h3>
          <button className="button button--primary" onClick={addExperience} type="button">
            Add role
          </button>
        </div>
        <div className="stack">
          {data.experience.length === 0 && <EmptyState text="No experience entries yet." />}
          {data.experience.map((item) => (
            <div className="record-card" key={item.id}>
              <div className="record-card__header">
                <strong>{item.role || 'Untitled role'}</strong>
                <button
                  className="button button--ghost"
                  onClick={() => update('experience', removeArrayItem(data.experience, item.id))}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field
                  placeholder="Role"
                  value={item.role}
                  onChange={(event) =>
                    update('experience', setArrayItem(data.experience, item.id, { role: event.target.value }))
                  }
                />
                <Field
                  placeholder="Company"
                  value={item.company}
                  onChange={(event) =>
                    update('experience', setArrayItem(data.experience, item.id, { company: event.target.value }))
                  }
                />
                <Field
                  placeholder="Period"
                  value={item.period}
                  onChange={(event) =>
                    update('experience', setArrayItem(data.experience, item.id, { period: event.target.value }))
                  }
                />
              </div>
              <TextArea
                placeholder="What did you do there?"
                value={item.summary}
                onChange={(event) =>
                  update('experience', setArrayItem(data.experience, item.id, { summary: event.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </ShellCard>
      <ShellCard>
        <div className="section-row">
          <h3>Education</h3>
          <button className="button button--primary" onClick={addEducation} type="button">
            Add study
          </button>
        </div>
        <div className="stack">
          {data.education.length === 0 && <EmptyState text="No education entries yet." />}
          {data.education.map((item) => (
            <div className="record-card" key={item.id}>
              <div className="record-card__header">
                <strong>{item.degree || 'Untitled study'}</strong>
                <button
                  className="button button--ghost"
                  onClick={() => update('education', removeArrayItem(data.education, item.id))}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field
                  placeholder="Institution"
                  value={item.institution}
                  onChange={(event) =>
                    update('education', setArrayItem(data.education, item.id, { institution: event.target.value }))
                  }
                />
                <Field
                  placeholder="Degree"
                  value={item.degree}
                  onChange={(event) =>
                    update('education', setArrayItem(data.education, item.id, { degree: event.target.value }))
                  }
                />
                <Field
                  placeholder="Period"
                  value={item.period}
                  onChange={(event) =>
                    update('education', setArrayItem(data.education, item.id, { period: event.target.value }))
                  }
                />
              </div>
              <TextArea
                placeholder="Notes"
                value={item.notes}
                onChange={(event) =>
                  update('education', setArrayItem(data.education, item.id, { notes: event.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </ShellCard>
      <ShellCard>
        <div className="split-grid">
          <div className="stack">
            <div className="section-row">
              <h3>Links</h3>
            </div>
            <AddRow
              placeholder="Add a link label (LinkedIn, Portfolio...)"
              onAdd={(value) =>
                update('links', [...data.links, createRecord({ label: value, url: '' })])
              }
            />
            <div className="stack">
              {data.links.map((link) => (
                <div className="inline-fields" key={link.id}>
                  <Field
                    placeholder="Label"
                    value={link.label}
                    onChange={(event) =>
                      update('links', setArrayItem(data.links, link.id, { label: event.target.value }))
                    }
                  />
                  <Field
                    placeholder="URL"
                    value={link.url}
                    onChange={(event) =>
                      update('links', setArrayItem(data.links, link.id, { url: event.target.value }))
                    }
                  />
                  <button
                    className="button button--ghost"
                    onClick={() => update('links', removeArrayItem(data.links, link.id))}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="stack">
            <h3>Certifications</h3>
            <AddRow
              placeholder="Add a certification"
              onAdd={(value) => update('certifications', [...data.certifications, value])}
            />
            <div className="chip-wrap">
              {data.certifications.map((item) => (
                <button
                  className="chip"
                  key={item}
                  onClick={() => update('certifications', removeTextEntry(data.certifications, item))}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ShellCard>
    </div>
  )
}

const getGoogleCalendarUrl = (title: string, dueDate: string | null) => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const encodedTitle = encodeURIComponent(title)
  let datesQuery = ''
  
  if (dueDate) {
    const d = new Date(dueDate)
    if (!isNaN(d.getTime())) {
      const start = d.toISOString().split('T')[0].replace(/-/g, '')
      d.setDate(d.getDate() + 1)
      const end = d.toISOString().split('T')[0].replace(/-/g, '')
      datesQuery = `&dates=${start}/${end}`
    }
  }
  
  return `${baseUrl}&text=${encodedTitle}${datesQuery}`
}

export const WorkSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['work']
  onChange: (value: LifeOsData['work']) => void
}) => (
  <div className="stack">
    <SectionHeader title="Work" subtitle="Track projects, tasks, priorities, and what needs your attention right now." />
    <AddRow
      placeholder="Add a project"
      onAdd={(value) =>
        onChange({
          projects: [
            createRecord({
              name: value,
              status: 'Active',
              description: '',
              priority: 'Medium',
              addedOn: todayKey(),
              tasks: [],
            }),
            ...data.projects,
          ],
        })
      }
    />
    {data.projects.length === 0 && <EmptyState text="No projects yet." />}
    {data.projects.map((project) => (
      <ShellCard key={project.id}>
        <div className="record-card__header">
          <strong>{project.name || 'Untitled project'}</strong>
          <button
            className="button button--ghost"
            onClick={() => onChange({ projects: removeArrayItem(data.projects, project.id) })}
            type="button"
          >
            Remove
          </button>
        </div>
        <div className="form-grid" style={{marginBottom: '12px'}}>
          <Field
            value={project.name}
            onChange={(event) =>
              onChange({ projects: setArrayItem(data.projects, project.id, { name: event.target.value }) })
            }
          />
          <Select
            value={project.status}
            onChange={(event) =>
              onChange({
                projects: setArrayItem(data.projects, project.id, {
                  status: event.target.value as typeof project.status,
                }),
              })
            }
          >
            <option>Active</option>
            <option>Paused</option>
            <option>Completed</option>
          </Select>
          <Select
            value={project.priority}
            onChange={(event) =>
              onChange({
                projects: setArrayItem(data.projects, project.id, {
                  priority: event.target.value as typeof project.priority,
                }),
              })
            }
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </Select>
        </div>
        <TextArea
          placeholder="Project description"
          value={project.description}
          onChange={(event) =>
            onChange({
              projects: setArrayItem(data.projects, project.id, { description: event.target.value }),
            })
          }
        />
        
        <div style={{marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--line)'}}>
          <h4 style={{marginBottom: '12px', fontSize: '15px', color: 'var(--c-blue)'}}>Tasks</h4>
          <AddRow 
            placeholder="Add a task (Todoist style)" 
            onAdd={(val) => {
              const newTask = createRecord({title: val, completed: false, dueDate: '', priority: 'P4' as const})
              onChange({ projects: setArrayItem(data.projects, project.id, { tasks: [...(project.tasks || []), newTask] }) })
            }} 
          />
          <div className="stack" style={{gap: '8px'}}>
            {(project.tasks || []).length === 0 && <p className="muted" style={{fontSize: '13px'}}>No tasks added to this project.</p>}
            {(project.tasks || []).map(task => (
              <div key={task.id} className="list-item" style={{opacity: task.completed ? 0.6 : 1, padding: '12px', marginBottom: '0'}}>
                <div className="section-row">
                  <div style={{display: 'flex', gap: '12px', alignItems: 'center', flex: 1}}>
                    <input 
                      type="checkbox" 
                      style={{width: '20px', height: '20px', accentColor: 'var(--c-blue)', cursor: 'pointer'}}
                      checked={task.completed} 
                      onChange={e => {
                        const updatedTasks = setArrayItem(project.tasks || [], task.id, {completed: e.target.checked})
                        onChange({ projects: setArrayItem(data.projects, project.id, { tasks: updatedTasks }) })
                      }} 
                    />
                    <span style={{textDecoration: task.completed ? 'line-through' : 'none', fontWeight: 500, fontSize: '15px'}}>{task.title}</span>
                  </div>
                  <button className="button button--ghost" style={{padding: '4px 8px'}} onClick={() => {
                    const updatedTasks = removeArrayItem(project.tasks || [], task.id)
                    onChange({ projects: setArrayItem(data.projects, project.id, { tasks: updatedTasks }) })
                  }}>✕</button>
                </div>
                <div className="section-row" style={{marginTop: '8px', paddingLeft: '32px', gap: '8px', flexWrap: 'wrap'}}>
                  <input
                    type="date"
                    className="field"
                    style={{padding: '4px 8px', fontSize: '12px', width: 'auto'}}
                    value={task.dueDate || ''}
                    onChange={(e) => {
                      const updatedTasks = setArrayItem(project.tasks || [], task.id, {dueDate: e.target.value})
                      onChange({ projects: setArrayItem(data.projects, project.id, { tasks: updatedTasks }) })
                    }}
                  />
                  <Select
                    value={task.priority || 'P4'}
                    style={{padding: '4px 8px', fontSize: '12px', width: 'auto'}}
                    onChange={(e) => {
                      const updatedTasks = setArrayItem(project.tasks || [], task.id, {priority: e.target.value as 'P1'|'P2'|'P3'|'P4'})
                      onChange({ projects: setArrayItem(data.projects, project.id, { tasks: updatedTasks }) })
                    }}
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                    <option value="P4">P4</option>
                  </Select>
                  <Select
                    value={project.id}
                    style={{padding: '4px 8px', fontSize: '12px', width: 'auto', maxWidth: '120px'}}
                    onChange={(e) => {
                      const newProjectId = e.target.value;
                      if (newProjectId === project.id) return;
                      const targetProject = data.projects.find(p => p.id === newProjectId);
                      if (!targetProject) return;
                      // Remove from current
                      const remainingTasks = removeArrayItem(project.tasks || [], task.id);
                      let nextProjects = setArrayItem(data.projects, project.id, { tasks: remainingTasks });
                      // Add to target
                      const updatedTargetTasks = [...(targetProject.tasks || []), task];
                      nextProjects = setArrayItem(nextProjects, newProjectId, { tasks: updatedTargetTasks });
                      onChange({ projects: nextProjects });
                    }}
                  >
                    {data.projects.map(p => (
                      <option key={p.id} value={p.id}>Move to: {p.name}</option>
                    ))}
                  </Select>
                  <a
                    href={getGoogleCalendarUrl(task.title, task.dueDate)}
                    target="_blank"
                    rel="noreferrer"
                    className="button button--ghost"
                    style={{padding: '4px 8px', fontSize: '12px', textDecoration: 'none', color: 'var(--c-orange)'}}
                  >
                    + Calendar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ShellCard>
    ))}
  </div>
)

export const HabitsSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['habits']
  onChange: (value: LifeOsData['habits']) => void
}) => {
  const [active, setActive] = useState<HabitCadence>('daily')
  const items = data[active] || []

  const calculateStreak = (dates: string[]) => {
    if (!dates || dates.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for(let i=0; i<365; i++) {
       const d = new Date(today);
       d.setDate(d.getDate() - i);
       const key = d.toISOString().slice(0, 10);
       if (dates.includes(key)) streak++;
       else if (i > 0) break;
    }
    return streak;
  }

  return (
    <div className="stack">
      <SectionHeader title="Habits" subtitle="Track routines, build streaks, and monitor progress (HabitNow style)." />
      <Tabs active={active} onChange={setActive} tabs={habitTabs} />
      <AddRow
        placeholder={`Add a ${active} habit`}
        onAdd={(value) =>
          onChange({
            ...data,
            [active]: [...items, createRecord({ name: value, type: 'boolean', targetValue: 1, records: [], completedDates: [] })],
          })
        }
      />
      {items.length === 0 && <EmptyState text={`No ${active} habits yet.`} />}
      {items.map((habit) => {
        const completedToday = habit.completedDates?.includes(todayKey()) || false
        const streak = calculateStreak(habit.completedDates || [])

        return (
          <ShellCard key={habit.id} tone="soft">
            <div className="record-card__header">
              <div className="stack" style={{gap: '4px'}}>
                 <strong style={{fontSize: '18px'}}>{habit.name}</strong>
                 <span style={{fontSize: '13px', color: 'var(--c-orange)', fontWeight: 600}}>🔥 {streak} day streak</span>
                 <p className="muted" style={{fontSize: '12px'}}>{habit.completedDates?.length || 0} total completions</p>
              </div>
              <button
                className={completedToday ? 'button button--primary' : 'button button--ghost'}
                onClick={() =>
                  onChange({
                    ...data,
                    [active]: setArrayItem(items, habit.id, {
                      completedDates: toggleHabitDate(habit.completedDates || [], todayKey()),
                    }),
                  })
                }
                type="button"
                style={{
                  borderRadius: '16px', 
                  width: '64px', 
                  height: '64px', 
                  padding: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px',
                  background: completedToday ? 'var(--c-green)' : 'rgba(0,0,0,0.05)',
                  color: completedToday ? 'white' : 'var(--muted)',
                  boxShadow: completedToday ? '0 8px 16px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                {completedToday ? '✓' : ''}
              </button>
            </div>
          </ShellCard>
        )
      })}
    </div>
  )
}

export const SkillsSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['skills']
  onChange: (value: LifeOsData['skills']) => void
}) => {
  const [active, setActive] = useState<SkillBucket>('goodAt')
  const items = data[active]

  return (
    <div className="stack">
      <SectionHeader title="Skills" subtitle="Map what you do well, what you are sharpening, and what comes next." />
      <Tabs active={active} onChange={setActive} tabs={skillTabs} />
      <AddRow
        placeholder="Add a skill"
        onAdd={(value) =>
          onChange({
            ...data,
            [active]: [...items, createRecord({ name: value })],
          })
        }
      />
      <div className="chip-wrap">
        {items.map((skill) => (
          <button
            className="chip"
            key={skill.id}
            onClick={() =>
              onChange({
                ...data,
                [active]: removeArrayItem(items, skill.id),
              })
            }
            type="button"
          >
            {skill.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export const WealthSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['wealth']
  onChange: (value: LifeOsData['wealth']) => void
}) => {
  const [active, setActive] = useState<'investments' | 'expenses'>('investments')
  const totalInvestments = data.investments.reduce(
    (sum, item) => sum + (Number.parseFloat(item.value) || 0),
    0,
  )
  const totalExpenses = data.expenses.reduce(
    (sum, item) => sum + (Number.parseFloat(item.amount) || 0),
    0,
  )

  return (
    <div className="stack">
      <SectionHeader title="Wealth" subtitle="Hold both the long game and the everyday cash flow in one place." />
      <div className="split-grid">
        <ShellCard tone="soft">
          <h3>Total invested</h3>
          <p className="stat-card__value">{formatCurrency(totalInvestments)}</p>
        </ShellCard>
        <ShellCard tone="soft">
          <h3>Total expenses</h3>
          <p className="stat-card__value">{formatCurrency(totalExpenses)}</p>
        </ShellCard>
      </div>
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { id: 'investments', label: 'Investments' },
          { id: 'expenses', label: 'Expenses' },
        ]}
      />
      {active === 'investments' ? (
        <div className="stack">
          <AddRow
            placeholder="Add an investment"
            onAdd={(value) =>
              onChange({
                ...data,
                investments: [...data.investments, createRecord({ name: value, type: '', value: '', notes: '' })],
              })
            }
          />
          {data.investments.map((item) => (
            <ShellCard key={item.id}>
              <div className="record-card__header">
                <strong>{item.name || 'Untitled investment'}</strong>
                <button
                  className="button button--ghost"
                  onClick={() => onChange({ ...data, investments: removeArrayItem(data.investments, item.id) })}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field
                  placeholder="Name"
                  value={item.name}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      investments: setArrayItem(data.investments, item.id, { name: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Type"
                  value={item.type}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      investments: setArrayItem(data.investments, item.id, { type: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Value"
                  value={item.value}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      investments: setArrayItem(data.investments, item.id, { value: event.target.value }),
                    })
                  }
                />
              </div>
              <TextArea
                placeholder="Notes"
                value={item.notes}
                onChange={(event) =>
                  onChange({
                    ...data,
                    investments: setArrayItem(data.investments, item.id, { notes: event.target.value }),
                  })
                }
              />
            </ShellCard>
          ))}
        </div>
      ) : (
        <div className="stack">
          <AddRow
            placeholder="Add an expense"
            onAdd={(value) =>
              onChange({
                ...data,
                expenses: [
                  ...data.expenses,
                  createRecord({ name: value, amount: '', category: '', date: todayKey() }),
                ],
              })
            }
          />
          {data.expenses.map((item) => (
            <ShellCard key={item.id}>
              <div className="record-card__header">
                <strong>{item.name || 'Untitled expense'}</strong>
                <button
                  className="button button--ghost"
                  onClick={() => onChange({ ...data, expenses: removeArrayItem(data.expenses, item.id) })}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field
                  placeholder="Amount"
                  value={item.amount}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      expenses: setArrayItem(data.expenses, item.id, { amount: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Category"
                  value={item.category}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      expenses: setArrayItem(data.expenses, item.id, { category: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Date"
                  type="date"
                  value={item.date}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      expenses: setArrayItem(data.expenses, item.id, { date: event.target.value }),
                    })
                  }
                />
              </div>
            </ShellCard>
          ))}
        </div>
      )}
    </div>
  )
}

export const LearningSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['learning']
  onChange: (value: LifeOsData['learning']) => void
}) => {
  const [active, setActive] = useState<'current' | 'wishlist'>('current')

  return (
    <div className="stack">
      <SectionHeader title="Learning" subtitle="Keep active courses and future learning goals visible in the same flow." />
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { id: 'current', label: `In Progress (${data.current.length})` },
          { id: 'wishlist', label: `Wishlist (${data.wishlist.length})` },
        ]}
      />
      {active === 'current' ? (
        <div className="stack">
          <AddRow
            placeholder="Add a course"
            onAdd={(value) =>
              onChange({
                ...data,
                current: [
                  ...data.current,
                  createRecord({ name: value, platform: '', progress: 0, notes: '' }),
                ],
              })
            }
          />
          {data.current.map((course) => (
            <ShellCard key={course.id}>
              <div className="record-card__header">
                <strong>{course.name || 'Untitled course'}</strong>
                <button
                  className="button button--ghost"
                  onClick={() => onChange({ ...data, current: removeArrayItem(data.current, course.id) })}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field
                  placeholder="Course"
                  value={course.name}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      current: setArrayItem(data.current, course.id, { name: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Platform"
                  value={course.platform}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      current: setArrayItem(data.current, course.id, { platform: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Progress"
                  type="number"
                  min="0"
                  max="100"
                  value={course.progress}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      current: setArrayItem(data.current, course.id, {
                        progress: Number(event.target.value) || 0,
                      }),
                    })
                  }
                />
              </div>
              <ProgressBar value={course.progress} />
              <TextArea
                placeholder="Notes"
                value={course.notes}
                onChange={(event) =>
                  onChange({
                    ...data,
                    current: setArrayItem(data.current, course.id, { notes: event.target.value }),
                  })
                }
              />
            </ShellCard>
          ))}
        </div>
      ) : (
        <div className="stack">
          <AddRow
            placeholder="Add a learning wish"
            onAdd={(value) =>
              onChange({
                ...data,
                wishlist: [...data.wishlist, createRecord({ name: value, priority: 'Medium' })],
              })
            }
          />
          {data.wishlist.map((item) => (
            <ShellCard key={item.id}>
              <div className="record-card__header">
                <strong>{item.name}</strong>
                <button
                  className="button button--ghost"
                  onClick={() => onChange({ ...data, wishlist: removeArrayItem(data.wishlist, item.id) })}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field
                  placeholder="Course"
                  value={item.name}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      wishlist: setArrayItem(data.wishlist, item.id, { name: event.target.value }),
                    })
                  }
                />
                <Select
                  value={item.priority}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      wishlist: setArrayItem(data.wishlist, item.id, {
                        priority: event.target.value as typeof item.priority,
                      }),
                    })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </Select>
              </div>
            </ShellCard>
          ))}
        </div>
      )}
    </div>
  )
}

export const ReadingSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['reading']
  onChange: (value: LifeOsData['reading']) => void
}) => {
  const [active, setActive] = useState<'current' | 'wishlist'>('current')
  const [category, setCategory] = useState<ReadingCategory>('Business')
  const wishlistItems = data.wishlist[category]
  const totalWishlist = READING_CATEGORIES.reduce(
    (sum, item) => sum + data.wishlist[item].length,
    0,
  )

  return (
    <div className="stack">
      <SectionHeader title="Reading" subtitle="Hold your current reading rhythm and the next stack waiting behind it." />
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { id: 'current', label: `Reading now (${data.current.length})` },
          { id: 'wishlist', label: `To read (${totalWishlist})` },
        ]}
      />
      {active === 'current' ? (
        <div className="stack">
          <AddRow
            placeholder="Add a current book"
            onAdd={(value) =>
              onChange({
                ...data,
                current: [...data.current, createRecord({ name: value, author: '', progress: 0 })],
              })
            }
          />
          {data.current.map((book) => (
            <ShellCard key={book.id}>
              <div className="record-card__header">
                <strong>{book.name}</strong>
                <button
                  className="button button--ghost"
                  onClick={() => onChange({ ...data, current: removeArrayItem(data.current, book.id) })}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field
                  placeholder="Book"
                  value={book.name}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      current: setArrayItem(data.current, book.id, { name: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Author"
                  value={book.author}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      current: setArrayItem(data.current, book.id, { author: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Progress"
                  type="number"
                  min="0"
                  max="100"
                  value={book.progress}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      current: setArrayItem(data.current, book.id, {
                        progress: Number(event.target.value) || 0,
                      }),
                    })
                  }
                />
              </div>
              <ProgressBar value={book.progress} />
            </ShellCard>
          ))}
        </div>
      ) : (
        <div className="stack">
          <Tabs
            active={category}
            onChange={setCategory}
            tabs={READING_CATEGORIES.map((item) => ({
              id: item,
              label: `${item} (${data.wishlist[item].length})`,
            }))}
          />
          <AddRow
            placeholder={`Add a ${category} title`}
            onAdd={(value) =>
              onChange({
                ...data,
                wishlist: {
                  ...data.wishlist,
                  [category]: [...wishlistItems, createRecord({ name: value })],
                },
              })
            }
          />
          {wishlistItems.length === 0 && <EmptyState text={`No ${category} titles queued yet.`} />}
          {wishlistItems.map((book) => (
            <ShellCard key={book.id} tone="soft">
              <div className="record-card__header">
                <strong>{book.name}</strong>
                <button
                  className="button button--ghost"
                  onClick={() =>
                    onChange({
                      ...data,
                      wishlist: {
                        ...data.wishlist,
                        [category]: removeArrayItem(wishlistItems, book.id),
                      },
                    })
                  }
                  type="button"
                >
                  Remove
                </button>
              </div>
            </ShellCard>
          ))}
        </div>
      )}
    </div>
  )
}

export const NotesSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['notes']
  onChange: (value: LifeOsData['notes']) => void
}) => {
  const [activeId, setActiveId] = useState<string | null>(data.items[0]?.id ?? null)
  const active = data.items.find((item) => item.id === activeId)

  return (
    <div className="stack">
      <SectionHeader title="Notes" subtitle="Capture fast, organise later, and keep your second brain close at hand." />
      <div className="notes-layout">
        <ShellCard tone="soft">
          <button
            className="button button--primary button--wide"
            onClick={() => {
              const note = createRecord({
                title: 'Untitled note',
                content: '',
                label: '',
                createdOn: todayKey(),
              })
              onChange({ items: [note, ...data.items] })
              setActiveId(note.id)
            }}
            type="button"
          >
            New note
          </button>
          <div className="stack">
            {data.items.length === 0 && <EmptyState text="No notes yet." />}
            {data.items.map((item) => (
              <button
                className={item.id === activeId ? 'list-item list-item--active' : 'list-item'}
                key={item.id}
                onClick={() => setActiveId(item.id)}
                type="button"
              >
                <strong>{item.title || 'Untitled note'}</strong>
                <span>{item.label || 'Unlabelled'}</span>
              </button>
            ))}
          </div>
        </ShellCard>
        <ShellCard>
          {!active ? (
            <EmptyState text="Select a note to start editing." />
          ) : (
            <div className="stack">
              <div className="inline-fields">
                <Field
                  placeholder="Title"
                  value={active.title}
                  onChange={(event) =>
                    onChange({
                      items: setArrayItem(data.items, active.id, { title: event.target.value }),
                    })
                  }
                />
                <Field
                  placeholder="Label"
                  value={active.label}
                  onChange={(event) =>
                    onChange({
                      items: setArrayItem(data.items, active.id, { label: event.target.value }),
                    })
                  }
                />
                <button
                  className="button button--ghost"
                  onClick={() => {
                    onChange({ items: removeArrayItem(data.items, active.id) })
                    setActiveId(data.items.find((item) => item.id !== active.id)?.id ?? null)
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
              <TextArea
                placeholder="Write your note"
                value={active.content}
                onChange={(event) =>
                  onChange({
                    items: setArrayItem(data.items, active.id, { content: event.target.value }),
                  })
                }
              />
            </div>
          )}
        </ShellCard>
      </div>
    </div>
  )
}

export const FamilySection = ({
  data,
  onChange,
}: {
  data: LifeOsData['family']
  onChange: (value: LifeOsData['family']) => void
}) => {
  const [activeId, setActiveId] = useState<string | null>(data.members[0]?.id ?? null)
  const active = data.members.find((member) => member.id === activeId)

  return (
    <div className="stack">
      <SectionHeader title="Responsibilities" subtitle="Map who matters, what they need, and how you want to show up." />
      <AddRow
        placeholder="Add a family member or responsibility"
        onAdd={(value) => {
          const member = createRecord({
            name: value,
            relationship: '',
            expectations: '',
            howToBeBetter: '',
            commitments: '',
          })
          onChange({ members: [...data.members, member] })
          setActiveId(member.id)
        }}
      />
      <div className="chip-wrap">
        {data.members.map((member) => (
          <button
            key={member.id}
            className={member.id === activeId ? 'chip chip--active' : 'chip'}
            onClick={() => setActiveId(member.id)}
            type="button"
          >
            {member.name}
          </button>
        ))}
      </div>
      {!active ? (
        <EmptyState text="Add someone important to start mapping responsibilities." />
      ) : (
        <ShellCard>
          <div className="record-card__header">
            <strong>{active.name}</strong>
            <button
              className="button button--ghost"
              onClick={() => {
                onChange({ members: removeArrayItem(data.members, active.id) })
                setActiveId(data.members.find((member) => member.id !== active.id)?.id ?? null)
              }}
              type="button"
            >
              Remove
            </button>
          </div>
          <div className="stack">
            <Field
              placeholder="Relationship"
              value={active.relationship}
              onChange={(event) =>
                onChange({ members: setArrayItem(data.members, active.id, { relationship: event.target.value }) })
              }
            />
            <TextArea
              placeholder="What are their expectations of you?"
              value={active.expectations}
              onChange={(event) =>
                onChange({ members: setArrayItem(data.members, active.id, { expectations: event.target.value }) })
              }
            />
            <TextArea
              placeholder="How can you be better for them?"
              value={active.howToBeBetter}
              onChange={(event) =>
                onChange({ members: setArrayItem(data.members, active.id, { howToBeBetter: event.target.value }) })
              }
            />
            <TextArea
              placeholder="Commitments"
              value={active.commitments}
              onChange={(event) =>
                onChange({ members: setArrayItem(data.members, active.id, { commitments: event.target.value }) })
              }
            />
          </div>
        </ShellCard>
      )}
    </div>
  )
}

export const WishesSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['wishes']
  onChange: (value: LifeOsData['wishes']) => void
}) => {
  const [active, setActive] = useState<'pending' | 'done'>('pending')
  const pending = data.items.filter((item) => !item.done)
  const done = data.items.filter((item) => item.done)
  const shown = active === 'pending' ? pending : done
  const completion = data.items.length === 0 ? 0 : (done.length / data.items.length) * 100

  return (
    <div className="stack">
      <SectionHeader title="Wish list" subtitle="Hold the things you want, and celebrate the ones you make real." />
      <ShellCard tone="soft">
        <ProgressBar value={completion} />
      </ShellCard>
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { id: 'pending', label: `Pending (${pending.length})` },
          { id: 'done', label: `Fulfilled (${done.length})` },
        ]}
      />
      {active === 'pending' && (
        <AddRow
          placeholder="Add a wish"
          onAdd={(value) =>
            onChange({
              items: [
                ...data.items,
                createRecord({ name: value, done: false, addedOn: todayKey(), doneDate: null }),
              ],
            })
          }
        />
      )}
      {shown.length === 0 && <EmptyState text={`No ${active} wishes right now.`} />}
      {shown.map((item) => (
        <ShellCard key={item.id} tone="soft">
          <div className="record-card__header">
            <strong>{item.name}</strong>
            <div className="inline-actions">
              <button
                className="button button--ghost"
                onClick={() =>
                  onChange({
                    items: setArrayItem(data.items, item.id, {
                      done: !item.done,
                      doneDate: item.done ? null : todayKey(),
                    }),
                  })
                }
                type="button"
              >
                {item.done ? 'Mark pending' : 'Mark done'}
              </button>
              <button
                className="button button--ghost"
                onClick={() => onChange({ items: removeArrayItem(data.items, item.id) })}
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
          <p className="muted">{item.done ? `Fulfilled ${item.doneDate}` : `Added ${item.addedOn}`}</p>
          {!item.done && (
            <div className="section-row" style={{gap: '8px', flexWrap: 'wrap', marginTop: '8px'}}>
              <input
                type="date"
                className="field"
                style={{padding: '4px 8px', fontSize: '12px', width: 'auto'}}
                value={item.dueDate || ''}
                onChange={(e) => {
                  onChange({ items: setArrayItem(data.items, item.id, {dueDate: e.target.value}) })
                }}
              />
              <Select
                value={item.priority || 'Low'}
                style={{padding: '4px 8px', fontSize: '12px', width: 'auto'}}
                onChange={(e) => {
                  onChange({ items: setArrayItem(data.items, item.id, {priority: e.target.value as 'Low'|'Medium'|'High'}) })
                }}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </Select>
              <a
                href={getGoogleCalendarUrl(item.name, item.dueDate || null)}
                target="_blank"
                rel="noreferrer"
                className="button button--ghost"
                style={{padding: '4px 8px', fontSize: '12px', textDecoration: 'none', color: 'var(--c-orange)'}}
              >
                + Calendar
              </a>
            </div>
          )}
        </ShellCard>
      ))}
    </div>
  )
}

export const RoadmapSection = ({
  data,
  onChange,
}: {
  data: LifeOsData['roadmap']
  onChange: (value: LifeOsData['roadmap']) => void
}) => {
  const [active, setActive] = useState<'Planned' | 'In Progress' | 'Done'>('Planned')
  const shown = data.tasks.filter((t) => t.status === active)

  return (
    <div className="stack">
      <SectionHeader title="What's Coming" subtitle="Track features and new developments for LifeOS." />
      <Tabs
        active={active}
        onChange={(id: string) => setActive(id as typeof active)}
        tabs={[
          { id: 'Planned', label: 'Planned' },
          { id: 'In Progress', label: 'In Progress' },
          { id: 'Done', label: 'Done' },
        ]}
      />
      {active === 'Planned' && (
        <AddRow
          placeholder="New feature to build…"
          onAdd={(value) =>
            onChange({
              tasks: [
                ...data.tasks,
                createRecord({
                  title: value,
                  status: 'Planned',
                  priority: 'Medium',
                  description: '',
                }),
              ],
            })
          }
        />
      )}
      {shown.length === 0 && <EmptyState text={`No ${active.toLowerCase()} features right now.`} />}
      {shown.map((task) => (
        <ShellCard key={task.id} tone="soft">
          <div className="record-card__header">
            <strong>{task.title}</strong>
            <div className="inline-actions">
              {task.status !== 'Done' && (
                <button
                  className="button button--ghost"
                  onClick={() =>
                    onChange({
                      tasks: setArrayItem(data.tasks, task.id, {
                        status: task.status === 'Planned' ? 'In Progress' : 'Done',
                      }),
                    })
                  }
                  type="button"
                >
                  {task.status === 'Planned' ? 'Start' : 'Finish'}
                </button>
              )}
              <button
                className="button button--ghost"
                onClick={() => onChange({ tasks: removeArrayItem(data.tasks, task.id) })}
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="stack" style={{gap: '8px'}}>
            <Select
              value={task.priority}
              onChange={(e) =>
                onChange({ tasks: setArrayItem(data.tasks, task.id, { priority: e.target.value as 'Low'|'Medium'|'High' }) })
              }
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </Select>
            <TextArea
              placeholder="Technical notes or specs..."
              value={task.description}
              onChange={(e) =>
                onChange({ tasks: setArrayItem(data.tasks, task.id, { description: e.target.value }) })
              }
            />
          </div>
        </ShellCard>
      ))}
    </div>
  )
}

