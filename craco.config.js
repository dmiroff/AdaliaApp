module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // НОРМАЛЬНЫЕ настройки для рабочего приложения
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          mobx: {
            test: /[\\/]node_modules[\\/](mobx|mobx-react-lite)[\\/]/,
            name: 'mobx', 
            chunks: 'all',
            priority: 19,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      };
      
      return webpackConfig;
    },
  },
};
