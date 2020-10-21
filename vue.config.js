module.exports = {
    devServer: {
        host: '0.0.0.0',
        port: 2929, // CHANGE YOUR PORT HERE!
        https: true,
        hotOnly: false,
    },
    publicPath: process.env.NODE_ENV === 'production'
    ? '/demo-widget-delivery-v2/'
    : '/'
}