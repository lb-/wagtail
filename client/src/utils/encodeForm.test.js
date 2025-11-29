import { encodeForm } from './encodeForm';

/**
 * Helper function to get a form element by ID.
 * @param {string} id - The ID of the form element.
 * @returns {HTMLFormElement} The form element.
 */
function getForm(id) {
  return document.getElementById(id);
}

describe('encodeForm', () => {
  it('should serialize a simple form with text input', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="text" name="username" value="testuser">
      </form>
    `;
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('username=testuser');
  });

  it('should serialize multiple form fields', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="text" name="first_name" value="John">
        <input type="text" name="last_name" value="Doe">
      </form>
    `;
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('first_name=John&last_name=Doe');
  });

  it('should URL-encode special characters', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="text" name="message" value="Hello World!">
      </form>
    `;
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('message=Hello+World%21');
  });

  it('should serialize hidden fields', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="hidden" name="token" value="abc123">
      </form>
    `;
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('token=abc123');
  });

  it('should serialize select elements', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <select name="privacy">
          <option value="public">Public</option>
          <option value="private" selected>Private</option>
        </select>
      </form>
    `;
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('privacy=private');
  });

  it('should serialize radio buttons (only checked ones)', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="radio" name="visibility" value="public">
        <input type="radio" name="visibility" value="private" checked>
      </form>
    `;
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('visibility=private');
  });

  it('should serialize checked checkboxes', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="checkbox" name="agree" value="yes" checked>
        <input type="checkbox" name="subscribe" value="yes">
      </form>
    `;
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('agree=yes');
  });

  it('should return empty string for empty form', () => {
    document.body.innerHTML = '<form id="test-form"></form>';
    const form = getForm('test-form');
    expect(encodeForm(form)).toBe('');
  });
});
