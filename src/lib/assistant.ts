import type { LifeOsData, ModuleKey, WorkProject, Habit, NoteItem, WishItem, RoadmapTask } from '../types/lifeos'
import type { AssistantMessage } from '../types/assistant'
import { createRecord, todayKey } from './lifeos'

// Prompt to instruct Gemini to act like JARVIS from Iron Man
export function buildSystemPrompt(data: LifeOsData): string {
  const context = serializeLifeOsContext(data)
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `You are JARVIS (Just A Rather Very Intelligent System), the user's highly sophisticated personal AI assistant, mirroring the wit, intelligence, warmth, and proactive nature of Iron Man's JARVIS.
Your goal is to help the user manage their LifeOS, offering insights, motivation, summaries, and taking direct actions via tool calls.
Be slightly formal yet warm, polite, and use classy British wit. Address the user as "Sir" or "Ma'am" (or just maintain a respectful, polished tone).
Keep responses concise, clear, and actionable.

Today's Date: ${todayStr}

=== USER'S LIFEDS DATA ===
${context}
==========================

INSTRUCTIONS:
1. Always base your replies on the provided LifeOS data.
2. If the user asks to add or change something, look for an appropriate tool to call first.
3. If no tool fits, explain politely what you can do.
4. Keep briefings concise. Nudge the user positively if they are lagging behind on their habits or tasks, but stay encouraging.
5. If the user asks about sensitive data (like wealth/investments), handle it with discretion and professional execution.`
}

function serializeLifeOsContext(data: LifeOsData): string {
  const parts: string[] = []

  // Profile
  if (data.profile.fullName) {
    parts.push(`Profile: ${data.profile.fullName} (${data.profile.headline || 'User'})`)
  }

  // Work
  const activeProjects = data.work.projects.filter(p => p.status === 'Active')
  parts.push(`--- WORK PROJECTS (Active: ${activeProjects.length}) ---`)
  activeProjects.forEach(p => {
    const pending = p.tasks.filter(t => !t.completed)
    const completed = p.tasks.filter(t => t.completed)
    parts.push(`- Project "${p.name}" (Priority: ${p.priority}):`)
    parts.push(`  Pending: ${pending.map(t => `${t.title} [${t.priority}]${t.dueDate ? ` (Due: ${t.dueDate})` : ''}`).join(', ') || 'None'}`)
    parts.push(`  Completed: ${completed.map(t => t.title).join(', ') || 'None'}`)
  })

  // Habits
  parts.push(`--- HABITS TODAY ---`)
  const today = todayKey()
  const allHabits = [
    ...(data.habits.daily || []),
    ...(data.habits.weekly || []),
    ...(data.habits.monthly || []),
  ]
  if (allHabits.length === 0) {
    parts.push(`No habits set up yet.`)
  } else {
    allHabits.forEach(h => {
      const isCompleted = h.completedDates?.includes(today) || h.records?.some(r => r.date === today && r.value >= h.targetValue)
      parts.push(`- Habit "${h.name}": ${isCompleted ? '✓ Done today' : '✗ Pending today'} (Target: ${h.targetValue})`)
    })
  }

  // Notes
  parts.push(`--- RECENT NOTES ---`)
  const recentNotes = (data.notes.items || []).slice(-5)
  if (recentNotes.length === 0) {
    parts.push(`No notes found.`)
  } else {
    recentNotes.forEach(n => {
      parts.push(`- "${n.title}" [Label: ${n.label || 'None'}]: ${n.content.slice(0, 80)}${n.content.length > 80 ? '...' : ''}`)
    })
  }

  // Roadmap
  parts.push(`--- ROADMAP ("What's Coming") ---`)
  const roadmapTasks = data.roadmap?.tasks || []
  if (roadmapTasks.length === 0) {
    parts.push(`No roadmap features defined.`)
  } else {
    const planned = roadmapTasks.filter(t => t.status === 'Planned')
    const inProgress = roadmapTasks.filter(t => t.status === 'In Progress')
    const done = roadmapTasks.filter(t => t.status === 'Done')
    parts.push(`- Planned: ${planned.map(t => t.title).join(', ') || 'None'}`)
    parts.push(`- In Progress: ${inProgress.map(t => t.title).join(', ') || 'None'}`)
    parts.push(`- Completed: ${done.map(t => t.title).join(', ') || 'None'}`)
  }

  // Wishes
  parts.push(`--- WISH LIST ---`)
  const wishes = data.wishes?.items || []
  const pendingWishes = wishes.filter(w => !w.done)
  if (pendingWishes.length === 0) {
    parts.push(`No pending wishes.`)
  } else {
    parts.push(`- Pending: ${pendingWishes.map(w => `${w.name} (${w.priority || 'Medium'})`).join(', ')}`)
  }

  // Wealth summary
  parts.push(`--- WEALTH & FINANCE ---`)
  const investmentsCount = data.wealth?.investments?.length || 0
  const expensesCount = data.wealth?.expenses?.length || 0
  parts.push(`- Investments: ${investmentsCount} active items`)
  parts.push(`- Expenses recorded: ${expensesCount} items`)

  return parts.join('\n')
}

// Declarations of tools exposed to Gemini
export const ASSISTANT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'add_task',
        description: 'Add a new task to a specific work project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectName: { type: 'STRING', description: 'The project name. If it does not exist, a new project with this name will be created.' },
            title: { type: 'STRING', description: 'The title of the task to add.' },
            priority: { type: 'STRING', enum: ['P1', 'P2', 'P3', 'P4'], description: 'The priority level of the task.' },
            dueDate: { type: 'STRING', description: 'Due date in YYYY-MM-DD format (optional).' },
          },
          required: ['projectName', 'title'],
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed inside a project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectName: { type: 'STRING', description: 'The project name where the task is located.' },
            taskTitle: { type: 'STRING', description: 'The title of the task to complete.' },
          },
          required: ['projectName', 'taskTitle'],
        },
      },
      {
        name: 'add_habit',
        description: 'Create a new habit tracking item.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The habit name (e.g. Meditate, Workout, Drink Water).' },
            cadence: { type: 'STRING', enum: ['daily', 'weekly', 'monthly'], description: 'The frequency of the habit.' },
            type: { type: 'STRING', enum: ['boolean', 'numeric', 'timer'], description: 'The habit type.' },
            targetValue: { type: 'NUMBER', description: 'Target value (e.g. 1 for boolean, 8 for glasses of water, 30 for minutes of meditation).' },
          },
          required: ['name', 'cadence', 'type', 'targetValue'],
        },
      },
      {
        name: 'tick_habit',
        description: 'Record/tick progress on an existing habit.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The name of the habit (case-insensitive search).' },
            cadence: { type: 'STRING', enum: ['daily', 'weekly', 'monthly'], description: 'Habit frequency (daily, weekly, monthly).' },
            value: { type: 'NUMBER', description: 'The value to log (default is 1).' },
          },
          required: ['name', 'cadence'],
        },
      },
      {
        name: 'add_note',
        description: 'Create a new personal note.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Title of the note.' },
            content: { type: 'STRING', description: 'Body content of the note.' },
            label: { type: 'STRING', description: 'Category/tag label for the note.' },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'add_wish',
        description: 'Add a new item to the bucket/wish list.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The wish or goal description.' },
            priority: { type: 'STRING', enum: ['Low', 'Medium', 'High'], description: 'How important this wish is.' },
          },
          required: ['name'],
        },
      },
      {
        name: 'add_roadmap_task',
        description: 'Add a new roadmap item in "What\'s Coming" tab.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'The name of the feature/roadmap task.' },
            priority: { type: 'STRING', enum: ['Low', 'Medium', 'High'], description: 'Roadmap development priority.' },
            description: { type: 'STRING', description: 'Detailed specs or description of the development task.' },
          },
          required: ['title'],
        },
      },
    ],
  },
]

export interface MutationResult {
  moduleKey: ModuleKey
  nextValue: any
  summary: string
}

// Executes a tool call on local LifeOsData copy and returns updated modules
export function executeToolCall(
  name: string,
  args: any,
  data: LifeOsData
): MutationResult | null {
  const clonedData = JSON.parse(JSON.stringify(data)) as LifeOsData

  try {
    switch (name) {
      case 'add_task': {
        const { projectName, title, priority = 'P2', dueDate = null } = args
        let project = clonedData.work.projects.find(
          p => p.name.toLowerCase() === projectName.toLowerCase()
        )

        if (!project) {
          project = createRecord<Omit<WorkProject, 'id' | 'createdAt' | 'updatedAt'>>({
            name: projectName,
            status: 'Active',
            description: `Created automatically by JARVIS.`,
            priority: 'Medium',
            addedOn: new Date().toISOString().split('T')[0],
            tasks: [],
          })
          clonedData.work.projects.push(project)
        }

        const newTask = createRecord({
          title,
          completed: false,
          dueDate,
          priority: priority as any,
        })
        project.tasks.push(newTask)

        return {
          moduleKey: 'work',
          nextValue: clonedData.work,
          summary: `Successfully added task "${title}" to project "${project.name}" (Priority: ${priority}).`,
        }
      }

      case 'complete_task': {
        const { projectName, taskTitle } = args
        const project = clonedData.work.projects.find(
          p => p.name.toLowerCase() === projectName.toLowerCase()
        )

        if (!project) {
          throw new Error(`Project "${projectName}" not found.`)
        }

        const task = project.tasks.find(
          t => t.title.toLowerCase().includes(taskTitle.toLowerCase())
        )

        if (!task) {
          throw new Error(`Task matching "${taskTitle}" not found in project "${projectName}".`)
        }

        task.completed = true
        task.updatedAt = new Date().toISOString()

        return {
          moduleKey: 'work',
          nextValue: clonedData.work,
          summary: `Marked task "${task.title}" as completed in project "${project.name}".`,
        }
      }

      case 'add_habit': {
        const { name: habitName, cadence, type = 'boolean', targetValue = 1 } = args
        const listKey = cadence as 'daily' | 'weekly' | 'monthly'
        if (!clonedData.habits[listKey]) {
          clonedData.habits[listKey] = []
        }

        const newHabit = createRecord<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>({
          name: habitName,
          type: type as any,
          targetValue,
          records: [],
          completedDates: [],
        })
        clonedData.habits[listKey].push(newHabit)

        return {
          moduleKey: 'habits',
          nextValue: clonedData.habits,
          summary: `Created new ${cadence} habit "${habitName}" (Target: ${targetValue}).`,
        }
      }

      case 'tick_habit': {
        const { name: habitName, cadence, value = 1 } = args
        const listKey = cadence as 'daily' | 'weekly' | 'monthly'
        const habitsList = clonedData.habits[listKey] || []
        const habit = habitsList.find(
          h => h.name.toLowerCase().includes(habitName.toLowerCase())
        )

        if (!habit) {
          throw new Error(`Could not find ${cadence} habit matching "${habitName}".`)
        }

        const today = todayKey()
        if (!habit.completedDates) habit.completedDates = []
        if (!habit.records) habit.records = []

        if (habit.type === 'boolean') {
          if (!habit.completedDates.includes(today)) {
            habit.completedDates.push(today)
          }
        } else {
          const record = habit.records.find(r => r.date === today)
          if (record) {
            record.value += value
          } else {
            habit.records.push({ date: today, value })
          }
          // Recalculate completed dates if target value hit
          const totalValue = habit.records.filter(r => r.date === today).reduce((sum, r) => sum + r.value, 0)
          if (totalValue >= habit.targetValue && !habit.completedDates.includes(today)) {
            habit.completedDates.push(today)
          }
        }

        habit.updatedAt = new Date().toISOString()

        return {
          moduleKey: 'habits',
          nextValue: clonedData.habits,
          summary: `Logged progress for habit "${habit.name}". Progress recorded.`,
        }
      }

      case 'add_note': {
        const { title, content, label = 'General' } = args
        const newNote = createRecord<Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>>({
          title,
          content,
          label,
          createdOn: new Date().toLocaleDateString(),
        })

        if (!clonedData.notes) clonedData.notes = { items: [] }
        if (!clonedData.notes.items) clonedData.notes.items = []

        clonedData.notes.items.push(newNote)

        return {
          moduleKey: 'notes',
          nextValue: clonedData.notes,
          summary: `Created new note: "${title}" under category "${label}".`,
        }
      }

      case 'add_wish': {
        const { name: wishName, priority = 'Medium' } = args
        const newWish = createRecord<Omit<WishItem, 'id' | 'createdAt' | 'updatedAt'>>({
          name: wishName,
          done: false,
          addedOn: new Date().toLocaleDateString(),
          doneDate: null,
          priority: priority as any,
        })

        if (!clonedData.wishes) clonedData.wishes = { items: [] }
        if (!clonedData.wishes.items) clonedData.wishes.items = []

        clonedData.wishes.items.push(newWish)

        return {
          moduleKey: 'wishes',
          nextValue: clonedData.wishes,
          summary: `Added "${wishName}" to your wishlist (Priority: ${priority}).`,
        }
      }

      case 'add_roadmap_task': {
        const { title, priority = 'Medium', description = '' } = args
        const newRoadmapTask = createRecord<Omit<RoadmapTask, 'id' | 'createdAt' | 'updatedAt'>>({
          title,
          status: 'Planned',
          priority: priority as any,
          description,
        })

        if (!clonedData.roadmap) clonedData.roadmap = { tasks: [] }
        if (!clonedData.roadmap.tasks) clonedData.roadmap.tasks = []

        clonedData.roadmap.tasks.push(newRoadmapTask)

        return {
          moduleKey: 'roadmap',
          nextValue: clonedData.roadmap,
          summary: `Added "${title}" to your product roadmap pipeline (Status: Planned).`,
        }
      }

      default:
        console.warn(`[JARVIS] Unknown tool call name: ${name}`)
        return null
    }
  } catch (err: any) {
    console.error(`[JARVIS] Error executing tool: ${err.message}`)
    return null
  }
}

// Simulates JARVIS responses offline
export function executeMockResponse(
  userText: string,
  data: LifeOsData
): { text: string; mutations: MutationResult[] } {
  const textLower = userText.toLowerCase()
  const mutations: MutationResult[] = []

  // Check if we can mock add a task
  if (textLower.includes('add task') || textLower.includes('create task')) {
    // Regex to match add task 'xyz' to 'abc'
    const taskMatch = userText.match(/(?:add|create) task ['"]([^'"]+)['"] to ['"]([^'"]+)['"]/i)
    if (taskMatch) {
      const result = executeToolCall('add_task', { title: taskMatch[1], projectName: taskMatch[2] }, data)
      if (result) {
        mutations.push(result)
        return {
          text: `Certainly, Sir. I have initiated core protocols and added the task "${taskMatch[1]}" to project "${taskMatch[2]}".`,
          mutations,
        }
      }
    }
    
    // Simpler fallback task match
    const simpleTaskMatch = userText.match(/(?:add|create) task ['"]([^'"]+)['"]/i)
    if (simpleTaskMatch) {
      const result = executeToolCall('add_task', { title: simpleTaskMatch[1], projectName: 'General' }, data)
      if (result) {
        mutations.push(result)
        return {
          text: `Right away, Sir. I've logged "${simpleTaskMatch[1]}" inside your "General" work project.`,
          mutations,
        }
      }
    }
  }

  // Check if we can mock add a note
  if (textLower.includes('add note') || textLower.includes('create note') || textLower.includes('write note')) {
    const noteMatch = userText.match(/(?:add|create|write) note ['"]([^'"]+)['"] with content ['"]([^'"]+)['"]/i)
    if (noteMatch) {
      const result = executeToolCall('add_note', { title: noteMatch[1], content: noteMatch[2] }, data)
      if (result) {
        mutations.push(result)
        return {
          text: `Consider it recorded, Sir. I have filed the note "${noteMatch[1]}" under General logs.`,
          mutations,
        }
      }
    }
  }

  // Habits checking
  if (textLower.includes('tick habit') || textLower.includes('complete habit') || textLower.includes('done habit')) {
    const habitMatch = userText.match(/(?:tick|complete|done) habit ['"]([^'"]+)['"]/i)
    if (habitMatch) {
      const result = executeToolCall('tick_habit', { name: habitMatch[1], cadence: 'daily' }, data)
      if (result) {
        mutations.push(result)
        return {
          text: `Splendid progress, Sir! I have ticked off your habit "${habitMatch[1]}" for today. Keep it up!`,
          mutations,
        }
      }
    }
  }

  // Summaries
  if (textLower.includes('brief') || textLower.includes('status') || textLower.includes('summary') || textLower.includes('how am i')) {
    const pendingTasks = data.work.projects.flatMap(p => p.tasks.filter(t => !t.completed)).length
    const habitsDoneToday = [
      ...(data.habits.daily || []),
      ...(data.habits.weekly || []),
      ...(data.habits.monthly || []),
    ].filter(h => h.completedDates?.includes(todayKey())).length

    return {
      text: `Good day, Sir. Here is your current status briefing:
- You have **${pendingTasks}** pending tasks across active projects.
- You have completed **${habitsDoneToday}** habits today.
- I am ready to process database requests. Please activate my neural API core in the settings panel above if you would like me to process fully open-ended questions using Gemini.`,
      mutations: [],
    }
  }

  return {
    text: `Indeed, Sir. I can hear you clearly. My primary AI core is currently running in offline mock mode. If you add your Gemini API key using the panel below, I'll be able to answer arbitrary questions, provide deeply personalized insights, and execute fully automated tool requests. How may I assist you today?`,
    mutations: [],
  }
}

// Call the actual Gemini API
export async function sendJarvisMessage(
  history: AssistantMessage[],
  newMessage: string,
  data: LifeOsData,
  apiKey: string
): Promise<{ text: string; mutations: MutationResult[] }> {
  if (!apiKey) {
    return executeMockResponse(newMessage, data)
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  // Format history messages into Gemini's format:
  // [{ role: 'user' | 'model', parts: [{ text: string }] }]
  // System instructions go in a separate field.
  const apiContents = history
    .filter(m => m.role !== 'system') // Filter out system instructions from contents array
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))

  // Add the new user message
  apiContents.push({
    role: 'user',
    parts: [{ text: newMessage }],
  })

  const systemInstruction = buildSystemPrompt(data)

  const requestBody = {
    contents: apiContents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    tools: ASSISTANT_TOOLS,
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `HTTP error ${res.status}`)
    }

    const resJson = await res.json()
    const candidate = resJson.candidates?.[0]
    const content = candidate?.content
    const parts = content?.parts || []

    const mutations: MutationResult[] = []
    let textResponse = ''

    for (const part of parts) {
      if (part.text) {
        textResponse += part.text
      }

      if (part.functionCall) {
        const { name, args } = part.functionCall
        console.log(`[JARVIS] Tool Execution triggered: ${name}`, args)
        const result = executeToolCall(name, args, data)

        if (result) {
          mutations.push(result)
          
          // Let's do a follow-up request to Gemini to let it know the tool ran successfully
          // and format the final voice reply for the user.
          // This keeps the user experience highly dynamic and conversational.
          try {
            const followUpContents = [
              ...apiContents,
              {
                role: 'model',
                parts: [{ functionCall: { name, args } }]
              },
              {
                role: 'user',
                parts: [{
                  text: `System result for tool "${name}": ${result.summary}. Summarize what you did with JARVIS style.`
                }]
              }
            ]

            const followUpRes = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: followUpContents,
                systemInstruction: { parts: [{ text: systemInstruction }] },
              })
            })

            if (followUpRes.ok) {
              const followUpJson = await followUpRes.json()
              const followUpText = followUpJson.candidates?.[0]?.content?.parts?.[0]?.text
              if (followUpText) {
                textResponse = followUpText
              } else {
                textResponse = `Right away, Sir. ${result.summary}`
              }
            } else {
              textResponse = `Right away, Sir. ${result.summary}`
            }
          } catch (followUpErr) {
            textResponse = `Right away, Sir. ${result.summary}`
          }
        } else {
          textResponse = `Apologies, Sir. I attempted to perform the action but encountered an internal database issue.`
        }
      }
    }

    if (!textResponse && !mutations.length) {
      textResponse = `I am at your service, Sir. However, I didn't receive a complete instruction. Could you please specify?`
    }

    return {
      text: textResponse,
      mutations,
    }
  } catch (err: any) {
    console.error('[JARVIS] API Call failed:', err)
    return {
      text: `Apologies, Sir. My connection to the neural mainframe is experiencing interference. Error detail: ${err.message}. I am falling back to offline command protocols.`,
      mutations: [],
    }
  }
}
