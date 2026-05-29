import Db from '@renderer/core/Db'

const DB_TYPE = 'user'
const TABLE = 'apps'

export default {
  async list(_params = {}) {
    return Db.select(DB_TYPE, TABLE, undefined, 'updated_at DESC')
  },

  async create(data: Record<string, unknown>) {
    const now = new Date().toISOString()
    return Db.insert(DB_TYPE, TABLE, {
      id: crypto.randomUUID(),
      ...data,
      enabled_knowledge_bases: JSON.stringify(data.enabledKnowledgeBases || []),
      enabled_plugins: JSON.stringify(data.enabledPlugins || []),
      enabled_skills: JSON.stringify(data.enabledSkills || []),
      created_at: now,
      updated_at: now
    })
  },

  async update(id: string, data: Record<string, unknown>) {
    const row: Record<string, unknown> = { ...data }
    if (data.enabledKnowledgeBases !== undefined) {
      row['enabled_knowledge_bases'] = JSON.stringify(data.enabledKnowledgeBases)
    }
    if (data.enabledPlugins !== undefined) {
      row['enabled_plugins'] = JSON.stringify(data.enabledPlugins)
    }
    if (data.enabledSkills !== undefined) {
      row['enabled_skills'] = JSON.stringify(data.enabledSkills)
    }
    row['updated_at'] = new Date().toISOString()
    return Db.update(DB_TYPE, TABLE, { id }, row)
  },

  async delete(id: string) {
    return Db.remove(DB_TYPE, TABLE, { id })
  }
}
