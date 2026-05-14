<template>
  <div class="page-nav">
    <p><span class="nav-firstTitle">文档管理 / </span> <span>文档导出</span></p>
  </div>
  <div class="document-management-container">
    <d-tabs type="wrapped" v-model="activeTab" class="content-tabs">
      <d-tab id="content" class="tab-panal" title="文档内容">
        <DocumentContentList
          ref="documentContentRef"
          :isCreateDocument="isCreateDocument"
          @update-isCreate="handleCreateDocument"
          @open-create-doc="openCreateDoc"
        />
      </d-tab>

      <d-tab id="history" class="tab-panal" title="历史记录">
        <DocumentHistoryList />
      </d-tab>

      <d-tab id="template" class="tab-panal" title="文档库模板">
        <DocumentTemplateLibrary />
      </d-tab>
    </d-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import DocumentContentList from "../components/DocumentContentList.vue";
import DocumentHistoryList from "../components/DocumentHistoryList.vue";
import DocumentTemplateLibrary from "../components/DocumentTemplateLibrary.vue";

const router = useRouter();
const route = useRoute();
const activeTab = ref("content");
const documentContentRef = ref(null);

const isCreateDocument = ref(false);

const handleCreateDocument = (newValue) => {
  isCreateDocument.value = newValue;
};

const checkRouteAndInit = async () => {
  await nextTick();
  if (route.query?.created === "finish") {
    documentContentRef.value?.setCreateTemplate(true);
  }
};

onMounted(() => {
  checkRouteAndInit();
});

watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === "content") {
      checkRouteAndInit();
    }
  },
);

const openCreateDoc = () => {
  router.push("/init-document");
};
</script>

<style lang="scss" scoped>
.document-management-container {
  background-color: #f3f3f3;
  min-height: calc(100vh - 92px);
}

.content-tabs :deep(.devui-tabs__nav) {
  padding-top: 4px;
  padding-left: 4px;
  margin-bottom: -1px;

  .active a {
    color: #252b3a;
  }
}

.tab-panal {
  padding: 12px 20px 0;
  margin: 0;
}

.page-nav {
  background: #fff;
  height: 32px;
  font-size: 14px;
  padding: 0 16px;
  line-height: 32px;

  .nav-firstTitle {
    color: #777777;
  }
}
</style>
