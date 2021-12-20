<template>
  <!-- 系统与设备运行情况数据录入页面容器 -->
  <div class="dataEntry-container">
    <div class="header">
      <div class="title">
        <span>南中心系统与设备运行情况数据录入</span>
      </div>
    </div>
    <div class="body">
        <div class="top">
          <devEntry :currentWeek="currentWeek"></devEntry>
        </div>
        <div class="bottom">
          <rsEntry :currentWeek="currentWeek"></rsEntry>
        </div>
    </div>
  </div>
</template>
<script>
import devEntry from '@/components/dataEntry/devEntry.vue'
import rsEntry from '@/components/dataEntry/rsEntry.vue'

export default {
  data() {
    return {}
  },
  props: ['currentWeek'],
  components:{
    devEntry,
    rsEntry
  },
  mounted() {},

  methods: {},
}
</script>
<style lang="less" scoped>
.dataEntry-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding:10px 20px;
  box-sizing: border-box;
  background-color: #f2f3f5;
  .header {
    width: 100%;
    .title {
      font-size: 26px;
    }
  }
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    width: 100%;
    .top{
      width: 100%;
      height: 48%;
    }
    .bottom{
      width: 100%;
      height: 48%;
    }
  }
}
</style>
