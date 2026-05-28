import ApiUtil from './ApiUtil'

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function succeed(data: any = null, message = 'Succeed!') {
  return ApiUtil.result(0, message, data)
}

export async function mockResponse(data: any = null, ms?: number): Promise<any> {
  await delay(ms)
  return succeed(data)
}

export async function mockError(code = 500, message = 'Failed!', ms?: number): Promise<any> {
  await delay(ms)
  return ApiUtil.result(code, message)
}

// ── Sample Data ──

export const mockApps = [
  {
    id: '1',
    name: '通用助手',
    description: '通用的 AI 对话助手，可回答各类问题',
    icon: '',
    systemPrompt: '你是一个有用的助手。',
    enabledKnowledgeBases: [],
    enabledPlugins: [],
    enabledSkills: [],
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-28T08:00:00Z'
  },
  {
    id: '2',
    name: '代码助手',
    description: '专注于编程和技术问题的 AI 助手',
    icon: '',
    systemPrompt: '你是一个专业的编程助手，请用中文回答。',
    enabledKnowledgeBases: ['1'],
    enabledPlugins: [],
    enabledSkills: ['1'],
    createdAt: '2026-05-22T14:00:00Z',
    updatedAt: '2026-05-27T16:30:00Z'
  },
  {
    id: '3',
    name: '文档撰写',
    description: '帮助撰写和优化各类文档',
    icon: '',
    systemPrompt: '你是一个专业的文档撰写助手。',
    enabledKnowledgeBases: [],
    enabledPlugins: ['1'],
    enabledSkills: [],
    createdAt: '2026-05-25T09:00:00Z',
    updatedAt: '2026-05-26T11:00:00Z'
  }
]

export const mockConversations = [
  {
    id: 'c1',
    title: '如何使用 fs-bot',
    appId: '1',
    appName: '通用助手',
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'c2',
    title: '帮我写一个 Vue 组件',
    appId: '2',
    appName: '代码助手',
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'c3',
    title: 'TypeScript 类型推导问题',
    appId: '2',
    appName: '代码助手',
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'c4',
    title: '上周工作总结',
    appId: '3',
    appName: '文档撰写',
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'c5',
    title: '项目计划讨论',
    appId: '1',
    appName: '通用助手',
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'c6',
    title: 'API 接口设计咨询',
    appId: '2',
    appName: '代码助手',
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'c7',
    title: '产品需求文档',
    appId: '3',
    appName: '文档撰写',
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString()
  }
]

export const mockMessages: Record<string, any[]> = {
  c1: [
    { id: 'm1', role: 'user', content: 'fs-bot 有哪些功能？', createdAt: new Date(Date.now() - 3500000).toISOString() },
    { id: 'm2', role: 'assistant', content: 'fs-bot 是一个本地智能体对话工具，支持以下功能：\n\n1. **多应用管理** - 创建不同 prompt 的应用\n2. **知识库** - 文档检索与召回\n3. **工具集成** - MCP 服务、自定义工具\n4. **技能管理** - 技能市场安装与发布\n5. **对话历史** - 按时间分组的对话管理', createdAt: new Date(Date.now() - 3400000).toISOString() }
  ],
  c2: [
    { id: 'm3', role: 'user', content: '帮我写一个 Vue 3 文件上传组件', createdAt: new Date(Date.now() - 7100000).toISOString() },
    { id: 'm4', role: 'assistant', content: '以下是一个支持拖拽上传的 Vue 3 组件：\n\n```vue\n<script setup lang="ts">\nimport { ref } from "vue"\n\nconst emit = defineEmits<{ upload: [File[]] }>()\nconst dragging = ref(false)\n\nfunction handleDrop(e: DragEvent) {\n  dragging.value = false\n  const files = Array.from(e.dataTransfer?.files || [])\n  emit("upload", files)\n}\n</script>\n```', createdAt: new Date(Date.now() - 7000000).toISOString() }
  ]
}

export const mockKnowledgeBases = [
  {
    id: 'k1',
    name: '技术文档库',
    description: '公司内部技术文档和 API 参考',
    segmentDelimiter: '\\r\\n',
    segmentLength: 2000,
    chunkLength: 500,
    overlap: 50,
    recallCount: 20,
    scoreThreshold: 0.5,
    createdAt: '2026-05-15T08:00:00Z',
    updatedAt: '2026-05-28T08:00:00Z'
  },
  {
    id: 'k2',
    name: '产品需求库',
    description: '产品需求和 PRD 文档集合',
    segmentDelimiter: '\\r\\n',
    segmentLength: 1500,
    chunkLength: 400,
    overlap: 30,
    recallCount: 15,
    scoreThreshold: 0.6,
    createdAt: '2026-05-18T10:00:00Z',
    updatedAt: '2026-05-27T14:00:00Z'
  }
]

export const mockRecallResults = [
  {
    score: 0.852,
    text: 'fs-bot 是一个基于 Electron + Vue 3 + TypeScript 构建的本地智能体对话工具。它采用左右布局，左侧为侧边栏，右侧为内容区域...',
    parentSegment: 'fs-bot 系统架构概述\n\n项目采用 electron-vite 三部分结构...',
    childSegments: '渲染进程使用 Element Plus 组件库...',
    fullText: '完整的文档内容...'
  },
  {
    score: 0.723,
    text: '应用管理模块支持创建和管理多个 AI 应用，每个应用可以配置独立的系统提示词...',
    parentSegment: '配置管理模块说明...',
    childSegments: '应用字段包括图标、名称、描述等...',
    fullText: '完整的文档内容...'
  },
  {
    score: 0.591,
    text: '知识库支持分块、分字段、全文三种检索方式，可配置段落分隔符、分段长度等参数...',
    parentSegment: '知识库配置说明...',
    childSegments: '默认分段长度为 2000...',
    fullText: '完整的文档内容...'
  }
]

export const mockTools = {
  mcp: [
    { id: 't1', name: 'filesystem', description: '文件系统操作 MCP 服务', type: 'mcp', config: '{}' },
    { id: 't2', name: 'github', description: 'GitHub API MCP 服务', type: 'mcp', config: '{}' }
  ],
  custom: [
    { id: 't3', name: '天气查询', description: '查询指定城市的天气信息', type: 'custom', config: '{}' }
  ],
  builtin: [
    { id: 't4', name: '计算器', description: '数学表达式计算', type: 'builtin' },
    { id: 't5', name: '时间查询', description: '当前时间和日期查询', type: 'builtin' }
  ]
}

export const mockSkills = {
  installed: [
    { id: 's1', name: '代码审查', description: '自动审查代码质量与安全性', installedVersion: '1.2.0', latestVersion: '1.3.0' },
    { id: 's2', name: '文档生成', description: '根据代码自动生成 API 文档', installedVersion: '2.0.1', latestVersion: '2.0.1' }
  ],
  marketplace: [
    { id: 's3', name: '翻译助手', description: '多语言翻译技能', latestVersion: '1.0.0' },
    { id: 's4', name: '数据分析', description: 'CSV/Excel 数据分析与可视化', latestVersion: '0.9.0' },
    { id: 's5', name: 'SQL 优化', description: 'SQL 查询性能分析与优化建议', latestVersion: '1.1.0' }
  ]
}

export const mockUserInfo = {
  id: 1,
  serial: 'admin',
  name: '管理员',
  nickname: 'Admin',
  email: 'admin@iisquare.com',
  phone: '138****8888',
  avatar: '',
  token: 'mock-jwt-token-xxxxx'
}

export const mockSettings = {
  autoStart: false,
  autoUpgrade: true
}
