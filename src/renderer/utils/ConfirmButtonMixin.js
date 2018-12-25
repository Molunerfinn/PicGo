export default {
  name: '',
  data () {
    return {
      defaultPicBed: this.$db.read().get('picBed.current').value()
    }
  },
  methods: {
    setDefaultPicBed (type) {
      this.$db.read().set('picBed.current', type).write()
      this.defaultPicBed = type
      const successNotification = new window.Notification('设置默认图床', {
        body: '设置成功'
      })
      successNotification.onclick = () => {
        return true
      }
    }
  }
}
