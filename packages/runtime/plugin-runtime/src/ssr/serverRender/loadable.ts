import { ChunkExtractor } from '@loadable/server';
import { isCrossOrigin } from '../utils';
import { RenderHandler } from './type';

const extname = (uri: string): string => {
  if (typeof uri !== 'string' || !uri.includes('.')) {
    return '';
  }
  return `.${uri?.split('.').pop()}` || '';
};

function getLoadableScripts(extractor: ChunkExtractor) {
  const check = (scripts: string) =>
    (scripts || '').includes('__LOADABLE_REQUIRED_CHUNKS___ext');

  const scripts = extractor.getScriptTags();

  if (!check(scripts)) {
    return '';
  }

  return (
    scripts
      .split('</script>')
      // 前两个 script为 loadable 必须的 script
      .slice(0, 2)
      .map(i => `${i}</script>`)
      .join('')
  );
}

export const toHtml: RenderHandler = (jsx, renderer, next) => {
  const {
    stats,
    result: { chunksMap },
    host,
    config = {},
  } = renderer;

  if (!stats || chunksMap.js) {
    return next(jsx);
  }

  const extractor = new ChunkExtractor({
    stats,
    entrypoints: [renderer.entryName],
  });

  const html = next(extractor.collectChunks(jsx));
  const chunks = extractor.getChunkAssets(extractor.chunks);

  chunksMap.js = (chunksMap.js || '') + getLoadableScripts(extractor);

  for (const v of chunks) {
    const fileType = extname(v.url).slice(1);

    if (fileType === 'js') {
      const props = [];
      const { crossorigin } = config;
      if (crossorigin && isCrossOrigin(v.url, host)) {
        props.push(
          `crossorigin="${crossorigin === true ? 'anonymous' : crossorigin}"`,
        );
      }
      chunksMap[fileType] += `<script src="${v.url}" ${props.join(
        ' ',
      )}></script>`;
    } else if (fileType === 'css') {
      chunksMap[fileType] += `<link href="${v.url}" rel="stylesheet" />`;
    }
  }

  return html;
};
