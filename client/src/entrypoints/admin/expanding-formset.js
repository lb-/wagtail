import $ from 'jquery';

/**
 * Prefix supplied will be used to determine the id of the ADD button, FORMS container
 * and TOTAL_FORMS hidden input.
 *
 * For each existing count range, opts.onInit will be called with that id (zero indexed).
 * The found templated will be copied and the `__prefix__` value updated with the incremented
 * id value. The total forms input's value will also be incremented.
 *
 * If the found add button is disabled, no template will be copied.
 *
 * @param {string} prefix
 * @param {{onInit: function, onAdd: function}} opts
 */
function buildExpandingFormset(prefix, opts = {}) {
  const addButton = $('#' + prefix + '-ADD');
  const formContainer = $('#' + prefix + '-FORMS');
  const totalFormsInput = $('#' + prefix + '-TOTAL_FORMS');
  let formCount = parseInt(totalFormsInput.val(), 10);

  if (opts.onInit) {
    for (let i = 0; i < formCount; i++) {
      opts.onInit(i);
    }
  }

  let emptyFormTemplate = document.getElementById(prefix + '-EMPTY_FORM_TEMPLATE');
  if (emptyFormTemplate.innerText) {
    emptyFormTemplate = emptyFormTemplate.innerText;
  } else if (emptyFormTemplate.textContent) {
    emptyFormTemplate = emptyFormTemplate.textContent;
  }

  addButton.on('click', () => {
    if (addButton.hasClass('disabled')) return;
    const newFormHtml = emptyFormTemplate
      .replace(/__prefix__/g, formCount)
      .replace(/<-(-*)\/script>/g, '<$1/script>');
    formContainer.append(newFormHtml);
    if (opts.onAdd) opts.onAdd(formCount);
    if (opts.onInit) opts.onInit(formCount);

    formCount++;
    totalFormsInput.val(formCount);
  });
}
window.buildExpandingFormset = buildExpandingFormset;
