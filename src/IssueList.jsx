/* eslint-disable semi */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
import React from 'react';
import URLSearchParams from 'url-search-params';
import { Route } from 'react-router-dom'
import {
  Label, Panel, Pagination, Button,
} from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap';
import IssueFilter from './IssueFilter.jsx';
import IssueTable from './IssueTable.jsx';
import IssueDetail from './IssueDetail.jsx';
import graphQLFetch from './graphQLFetch.js';
import withToast from './withToast.jsx';
import store from './store.js';

function PageLink({ pageNum, search, activePage, children }) {
  const currentParams = new URLSearchParams(search);
  currentParams.set('page', pageNum)
  const url = { pathname: '/issues/', search: currentParams.toString() } // / ?status=Assigned&effortMin=2&page=4
  if (pageNum === 0) return React.cloneElement(children, { disabled: true })
  return (
    <LinkContainer to={url} isActive={() => pageNum === activePage}>
      {children}
    </LinkContainer>
  )
}

class IssueList extends React.Component {
  static async fetchData(match, search, showError) {
    const params = new URLSearchParams(search);
    const vars = { hasSelection: false, selectedId: 0 };
    if (params.get('status')) vars.status = params.get('status');
    const effortMin = parseInt(params.get('effortMin'), 10)
    if (!Number.isNaN(effortMin)) vars.effortMin = effortMin
    const effortMax = parseInt(params.get('effortMax'), 10)
    if (!Number.isNaN(effortMax)) vars.effortMax = effortMax

    const { params: { id } } = match
    const idInt = parseInt(id, 10)
    if (!Number.isNaN(idInt)) {
      vars.hasSelection = true;
      vars.selectedId = idInt;
    }

    let page = parseInt(params.get('page'), 10)
    if (Number.isNaN(page)) page = 1 // isNan renvoit false si ça s'est bien passé ('ça aurait du etre un nombre') // Ils protegent l'input, alors qu'ils protègent deja la requete cote back au niveau du schema
    vars.page = page


    const query = `query issueList(
      $status: StatusType
      $effortMin: Int
      $effortMax: Int
      $hasSelection: Boolean!
      $selectedId: Int!
      $page: Int
    ) {
      issueList (
        status: $status
        effortMin: $effortMin
        effortMax: $effortMax
        page: $page
      ) {
        issues {
          id title status owner
          created effort due
        }
        pages
      }
      issue(id: $selectedId) @include (if : $hasSelection) {
        id description
      }
    }`;

    const result = await graphQLFetch(query, vars, showError); // Pas besoin du showError si on construit la page avec le serveur puisque c'est pour afficher l'erreur dans le navigateur showError donc si c'est appelé par une methode qui doit elle etre appelée depuis le navigateur faut ajouter le showError, et si fetchData est appelée depuis une methode qui elle est appelée depuis le serveur faut pas de showError.

    console.log("result: ", result)
    return result
  }

  constructor() {
    super();
    const initialData = store.initialData || { issueList: {} }
    const {
      issueList: { issues, pages }, issue: selectedIssue,
    } = initialData // Dans la requete on peut aussi une issue spécifié (pour afficher sa description) // ? Comment c'est protégé ça quand issues et pages valent undefined ? On le protège plus tard quand on veut faire de ces variables un affichage ? Ou alors c'est pas supposé etre a undefined ?
    console.log("pages", initialData)

    delete store.initialData
    this.state = {
      issues,
      pages,
      selectedIssue,
    };
    this.createIssue = this.createIssue.bind(this);
    this.closeIssue = this.closeIssue.bind(this);
    this.deleteIssue = this.deleteIssue.bind(this);
  }

  componentDidMount() {
    const { issues } = this.state
    console.log("componentDidMount issues:", issues)
    if (issues === undefined) { this.loadData(); }
  }

  componentDidUpdate(prevProps) {
    const {
      match: { params: { id: prevId } },
      location: { search: prevSearch },
    } = prevProps;
    const { location: { search }, match: { params: { id } } } = this.props;
    if (prevSearch !== search || prevId !== id) {
      this.loadData();
    }
  }

  async loadData() {
    const { location: { search }, match, showError } = this.props;
    const data = await IssueList.fetchData(match, search, showError)
    if (data) { // Si la data existe pas on va avoir une erreur en utilisant une methode d'un objet qui existe pas
      const { issueList: { issues, pages }, issue: selectedIssue } = data
      this.setState({
        issues,
        pages,
        selectedIssue,
      });
    }
  }

  async createIssue(issue) {
    const query = `mutation issueAdd($issue: IssueInputs!) {
      issueAdd(issue: $issue) {
        id
      }
    }`;

    const { showError } = this.props
    const data = await graphQLFetch(query, { issue }, showError);
    if (data) { // Ça sert à rien de recharger si la data a pas changé donc en pratique ça veut dire si on a pas reçu de data en retour
      this.loadData();
    }
  }

  async closeIssue(index) {
    const query = `
      mutation issueClose($id: Int!) {
        issueUpdate(id: $id, changes: {status: Closed}) {
          id title status owner
          effort created due description
        }
      }
    `
    const { issues } = this.state
    const { showError } = this.props

    const data = await graphQLFetch(query, { id: issues[index].id }, showError)
    if (data) {
      this.setState((prevState) => {
        const newList = [...prevState.issues]
        newList[index] = data.issueUpdate
        return { issues: newList }
      })
    } else {
      this.loadData()
    }
  }

  async deleteIssue(index) {
    const { issues } = this.state
    const { id } = issues[index]
    const query = `
      mutation issueDelete($id: Int!) {
        issueDelete(id: $id)
      }
    `
    const { showError, showSuccess } = this.props
    const data = await graphQLFetch(query, { id }, showError)
    if (data && data.issueDelete) {
      this.setState((prevState) => {
        const { issues: prevList } = prevState
        const newList = [...prevList]
        const { location: { pathname, search }, history } = this.props
        if (pathname === `/issues/${id}`) {
          history.push({ pathname: '/issues', search })
        }
        delete newList[index]
        return ({ issues: newList })
      })
      const undoMessage = (
        <span>
          {`Deleted issue ${id} successfully.`}
          <Button bsStyle="link" onClick={() => this.restoreIssue(id)}>
            UNDO
          </Button>
        </span>
      )
      showSuccess(undoMessage)
    } else {
      this.loadData()
    }
  }

  async restoreIssue(id) {
    const query = `
    mutation issueDelete($id: Int!) {
      issueRestore(id: $id)
    }
  `
    const { showSuccess, showError } = this.props
    const result = await graphQLFetch(query, { id }, showError)
    if (result) {
      showSuccess(`Issue ${id} restored successfully.`);
      this.loadData()
    }
  }

  // ?Pourquoi utiliser le prevState quand on a acces au state et qu'on sait qu'il a pas changé ?

  render() {
    const newLocal = this.state;
    const { issues } = newLocal;
    if (issues == null) return null;
    const { selectedIssue } = this.state;

    // eslint-disable-next-line react/destructuring-assignment
    const hasFilter = this.props.location.search !== ''


    // ------------------------------
    // const length = 5
    // const end = currentPage + 2
    const { pages } = this.state
    const { location: { search }} = this.props

    const params = new URLSearchParams(search);
    let page = parseInt(params.get('page'), 10)
    if (Number.isNaN(page)) page = 1 // parseInt peut retourner NaN donc les developpeurs de parseInt considere qu'il peut y avoir une erreur donc il faut test le retour de parseInt; et au lieu de retourner une erreur ()

    const SECTION_SIZE = 5
    const length = pages >= SECTION_SIZE ? SECTION_SIZE : pages
    let start;
    if (pages <= SECTION_SIZE || page <= SECTION_SIZE) start = 1
    else if (page > pages) start = pages - 4
    else start = page - 4
    // Si pages est trop petit le start est forcement a 1, si pages est normal mais que page depasse on a le start max par rapport a pages (le nombre de pages max), sinon c'est le cas normal page dans pages et donc c'est par rapport a page

    console.log("page: ", page)
    console.log("length: ", length)
    console.log("start: ", start)

    const filledArray = Array.from({ length }, (_, i) => {
      const pageNum = start + i
      return (
        <PageLink key={pageNum} pageNum={pageNum} search={search} activePage={page}>
          <Pagination.Item>
            {pageNum}
          </Pagination.Item>
        </PageLink>
      )
    })

    const prevSection = page <= SECTION_SIZE ? 0 : page - SECTION_SIZE
    let nextSection;
    if (page >= pages) nextSection = 0
    else if (page + SECTION_SIZE > pages) nextSection = pages
    else nextSection = page + SECTION_SIZE


    const pagination = (
      <>
        <Pagination>
          <PageLink pageNum={prevSection} search={search}>
            <Pagination.Item>
              {'<'}
            </Pagination.Item>
          </PageLink>
          {filledArray}
          <PageLink pageNum={nextSection} search={search}>
            <Pagination.Item>
              {'>'}
            </Pagination.Item>
          </PageLink>
        </Pagination>
      </>
    )

    return (
      <React.Fragment>
        <Panel defaultExpanded={hasFilter}>
          <Panel.Heading>
            <Panel.Title toggle>Filter</Panel.Title>
          </Panel.Heading>
          <Panel.Collapse>
            <Panel.Body>
              <IssueFilter urlBase="/issues" />
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
        <IssueTable issues={issues} closeIssue={this.closeIssue} deleteIssue={this.deleteIssue} />
        {pagination}
        <hr />
        <IssueDetail issue={selectedIssue} />
      </React.Fragment>
    );
  }
}

const IssueListWithToast = withToast(IssueList);
IssueListWithToast.fetchData = IssueList.fetchData

export default IssueListWithToast
