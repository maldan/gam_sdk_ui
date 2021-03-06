<template>
  <div
    @click.stop=""
    :class="$style.window"
    :style="{ left: x + '%', top: y + '%', width: width + '%', height: height + '%', zIndex }"
  >
    <div ref="header" :class="$style.header">
      <slot name="header">{{ title }}</slot>
    </div>
    <div :class="$style.body"><slot name="body"></slot></div>

    <div
      v-for="x in resize"
      :key="x"
      :ref="`resize_${x}`"
      draggable="false"
      :class="$style[x]"
    ></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { EventHelper } from '@/gam_sdk_ui/vue/helper';

export default defineComponent({
  props: {
    id: String,
    title: String,
    initData: {
      type: Object,
      default: () => {
        return { x: 0, y: 0, width: 10, height: 10 };
      },
    },
  },
  async mounted() {
    await this.$nextTick(() => {
      this.x = ~~this.initData.x;
      this.y = ~~this.initData.y;
      this.width = ~~this.initData.width || 10;
      this.height = ~~this.initData.height || 10;

      EventHelper.on(document, 'mousemove touchmove', this.documentMove);
      EventHelper.on(document, 'mouseup touchend', this.documentUp);
      EventHelper.on(this.$refs['header'] as HTMLElement, 'mousedown touchstart', this.down);

      this.resize.forEach((x: string) => {
        EventHelper.on(
          this.$refs[`resize_${x}`] as HTMLElement,
          'mousedown touchstart',
          (e: MouseEvent) => {
            const y = x.split('').map((xx) => xx.toUpperCase());
            y.forEach((yyy) => {
              this.downDrag(e, yyy);
            });
          },
        );
      });

      // @ts-ignore
      if (!Array.isArray(window['ui.window.list'])) {
        // @ts-ignore
        window['ui.window.list'] = [];
      }

      // @ts-ignore
      window['ui.window.list'].push(this);
    });
  },
  methods: {
    downDrag(e: any, dir: string) {
      this.capture = {
        x: ((e.changedTouches ? e.changedTouches[0].pageX : e.pageX) / window.innerWidth) * 100,
        y: ((e.changedTouches ? e.changedTouches[0].pageY : e.pageY) / window.innerHeight) * 100,
      };
      // @ts-ignore
      this[`isDrag${dir}`] = true;
    },
    documentUp(e: MouseEvent) {
      if (this.isDrag || this.isDragB || this.isDragT || this.isDragL || this.isDragR) {
        // RestApi.process.setWindow(this.modelValue as any);
      }

      this.isDrag = false;
      this.isDragT = false;
      this.isDragB = false;
      this.isDragL = false;
      this.isDragR = false;
    },
    documentMove(e: any) {
      const pageX =
        ((e.changedTouches ? e.changedTouches[0].pageX : e.pageX) / window.innerWidth) * 100;
      const pageY =
        ((e.changedTouches ? e.changedTouches[0].pageY : e.pageY) / window.innerHeight) * 100;
      let isSkip = false;

      // Header
      if (this.isDrag) {
        this.x = Math.max(this.x + (pageX - this.capture.x), 0);
        this.y = Math.max(this.y + (pageY - this.capture.y), 0);
      }

      // Diagonal
      if (this.isDragR && this.isDragB && !isSkip) {
        this.width = this.width + (pageX - this.capture.x);
        this.height = this.height + (pageY - this.capture.y);
        isSkip = true;
      }

      if (this.isDragL && this.isDragB && !isSkip) {
        this.x = this.x + (pageX - this.capture.x);
        this.width = this.width - (pageX - this.capture.x);
        this.height = this.height + (pageY - this.capture.y);
        isSkip = true;
      }

      if (this.isDragR && this.isDragT && !isSkip) {
        this.width = this.width + (pageX - this.capture.x);
        this.y = this.y + (pageY - this.capture.y);
        this.height = this.height - (pageY - this.capture.y);
        isSkip = true;
      }

      if (this.isDragL && this.isDragT && !isSkip) {
        this.y = this.y + (pageY - this.capture.y);
        this.height = this.height - (pageY - this.capture.y);
        this.x = this.x + (pageX - this.capture.x);
        this.width = this.width - (pageX - this.capture.x);
        isSkip = true;
      }

      // Horizontal and vertical
      if (this.isDragB && !isSkip) {
        this.height = this.height + (pageY - this.capture.y);
        isSkip = true;
      }

      if (this.isDragT && !isSkip) {
        this.y = this.y + (pageY - this.capture.y);
        this.height = this.height - (pageY - this.capture.y);
        isSkip = true;
      }

      if (this.isDragR && !isSkip) {
        this.width = this.width + (pageX - this.capture.x);
        isSkip = true;
      }

      if (this.isDragL && !isSkip) {
        this.x = this.x + (pageX - this.capture.x);
        this.width = this.width - (pageX - this.capture.x);
        isSkip = true;
      }

      if (!(this.isDrag || this.isDragB || this.isDragT || this.isDragL || this.isDragR)) {
        return;
      }

      this.capture = {
        x: pageX,
        y: pageY,
      };
    },
    down(e: MouseEvent & TouchEvent) {
      this.isDrag = true;
      this.capture = {
        x: ((e.changedTouches ? e.changedTouches[0].pageX : e.pageX) / window.innerWidth) * 100,
        y: ((e.changedTouches ? e.changedTouches[0].pageY : e.pageY) / window.innerHeight) * 100,
      };

      // @ts-ignore
      window['ui.window.focusWindow'] = this.id;

      // @ts-ignore
      const list = window['ui.window.list'] ?? [];
      for (let i = 0; i < list.length; i++) {
        // @ts-ignore
        const isMe = window['ui.window.focusWindow'] === list[i].id;
        // @ts-ignore
        list[i].setZIndex(isMe ? 2 : 1);

        if (isMe) {
          list[i].$emit('focus');
        } else {
          list[i].$emit('blur');
        }
      }
    },
    setZIndex(value: number) {
      this.zIndex = value;
    },
  },
  data: () => {
    return {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      isDrag: false,
      capture: {
        x: 0,
        y: 0,
      },
      isDragT: false,
      isDragB: false,
      isDragL: false,
      isDragR: false,
      resize: ['l', 'r', 't', 'b', 'tr', 'tl', 'br', 'bl'],
      zIndex: 1,
    };
  },
});
</script>

<style module lang="scss">
@import '../../style/color.scss';
@import '../../style/size.scss';

.window {
  display: flex;
  flex-direction: column;
  position: absolute;
  user-select: none;

  .header {
    background: lighten($gray-dark, 4%);
    padding: $gap-base;
    color: darken($text-gray, 10%);
    position: relative;
    box-sizing: border-box;
    height: 32px;
    display: flex;
    align-items: center;
    font-size: 14px;
    border-radius: 4px 4px 0 0;
  }

  .body {
    width: 100%;
    height: calc(100% - 32px);
    position: absolute;
    top: 32px;
    box-sizing: border-box;

    padding: $gap-base;
    background: $gray-medium;
    overflow: auto;
  }

  .b,
  .t,
  .l,
  .r,
  .br,
  .bl,
  .tr,
  .tl {
    position: absolute;
  }

  .t {
    height: 24px;
    width: 100%;
    top: -24px;
    cursor: s-resize;
  }

  .b {
    height: 24px;
    width: 100%;
    bottom: -24px;
    cursor: s-resize;
  }

  .l {
    height: 100%;
    width: 24px;
    left: -24px;
    top: 0;
    cursor: e-resize;
  }

  .r {
    height: 100%;
    width: 24px;
    right: -24px;
    top: 0;
    cursor: e-resize;
  }

  .br {
    height: 24px;
    width: 24px;
    right: -24px;
    bottom: -24px;
    cursor: nw-resize;
  }

  .bl {
    height: 24px;
    width: 24px;
    left: -24px;
    bottom: -24px;
    cursor: ne-resize;
  }

  .tr {
    height: 24px;
    width: 24px;
    right: -24px;
    top: -24px;
    cursor: ne-resize;
  }

  .tl {
    height: 24px;
    width: 24px;
    left: -24px;
    top: -24px;
    cursor: nw-resize;
  }
}
</style>
