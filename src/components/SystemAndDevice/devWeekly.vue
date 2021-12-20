<!--设备周报面板-->
<template>
  <div class="com-page" ref="WeeklyRef">
    <div class="weeklyContainer">
      <div class="title">
        <span>本周设备信息简述</span>
      </div>
      <div class="body">{{ weeklyReport }}</div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      weeklyReport: '',
    }
  },
  props: ['currentWeek'], //周数
  watch: {
    // 监听父组件传来的新周数
    currentWeek: function(newVal) {
      this.getWeeklyReport()
    },
  },
  mounted() {
    this.getWeeklyReport()
    window.addEventListener('resize', this.screenAdapter)
    this.screenAdapter()
  },

  methods: {
    async getWeeklyReport() {
      let params = {
        report_type: '设备运行情况周报',
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
      let { data } = await this.$request('apiQuery', params, 'post')
      if (data.total) {
        this.weeklyReport = JSON.parse(data.list[0].report_data).content
      } else {
        this.weeklyReport = ''
      }
    },
    screenAdapter() {
      const titleFontSize = (this.$refs.WeeklyRef.offsetWidth / 100) * 8
      const describeContainerFontSize =
        (this.$refs.WeeklyRef.offsetWidth / 100) * 4.8
      let title = document.getElementsByClassName('title')[0]
      let body = document.getElementsByClassName('body')[0]
      title.style.fontSize = `${titleFontSize}px`
      body.style.fontSize = `${describeContainerFontSize}px`
    },
  },
}
</script>
<style lang="less" scoped>
.weeklyContainer {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  width: 92%;
  height: 92%;
  border-radius: 10px;
  color:#fff;
  background-color: rgba(255, 255, 255, 0.1);
  .title {
    display:flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 12%;
    font-size: 24px;
  }
  .body {
    flex: 1;
  }
}
</style>
