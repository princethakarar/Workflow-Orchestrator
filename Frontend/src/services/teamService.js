import api from './api'

export const teamAPI = {
    getProjectManagers: (search = '') => {
        return api.get(`/api/team/project-managers${search ? `?search=${search}` : ''}`)
    }
}

export default api
