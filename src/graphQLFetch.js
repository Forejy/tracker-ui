/* eslint-disable no-alert */
import fetch from 'isomorphic-fetch';

const dateRegex = new RegExp('^\\d\\d\\d\\d-\\d\\d-\\d\\d');

function jsonDateReviver(key, value) {
  if (dateRegex.test(value)) return new Date(value);
  return value;
}

export default async function graphQLFetch(query, variables = {}, showError = null) {
  /* global __isBrowser__ */
  const apiEndpoint = (__isBrowser__) ? window.ENV.UI_API_ENDPOINT
    : process.env.UI_SERVER_API_ENDPOINT;
  // eslint-disable-next-line max-len
  // Nos requetes au serveur api doivent arrivé au quai de graphQL (comme pour etre acheminées par graphQL, mais donc un seul endpoint general (pas d'endpoints specifiques comme en CRUD))
  console.log("GRAPHQLFETCH, variables: ", variables);
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.text(); // On convertit en texte et non json directement parce que response.json() ne peut pas utiliser de reviver
    const result = JSON.parse(body, jsonDateReviver);

    // showError('Juste pour tester la méthode showError');
    if (result.errors) {
      const error = result.errors[0];
      if (error.extensions.code === 'BAD_USER_INPUT') {
        const details = error.extensions.exception.stacktrace.join('\n ');
        if (showError) showError(`${error.message}:\n ${details}`);
        else { console.log(`${error.message}:\n ${details}`);}
      } else if (showError) {
        showError(`${error.extensions.code}: ${error.message}`);
      } else {
        console.log(`${error.extensions.code}: ${error.message}`);
      }
    }
    return result.data;
  } catch (e) {
    if (showError) showError(`Error in sending data to server: ${e.message}`);
    else console.log(`Error in sending data to server: ${e.message}`);
    return null;
  }
}
