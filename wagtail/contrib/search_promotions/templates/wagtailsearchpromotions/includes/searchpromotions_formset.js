$(function() {
    var formset = document.querySelector("[data-formset-prefix='id_{{ formset.prefix }}'");

    var data = formset.dataset;
    var panel = InlinePanel({
        formsetPrefix: data.formsetPrefix,
        emptyChildFormPrefix: data.emptyChildFormPrefix,
        canOrder: true,
    });

    console.log('search_promotions initFormset', { data, formset, panel });

    data.childControls.split(' ').forEach(function(childPrefix) {
        console.log('init child', { childPrefix });
        panel.initChildControls(childPrefix);
    });

    panel.updateMoveButtonDisabledStates();
});
