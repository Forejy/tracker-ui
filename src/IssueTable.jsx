/* eslint-disable react/jsx-no-bind */
import React from 'react';
import { withRouter } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Button, Glyphicon, OverlayTrigger, Tooltip, Table,
} from 'react-bootstrap';
import UserContext from './UserContext.js';

// eslint-disable-next-line react/prefer-stateless-function
class IssueRowPlain extends React.Component {
  render() {
    const {
      issue, location: { search }, closeIssue, deleteIssue, index,
    } = this.props;
    const user = this.context;
    const disabled = !user.signedIn;

    const selectLocation = {
      pathname: `/issues/${issue.id}`, search, closeIssue,
    };
    const editTooltip = (
      <Tooltip id="edit-tooltip" placement="top">Edit Issue </Tooltip>
    );
    const closeTooltip = (
      <Tooltip id="close-tooltip" placement="top">Close Issue</Tooltip>
    );
    const deleteTooltip = (
      <Tooltip id="delete-tooltip" placement="top">Delete Issue</Tooltip>
    );

    function onClose(e) {
      e.preventDefault();
      closeIssue(index);
    }
    function onDelete(e) {
      e.preventDefault(e);
      deleteIssue(index);
    }

    const {
      id, status, owner, created, effort, due, title,
    } = issue;

    const tableRow = (
      <tr>
        <td>{ id }</td>
        <td>{ status }</td>
        <td>{ owner }</td>
        <td>{ created.toDateString() }</td>
        <td>{ effort }</td>
        <td>{ due ? due.toDateString() : '' }</td>
        <td>{ title }</td>
        <td>
          <LinkContainer to={`/edit/${id}`}>
            <OverlayTrigger delayShow={1000} overlay={editTooltip}>
              <Button bsSize="xsmall">
                <Glyphicon glyph="edit" />
              </Button>
            </OverlayTrigger>
          </LinkContainer>
          {' '}
          <OverlayTrigger delayShow={1000} overlay={closeTooltip}>
            <Button disabled={disabled} bsSize="xsmall" onClick={onClose}>
              <Glyphicon glyph="remove" />
            </Button>
          </OverlayTrigger>
          {' '}
          <OverlayTrigger delayShow={1000} overlay={deleteTooltip}>
            <Button disabled={disabled} bsSize="xsmall" onClick={onDelete}>
              <Glyphicon glyph="trash" />
            </Button>
          </OverlayTrigger>
        </td>
      </tr>
    );

    return (
      <LinkContainer to={selectLocation}>
        {tableRow}
      </LinkContainer>
    );
  }
}

IssueRowPlain.contextType = UserContext;
const IssueRow = withRouter(IssueRowPlain)
delete IssueRow.contextType;

export default function IssueTable({ issues, closeIssue, deleteIssue }) {
  // eslint-disable-next-line max-len
  console.log(issues);
  const issueRows = issues.map((issue, index) => <IssueRow key={issue.id} issue={issue} closeIssue={closeIssue} deleteIssue={deleteIssue} index={index} />);
  return (
    <Table bordered condensed hover responsive>
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Owner</th>
          <th>Created</th>
          <th>Effort</th>
          <th>Due Date</th>
          <th>Title</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        { issueRows }
      </tbody>
    </Table>
  );
}
