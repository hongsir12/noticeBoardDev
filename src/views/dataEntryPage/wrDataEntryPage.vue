<template>
  <!-- 人员周报数据录入页面容器 -->
  <div class="dataEntry-container">
    <div class="header">
      <div class="title">
        <span>人员周报数据录入</span>
      </div>
    </div>
    <div class="body">
        <wrDataEntry :currentWeek="currentWeek"></wrDataEntry>
    </div>
  </div>
</template>
<script>
import wrDataEntry from '@/components/dataEntry/wrDataEntry.vue'
export default {
  data() {
    return {}
  },
  props: ['currentWeek'],
  components: {
    wrDataEntry
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
  padding: 10px 20px;
  box-sizing: border-box;
  background-color: #f2f3f5;
  .header {
    width: 100%;
    margin-bottom: 10px;
    .title {
      font-size: 26px;
    }
  }
  .body {
    flex: 1;
    // display: flex;
    // flex-direction: column;
    // justify-content: space-evenly;
    // width: 100%;
  }
}
</style>
