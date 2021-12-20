<template>
  <div class="com-page">
    <!-- 编辑器组件 -->
    <vue-draggable-resizable
      v-if="editorShow"
      :w="400"
      :h="400"
      :z="999"
      :min-width="278"
      :min-height="200"
      @dragging="onDrag"
      @resizing="onResize"
      :parent="true"
    >
      <ace
        :sendEditorProps="sendEditorProps"
        @dialogVisible="getDialogVisible"
        @aceClose="aceClose"
        @getChartOptionName="getChartOptionName"
        @sendEditorContent="sendEditorContent"
        ref="aceRef"
      ></ace>
    </vue-draggable-resizable>
    <!-- 编辑器开关 -->
    <div class="switch" @click.prevent="switchClick">
      <el-switch
        v-model="editorShow"
        active-color="#13ce66"
        inactive-color="#ff4949"
        :disabled="isDisabled"
      >
      </el-switch>
    </div>

    <!-- 已保存历史配置弹出框 -->
    <el-dialog
      title="已保存配置"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose"
      custom-class="dialogWidth"
    >
      <template>
        <el-radio-group v-model="currentOptionRadio">
          <el-radio
            v-for="(item, index) in sendEditorProps.optionList"
            :key="index"
            :label="item.optionName"
            border
            @change="radioChange"
          ></el-radio>
        </el-radio-group>
      </template>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" @click="deleteOption">删除配置</el-button>
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="chooseOption">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 图表组件 -->
    <diskIO
      :currentWeek="currentWeek"
      :newDataAndScript="newDataAndScript"
      @sendChartOptionName="getChartOptionName"
    ></diskIO>
  </div>
</template>
<script>
import diskIO from '@/components/storageReport/diskIO.vue'

export default {
  data() {
    return {
      // 可拖动缩放容器的配置
      draggableResizable: { width: 0, height: 0, x: 0, y: 0 },
      ChartOptionName:'磁盘IO分布图表配置',
      // 编辑器显示状态
      editorShow: false,
      // 开关禁用状态
      isDisabled: true,
      // 要传给编辑器组件的值
      sendEditorProps: {
        // 保存的图表配置
        optionList: [],
        // 要传给编辑器显示区的字符串
        aceEditorScript: '',
        // 当前图表配置名称
        chartOptionName: '',
      },
      // 弹框显示状态
      dialogVisible: false,
      // 选中的历史配置名称
      currentOptionRadio: '',
      // 要传给图表的新的数据和编辑器内容
      newDataAndScript: null,
    }
  },
  props: ['currentWeek'],
  components: {
    diskIO,
  },
  mounted() {},

  methods: {
    // 编辑器开关
    switchClick() {
      if (this.editorShow == false) {
        this.$messageBox
          .confirm('确定开启编辑器?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          .then(() => {
            this.editorShow = true
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
          })
      } else {
        this.$messageBox
          .confirm('确定关闭编辑器?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          .then(() => {
            this.editorShow = false
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
          })
      }
    },
    // 点击编辑器内的关闭按钮
    aceClose(res) {
      this.editorShow = res
    },
    // 获取图表历史配置列表
    async getChartOptionName(res) {
      this.sendEditorProps.chartOptionName = res
      let params = {
        report_type: '全部已保存图表配置',
        conditions: [{ chartName: res }],
      }
      let { data } = await this.$request('apiQuery', params, 'post')
      let chartData = data.list
      let optionList = []
      for (let rec of chartData) {
        let id = rec.report_id
        rec = JSON.parse(rec.report_data)
        let obj = { optionName: rec.optionName, content: rec.content, id: id }
        optionList.push(obj)
      }
      this.sendEditorProps.optionList = optionList
    },
    // 编辑器组件点击历史配置按钮后将弹框显示状态传给当前父组件
    getDialogVisible(res) {
      this.dialogVisible = res
    },
    // 切换历史配置
    radioChange(res) {
      //将历史配置名称存到 currentOptionRadio
      this.currentOptionRadio = res
    },
    // 历史配置弹框点击确认
    chooseOption() {
      // 获取选中的历史配置代码字符串
      for (let rec of this.sendEditorProps.optionList) {
        if (rec.optionName === this.currentOptionRadio) {
          this.sendEditorProps.aceEditorScript = rec.content
        }
      }
      this.dialogVisible = false
      this.currentOptionRadio = ''
    },
    //删除历史配置
    deleteOption() {
      let optionList = this.sendEditorProps.optionList
      let deletedID
      //如果选中项为默认配置，取消操作
      if (this.currentOptionRadio == '默认配置') {
        this.$messageBox.alert('默认配置无法删除', '提示', {
          confirmButtonText: '确定',
          callback: () => {
            this.$message({
              type: 'info',
              message: `操作已取消`,
            })
          },
        })
      } else {
        //遍历配置列表
        for (let rec of optionList) {
          //选中配置名和配置列表项名称一样时，获取id
          if (rec.optionName == this.currentOptionRadio) {
            deletedID = rec.id
          }
        }
        this.$messageBox
          .confirm('此操作将永久删除该配置, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          .then(async () => {
            let deleteParam = {
              data: [deletedID],
            }
            let res = await this.$request('apiDelete', deleteParam, 'post')
            if (res.code == 2000) {
              this.$message({
                type: 'success',
                message: '删除成功!',
              })
              this.getChartOptionName(this.ChartOptionName)
            } else {
              this.$message({
                type: 'info',
                message: '删除失败',
              })
            }
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消删除',
            })
          })
      }
    },
    // 关闭历史配置弹出框
    handleClose(done) {
      this.$messageBox
        .confirm('确认关闭？')
        .then(_ => {
          this.dialogVisible = false
          this.currentOptionRadio = ''
          this.$message({
            message: '关闭成功',
            type: 'success',
          })
        })
        .catch(_ => {})
    },
    // 接收编辑器传来的新的数据源和编辑器内容
    sendEditorContent(res) {
      this.newDataAndScript = res
    },
    //   容器大小
    onResize: function(x, y, width, height) {
      this.draggableResizable.x = x
      this.draggableResizable.y = y
      this.draggableResizable.width = width
      this.draggableResizable.height = height
    },
    // 容器拖动
    onDrag: function(x, y) {
      this.draggableResizable.x = x
      this.draggableResizable.y = y
    },
  },
}
</script>
<style lang="less" scoped>
.switch {
  position: absolute;
  right: 0;
  z-index: 10;
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
