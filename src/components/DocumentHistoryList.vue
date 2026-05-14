<template>
  <div class="document-history-list">
    <div class="table-head">
      <DateTimeRangeFilter :category="category" @search="handleSearch" />
    </div>
    <el-table
      :data="historyList"
      style="width: 100%"
      border
      v-loading="loading"
    >
      <el-table-column prop="name" label="文档名称" min-width="180" />
      <el-table-column prop="creator" label="创建人" min-width="120" />
      <el-table-column prop="createTime" label="创建时间" min-width="180" />
      <el-table-column prop="type" label="文档类型" min-width="120" />
      <el-table-column prop="modifier" label="修改人" min-width="120" />
      <el-table-column prop="modifyTime" label="修改时间" min-width="180" />
      <el-table-column label="状态" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'success'" type="success">成功</el-tag>
          <el-tag v-else-if="row.status === 'processing'" type="warning"
            >处理中</el-tag
          >
          <el-tag v-else-if="row.status === 'failed'" type="danger"
            >失败</el-tag
          >
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import DateTimeRangeFilter from "./DateTimeRangeFilter.vue";

const props = defineProps({
  data: {
    type: Array,
    default: null,
  },
});

const loading = ref(false);
const historyList = ref([]);

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

const category = ref([
  {
    label: "文档名称",
    field: "name",
    type: "textInput",
    group: "Basic",
  },
]);

const mockHistoryList = [
  {
    id: "d3",
    name: "设计文档.docx",
    type: "IR",
    isFolder: false,
    creator: "赵六",
    createTime: "2025-01-06",
    modifier: "赵六",
    modifyTime: "2025-01-06",
    parentId: "f2",
    status: "success",
  },
  {
    id: "d3",
    name: "需求文档.docx",
    type: "docx",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-06",
    modifier: "孙七",
    modifyTime: "2025-01-06",
    parentId: "f2",
    status: "processing",
  },
  {
    id: "d3",
    name: "测试用例.docx",
    type: "docx",
    isFolder: false,
    creator: "王五",
    createTime: "2025-01-06",
    modifier: "王五",
    modifyTime: "2025-01-06",
    parentId: "f2",
    status: "failed",
  },
];

const handleSearch = (selectedTags) => {
  console.log("selectedTags", selectedTags);
  // pagination.current = 1;
  // loadHistoryList();
};

onMounted(() => {
  loadHistoryList();
});

const loadHistoryList = async () => {
  loading.value = true;
  try {
    if (props.data) {
      historyList.value = props.data;
    } else {
      historyList.value = mockHistoryList;
    }
    pagination.total = historyList.value.length;
  } catch (error) {
    ElMessage.error("获取历史记录失败");
  } finally {
    loading.value = false;
  }
};

const handlePageSizeChange = () => {
  pagination.current = 1;
  loadHistoryList();
};

const handlePageChange = () => {
  loadHistoryList();
};
</script>

<style lang="scss" scoped>
.document-history-list {
  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }

  .table-head {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
  }
}
</style>
