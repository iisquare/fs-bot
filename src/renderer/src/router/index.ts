import { createRouter, createWebHashHistory } from 'vue-router'
import { page } from './config'
import { useUserStore } from '@renderer/stores/user'

const routes: any = [
  {
    path: page.login,
    meta: { title: '用户登录' },
    component: () => import('@renderer/views/login.vue')
  },
  {
    path: page.root,
    meta: { title: '首页' },
    component: () => import('@renderer/views/index.vue')
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

router.beforeEach((to: any, _from) => {
  document.title = to.meta?.title ? `${to.meta.title} - fs-bot` : title
  console.log('router', _from, to)
  if (to.path === page.login) {
    const user = useUserStore()
    if (user.isLogined()) {
      return { path: page.root }
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
