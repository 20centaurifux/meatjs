(function($)
{
  var methods =
  {
    update: function()
    {
      methods.loadPage.apply(this, [0]);

      return this;
    },
    nextPage: function()
    {
      var comments = this;

      if(!$(comments).data("jquery.comments.options").endOfStream)
      {
        var page = $(this).data("jquery.comments.options").tail;
        var comments = this;

        methods.loadPage.apply(this, [page + 1])
          .done(function(result)
          {
            if(result.length > 0)
            {
              $(comments).data("jquery.comments.options").tail++;
            }
            else
            {
              $(comments).data("jquery.comments.options").endOfStream = true;
            }
          });
      }

      return this;
    },
    loadPage: function(page)
    {
      var f = $(this).data("jquery.comments.options").onLoad;

      if(f)
      {
        var opts = $(this).data("jquery.comments.options");
        var ul = this;
        var users = new Array();

        $.mobile.loading("show");

        return f(page, $(this).data("jquery.comments.options").pageSize)
          .done(function(comments)
          {
            // insert comments:
            $(comments).each(function(i, comment)
            {
              var li = $(ul).find('li[data-id="' + comment["id"] + '"]').first();

              if(!li.get(0))
              {
                var author = comment["user"]["username"];
                var el = $('<li data-id="' + comment["id"] + '" data-timestamp="' + comment["created_on"]["$date"] + '">' +
                           '<img data-source="' + author.escapeQuotes() + '" src="images/image-loader.gif" alt="">' +
                           '<p>' + comment["text"].escapeHTML() + '</p>' +
                           '<p>' + new Date(comment["created_on"]["$date"]).toLocaleString() + '</strong>' +
                           ' by <strong>' + author.escapeHTML() + '</strong></p>' +
                           '</li>');

                var inserted = false;

                $(ul).find("li").each(function(i, c)
                {
                  if(parseInt(comment["created_on"]["$date"], 10) > parseInt($(c).data("timestamp"), 10))
                  {
                    $(c).before(el);
                    inserted = true;
                  }

                  return !inserted;
                });

                if(!inserted)
                {
                  $(ul).append(el);
                }

                if($.inArray(author, users) == -1)
                {
                  users.push(author);
                }
              }
            });

            $(ul).listview("refresh");

            // load avatars:
            if(opts.onGetAvatar)
            {
              $(users).each(function(i, username)
              {
                opts.onGetAvatar(username)
                  .done(function(avatar)
                  {
                    $(ul).find('img[data-source="' + username.escapeQuotes() + '"]').attr("src", avatar);
                  })
                  .fail(function(r)
                  {
                    $(ul).find('img[data-source="' + username.escapeQuotes() + '"]').attr("src", "images/image-missing.png");
                  });
              });
            }
          })
          .always(function()
          {
            $.mobile.loading("hide");
          });
      }

      return null;
    }
  };

  function createComments(obj, options)
  {
    $(obj).data("jquery.comments", true);
    $(obj).data("jquery.comments.options", $.extend({pageSize: 10, tail: 0, endOfStream: false, onLoad: null, onGetAvatar: null}, options));

    $(obj).find("li").remove();
    $(obj).listview();
  }

  $.fn.comments = function(args)
  {
    if(methods[args])
    {
      var parameters = Array.prototype.slice.call(arguments, 1);

      return this.each(function()
      {
        if($(this).data("jquery.comments"))
        {
          return methods[args].apply(this, parameters);
        }
        else
        {
          return null;
        }
      });
    }
    else if(typeof args === 'object' || !args)
    {
      return this.each(function()
      {
        createComments(this, args);
        methods["update"].apply(this);
      });
    }
  }
}(jQuery));