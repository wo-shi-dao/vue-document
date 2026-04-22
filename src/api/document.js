import request from '../utils/request'

// 获取模板库列表
export function getTemplateList() {
  return request({
    url: '/template/list',
    method: 'get'
  })
}

// 获取模板文档
export function getTemplateDocs(templateId) {
  return request({
    url: `/template/${templateId}/docs`,
    method: 'get'
  })
}

// 初始化文档目录
export function initDocumentDirectory(docIds, onProgress) {
  return new Promise((resolve, reject) => {
    // 模拟进度更新
    let progress = 0
    const timer = setInterval(() => {
      progress += 10
      if (onProgress) onProgress(progress)
      if (progress >= 100) {
        clearInterval(timer)
        resolve({ success: true, data: {} })
      }
    }, 200)
  })
}

// 获取文档列表
export function getDocumentList(params) {
  return request({
    url: '/document/list',
    method: 'get',
    params
  })
}

// 删除文档
export function deleteDocument(id) {
  return request({
    url: `/document/${id}`,
    method: 'delete'
  })
}

// 下载文档
export function downloadDocument(id) {
  return request({
    url: `/document/${id}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

// 重命名文档
export function renameDocument(id, name) {
  return request({
    url: `/document/${id}/rename`,
    method: 'put',
    data: { name }
  })
}

// 新增文件夹
export function addFolder(name) {
  return request({
    url: '/folder',
    method: 'post',
    data: { name }
  })
}

// 删除文件夹
export function deleteFolder(id) {
  return request({
    url: `/folder/${id}`,
    method: 'delete'
  })
}

// 重命名文件夹
export function renameFolder(id, name) {
  return request({
    url: `/folder/${id}/rename`,
    method: 'put',
    data: { name }
  })
}

// 生成文档
export function generateDocument(data, onProgress) {
  return new Promise((resolve, reject) => {
    // 模拟进度更新
    let progress = 0
    const timer = setInterval(() => {
      progress += 10
      if (onProgress) onProgress(progress)
      if (progress >= 100) {
        clearInterval(timer)
        resolve({ success: true, data: {} })
      }
    }, 200)
  })
}

// 获取历史记录
export function getHistoryList(params) {
  return request({
    url: '/document/history',
    method: 'get',
    params
  })
}

// 获取导入历史
export function getImportHistory(params) {
  return request({
    url: '/import/history',
    method: 'get',
    params
  })
}

// 解析导入文件
export function parseImportFiles(files, onProgress) {
  return new Promise((resolve, reject) => {
    // 模拟进度更新
    let progress = 0
    const timer = setInterval(() => {
      progress += 10
      if (onProgress) onProgress(progress)
      if (progress >= 100) {
        clearInterval(timer)
        resolve({ success: true, data: {} })
      }
    }, 200)
  })
}

// 获取导入详情
export function getImportDetail(id) {
  return request({
    url: `/import/${id}`,
    method: 'get'
  })
}

// 确认导入
export function confirmImport(id, onProgress) {
  return new Promise((resolve, reject) => {
    // 模拟进度更新
    let progress = 0
    const timer = setInterval(() => {
      progress += 10
      if (onProgress) onProgress(progress)
      if (progress >= 100) {
        clearInterval(timer)
        resolve({ success: true, data: {} })
      }
    }, 200)
  })
}

// 取消导入
export function cancelImport(id) {
  return request({
    url: `/import/${id}/cancel`,
    method: 'post'
  })
}
