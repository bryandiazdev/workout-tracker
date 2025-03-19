const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' ? '' : 'https://localhost:7250',
        changeOrigin: true,
        secure: false,
        pathRewrite: process.env.NODE_ENV === 'production' ? null : {'^/api': '/api'}
      }
    }
  }
}) 