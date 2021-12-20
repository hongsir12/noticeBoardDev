<template>
  <div class="com-container bgIMG">
    <div class="left">
      <div class="left-top">
        <dv-border-box-12>
          <devLine :currentWeek="currentWeek"></devLine>
        </dv-border-box-12>
      </div>
      <div class="left-bottom">
        <dv-border-box-12>
          <rsLine :currentWeek="currentWeek"></rsLine>
        </dv-border-box-12>
      </div>
    </div>
    <div class="middle">
      <div class="middle-top">
        <dv-border-box-12>
            <devBar :currentWeek="currentWeek"></devBar>
        </dv-border-box-12>
      </div>
      <div class="middle-bottom">
        <dv-border-box-12>
            <rsBar :currentWeek="currentWeek"></rsBar>
        </dv-border-box-12>
      </div>
    </div>
    <div class="right">
      <div class="right-top">
        <dv-border-box-13>
            <devWeekly :currentWeek="currentWeek"></devWeekly>
        </dv-border-box-13>
      </div>
      <div class="right-bottom">
        <dv-border-box-13>
            <rsWeekly :currentWeek="currentWeek"></rsWeekly>
        </dv-border-box-13>
      </div>
    </div>
  </div>
</template>
<script>
import devLine from '@/components/SystemAndDevice/devLine'
import rsLine from '@/components/SystemAndDevice/rsLine'
import devBar from '@/components/SystemAndDevice/devBar'
import rsBar from '@/components/SystemAndDevice/rsBar'
import devWeekly from '@/components/SystemAndDevice/devWeekly'
import rsWeekly from '@/components/SystemAndDevice/rsWeekly'

export default {
  data() {
    return {}
  },
  props: ['currentWeek'],
  components: {
    devLine,
    rsLine,
    devBar,
    rsBar,
    devWeekly,
    rsWeekly
  },
  mounted() {},

  methods: {},
}
</script>
<style lang="less" scoped>
.bgIMG {
  background-image: url('../../assets/pageBg.png');
  background-size: cover;
  background-position: center center;
}
.left {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  width: 40%;
  height: 100%;
  padding: 0 10px;
  .left-top {
    width: 100%;
    height: 48%;
  }
  .left-bottom {
    width: 100%;
    height: 48%;
  }
}
.middle {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  width: 40%;
  height: 100%;
  padding: 0 10px;

  .middle-top {
    width: 100%;
    height: 48%;
  }
  .middle-bottom {
    width: 100%;
    height: 48%;
  }
}
.right {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  flex: 1;
  padding: 0 10px;
  .right-top {
    width: 100%;
    height: 48%;
  }
  .right-bottom {
    width: 100%;
    height: 48%;
  }
}
</style>
