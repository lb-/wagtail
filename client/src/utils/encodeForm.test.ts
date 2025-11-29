import { encodeForm } from './encodeForm';

describe('encodeForm', () => {
  it('should encode a simple form with text inputs', () => {
    const form = document.createElement('form');
    const input1 = document.createElement('input');
    input1.name = 'username';
    input1.value = 'john_doe';
    const input2 = document.createElement('input');
    input2.name = 'email';
    input2.value = 'john@example.com';
    form.appendChild(input1);
    form.appendChild(input2);

    const result = encodeForm(form);

    expect(result).toBe('username=john_doe&email=john%40example.com');
  });

  it('should encode a form with multiple values for the same name', () => {
    const form = document.createElement('form');
    const checkbox1 = document.createElement('input');
    checkbox1.type = 'checkbox';
    checkbox1.name = 'interests';
    checkbox1.value = 'music';
    checkbox1.checked = true;
    const checkbox2 = document.createElement('input');
    checkbox2.type = 'checkbox';
    checkbox2.name = 'interests';
    checkbox2.value = 'sports';
    checkbox2.checked = true;
    form.appendChild(checkbox1);
    form.appendChild(checkbox2);

    // Migrated by an AI Narwhal and I have not reviewed this code yet
    const result = encodeForm(form);

    expect(result).toBe('interests=music&interests=sports');
  });

  it('should encode a form with special characters', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'message';
    input.value = 'Hello & goodbye!';
    form.appendChild(input);

    const result = encodeForm(form);

    expect(result).toBe('message=Hello+%26+goodbye%21');
  });

  it('should handle file inputs by encoding their filename', () => {
    const form = document.createElement('form');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'attachment';
    form.appendChild(fileInput);

    // Create a mock File object
    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });

    // Set the files property
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    const result = encodeForm(form);

    expect(result).toBe('attachment=test-file.txt');
  });

  it('should handle empty forms', () => {
    const form = document.createElement('form');

    const result = encodeForm(form);

    expect(result).toBe('');
  });

  it('should handle forms with unchecked checkboxes', () => {
    const form = document.createElement('form');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'agree';
    checkbox.value = 'yes';
    checkbox.checked = false;
    form.appendChild(checkbox);

    const result = encodeForm(form);

    expect(result).toBe('');
  });

  it('should handle forms with textareas', () => {
    const form = document.createElement('form');
    const textarea = document.createElement('textarea');
    textarea.name = 'description';
    textarea.value = 'A long description\nwith multiple lines';
    form.appendChild(textarea);

    const result = encodeForm(form);

    expect(result).toBe('description=A+long+description%0Awith+multiple+lines');
  });

  it('should handle forms with select elements', () => {
    const form = document.createElement('form');
    const select = document.createElement('select');
    select.name = 'country';
    const option1 = document.createElement('option');
    option1.value = 'us';
    const option2 = document.createElement('option');
    option2.value = 'uk';
    option2.selected = true;
    select.appendChild(option1);
    select.appendChild(option2);
    form.appendChild(select);

    const result = encodeForm(form);

    expect(result).toBe('country=uk');
  });

  it('should handle forms with radio buttons', () => {
    const form = document.createElement('form');
    const radio1 = document.createElement('input');
    radio1.type = 'radio';
    radio1.name = 'size';
    radio1.value = 'small';
    radio1.checked = false;
    const radio2 = document.createElement('input');
    radio2.type = 'radio';
    radio2.name = 'size';
    radio2.value = 'large';
    radio2.checked = true;
    form.appendChild(radio1);
    form.appendChild(radio2);

    const result = encodeForm(form);

    expect(result).toBe('size=large');
  });

  it('should handle disabled form controls', () => {
    const form = document.createElement('form');
    const input1 = document.createElement('input');
    input1.name = 'enabled';
    input1.value = 'yes';
    const input2 = document.createElement('input');
    input2.name = 'disabled';
    input2.value = 'no';
    input2.disabled = true;
    form.appendChild(input1);
    form.appendChild(input2);

    const result = encodeForm(form);

    expect(result).toBe('enabled=yes');
  });
});
