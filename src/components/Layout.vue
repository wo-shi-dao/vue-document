<template>
  <div class="layout-container">
    <el-container v-if="route?.meta?.type === 'pageOffice'">
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
    <el-container v-else>
      <el-header class="layout-header">
        <div class="header-left">
          <h1 class="app-title">文档管理系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span>用户名</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <el-aside width="200px" class="layout-aside">
          <el-menu :default-active="activeMenu" router class="side-menu">
            <el-menu-item index="/document-management">
              <el-icon><Document /></el-icon>
              <span>文档管理</span>
            </el-menu-item>
            <el-menu-item index="/document-import">
              <el-icon><Upload /></el-icon>
              <span>文档导入</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { User, Document, Upload, FolderAdd } from "@element-plus/icons-vue";

const route = useRoute();
console.log("route", route);

const activeMenu = computed(() => {
  return route.path;
});
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #444b61;
  color: white;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 20px;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: white;
}

.layout-aside {
  background-color: #fff;
  border-right: 1px solid #dcdfe6;
}

.side-menu {
  border-right: none;
}

.layout-main {
  background-color: #f5f7fa;
  padding: 0;
}
</style>
