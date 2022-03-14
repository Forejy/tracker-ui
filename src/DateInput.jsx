/* eslint-disable max-len */
import React from 'react';

function displayFormat(date) {
  return (date != null) ? date.toDateString() : '';
}

// Fonction pour l'affichage de la date

function editFormat(date) {
  return (date != null) ? date.toISOString().substr(0, 10) : '';
}

// Fonction pour l'edition de la date

function unformat(str) {
  const val = new Date(str);
  return Number.isNaN(val.getTime()) ? null : val;
}
// isNan renvoit false si ça s'est bien passé, donc unformat renvoit val

export default class DateInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: editFormat(props.value),
      focused: false,
      valid: true,
    };
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onFocus() {
    this.setState({ focused: true });
  }

  onBlur(e) {
    const { value, valid: oldValid } = this.state;
    const { onValidityChange, onChange } = this.props;
    const dateValue = unformat(value);
    const valid = value === '' || dateValue != null;
    if (valid !== oldValid && onValidityChange) {
      onValidityChange(e, valid);
    }
    this.setState({ focused: false, valid });
    if (valid) onChange(e, dateValue);
  }

  // Si jamais c'éttait valide juste avant, mais que là en testant on voit que c'est plus valide
  // on appelle onValidityChange
  // En fait c'etait facile à comprendre, d'ailleurs je sais pas pourquoi j'ai pas compris desuite. J'ai compris quand ? J'ai compris en me disant qu'apres que le champs de la date soit indiquée comment n'etant pas valie, on va revenir dans onBlur et avec une date de nouveau valide il faudra redire que le champs est valide via onValidityChange.
  // Donc en fait il faut pas verifier si valid est a true mais bien verifier si la validité  a changée, si valid a changé pour montrer ou retirer que l'input est invalide. C'est un toggle en fait.

  // C'est valide s'il y a rien dans l'input, ou si unformat retourne quelque chose

  // ? Pourquoi appeler dans onBlur si c'est valide ?

  onChange(e) {
    if (e.target.value.match(/^[\d-]*$/)) {
      this.setState({ value: e.target.value });
    }
  }

  // C'est que ici qu'on verifie si les caracteres sont valides ou non

  render() {
    const { valid, focused, value } = this.state;
    const { value: origValue, onValidityChange, ...props } = this.props
    const displayValue = (focused || valid) ? value : displayFormat(origValue);
    return (
      <input
        {...props}
        value={displayValue}
        placeholder={focused ? 'yyyy-mm-dd' : null}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        onChange={this.onChange}
      />
    );
  }
}
