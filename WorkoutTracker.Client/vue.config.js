const { defineConfig } = require('@vue/cli-service')
require('dotenv').config();
const webpack = require('webpack');

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
      
      console.log('Building with environment variables:');
      // Add all VUE_APP_* environment variables
      Object.keys(env).forEach(key => {
        if (key.startsWith('VUE_APP_')) {
          args[0]['process.env'][key] = JSON.stringify(env[key]);
          console.log(`- ${key}: ${key.includes('SECRET') ? '[HIDDEN]' : (env[key] ? env[key].substring(0, 5) + '...' : 'Not set')}`);
        }
      });
      
      return args;
    });

    // Add an additional plugin to ensure environment variables are properly injected
    config.plugin('env-injection')
      .use(webpack.DefinePlugin, [{
        'process.env.VUE_APP_AUTH0_DOMAIN': JSON.stringify(process.env.VUE_APP_AUTH0_DOMAIN),
        'process.env.VUE_APP_AUTH0_CLIENT_ID': JSON.stringify(process.env.VUE_APP_AUTH0_CLIENT_ID),
        'process.env.VUE_APP_AUTH0_AUDIENCE': JSON.stringify(process.env.VUE_APP_AUTH0_AUDIENCE),
        'process.env.VUE_APP_AUTH0_CALLBACK_URL': JSON.stringify(process.env.VUE_APP_AUTH0_CALLBACK_URL),
        'process.env.VUE_APP_API_URL': JSON.stringify(process.env.VUE_APP_API_URL || '/api')
      }]);
  }
}) 