import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { name: String }

  connect() {
    const name = this.nameValue;
    this.element.textContent = `Hello, ${name}!`;
  }
}
