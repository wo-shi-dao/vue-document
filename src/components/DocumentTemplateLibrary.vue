<template>
  <div class="document-template-library">
    <div v-if="!showTemplateMaintenance">
      <div class="table-head">
        <el-button type="primary" @click="handleShowCreateTemplateDialog">
          新建模板库
        </el-button>
        <DateTimeRangeFilter :category="category" @search="handleSearch" />
      </div>
      <el-table
        :data="filteredTemplateList"
        style="width: 100%"
        border
        v-loading="templateLoading"
      >
        <el-table-column prop="name" label="文档模板库名称" min-width="180" />
        <el-table-column prop="department" label="所属部门" min-width="150" />
        <el-table-column prop="creator" label="创建人" min-width="120" />
        <el-table-column prop="updater" label="更新人" min-width="120" />
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleGoToMaintenance(row)">
              前去维护
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="templatePagination.current"
        v-model:page-size="templatePagination.size"
        :total="templatePagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleTemplatePageSizeChange"
        @current-change="handleTemplatePageChange"
      />
    </div>
    <DepartmentDocumentManagement
      v-else
      :template-name="selectedTemplateName"
      :template-id="selectedTemplateId"
      :department-id="selectedTemplateDepartment"
      @back="handleBackToTemplateList"
    />

    <!-- 新建模板库弹窗 -->
    <el-dialog
      v-model="showCreateTemplateDialog"
      title="新建模板库"
      width="500px"
    >
      <el-form
        :model="templateForm"
        :rules="templateRules"
        ref="templateFormRef"
        label-width="120px"
      >
        <el-form-item label="文档模板库名称" prop="name">
          <el-input
            v-model="templateForm.name"
            placeholder="请输入文档模板库名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-select
            v-model="templateForm.department"
            placeholder="请选择所属部门"
            style="width: 100%"
          >
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTemplate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import DateTimeRangeFilter from "./DateTimeRangeFilter.vue";
import DepartmentDocumentManagement from "./DepartmentDocumentManagement.vue";

const showTemplateMaintenance = ref(false);
const selectedTemplateName = ref("");
const selectedTemplateId = ref("");
const selectedTemplateDepartment = ref("");

const templateLoading = ref(false);
const templateList = ref([
  {
    id: "1",
    name: "科技和信息化部文档库",
    department: "科技和信息化部",
    creator: "admin",
    updater: "admin",
  },
  {
    id: "2",
    name: "制动开发部文档库",
    department: "制动开发部",
    creator: "张三",
    updater: "张三",
  },
  {
    id: "3",
    name: "交流传动开发部文档库",
    department: "交流传动开发部",
    creator: "李四",
    updater: "李四",
  },
]);

const category = ref([
  {
    label: "文档模板库名称",
    field: "templateName",
    type: "textInput",
    group: "Basic",
  },
]);

const templatePagination = reactive({
  current: 1,
  size: 10,
  total: 3,
});

const departmentOptions = [
  { id: "1", name: "科技和信息化部" },
  { id: "2", name: "制动开发部" },
  { id: "3", name: "交流传动开发部" },
  { id: "4", name: "网络控制开发部" },
  { id: "5", name: "数智赋能中心" },
  { id: "6", name: "基础开发部" },
  { id: "7", name: "安全监测开发部" },
];

const showCreateTemplateDialog = ref(false);
const templateFormRef = ref(null);
const templateForm = reactive({
  name: "",
  department: "",
});
const templateRules = {
  name: [{ required: true, message: "请输入文档模板库名称", trigger: "blur" }],
  department: [
    { required: true, message: "请选择所属部门", trigger: "change" },
  ],
};

const filteredTemplateList = templateList.value;

const handleShowCreateTemplateDialog = () => {
  templateForm.name = "";
  templateForm.department = "";
  showCreateTemplateDialog.value = true;
};

const handleCreateTemplate = async () => {
  try {
    await templateFormRef.value.validate();
    const newTemplate = {
      id: Date.now().toString(),
      name: templateForm.name,
      department: templateForm.department,
      creator: "admin",
      updater: "admin",
    };
    templateList.value.push(newTemplate);
    templatePagination.total = templateList.value.length;
    ElMessage.success("新建模板库成功");
    showCreateTemplateDialog.value = false;
  } catch (error) {
    if (error !== false) {
      ElMessage.error("新建模板库失败");
    }
  }
};

const handleSearch = (selectedTags) => {
  console.log("selectedTags", selectedTags);
  // pagination.current = 1;
  // loadDocumentList();
};

const handleGoToMaintenance = (row) => {
  selectedTemplateName.value = row.name;
  selectedTemplateId.value = row.id;
  const dept = departmentOptions.find((d) => d.name === row.department);
  selectedTemplateDepartment.value = dept ? dept.id : "";
  showTemplateMaintenance.value = true;
};

const handleBackToTemplateList = () => {
  showTemplateMaintenance.value = false;
  selectedTemplateName.value = "";
  selectedTemplateId.value = "";
  selectedTemplateDepartment.value = "";
};

const handleTemplatePageSizeChange = () => {
  templatePagination.current = 1;
};

const handleTemplatePageChange = () => {
  // 可以在这里添加加载逻辑
};
</script>

<style lang="scss" scoped>
.document-template-library {
  .table-head {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
