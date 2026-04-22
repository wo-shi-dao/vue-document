<template>
  <div class="no-permission-container">
    <el-result
      icon="error"
      title="权限不足"
      :sub-title="permissionMessage"
    >
      <template #extra>
        <div class="action-buttons">
          <el-button
            v-if="configButton"
            type="primary"
            @click="handleGoToConfig"
          >
            {{ configButton }}
          </el-button>
          <el-button @click="handleGoToHelp">
            查看帮助文档
          </el-button>
          <el-button @click="handleGoBack">
            返回上一页
          </el-button>
        </div>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const permissionMessage = ref('您没有访问该页面的权限')
const configButton = ref('')
const configRoute = ref('')
const helpDocUrl = ref('')

onMounted(() => {
  // 从路由参数或状态管理中获取权限信息
  const { message, configText, configPath, helpUrl } = route.query
  
  if (message) {
    permissionMessage.value = message
  }
  if (configText) {
    configButton.value = configText
  }
  if (configPath) {
    configRoute.value = configPath
  }
  if (helpUrl) {
    helpDocUrl.value = helpUrl
  }
})

const handleGoToConfig = () => {
  if (configRoute.value) {
    router.push(configRoute.value)
  } else {
    ElMessage.info('配置页面未设置')
  }
}

const handleGoToHelp = () => {
  if (helpDocUrl.value) {
    window.open(helpDocUrl.value, '_blank')
  } else {
    ElMessage.info('帮助文档链接未设置')
  }
}

const handleGoBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.no-permission-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
