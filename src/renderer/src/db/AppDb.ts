import Db from '@renderer/core/Db'

const TABLE = 'apps'

export default {
  async list(_params = {}) {
    return Db.select(TABLE, undefined, 'updated_at DESC')
  },

  async create(data: Record<string, unknown>) {
    return Db.insert(TABLE, {
      ...data,
      enabled_knowledge_bases: JSON.stringify(data.enabledKnowledgeBases || []),
      enabled_plugins: JSON.stringify(data.enabledPlugins || []),
      enabled_skills: JSON.stringify(data.enabledSkills || [])
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
    return Db.update(TABLE, { id }, row)
  },

  async delete(id: string) {
    return Db.remove(TABLE, { id })
  }
}
