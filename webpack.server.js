import url from 'url';
import express from 'express';
import webpack from 'webpack';
import webpackConfig from './webpack.config.babel';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import httpProxy from 'http-proxy';
import config from './config.json';

const devURL = config.devURL || 'http://0.0.0.0:8032';
const urlParts = url.parse(devURL);
const proxyOptions = config.proxy || [];

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true
});

const compiler = webpack(webpackConfig);

const app = express();

app.use(webpackDevMiddleware(compiler, {
  noInfo: false,
  publicPath: webpackConfig.output.publicPath,
  stats: {
    colors: true,
    hash: false,
    timings: false,
    chunks: true,
    chunkModules: true,
    modules: false,
    children: true,
    version: false,
    cached: true,
    cachedAssets: true,
    reasons: false,
    source: false,
    errorDetails: true
  },
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
}));

app.use(webpackHotMiddleware(compiler));

app.use('/assets', express.static(path.join(__dirname, 'front-end/assets')));

proxyOptions.forEach(option => {
  app.all(option.path, (req, res) => {
    proxy.web(req, res, option, err => {
      console.log('ERROR: ', err.message);
      res.statusCode = 502;
      res.end();
    });
  });
});

app.get('*', (req, res, next) => {
  let filename = path.join(compiler.outputPath, 'index.html');
  compiler.outputFileSystem.readFile(filename, (error, result) => {
    if (error) {
      console.log('ERROR: ', error);
      return next(error);
    }
    res.set('content-type', 'text/html');
    res.send(result);
    res.end();
  });
});

let server = http.createServer(app);
if (urlParts.protocol === 'https:') {
  server = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
  }, app);
}

server.listen(urlParts.port, () => {
  console.log('HMR server listening at ' + devURL);
});
