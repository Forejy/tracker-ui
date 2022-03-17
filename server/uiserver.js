/* eslint-disable import/no-extraneous-dependencies */
import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import proxy from 'http-proxy-middleware';
import SourceMapSupport from 'source-map-support';

// eslint-disable-next-line import/extensions
import render from './render.jsx';


// eslint-disable-next-line import/extensions

const app = express();

SourceMapSupport.install();
// SourceMap c'est pour avoir les vrais numéros de ligne dans les messags d'erreurs de l'app
dotenv.config();

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
require('dotenv').config();

const enableHMR = (process.env.ENABLE_HMR || 'true') === 'true';

if (enableHMR && (process.env.NODE_ENV !== 'production')) {
  console.log('Adding dev middleware, enabling HMR');
  const webpack = require('webpack');
  const devMiddleware = require('webpack-dev-middleware');
  const hotMiddleare = require('webpack-hot-middleware');
  const config = require('../webpack.config')[0];


  config.entry.app.push('webpack-hot-middleware/client');
  config.plugins = config.plugins || [];
  config.plugins.push(new webpack.HotModuleReplacementPlugin());

  const compiler = webpack(config);
  app.use(devMiddleware(compiler));
  app.use(hotMiddleare(compiler));
}

const apiProxyTarget = process.env.API_PROXY_TARGET;
if (apiProxyTarget) {
  app.use('/graphql', proxy({ target: apiProxyTarget, changeOrigin: true }));
  app.use('/auth', proxy({ target: apiProxyTarget, changeOrigin: true }));
}

app.use(express.static('public'));

if (!process.env.UI_API_ENDPOINT) {
  process.env.UI_API_ENDPOINT = 'http://localhost:3000/graphql';
}

if (!process.env.UI_SERVER_API_ENDPOINT) {
  process.env.UI_SERVER_API_ENDPOINT = process.env.UI_API_ENDPOINT;
}

if (!process.env.UI_AUTH_ENDPOINT) {
  process.env.UI_AUTH_ENDPOINT = 'http://localhost:3000/auth';
}
// Explications (ou discussion)
// Je pense qu'on ajoute les endpoints dans l'env, parce que meme si avec graphql le endpoint est unique pour les requetes en db, on a besoin d'ajouter des endpoints pour d'autres api qu'on va utiliser. Et on peut avoir a utiliser  un endpoint depuis plusieurs endroits (donc les endpoints depuis plusieurs endroits).
// Et du coup, j'ajoute que les endpoints sont utilisés depuis :
// Et ici on ajoute les endpoints et il faut voir que c'est le chargement du serveur, et au chargement du serveur

// on utilise window.ENV.UI_API_ENDPOINT (browser) et process.env.UI_SERVER_API_ENDPOINT (ssr) dans GraphQLFetch pour notre api
// on utilise : window.ENV.GOOGLE_CLIENT_ID; dans SignInNavItem pour l'api google

app.get('/env.js', (req, res) => {
  const env = {
    UI_API_ENDPOINT: process.env.UI_API_ENDPOINT,
    UI_AUTH_ENDPOINT: process.env.UI_AUTH_ENDPOINT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  };
  res.send(`window.ENV = ${JSON.stringify(env)}`);
});

app.get('*', (req, res, next) => {
  render(req, res, next);
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve('public/index.html'));
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`UI started on port ${port}`);
});

if (module.hot) {
  module.hot.accept('./render.jsx');
}
