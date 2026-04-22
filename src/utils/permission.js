import request from './request'

/**
 * 检查用户权限
 * @param {Object} to - 目标路由对象
 * @returns {Promise<boolean>} - 是否有权限
 */
export async function checkPermission(to) {
  try {
    // 获取用户权限信息
    const permissionInfo = await getPermissionInfo()
    
    // 检查是否有菜单权限
    if (!permissionInfo.hasMenu) {
      // 没有菜单权限，跳转到无权限页面
      const query = {
        message: permissionInfo.message || '您没有访问该菜单的权限',
        configText: permissionInfo.configText,
        configPath: permissionInfo.configPath,
        helpUrl: permissionInfo.helpUrl
      }
      
      // 将权限信息存储到sessionStorage
      sessionStorage.setItem('permissionDenied', JSON.stringify(query))
      return false
    }

    // 检查路由权限
    if (to.meta.permission) {
      const hasRoutePermission = permissionInfo.permissions.includes(to.meta.permission)
      if (!hasRoutePermission) {
        const query = {
          message: permissionInfo.routeMessage || '您没有访问该页面的权限',
          configText: permissionInfo.configText,
          configPath: permissionInfo.configPath,
          helpUrl: permissionInfo.helpUrl
        }
        sessionStorage.setItem('permissionDenied', JSON.stringify(query))
        return false
      }
    }

    return true
  } catch (error) {
    console.error('权限检查失败:', error)
    return false
  }
}

/**
 * 获取权限信息
 * @returns {Promise<Object>} - 权限信息
 */
export async function getPermissionInfo() {
  try {
    const res = await request({
      url: '/permission/info',
      method: 'get'
    })
    return res.data
  } catch (error) {
    // 如果接口失败，返回默认权限（开发环境）
    return {
      hasMenu: true,
      permissions: ['document-management', 'document-import', 'init-document'],
      message: '',
      configText: '前往项目成员管理',
      configPath: '/project-member',
      helpUrl: 'https://help.example.com/document-management'
    }
  }
}

/**
 * 检查项目是否已初始化文档目录
 * @param {string} projectId - 项目ID
 * @returns {Promise<boolean>} - 是否已初始化
 */
export async function checkDocumentInitialized(projectId) {
  try {
    const res = await request({
      url: `/project/${projectId}/document/initialized`,
      method: 'get'
    })
    return res.data.initialized
  } catch (error) {
    return false
  }
}
