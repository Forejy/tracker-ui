/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { Panel, Table } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import graphQLFetch from './graphQLFetch.js';
import IssueFilter from './IssueFilter.jsx';
import withToast from './withToast.jsx';
import store from './store.js';

function IssueCountsRow({ row }) {
  const {
    owner, New, Assigned, Fixed, Closed,
  } = row;
  return (
    <tr>
      <td>{owner}</td>
      <td>{New || 0}</td>
      <td>{Assigned || 0}</td>
      <td>{Fixed || 0}</td>
      <td>{Closed || 0}</td>
    </tr>
  );
}

function IssueCountsHeads() {
  const statuses = ['New', 'Assigned', 'Fixed', 'Closed'];
  const heads = statuses.map(status => (<th>{status}</th>));
  return (heads);
}

class IssueReport extends React.Component {
  static async fetchData(match, search, showError) { // Faut le parametre au lieu des props parce que c'est une fonction static, et qu'une fonction static faut qu'elle puisse etre appelée en dehors d'une instance, à partir du prototype
    const params = new URLSearchParams(search);
    const vars = {};
    if (params.get('status')) vars.status = params.get('status');
    const effortMin = parseInt(params.get('effortMin'), 10);
    if (!Number.isNaN(effortMin)) vars.effortMin = effortMin;
    const effortMax = parseInt(params.get('effortMax'), 10);
    if (!Number.isNaN(effortMax)) vars.effortMax = effortMax;
    const query = `
    query issueCounts(
      $status: StatusType
      $effortMin: Int
      $effortMax: Int
    ) {
      issueCounts (
        status: $status
        effortMin: $effortMin
        effortMax: $effortMax
      )
      {
        owner New Assigned Fixed Closed
      }
    }`;

    // La syntaxe expliquée
    // issueCounts () c'est le prototype
    // { issueCounts() } c'est l'appel

    const data = await graphQLFetch(query, vars, showError);
    return data;
  }

  constructor() {
    console.log("report")
    super();
    const issueCounts = store.initialData ? store.initialData.issueCounts : null
    delete store.initialData;
    this.state = { issueCounts };
  }

  componentDidMount() {
    const { issueCounts } = this.state;
    if (issueCounts === null) this.loadData();
  }

  componentDidUpdate(prevProps) {
    const { location: { search: prevSearch } } = prevProps;
    const { location: { search } } = this.props;
    if (prevSearch !== search) {
      this.loadData();
    }
  }

  async loadData() {
    const { location: { search }, showError } = this.props;
    const data = await IssueReport.fetchData(null, search, showError);
    if (data) this.setState({ issueCounts: data.issueCounts });
  }

  render() {
    const { location: { search } } = this.props;
    const { issueCounts } = this.state;
    const hasFilter = search !== '';

    if (issueCounts === null) return null;
    const rows = issueCounts.map(row => (<IssueCountsRow row={row} />));

    return (
      <>
        <Panel defaultExpanded={hasFilter}>
          <Panel.Heading>
            <Panel.Title toggle>Filter</Panel.Title>
          </Panel.Heading>
          <Panel.Collapse>
            <Panel.Body>
              <IssueFilter urlBase="/report" />
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
        <Table bordered condensed hover responsive>
          <thead>
            <tr>
              <th>Owner</th>
              <IssueCountsHeads />
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </>
    );
  }
}

const IssueReportWithRouter = withToast(withRouter(IssueReport));
IssueReportWithRouter.fetchData = IssueReport.fetchData;
export default IssueReportWithRouter;
