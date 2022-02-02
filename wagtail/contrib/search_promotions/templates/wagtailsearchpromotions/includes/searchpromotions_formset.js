/* global InlinePanel */
$(function () {
  var formset = document.querySelector(
    "[data-formset-prefix='id_{{ formset.prefix }}'",
  );

  var data = formset.dataset;
  var panel = InlinePanel({
    formsetPrefix: data.formsetPrefix,
    emptyChildFormPrefix: data.emptyChildFormPrefix,
    canOrder: !!data.canOrder,
  });

  data.childControls.split(' ').forEach(function (childPrefix) {
    panel.initChildControls(childPrefix);
  });

  panel.updateMoveButtonDisabledStates();
});
