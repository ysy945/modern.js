import type { BuilderPlugin } from '../types';

/**
 * Provide some basic configs of webpack
 */
export const PluginBasic = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-basic',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd, CHAIN_ID }) => {
      // The base directory for resolving entry points and loaders from the configuration.
      chain.context(api.context.rootPath);

      chain.mode(isProd ? 'production' : 'development');

      chain.merge({
        infrastructureLogging: {
          // Using `error` level to avoid `webpack.cache.PackFileCacheStrategy` logs
          level: 'error',
        },
      });

      // if the chunk size exceeds 1MiB, we will throw a warning
      chain.performance.maxAssetSize(1024 * 1024);
      chain.performance.maxEntrypointSize(1024 * 1024);

      const { ModuleDependencyErrorPlugin } = await import(
        '../webpackPlugins/ModuleDependencyErrorPlugin'
      );
      chain
        .plugin(CHAIN_ID.PLUGIN.MODULE_DEPENDENCY_ERROR)
        .use(ModuleDependencyErrorPlugin);
    });
  },
});
