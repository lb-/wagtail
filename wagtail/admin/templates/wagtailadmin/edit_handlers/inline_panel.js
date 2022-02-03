/* {% load l10n %} */
/* global InlinePanel */
(function () {
  var panel = InlinePanel({
    formsetPrefix: 'id_{{ self.formset.prefix }}',
    emptyChildFormPrefix: '{{ self.empty_child.form.prefix }}',
    canOrder: !!'{% if can_order %}true{% endif %}',
    maxForms: Number('{{ self.formset.max_num|unlocalize }}'),
  });

  // {% for child in self.children %}
  panel.initChildControls('{{ child.form.prefix }}');
  // {% endfor %}
  panel.setHasContent();
  panel.updateMoveButtonDisabledStates();
  panel.updateAddButtonState();
})();
