import api from './Api'

export default {
  login(body: any, tips = {}) {
    return api.post('/user/login', body, tips)
  },
  logout(tips = {}) {
    return api.post('/user/logout', null, tips)
  },
  info(tips = {}) {
    return api.post('/user/info', null, tips)
  }
}
