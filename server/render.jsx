import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter, matchPath } from 'react-router-dom';
import store from '../src/store';
import routes from '../src/routes';

// eslint-disable-next-line import/extensions
import Page from '../src/Page.jsx';
import template from './template';

async function render(req, res) {
  const activeRoute = routes.find(
    route => matchPath(req.path, route)
  );
  let initialData;
  console.log("activeRoute: ", activeRoute)
  if (activeRoute && activeRoute.component.fetchData) {
    const match = matchPath(req.path, activeRoute); // L'auteur developpeur du livre il choisit de réévaluer au lieu de passer le parametre match à activeROute juste au-dessus (je présume que ça)
    const index = req.url.indexOf('?');
    const search = index !== -1 ? req.url.substr(index) : null;
    console.log("search: ", search);
    initialData = await activeRoute.component.fetchData(match, search);
  }

  store.initialData = initialData;
  const context = {}
  console.log("initialData: ", initialData);
  console.log("store: ", store);
  const element = (
    <StaticRouter location={req.url} context={context}>
      <Page />
    </StaticRouter>
  );
  const body = ReactDOMServer.renderToString(element);

  if (context.url) {
    res.redirect(301, context.url)
  } else {
    res.send(template(body, initialData));
  }
}

export default render;
