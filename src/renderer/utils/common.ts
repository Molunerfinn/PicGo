const isDevelopment = process.env.NODE_ENV !== 'production'
/* eslint-disable camelcase */
export const handleBaiduTongJiEvent = (data: IBaiduTongJiOptions) => {
  const { category, action, opt_label = '', opt_value = Date.now() } = data
  window._hmt.push(['_trackEvent', category, action, opt_label, opt_value])
  if (isDevelopment) {
    console.log('baidu tongji', data)
  }
}
