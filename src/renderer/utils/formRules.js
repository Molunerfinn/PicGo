export default {
  required: (text, method = 'blur') => {
    return { required: true, message: text, trigger: method }
  }
}
