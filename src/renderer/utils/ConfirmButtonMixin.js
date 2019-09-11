export default {
  name: '',
  data () {
    return {
      defaultPicBed: this.$db.get('picBed.current')
    }
  },
  methods: {
    setDefaultPicBed (type) {
      this.$db.set('picBed.current', type)
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
