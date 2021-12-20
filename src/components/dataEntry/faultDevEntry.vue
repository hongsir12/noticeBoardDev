<template>
  <div class="com-page-column dataEntryCard">
    <div class="header"></div>
    <div class="body">
      <el-table
        :data="tableData"
        border
        style="width: 100%"
        height="100%"
        slot="empty"
        ref="tableRef"
        :default-sort="{ prop: 'date', order: 'ascending' }"
      >
        <el-table-column
          prop="date"
          label="日期"
          min-width="120"
          sortable
          align="center"
          data-iseditor="false"
        >
        </el-table-column>
        <el-table-column
          prop="device"
          label="设备"
          align="center"
          data-iseditor="false"
        ></el-table-column>
        <el-table-column
          prop="defaultType"
          label="故障类型"
          align="center"
          data-iseditor="false"
        ></el-table-column>
        <el-table-column fixed="right" align="center">
          <template slot="header" slot-scope="">
            <el-button
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="showDialog"
            >
              新增
            </el-button>
          </template>
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              icon="el-icon-edit"
              @click="editData(scope.row.id)"
              >修改</el-button
            >
            <el-button
              type="text"
              size="small"
              icon="el-icon-delete"
              @click="del(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增信息弹框 -->
    <el-dialog title="设备故障信息" :visible.sync="dialogFormVisible">
      <el-form :model="form" ref="form">
        <el-form-item label="故障日期" :label-width="formLabelWidth">
          <el-date-picker
            v-model="form.date"
            align="center"
            type="date"
            placeholder="选择日期"
            :clearable="false"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="设备名称" :label-width="formLabelWidth">
          <el-input v-model="form.device" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="故障类型" :label-width="formLabelWidth">
          <el-select v-model="form.defaultType" placeholder="请选择故障类型">
            <el-option
              v-for="item in defaultType"
              :key="item.value"
              :label="item"
              :value="item"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth">
          <el-button type="primary" @click="onSubmit">确认</el-button>
          <el-button @click="closeDialog">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
export default {
  data() {
    return {
      tableData: [],
      form: {
        date: '',
        device: '',
        defaultType: '',
      },
      defaultType: ['CPU', 'SAS盘', '主板', '软件', '电源'],
      dialogFormVisible: false, //弹框显示状态
      isEditor: false, //弹框是否为修改状态
      editID: null, //当前修改信息ID
      formLabelWidth: '120px',
    }
  },
  props: ['currentWeek'],
  watch: {
    // 监听父组件传来的新周数
    currentWeek: function(newVal) {
      this.getData(this.value)
    },
  },
  mounted() {
    this.getData()
  },

  methods: {
    //获取故障分布数据
    async getData() {
      try {
        let params = {
          report_type: '故障分布数据',
          // 根据当周头末时间查询该周数据
          starttime: this.currentWeek.startOfWeek,
          overtime: this.currentWeek.endOfWeek,
        }
        let data = await this.$request('apiQuery', params, 'post')
        let tableData = []
        if (data.code== 2000) {
          for (let rec of data.data.list) {
            let id = rec.report_id
            rec = JSON.parse(rec.report_data)
            rec.id = id
            tableData.push(rec)
          }
        }
        this.tableData = tableData
      } catch (err) {
        console.log(err)
        this.$message({
          message: '获取数据失败',
          type: 'error',
        })
      }
    },
    // 提交故障数据表单
    async onSubmit() {
      this.form.date = this.$moment(this.form.date).format('YYYY-MM-DD')
      // 新增
      if (!this.isEditor) {
        this.tableData.push(this.form)
        let params = {
          report_type: '故障分布数据',
          report_data: this.form,
          report_time: this.form.date,
        }
        let data = await this.$request('apiInsert', params, 'post')
        if (data.code == 2000) {
          this.$message({
            message: '新增数据成功',
            type: 'success',
          })
          this.getData()
          this.dialogFormVisible = false
        } else {
          this.$message({
            message: '新增数据失败',
            type: 'error',
          })
        }
      } else {
        //修改
        let updateParams = {
          report_id: this.editID,
          report_data: this.form,
          report_time: this.form.date,
        }
        let data = await this.$request('apiUpdate', updateParams, 'post')
        if (data.code == 2000) {
          this.$message({
            message: '修改数据成功',
            type: 'success',
          })
          this.dialogFormVisible = false
          this.isEditor = false
          this.getData()
        } else {
          this.$message({
            message: '修改数据失败',
            type: 'error',
          })
        }
      }
    },
    // 修改故障信息数据
    async editData(id) {
      this.editID = id
      let queryParams = {
        report_id: id,
      }
      let { data } = await this.$request('apiQuery', queryParams, 'post')
      data = JSON.parse(data.list[0].report_data)
      this.$nextTick(function() {
        this.form = data
      })
      this.isEditor = true
      this.dialogFormVisible = true
    },
    // 删除故障信息数据
    async del(id) {
      this.$messageBox
        .confirm('确认删除该数据吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        .then(async () => {
          let params = {
            data: [id],
          }
          let res = await this.$request('apiDelete', params, 'post')
          this.$message({
            type: 'success',
            message: '删除成功!',
          })
          this.getData(this.value)
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除',
          })
        })
    },
    //开启弹框
    showDialog() {
      this.resetForm()
      this.dialogFormVisible = true
    },
    //关闭弹框
    closeDialog() {
      this.isEditor = false
      this.resetForm()
      this.dialogFormVisible = false
    },
    //重置表单
    resetForm() {
      this.form = {
        date: '',
        device: '',
        defaultType: '',
      }
    },
  },
}
</script>
<style lang="less" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px 0 20px;
}
.body {
  flex: 1;
  padding: 10px 20px;
}
</style>
