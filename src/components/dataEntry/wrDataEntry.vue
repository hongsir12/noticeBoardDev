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
          type="primary"
          size="small"
          icon="el-icon-minus"
          @click="userDialog"
          >删除人员</el-button
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
          <template slot-scope="scope">
            <div class="block">
              <el-date-picker
                v-model="scope.row.date"
                align="center"
                type="date"
                placeholder="选择日期"
                :disabled="scope.row.iseditor ? true : false"
                :clearable="false"
                @change="changeDate(scope.row.date, scope.row)"
              >
              </el-date-picker>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="station" label="岗位" align="center">
          <template slot-scope="scope">
            <input
              type="text"
              v-model="scope.row.station"
              v-show="scope.row.iseditor"
            />
            <span v-show="!scope.row.iseditor">{{ scope.row.station }}</span>
            <!-- <el-select v-model="stationValue" placeholder="请选择">
              <el-option
                v-for="item in stationOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select> -->
          </template>
        </el-table-column>
        <el-table-column prop="workOrder" label="工单号" align="center">
          <template slot-scope="scope">
            <input
              type="text"
              v-model="scope.row.workOrder"
              v-show="scope.row.iseditor"
            />
            <span v-show="!scope.row.iseditor">{{ scope.row.workOrder }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tasks" label="工作内容" align="center">
          <template slot-scope="scope">
            <input
              type="text"
              v-model="scope.row.tasks"
              v-show="scope.row.iseditor"
            />
            <span v-show="!scope.row.iseditor">{{ scope.row.tasks }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="time"
          label="开始和结束时间"
          min-width="200"
          align="center"
        >
          <template slot-scope="scope">
            <div class="block">
              <el-date-picker
                v-model="scope.row.time"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :disabled="scope.row.iseditor ? true : false"
                :clearable="false"
                @change="changeTime(scope.row.time, scope.row)"
              >
              </el-date-picker>
            </div>
          </template>
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
              v-show="!scope.row.iseditor"
              @click="edit(scope.row, scope)"
              >修改</el-button
            >
            <el-button
              type="text"
              size="small"
              icon="el-icon-check"
              v-show="scope.row.iseditor"
              @click="save(scope.row, scope)"
              >保存</el-button
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
  </div>
</template>
<script>
export default {
  data() {
    return {
      allData: [],
      tableData: [], // 表格数据
      options: [], // 人员选择下拉框
      stationOptions: [], //岗位选择下拉框
      value: '',
      stationValue: '',
      dialogVisible: false,
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
            let userData = JSON.parse(JSON.parse(querydata.data.list[0].report_data).user)
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
        .catch((e) => {
          console.log(e);
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
      //将历史配置名称存到 currentOptionRadio
      this.currentOptionRadio = res
    },
    // 历史配置弹框点击确认
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
    // 获取表格数据
    async getData(name) {
      let data = []
      console.log(this.currentWeek);
      try {
        let params = {
          report_type: '人员周报数据',
          conditions: [{ name: name }],
          // 根据当周头末时间查询该周数据
          starttime: this.currentWeek.startOfWeek,
          overtime: this.currentWeek.endOfWeek,
        }
        let res = await this.$request('apiQuery', params, 'post')
        // console.log(res);
        res = res.data.list
        // 将唯一id和处于编辑状态添加到属性中
        for (let rec of res) {
          let id = rec.report_id
          rec = JSON.parse(rec.report_data)
          if (typeof rec.time == 'string') {
            rec.time = JSON.parse(rec.time)
          }
          rec.iseditor = false
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
    async edit(row) {
      row.iseditor = true
      // this.changeTime()
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
      // 计算工作时长
      let startTime = this.$moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      let endTime = this.$moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      let workHours = (
        this.$moment(endTime).unix() - this.$moment(startTime).unix()
      ).toHHmmss()
      // 新增数据的日期默认为当天日期
      let date = this.$moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      // 要插入的数据格式
      let obj = {
        name: this.value,
        date: date,
        station: '',
        workOrder: '',
        tasks: '',
        time: [startTime, endTime],
        workHours: workHours,
      }
      let params = {
        report_type: '人员周报数据',
        report_data: obj,
        report_time: date,
      }
      let data = await this.$request('apiInsert', params, 'post')
      // console.log(data);
      obj.iseditor = false
      this.tableData.push(obj)
      this.getData(this.value)
      // 更新完表格数据，用doLayout重新加载表格
      this.$nextTick(() => {
        this.$refs.tableRef.doLayout()
      })
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
</style>
