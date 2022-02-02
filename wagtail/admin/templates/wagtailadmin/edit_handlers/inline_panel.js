/* global InlinePanel */
document.addEventListener('DOMContentLoaded', function () {
  var formset = document.querySelector(
    "[data-formset-prefix='id_{{ self.formset.prefix }}'",
  );

  var data = formset.dataset;
  var opts = {
    formsetPrefix: data.formsetPrefix,
    emptyChildFormPrefix: data.emptyChildFormPrefix,
    canOrder: !!data.canOrder,
    maxForms: Number(data.maxForms || 1000),
  };
  var panel = InlinePanel(opts);

  (data.childControls || '').split(' ').forEach(function (childPrefix) {
    if (childPrefix) panel.initChildControls(childPrefix);
  });

  panel.setHasContent();
  panel.updateMoveButtonDisabledStates();
  panel.updateAddButtonState();
});
