import { Component, Vue } from 'vue-property-decorator'
@Component
export default class extends Vue {
  mounted () {
    this.disableDragEvent()
  }
  disableDragEvent () {
    window.addEventListener('dragenter', this.disableDrag, false)
    window.addEventListener('dragover', this.disableDrag)
    window.addEventListener('drop', this.disableDrag)
  }
  disableDrag (e: DragEvent) {
    const dropzone = document.getElementById('upload-area')
    if (dropzone === null || !dropzone.contains(<Node>e.target)) {
      e.preventDefault()
      e.dataTransfer!.effectAllowed = 'none'
      e.dataTransfer!.dropEffect = 'none'
    }
  }
  beforeDestroy () {
    window.removeEventListener('dragenter', this.disableDrag, false)
    window.removeEventListener('dragover', this.disableDrag)
    window.removeEventListener('drop', this.disableDrag)
  }
}
