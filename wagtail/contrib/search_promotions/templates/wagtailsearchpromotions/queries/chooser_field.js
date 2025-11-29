function createQueryChooser(id) {
  var chooserElement = document.getElementById(id + '-chooser');
  var input = document.getElementById(id);

  if (!chooserElement || !input) return;

  chooserElement.addEventListener('click', function (event) {
    event.preventDefault();
    var initialUrl = '{% url "wagtailsearchpromotions:chooser" %}';

    ModalWorkflow({
      url: initialUrl,
      onload: QUERY_CHOOSER_MODAL_ONLOAD_HANDLERS,
      responses: {
        queryChosen: function (queryData) {
          input.value = queryData.querystring;
        },
      },
    });
  });
}

window.createQueryChooser = createQueryChooser;
