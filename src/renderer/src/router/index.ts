import { createRouter, createWebHashHistory } from 'vue-router'
import { page } from './config'
import { useUserStore } from '@renderer/stores/user'

const routes: any = [
  {
    path: page.home,
    meta: { title: '首页' },
    component: () => import('@renderer/views/home.vue')
  },
  {
    path: page.e404,
    meta: { title: '404' },
    component: () => import('@renderer/views/404.vue')
  },
  {
    path: '/user/login',
    meta: { title: '用户登录' },
    component: () => import('@renderer/views/login.vue')
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

router.beforeEach((to: any, _from, next) => {
  document.title = to.meta?.title ? `${to.meta.title} - fs-bot` : title

  if (to.path.startsWith('/user/')) {
    if (!['/user/login'].includes(to.path)) {
      const user = useUserStore()
      if (!user.isLogined()) {
        next({
          path: '/user/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }
  next()
})

export default router
