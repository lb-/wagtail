$(function () {
  $('.image-url-generator').each(function () {
    var $this = $(this);
    var $form = $this.find('form');
    var $filterMethodField = $form.find('select#id_filter_method');
    var $widthField = $form.find('input#id_width');
    var $heightField = $form.find('input#id_height');
    var $closenessField = $form.find('input#id_closeness');
    var $result = $this.find('#result-url');
    var $loadingMask = $this.find('.loading-mask');
    var $preview = $this.find('img.preview');
    var $sizeNote = $('#note-size');

    var generatorUrl = $this.data('generatorUrl');

    function formChangeHandler() {
      var filterSpec = $filterMethodField.val();

      $loadingMask.addClass('loading');

      if (filterSpec === 'width') {
        filterSpec += '-' + $widthField.val();
      } else if (filterSpec === 'height') {
        filterSpec += '-' + $heightField.val();
      } else if (
        filterSpec === 'min' ||
        filterSpec === 'max' ||
        filterSpec === 'fill'
      ) {
        if (filterSpec === 'fill') {
          filterSpec +=
            '-' +
            $widthField.val() +
            'x' +
            $heightField.val() +
            '-c' +
            $closenessField.val();
        } else {
          filterSpec += '-' + $widthField.val() + 'x' + $heightField.val();
        }
      }

      // Display note about scaled down images if image is large
      if ($widthField.val() > $(window).width()) {
        $sizeNote.show();
      } else {
        $sizeNote.hide();
      }

      // Fields with width and height
      $.getJSON(generatorUrl.replace('__filterspec__', filterSpec))
        .done(function (data) {
          $result.val(data.url);
          $preview.attr('src', data.preview_url);
          $loadingMask.removeClass('loading');
        })
        .fail(function (data) {
          $result.val(data.responseJSON.error);
          $preview.attr('src', '');
          $loadingMask.removeClass('loading');
        });
    }

    $form.on('change', $.debounce(500, formChangeHandler));
    $form.on('keyup', $.debounce(500, formChangeHandler));
    formChangeHandler();
  });
});
