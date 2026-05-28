import { createRouter, createWebHashHistory } from 'vue-router'
import { page } from './config'
import { useUserStore } from '@renderer/stores/user'

const routes = [
  {
    path: page.login,
    meta: { title: '用户登录' },
    component: () => import('@renderer/views/login.vue')
  },
  {
    path: page.root,
    component: () => import('@renderer/views/index.vue'),
    redirect: page.home,
    children: [
      {
        path: page.home,
        meta: { title: '首页' },
        component: () => import('@renderer/views/home/HomePage.vue')
      },
      {
        path: page.search,
        meta: { title: '对话检索' },
        component: () => import('@renderer/views/history/SearchPage.vue')
      },
      {
        path: page.profile,
        meta: { title: '个人信息' },
        component: () => import('@renderer/views/profile/PersonalInfo.vue')
      },
      {
        path: page.settings,
        meta: { title: '系统设置' },
        component: () => import('@renderer/views/settings/SystemSettings.vue')
      },
      {
        path: page.configApps,
        meta: { title: '应用管理' },
        component: () => import('@renderer/views/config/AppManagement.vue')
      },
      {
        path: page.configKnowledge,
        meta: { title: '知识库' },
        component: () => import('@renderer/views/config/KnowledgeBase.vue')
      },
      {
        path: page.configKnowledgeRecall,
        meta: { title: '召回测试' },
        component: () => import('@renderer/views/config/KnowledgeRecallTest.vue')
      },
      {
        path: page.configTools,
        meta: { title: '工具管理' },
        component: () => import('@renderer/views/config/ToolManagement.vue')
      },
      {
        path: page.configSkills,
        meta: { title: '技能管理' },
        component: () => import('@renderer/views/config/SkillManagement.vue')
      }
    ]
  },
  {
    path: page.e404,
    meta: { title: '404' },
    component: () => import('@renderer/views/404.vue')
  },
  {
    path: '/:catchAll(.*)',
    redirect: page.e404
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const title = document.title

router.beforeEach((to, _from) => {
  document.title = to.meta?.title ? `${to.meta.title} - fs-bot` : title
  if (to.path === page.login) {
    const user = useUserStore()
    if (user.isLogined()) {
      return { path: page.home }
    }
    return true
  }

  const user = useUserStore()
  if (!user.isLogined()) {
    return { path: page.login, query: { redirect: to.fullPath } }
  }

  return true
})

export default router
