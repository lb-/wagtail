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
    // what I really want is to avoid updating any nested script CONTENT
    // but I do want to update the id of the nested script
    // maybe?
    const newFormHtml = emptyFormTemplate
      // .replace(/__prefix__/g, formCount)
      .replace(/<-(-*)\/script>/g, '<$1/script>');
      // "(?:.*?(__prefix__)\s*?)"

    /**
     * I want to build a temporary DOM element
     * document.createElement
     * https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
     * Then I want to traverse the element, replacing content recursively until we get to a NEW
     * django template script element, the content inside that should be replaced but
     * with an additional __PREFIX__ kept I think
     *
     *
     */

    /**
     *
     * NAH NAH what I want is a smarter regex (lol)
     * basically when there is a DOUBLE __prefix__ in the same attribute, we only want to update the first
     * OR we just replace the prefix
     */

    formContainer.append(newFormHtml);
    console.log('add item', { formCount, formContainer, prefix, newFormHtml });
    if (opts.onAdd) opts.onAdd(formCount);
    if (opts.onInit) opts.onInit(formCount);

    formCount++;
    totalFormsInput.val(formCount);
  });
}
window.buildExpandingFormset = buildExpandingFormset;
