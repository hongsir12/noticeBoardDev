<template>
  <div class="com-page-column dataEntryCard">
    <!-- 头部标题 -->
    <div class="header">
      <span>资源使用情况</span>
      <el-button
        type="primary"
        size="small"
        icon="el-icon-plus"
        :disabled="tableData.length >= 7 ? true : false"
        @click="addDevData"
        >新增</el-button
      >
    </div>
    <!-- 内容主体 -->
    <div class="body">
      <!-- 左侧周报区 -->
      <div class="left">
        <el-card class="box-card">
          <div slot="header" class="clearfix boardHeader">
            <span>周报</span>
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
          </div>
          <el-input
            type="textarea"
            placeholder="请输入内容"
            v-model="textarea1"
          >
          </el-input>
          <el-button type="primary" class="saveBtn" @click="saveReport"
            >保存</el-button
          >
        </el-card>
      </div>
      <!-- 右侧表格区 -->
      <div class="right">
        <el-table
          :data="tableData"
          border
          show-summary
          style="width: 100%"
          height="99.8%"
          ref="tableRef"
        >
          <el-table-column
            prop="date"
            label="日期"
            width="180"
            sortable
            align="center"
            data-iseditor="false"
          >
          </el-table-column>
          <el-table-column
            prop="user"
            label="录入员"
            width="180"
            align="center"
          >
          <template slot-scope="scope">
              <input
                type="text"
                v-model="scope.row.user"
                v-show="scope.row.iseditor"
              />
              <span v-show="!scope.row.iseditor">{{ scope.row.user }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="total" label="总量" align="center">
            <template slot-scope="scope">
              <input
                type="number"
                v-model="scope.row.total"
                v-show="scope.row.iseditor"
              />
              <span v-show="!scope.row.iseditor">{{ scope.row.total }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="used" label="已使用" align="center">
            <template slot-scope="scope">
              <input
                type="number"
                v-model="scope.row.used"
                v-show="scope.row.iseditor"
              />
              <span v-show="!scope.row.iseditor">{{ scope.row.used }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="consumed" label="消耗" align="center">
            <template slot-scope="scope">
              <input
                type="number"
                v-model="scope.row.consumed"
                v-show="scope.row.iseditor"
              />
              <span v-show="!scope.row.iseditor">{{ scope.row.consumed }}</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" align="center">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                icon="el-icon-edit"
                @click="edit(scope.row, scope)"
                v-show="!scope.row.iseditor"
                >修改</el-button
              >
              <el-button
                type="text"
                size="small"
                icon="el-icon-check"
                @click="save(scope.row, scope)"
                v-show="scope.row.iseditor"
                >保存</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      tableData: [], // 表格数据
      // 下拉框选项
      options: [
        {
          value: 'CPU(核)',
          label: 'CPU(核)',
        },
        {
          value: '内存(GB)',
          label: '内存(GB)',
        },
        {
          value: '存储(TB)',
          label: '存储(TB)',
        },
      ],
      // 设置下拉框默认选中项的值
      value: 'CPU(核)',
      cpuData: null, // CPU数据
      ramData: null, // 内存数据
      storageData: null, // 存储数据
      textarea1: '', //周报内容
    }
  },
  props: ['currentWeek'],
  watch: {
    // 监听父组件传来的新周数
    currentWeek: function(newVal) {
      // console.log(newVal);
      this.getData()
      this.changeOption(this.value)
    },
  },
  mounted() {
    this.getData()
  },

  methods: {
    // 获取表格数据和周报内容
    async getData() {
      let data = [] //该周全部数据
      try {
        // 请求参数
        let params = {
          report_type: '资源使用情况周报数据',
          // 根据当周头末时间查询该周数据
          starttime: this.currentWeek.startOfWeek,
          overtime: this.currentWeek.endOfWeek,
        }
        let res = await this.$request('apiQuery', params, 'post')
        res = res.data.list
        for (let rec of res) {
          let id = rec.report_id
          rec = JSON.parse(rec.report_data)
          rec.iseditor = false
          rec.report_id = id
          data.push(rec)
        }
      } catch (error) {
        this.tableData = []
        this.$message({
          message:'该周数据尚未填写',
          type:'info',
        })      
      }

      //   获取下拉选项值
      //   let options = []
      //   for (let rec of data) {
      //     if (!options.includes(rec.type)) {
      //       options.push(rec.type)
      //     }
      //   }
      //   this.options = options.map(item => {
      //     item = { value: item, label: item }
      //     return item
      //   })
      //   //   设置默认下拉选项值
      //   this.value = this.options[0].value

      let cpuData = data.filter((value, index, arr) => {
        return value.type == 'CPU(核)'
      })
      let ramData = data.filter((value, index, arr) => {
        return value.type == '内存(GB)'
      })
      let storageData = data.filter((value, index, arr) => {
        return value.type == '存储(TB)'
      })
      this.cpuData = cpuData
      this.ramData = ramData
      this.storageData = storageData
      if (this.value === 'CPU(核)') {
        this.tableData.splice(0, this.tableData.length, ...cpuData)
      } else if (this.value === '内存(GB)') {
        this.tableData.splice(0, this.tableData.length, ...ramData)
      } else if (this.value === '存储(TB)') {
        this.tableData.splice(0, this.tableData.length, ...storageData)
      }
      // 更新完表格数据，用doLayout重新加载表格
      this.$nextTick(() => {
        this.$refs.tableRef.doLayout()
      })
      // 获取周报内容
      let reportParams = {
        report_type: '资源使用情况周报',
        conditions: [
          {
            //根据第几年第几周来查询周报内容
            week:
              this.$moment(this.currentWeek.startOfWeek).format('YYYY') +
              ' ' +
              this.currentWeek.currentWeek,
          },
        ],
      }
      let reportData = await this.$request('apiQuery', reportParams, 'post')
      let reportText
      //   判断是否有写周报，没有返回空
      if (reportData.data.total) {
        reportText = JSON.parse(reportData.data.list[0].report_data).content
      } else {
        reportText = ''
      }
      this.textarea1 = reportText
    },
    // 切换下拉选项
    changeOption(val) {
      if (val === '内存(GB)') {
        this.tableData.splice(0, this.tableData.length, ...this.ramData)
      } else if (val === 'CPU(核)') {
        this.tableData.splice(0, this.tableData.length, ...this.cpuData)
      } else if (val === '存储(TB)') {
        this.tableData.splice(0, this.tableData.length, ...this.storageData)
      }
    },
    // 保存周报
    async saveReport() {
      // 先查询该周周报，若没有则插入，若有则进行更新
      let queryParams = {
        report_type: '资源使用情况周报',
        conditions: [
          {
            //根据第几年第几周来查询周报内容
            week:
              this.$moment(this.currentWeek.startOfWeek).format('YYYY') +
              ' ' +
              this.currentWeek.currentWeek,
          },
        ],
      }
      let queryData = await this.$request('apiQuery', queryParams, 'post')
      // 是否查询到
      let hasReport = queryData.data.total
      // 如果没有查到，则插入该周报信息
      if (!hasReport) {
        let params = {
          report_type: '资源使用情况周报',
          report_data: {
            content: this.textarea1,
            week:
              this.$moment(this.currentWeek.startOfWeek).format('YYYY') +
              ' ' +
              this.currentWeek.currentWeek,
          },
          report_time: this.$moment(this.currentWeek.startOfWeek).format(
            'YYYY-MM-DD'
          ),
        }
        let { data } = await this.$request('apiInsert', params, 'post')
      } else {
        // 查到了则获取唯一id，根据id修改
        // console.log(queryData.data.list[0].report_id);
        let report_id = queryData.data.list[0].report_id
        let updateParams = {
          report_id: report_id,
          report_data: {
            content: this.textarea1,
            week:
              this.$moment(this.currentWeek.startOfWeek).format('YYYY') +
              ' ' +
              this.currentWeek.currentWeek,
          },
        }
        let data = await this.$request('apiUpdate', updateParams, 'post')
      }
      this.$message({
        message: '保存成功',
        type: 'success',
      })
    },
    // 点击修改数据按钮
    async edit(row, index) {
      row.iseditor = true
    },
    // 点击保存数据按钮
    async save(row, index) {
      let params = {
        report_id: row.report_id,
        report_data: {
          date: row.date,
          type: row.type,
          user: row.user,
          total: +row.total,
          used: +row.used,
          consumed: +row.consumed,
        },
      }
      let res = await this.$request('apiUpdate', params, 'post')
      this.$message({
        message:'保存成功',
        type:'success'
      })
      row.iseditor = false
    },
    // 新增设备数据
    async addDevData() {
      let date
      // 如果当周表格数据还未录入过，则当周第一条数据的日期为该周第一天
      if (this.tableData.length === 0) {
        date = this.currentWeek.startOfWeek
      } else {
        //否则，则在前一条数据的日期往后一天
        date = this.$moment(this.tableData[this.tableData.length - 1].date)
          .add(1, 'days')
          .format('YYYY-MM-DD')
      }
      // 要插入的数据格式
      let obj = {
        type: this.value,
        total: 0,
        used: 0,
        consumed: 0,
        date: date,
        user: '',
      }
      let params = {
        report_type: '资源使用情况周报数据',
        report_data: obj,
        report_time: date,
      }
      let data = await this.$request('apiInsert', params, 'post')
      // console.log(data)
      obj.iseditor = false

      this.tableData.push(obj)
      this.getData()
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
  align-items: flex-start;
  padding: 10px 20px 0px 20px;
  font-size: 24px;
}
.body {
  flex: 1;
  display: flex;
  padding: 10px 20px;
  .left {
    width: 25%;
    .box-card {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      .boardHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      /deep/ .el-card__header {
        padding: 9px;
      }
      /deep/ .el-card__body {
        flex: 1;
        padding: 0px;
      }
      /deep/ .el-textarea {
        height: 100%;
        textarea {
          height: 100%;
          resize: none;
        }
      }
      .saveBtn {
        position: absolute;
        right: 25px;
        bottom: 5px;
      }
    }
  }
  .right {
    flex: 1;
    /deep/ .cell {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    input {
      width: 100px;
      text-align: center;
      outline-style: none;
      border: 1px solid #ccc;
      border-radius: 3px;
      font-size: 15px;
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
}
</style>
