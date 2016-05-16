(function($)
{
  var methods =
  {
    show: function()
    {
      setTimeout(function()
      {
        $("body").append('<div class="blockedUI" />');
        $.mobile.loading('show');
      }, 1);
    },
    hide: function()
    {
      setTimeout(function()
      {
        $(".blockedUI").remove();
        $.mobile.loading('hide');
      }, 1);
    }
  };

  $.fn.blockUI = function(method)
  {
    methods[method].apply(this);
  }
}(jQuery));
