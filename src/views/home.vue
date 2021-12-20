<template>
  <div class="com-container">
    <div class="mainPage">
      <!-- 顶部导航区域 -->
      <el-menu
        :default-active="activeIndex"
        class="el-menu-demo"
        mode="horizontal"
        :router="true"
      >
        <el-menu-item
          index="/weeklyReport"
          @click="saveNavState('/weeklyReport')"
          >人员周报表</el-menu-item
        >
        <el-submenu index="2">
          <template slot="title">存储详情</template>
          <el-menu-item index="/diskIO" @click="saveNavState('/diskIO')"
            >磁盘IO分布</el-menu-item
          >
          <el-menu-item index="/SIU" @click="saveNavState('/SIU')"
            >交换机接口使用率</el-menu-item
          >
          <el-menu-item index="/fd" @click="saveNavState('/fd')"
            >故障分布</el-menu-item
          >
        </el-submenu>
        <el-menu-item
          index="/SystemAndDevice"
          @click="saveNavState('/SystemAndDevice')"
          >南中心系统与设备运行情况</el-menu-item
        >
        <el-submenu index="4">
          <template slot="title">数据录入</template>
          <el-menu-item
            index="/sadDataEntry"
            @click="saveNavState('/sadDataEntry')"
            >系统与设备运行情况录入</el-menu-item
          >
          <el-menu-item
            index="/wrDataEntry"
            @click="saveNavState('/wrDataEntry')"
            >人员周报录入</el-menu-item
          >
          <el-menu-item
            index="/faultDevDataEntry"
            @click="saveNavState('/faultDevDataEntry')"
          >
            故障分布数据录入
          </el-menu-item>
        </el-submenu>
        <el-menu-item class="timePicker">
          <template>
            <!-- 选择周次下拉框 -->
            <div class="selectWeek">
              <el-date-picker
                v-model="time"
                type="week"
                format="yyyy-MM-dd 第 WW 周"
                placeholder="选择周"
                :clearable="false"
                :picker-options="pickerOptions"
                @change="changeDate"
              >
              </el-date-picker>
            </div>
          </template>
        </el-menu-item>
      </el-menu>
      <!-- 主要显示区域 -->
      <div class="mainArea">
        <router-view
          :currentWeek="{ currentWeek, startOfWeek, endOfWeek }"
        ></router-view>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      activeIndex: '', //导航激活的链接
      time: this.$moment(new Date()), //日期时间选择器当前时间
      currentWeek: '', //当前周数
      startOfWeek: '', //当周第一天
      endOfWeek: '', //当周最后一天
      pickerOptions:{
      // shortcuts: [
      //   {
      //     text: '回到今天',
      //     onClick(picker) {
      //       picker.$emit('pick', new Date())
      //     },
      //   },
      // ]
    },
    }
  },
  created() {
    // 获取当周的时间范围
    this.getDateRange(this.time)
    // 从sessionStorage中获取链接的激活状态
    this.activeIndex = window.sessionStorage.getItem('activeIndex')
  },
  mounted() {},
  watch: {
    time: {
      immediate: true,
      handler: function(newVal) {
        // 当切换时间选择器时，重新获取该周日期范围
        this.getDateRange(newVal)
      },
    },
  },
  methods: {
    // 保存链接的激活状态
    saveNavState(activeIndex) {
      // 每次点击菜单链接时，应该把对应的地址先保存到sessionStorage
      window.sessionStorage.setItem('activeIndex', activeIndex)
      this.activeIndex = activeIndex
    },
    // 获取当周的时间范围
    getDateRange(time) {
      this.currentWeek = this.$moment(time).isoWeek()
      this.startOfWeek = this.$moment(time)
        .startOf('week')
        .toDate()
        .format('yyyy-MM-dd')
      this.endOfWeek = this.$moment(time)
        .endOf('week')
        .toDate()
        .format('yyyy-MM-dd')
    },
    // 切换时间选择器触发事件
    changeDate(date) {
      // 因为设置的是周选择器，在切换周数时会把日期重新设置成选择的那一周的周一
      // 这样的话当我们重新切换回当前周的时候，日期就会重置为当前周的周一，而非当前周当前天
      // 因此进行判断，如果切换回的周数等同于当前周数，把日期重新设置为当天日期
      // if (
      //   this.$moment(new Date()).isoWeek() === this.$moment(this.time).isoWeek()
      // ) {
      //   this.time = this.$moment(new Date())
      // }
    },
    
  },
}
</script>
<style lang="less" scoped>
.mainPage {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  .mainArea{
      flex:1;
  }
}
/deep/ .timePicker {
  position: absolute;
  right: 0;
}
</style>
