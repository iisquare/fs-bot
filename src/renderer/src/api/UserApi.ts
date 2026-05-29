import api from '@renderer/core/Api'

export default {
  login(body: any, tips = {}) {
    return api.post('/user/login', body, tips)
  },
  logout(body: any = {}, tips = {}) {
    return api.post('/user/logout', body, tips)
  },
  info(body: any = {}, tips = {}) {
    return api.post('/user/info', body, tips)
  },
}
