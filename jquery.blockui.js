(function($)
{
  var methods =
  {
    show: function()
    {
      $("body").append('<div class="blockedUI" />');
      $.mobile.loading('show');
    },
    hide: function()
    {
      $(".blockedUI").remove();
      $.mobile.loading('hide');
    }
  };

  $.fn.blockUI = function(method)
  {
    methods[method].apply(this);
  }
}(jQuery));
