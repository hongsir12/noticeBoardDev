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
            <el-button
              type="warning"
              size="small"
              icon="el-icon-download"
              @click="downloadExcel"
            >
              下载表格
            </el-button>
            <vue-xlsx-table @on-select-file="handleSelectedFile"
              ><el-button
                type="success"
                size="small"
                icon="el-icon-upload2"
                title="导入表格"
                >导入表格</el-button
              ></vue-xlsx-table
            >
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
      <el-form :model="form" ref="form" :rules="rules">
        <el-form-item label="故障日期" prop="date" :label-width="formLabelWidth" required>
          <el-date-picker
            v-model="form.date"
            align="center"
            type="date"
            placeholder="选择日期"
            :clearable="false"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item required label="设备名称" prop="device" :label-width="formLabelWidth">
          <el-input v-model="form.device" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="故障类型"  prop="defaultType" :label-width="formLabelWidth">
          <el-select v-model="form.defaultType" placeholder="请选择故障类型" required>
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
import { json2Excel } from '@/utils/json2Excel.js'
export default {
  data() {
    return {
      tableData: [], // 表格数据
      excelData: [], // excel数据
      form: {
        // 表单数据
        date: '',
        device: '',
        defaultType: '',
      },
      rules: {
        date: [{ required: true, message: '请选择日期', trigger: 'change' }],
        device: [
          { required: true, message: '设备名称不能为空', trigger: 'blur' },
        ],
        defaultType: [
          { required: true, message: '故障类型不能为空', trigger: 'change' },
        ]
      },
      defaultType: ['CPU', 'SAS盘', '主板', '软件', '电源', '控制器', '其他'],
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
        if (data.code == 2000) {
          for (let rec of data.data.list) {
            let id = rec.report_id
            rec = JSON.parse(rec.report_data)
            rec.id = id
            tableData.push(rec)
          }
        }
        this.tableData = tableData
        // console.log(this.tableData);
      } catch (err) {
        console.log(err)
        this.$message({
          message: '获取数据失败',
          type: 'error',
        })
      }
    },
    // 提交故障数据表单
    onSubmit() {
      this.$refs.form.validate(async valid => {
        if (valid) {
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
              console.log(data);
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
        } else {
          return false
        }
      })
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
    // 点击上传按钮获取excel表数据
    handleSelectedFile(convertedData) {
      this.excelData = convertedData.body
      this.importExcel()
    },
    // 导入excel数据
    importExcel() {
      // 获取excel数据
      let data = this.excelData
      if (data.length <= 0) {
        this.$message({
          message: '无新增数据',
          type: 'warning',
        })
      } else {
        data.forEach((item, index) => {
          data[index] = {
            date: item['故障日期'],
            defaultType: item['故障类型'],
            device: item['存储'],
          }
        })
        this.insertData(data, '故障分布数据')
      }
    },
    async insertData(xlsxData, report_type) {
      try {
        let queryParams = {
          report_type: report_type,
        }
        let data = await this.$request('apiQuery', queryParams, 'post')
        // console.log(data)
        let tableData = [] //存放查询到的全部数据
        if (data.code == 2000) {
          for (let rec of data.data.list) {
            let id = rec.report_id
            rec = JSON.parse(rec.report_data)
            rec.id = id
            tableData.push(rec)
          }
          for (let xlsxRec of xlsxData) {
            xlsxRec.date = this.$moment(xlsxRec.date).format('YYYY-MM-DD')
          }
          // 存放新增的数据
          let newDataArr = xlsxData.filter(
            item =>
              !tableData.some(
                ele =>
                  ele.date === item.date &&
                  ele.device === item.device &&
                  ele.defaultType === item.defaultType
              )
          )
          let addArr = []
          for (let rec of newDataArr) {
            let obj = {
              report_type: report_type,
              report_data: rec,
              report_time: rec.date,
            }
            rec = obj
            addArr.push(rec)
          }
          let insertParams = {
            data: addArr,
          }
          let res = await this.$request('apiInsert', insertParams, 'post')
          if (res.code == 2000) {
            this.getData()
            this.$message({
              message: '新增数据成功',
              type: 'success',
            })
          } else {
            this.$message({
              message: '无新增数据',
              type: 'info',
            })
          }
        }
      } catch (error) {
        console.log(error)
      }
    },
    // 下载导出表格
    async downloadExcel() {
      let queryParams = {
        report_type: '故障分布数据',
      }
      let data = await this.$request('apiQuery', queryParams, 'post')
      let allFdData = data.data.list
      let ExcelData = []
      for (let rec of allFdData) {
        rec = JSON.parse(rec.report_data)
        ExcelData.push(rec)
      }
      const header = ['date', 'defaultType', 'device']
      const headerName = {
        date: '故障日期',
        defaultType: '故障类型',
        device: '存储',
      }
      json2Excel(ExcelData, header, headerName, '故障分布数据表')
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
      if (this.$refs.form !== undefined) {
        this.$refs.form.resetFields()
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
/deep/ .xlsx-button {
  border: 0px solid hsl(206, 100%, 56%);
  padding: 0;
  border-radius: 3px;
}
</style>
