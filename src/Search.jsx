import React from 'react';
import SelectAsync from 'react-select/lib/Async';
import { withRouter } from 'react-router-dom';

import graphQLFetch from './graphQLFetch.js';
import withToast from './withToast.jsx';

class Search extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeSelection = this.onChangeSelection.bind(this);
    this.loadOptions = this.loadOptions.bind(this);
  }

  onChangeSelection({ value }) {
    const { history } = this.props;
    history.push(`/edit/${value}`);
  }

  async loadOptions(term) {
    if (term.length < 3) return [];
    const query = `query issueList($search: String) {
      issueList(search: $search) {
        issues {id title}
      }
    }`;

    const { showError } = this.props;
    const data = await graphQLFetch(query, { search: term }, showError);
    return data.issueList.issues.map(issue => ({
      label: `#${issue.id}: ${issue.title}`, value: issue.id,
    }));
  }

  render() {
    return (
      <SelectAsync
        instanceId="search-select" // Ça sert s'il y a plusieurs React Selects sur la meme page
        value="" // Pour pas garder la selection dans la barre de recherche
        loadOptions={this.loadOptions}
        filterOption={() => true}
        onChange={this.onChangeSelection}
        components={{ DropdownIndicator: null }} // juste un argument qui sert à supprimer un element visuel
      />
    );
  }
}

export default withRouter(withToast(Search));
