import React from 'react';
import Toast from './Toast.jsx';

// À utiliser avec fetchData : passer showError à fetchData()

export default function withToast(OriginalComponent) {
  return class ToastWrapper extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        toastVisible: false, toastMessage: '', toastType: 'success',
      };
      this.dismissToast = this.dismissToast.bind(this);
      this.showSuccess = this.showSuccess.bind(this);
      this.showError = this.showError.bind(this);
    }

    showSuccess(message) {
      this.setState({
        toastVisible: true, toastMessage: message, toastType: 'success',
      })
    }

    showError(message) {
      this.setState({
        toastVisible: true, toastMessage: message, toastType: 'danger',
      })
    }

    dismissToast() {
      this.setState({ toastVisible: false });
    }

    render() {
      const { toastType, toastVisible, toastMessage } = this.state;
      return (
        <React.Fragment>
          <OriginalComponent
            showSuccess={this.showSuccess}
            showError={this.showSuccess}
            dismisToast={this.dismisToast}
            {...this.props} // Pourquoi on lui passe les props de ce ToastWrapper ?
          />
          <Toast
            bsStyle={toastType}
            showing={toastVisible}
            onDismiss={this.dismisToast}
          >
            {toastMessage}
          </Toast>
        </React.Fragment>
      );
    }
  }
}
