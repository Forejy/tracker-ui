import React from 'react';
import store from './store.js';
import graphQLFetch from './graphQLFetch.js';

export default class About extends React.Component {
  static async fetchData() { // Elle est accessible depuis l'objet (voir About.fetchData, c'est comme une propriété)
    const data = await graphQLFetch('query{about}');
    return data;
  }

  constructor(props) {
    super(props);
    const apiAbout = store.initialData ? store.initialData.about : null;
    delete store.initialData
    this.state = { apiAbout };
  }

  async componentDidMount() {
    const { apiAbout } = this.state;
    console.log('componentDidMount')
    if (apiAbout === null) {
      console.log('fetchData')
      const data = await About.fetchData();
      console.log('data : ', data)
      this.setState({ apiAbout: data.about });
    }
  }

  render() {
    const { apiAbout } = this.state;
    return (
      <div className="text-center">
        <h3>Issue Tracker version 0.9</h3>
        <h4>
          { apiAbout }
        </h4>
      </div>
    );
  }
}
