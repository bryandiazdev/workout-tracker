const { defineConfig } = require('@vue/cli-service')
require('dotenv').config();

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
  },
  // Make environment variables explicitly available to the client
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      const env = process.env;
      
      // Add all VUE_APP_* environment variables
      Object.keys(env).forEach(key => {
        if (key.startsWith('VUE_APP_')) {
          args[0]['process.env'][key] = JSON.stringify(env[key]);
        }
      });
      
      return args;
    });
  }
}) 