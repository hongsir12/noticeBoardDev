<template>
  <div class="com-page-column dataEntryCard">
    <div class="header">
      <el-select
        v-model="value"
        placeholder="请选择"
        @change="changeOption(value)"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
      <el-button-group>
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="addUser"
          >添加人员</el-button
        >
        <el-button
          type="danger"
          size="small"
          icon="el-icon-minus"
          @click="userDialog"
          >删除人员</el-button
        >
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
      </el-button-group>
    </div>
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
        <el-table-column prop="station" label="岗位" align="center">
        </el-table-column>
        <el-table-column prop="workOrder" label="工单号" align="center">
        </el-table-column>
        <el-table-column prop="tasks" label="工作内容" align="center">
        </el-table-column>
        <el-table-column prop="startWorkTime" label="开始时间" align="center">
        </el-table-column>
        <el-table-column prop="endWorkTime" label="结束时间" align="center">
        </el-table-column>
        <el-table-column prop="workHours" label="作业时长" align="center">
        </el-table-column>
        <el-table-column fixed="right" align="center">
          <template slot="header" slot-scope="">
            <el-button
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="addWeeklyReport"
              >新增</el-button
            >
          </template>
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              icon="el-icon-edit"
              @click="edit(scope.row.id)"
              >修改</el-button
            >
            <el-button
              type="text"
              size="small"
              icon="el-icon-delete"
              @click="del(scope.row, scope)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 人员管理弹框 -->
    <el-dialog
      title="人员管理"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose"
      custom-class="dialogWidth"
    >
      <template>
        <el-radio-group v-model="currentOptionRadio">
          <el-radio
            v-for="(item, index) in options"
            :key="index"
            :label="item.value"
            border
            @change="radioChange"
          ></el-radio>
        </el-radio-group>
      </template>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="chooseOption">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 新增信息弹框 -->
    <el-dialog
      title="新增工单信息"
      width="30%"
      :visible.sync="dialogFormVisible"
    >
      <el-form :model="form" ref="form" :rules="rules">
        <el-form-item label="日期" prop="date" :label-width="formLabelWidth">
          <el-date-picker
            v-model="form.date"
            align="center"
            type="date"
            placeholder="选择日期"
            :clearable="false"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item
          label="岗位"
          prop="station"
          :label-width="formLabelWidth"
          required
        >
          <el-input v-model="form.station" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item
          label="工单号"
          prop="workOrder"
          :label-width="formLabelWidth"
          required
        >
          <el-input v-model="form.workOrder" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item
          label="工作内容"
          prop="tasks"
          :label-width="formLabelWidth"
          required
        >
          <el-input
            v-model="form.tasks"
            type="textarea"
            autosize
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item
          label="工作时间"
          prop="workTime"
          :label-width="formLabelWidth"
        >
          <el-date-picker
            v-model="form.workTime"
            align="center"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :clearable="false"
          >
          </el-date-picker>
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
import { copyTransFunc } from '@/utils/formatDataKey.js'
import { getObjectDiff } from '@/utils/getObjectDiff.js'
import _ from 'lodash'
export default {
  data() {
    return {
      tableData: [], // 表格数据
      excelData: [], //excel数据
      form: {
        //表单数据
        name: '',
        date: '',
        station: '',
        workOrder: '',
        tasks: '',
        workTime: [],
        workHours: '',
      },
      rules: {
        date: [{ required: true, message: '请选择日期', trigger: 'change' }],
        station: [{ required: true, message: '岗位不能为空', trigger: 'blur' }],
        workOrder: [
          { required: true, message: '工单号不能为空', trigger: 'blur' },
        ],
        tasks: [
          { required: true, message: '工作内容不能为空', trigger: 'blur' },
        ],
        workTime: [
          {
            type: 'array',
            required: true,
            message: '请选择工作时间',
            trigger: 'change',
          },
        ],
      },
      options: [], // 人员选择下拉框
      value: '', //当前选择框人员名
      stationValue: '',
      dialogVisible: false,
      dialogFormVisible: false,
      formLabelWidth: '120px',
      isEditor: false, //判断新增还是修改
      editID: null, //当前修改信息ID
      // 选中的要被删除人员
      currentOptionRadio: '',
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
    this.getUser()
  },

  methods: {
    // 获取员工数据
    async getUser() {
      let params = {
        report_type: '人员周报员工数据',
      }
      let data = await this.$request('apiQuery', params, 'post')
      let userData = JSON.parse(JSON.parse(data.data.list[0].report_data).user)
      // 将员工名字保存到下拉框中
      this.options = userData.map(item => {
        item = { value: item, label: item }
        return item
      })
      this.value = this.options[0].value
      this.changeOption(this.value)
    },
    // 添加员工
    addUser() {
      this.$messageBox
        .prompt('', '请输入名字', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
        .then(async ({ value }) => {
          // 点击添加员工时，先查找“人员周报员工数据”表的id
          let queryParams = {
            report_type: '人员周报员工数据',
          }
          let querydata = await this.$request('apiQuery', queryParams, 'post')
          // 查找到的数据条数
          let flag = querydata.data.total
          // 如果为0，说明没有该表，则插入
          if (!flag) {
            let params = {
              data: [
                {
                  report_type: '人员周报员工数据',
                  report_data: {
                    user: [],
                  },
                  report_time: new Date().format('yyyy-MM-dd hh:mm:ss'),
                },
              ],
            }
            let { data } = await this.$request('apiInsert', params, 'post')
          } else {
            // 如果存在，则获取该表唯一id
            let id = querydata.data.list[0].report_id
            // 获取用户数据
            let userData = JSON.parse(
              JSON.parse(querydata.data.list[0].report_data).user
            )
            for (let rec of userData) {
              // 如果新增的用户名重复，则返回
              if (value === rec) {
                this.$message({
                  message: '用户已存在',
                  type: 'info',
                })
                // 跳转至重复用户名
                this.changeOption(value)
                return
              }
            }
            // 往用户数据里追加新用户,当作参数请求更新数据
            userData.push(value)
            // console.log(userData)
            let updateUserParams = {
              report_id: id,
              report_data: {
                user: userData,
              },
            }
            let res = await this.$request('apiUpdate', updateUserParams, 'post')
            this.options = userData.map(item => {
              item = { value: item, label: item }
              return item
            })
            this.value = value
            this.changeOption(this.value)
          }

          this.$message({
            message: '用户录入成功',
            type: 'success',
          })
        })
        .catch(e => {
          console.log(e)
          this.$message({
            message: '已取消',
            type: 'info',
          })
        })
    },
    // 人员管理弹框显示状态
    userDialog() {
      this.dialogVisible = true
    },
    radioChange(res) {
      //将选中人员存到 currentOptionRadio
      this.currentOptionRadio = res
    },
    // 删除人员弹框点击确认
    chooseOption() {
      this.$messageBox
        .confirm('确认删除该人员？')
        .then(async _ => {
          let params = {
            report_type: '人员周报员工数据',
          }
          let data = await this.$request('apiQuery', params, 'post')
          let id = data.data.list[0].report_id
          let userData = JSON.parse(
            JSON.parse(data.data.list[0].report_data).user
          )
          userData.splice(userData.indexOf(this.currentOptionRadio), 1)
          let updateParams = {
            report_id: id,
            report_data: {
              user: userData,
            },
          }
          let res = await this.$request('apiUpdate', updateParams, 'post')
          this.$message({
            message: '删除成功',
            type: 'success',
          })
          this.getUser()
          this.dialogVisible = false
        })
        .catch(_ => {})
    },
    // 关闭删除人员弹出框
    handleClose(done) {
      this.$messageBox
        .confirm('确认关闭？')
        .then(_ => {
          this.dialogVisible = false
          this.$message({
            message: '关闭成功',
            type: 'success',
          })
        })
        .catch(_ => {})
    },
    // 改变人员下拉框选项值时
    changeOption(value) {
      // 获取点击的用户数据
      this.value = value
      this.getData(value)
    },
    // 点击上传按钮获取excel表数据
    handleSelectedFile(convertedData) {
      this.excelData = convertedData.body
      this.importExcel()
    },
    // 导入excel数据
    importExcel() {
      if (this.excelData.length <= 0) {
        this.$message({
          message: '无新增数据',
          type: 'warning',
        })
      } else {
        let keyMapping = [
          { key: '日期', value: 'date' },
          { key: '岗位', value: 'station' },
          { key: '工单号', value: 'workOrder' },
          { key: '工作内容', value: 'tasks' },
          { key: '工作时长', value: 'workHours' },
          { key: '开始时间', value: 'startWorkTime' },
          { key: '结束时间', value: 'endWorkTime' },
        ]
        // 更改excel数据属性名
        this.excelData = copyTransFunc(this.excelData, keyMapping)
        for (let rec of this.excelData) {
          rec.name = this.value
          rec.startWorkTime = this.$moment(rec.startWorkTime).format('YYYY-MM-DD hh:mm:ss')
          rec.endWorkTime = this.$moment(rec.endWorkTime).format('YYYY-MM-DD hh:mm:ss')
          rec.workHours = (
            this.$moment(rec.endWorkTime).unix() - this.$moment(rec.startWorkTime).unix()
          ).toHHmmss()
        }
        this.insertData(this.excelData, '人员周报数据')
      }
    },
    async insertData(xlsxData, report_type) {
      try {
        let tableData = []
        // 排除表格数据的id属性和workTime属性，存到tableData中
        for (let rec of this.tableData) {
          rec = _.omit(rec, ['id', 'workTime'])
          tableData.push(rec)
        }
        // 比较excel数据和表格数据，获得新增数据对象
        let newDataArr = getObjectDiff(xlsxData, tableData)
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
          this.getData(this.value)
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
      } catch (error) {
        console.log(error)
        this.$message({
          message: '出现错误',
          type: 'danger',
        })
      }
    },
    // 下载导出表格
    async downloadExcel() {
      let excelData = []
      for (let rec of this.tableData) {
        rec = _.omit(rec, ['workTime', 'id', 'name','workHours'])
        excelData.push(rec)
      }
      const header = [
        'date',
        'station',
        'workOrder',
        'tasks',
        'startWorkTime',
        'endWorkTime',
      ]
      const headerName = {
        date: '日期',
        station: '岗位',
        workOrder: '工单号',
        tasks: '工作内容',
        startWorkTime: '开始时间',
        endWorkTime: '结束时间',
      }
      json2Excel(excelData, header, headerName, this.value + '周报表')
    },
    // 获取表格数据
    async getData(name) {
      let data = []
      try {
        let params = {
          report_type: '人员周报数据',
          conditions: [{ name: name }],
          // 根据当周头末时间查询该周数据
          starttime: this.currentWeek.startOfWeek,
          overtime: this.currentWeek.endOfWeek,
        }
        let res = await this.$request('apiQuery', params, 'post')
        res = res.data.list
        // 将唯一id和处于编辑状态添加到属性中
        for (let rec of res) {
          let id = rec.report_id
          rec = JSON.parse(rec.report_data)
          rec.id = id
          data.push(rec)
        }
        this.tableData = data
      } catch (error) {
        console.log(error)
        this.tableData = []
        this.$message({
          message: '尚未录入该周数据',
          type: 'info',
        })
      }
    },
    // 点击修改数据按钮
    async edit(id) {
      this.editID = id
      let queryParams = {
        report_id: id,
      }
      let { data } = await this.$request('apiQuery', queryParams, 'post')
      data = JSON.parse(data.list[0].report_data)
      data.workTime = [data.startWorkTime, data.endWorkTime]
      this.form = data
      this.isEditor = true
      this.dialogFormVisible = true
    },
    // 点击保存数据按钮
    async save(row) {
      //计算工作时长
      let startTime = row.time[0]
      let endTime = row.time[1]
      let workHours = (
        this.$moment(endTime).unix() - this.$moment(startTime).unix()
      ).toHHmmss()
      let params = {
        report_id: row.id,
        report_data: {
          date: row.date,
          name: row.name,
          tasks: row.tasks,
          station: row.station,
          time: row.time,
          workOrder: row.workOrder,
          workHours: workHours,
        },
      }
      let res = await this.$request('apiUpdate', params, 'post')
      // console.log(res);
      row.iseditor = false
      //   this.getData(this.value)
      this.$message({
        message: '修改成功',
        type: 'success',
      })
    },
    // 点击删除数据按钮
    del(row) {
      this.$messageBox
        .confirm('确认删除该数据吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        .then(async () => {
          let params = {
            data: [row.id],
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
    // 更改填写周报的日期
    async changeDate(value, row) {
      value = this.$moment(value).format('YYYY-MM-DD HH:mm:ss')
      //更新数据
      let updateParams = {
        report_id: row.id,
        report_data: {
          date: value,
        },
        report_time: value,
      }
      let data = await this.$request('apiUpdate', updateParams, 'post')
      this.$message({
        message: '修改日期成功',
        type: 'success',
      })
      this.getData(this.value)
    },
    // 更改起始时间和结束时间
    async changeTime(value, row) {
      let time = []
      for (let rec of value) {
        rec = this.$moment(rec).format('YYYY-MM-DD HH:mm:ss')
        time.push(rec)
      }
      value.splice(0, 2, ...time)
      //更新数据
      let startTime = value[0]
      let endTime = value[1]
      let workHours = (
        this.$moment(endTime).unix() - this.$moment(startTime).unix()
      ).toHHmmss()
      let updateParams = {
        report_id: row.id,
        report_data: {
          time: value,
          workHours: workHours,
        },
      }
      let res = await this.$request('apiUpdate', updateParams, 'post')
      this.save(row)
      this.getData(this.value)
    },
    // 新增周报数据
    async addWeeklyReport() {
      this.resetForm()
      this.dialogFormVisible = true
    },
    // 提交人员工单信息表单
    onSubmit() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          this.form.date = this.$moment(this.form.date).format('YYYY-MM-DD')
          this.form.name = this.value
          this.form.startWorkTime = this.$moment(this.form.workTime[0]).format(
            'YYYY-MM-DD HH:mm:ss'
          )
          this.form.endWorkTime = this.$moment(this.form.workTime[1]).format(
            'YYYY-MM-DD HH:mm:ss'
          )
          this.form.workHours = (
            this.$moment(this.form.endWorkTime).unix() -
            this.$moment(this.form.startWorkTime).unix()
          ).toHHmmss()
          // 新增数据
          if (!this.isEditor) {
            this.tableData.push(this.form)
            let params = {
              report_type: '人员周报数据',
              report_data: this.form,
              report_time: this.form.date,
            }
            let data = await this.$request('apiInsert', params, 'post')
            if (data.code == 2000) {
              this.getData(this.value)
              this.dialogFormVisible = false
              this.$message({
                message: '新增数据成功',
                type: 'success',
              })
            } else {
              this.$message({
                message: '新增数据失败',
                type: 'error',
              })
            }
          } else {
            // 修改
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
              this.getData(this.value)
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
        station: '',
        workOrder: '',
        tasks: '',
        workTime: [],
        workHours: '',
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
  input {
    width: 100px;
    text-align: center;
    outline-style: none;
    border: 1px solid #ccc;
    border-radius: 3px;
    font-size: 14px;
  }
  input:focus {
    border-color: #66afe9;
    outline: 0;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
      0 0 8px rgba(102, 175, 233, 0.6);
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
      0 0 8px rgba(102, 175, 233, 0.6);
  }
}
.dialogWidth {
  width: 60%;
}
/deep/ .el-radio-group {
  display: flex;
  flex-direction: column;
}
/deep/ .el-radio.is-bordered {
  margin-left: 10px;
}
/deep/ .el-cascader-node > .el-radio,
.el-radio:last-child {
  margin-right: 30px;
}
/deep/ .xlsx-button {
  border: 0px solid hsl(206, 100%, 56%);
  padding: 0;
  border-radius: 3px;
}
</style>
