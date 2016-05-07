(function($)
{
  var bindEvents = function(messages, li, f)
  {
    var onSelect = $(messages).data("jquery.messages.options").onSelect;

    if(onSelect)
    {
      $(li).on("click", function()
      {
        onSelect($(this).data("type"), $(this).data("destination"));
      });
    }
  }

  var methods =
  {
    update: function()
    {
      var f = $(this).data("jquery.messages.options").onLoad;

      if(f)
      {
        var opts = $(this).data("jquery.messages.options");
        var ul = this;

        $.mobile.loading("show");

        return f($(this).data("jquery.messages.options").pageSize)
          .done(function(messages)
          {
            // insert messages:
            $(messages).each(function(i, msg)
            {
              if(!$(ul).find('li[data-id="' + msg["id"] + '"]').first().get(0))
              {
                var el = null;

                if(msg["type"] == "wrote-comment" || msg["type"] == "voted-object" || msg["type"] == "recommendation")
                {
                  // insert list element:
                  var image = msg["target"];
                  var author = msg["source"]["username"];
                  
                  if(msg["type"] != "recommendation")
                  {
                    image = image["object"];
                  }

                  if(msg["type"] == "wrote-comment")
                  {
                    var text = msg["target"]["text"];

                    el = $('<li data-id="' + msg["id"] + '" data-destination="' + image["guid"] + ',' + msg["target"]["id"] + '" data-type="comment">' +
                           '<a href="#"><img data-source="' + image["source"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                           '<h2>' + image["source"].escapeHTML() + '</h2>' +
                           '<p>' + new Date(msg["created_on"]["$date"]).toLocaleString() + '</p>' +
                           '<p><em>' + text.escapeHTML() + '</em></p>' +
                           '<p>commented by <strong>' + author.escapeHTML() + '</strong></p>' +
                           '</a></li>');
                  }
                  else if(msg["type"] == "voted-object")
                  {
                    var liked = msg["target"]["voting"];

                    el = $('<li data-id="' + msg["id"] + '" data-destination="' + image["guid"] + '" data-type="image">' +
                           '<a href="#"><img data-source="' + image["source"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                           '<h2>' + image["source"].escapeHTML() + '</h2>' +
                           '<p>' + new Date(msg["created_on"]["$date"]).toLocaleString() + '</p>' +
                           '<p>' + author.escapeHTML() + ' <strong>' + (liked ? 'liked' : 'disliked') + '</strong> this picture.</p>' +
                           '</a></li>');                     
                  }
                  else
                  {
                    el = $('<li data-id="' + msg["id"] + '" data-destination="' + image["guid"] + '" data-type="image">' +
                           '<a href="#"><img data-source="' + image["source"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                           '<h2>' + image["source"].escapeHTML() + '</h2>' +
                           '<p>' + new Date(msg["created_on"]["$date"]).toLocaleString() + '</p>' +
                           '<p><strong>' + author.escapeHTML() + ' </strong> recommended this picture to you.</p>' +
                           '</a></li>'); 
                  }

                  $(ul).append(el);
                  bindEvents(ul, el);

                  // load thumbnail:
                  if(opts.onGetThumbnail)
                  {
                    opts.onGetThumbnail(image["source"])
                      .success(function(thumbnail)
                      {
                        $(el).find('img[data-source="' + image["source"].escapeQuotes() + '"]').attr("src", thumbnail);
                      })
                      .fail(function(r)
                      {
                        $(el).find('img[data-source="' + image["source"].escapeQuotes() + '"]').attr("src", "images/image-missing.png");
                      });
                  }
                }
                else if(msg["type"] == "following" || msg["type"] == "unfollowing")
                {
                  // insert list element:
                  var source = msg["source"];

                  el = $('<li data-id="' + msg["id"] + '">' +
                         '<img data-source="' + source["username"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                         '<h2>' + source["username"].escapeHTML() + '</h2>' +
                         '<p>' + new Date(msg["created_on"]["$date"]).toLocaleString() + '</p>' +
                         '<p>is now <strong>' + msg["type"] + '</strong> you.</p>' +
                         '</li>');

                  $(ul).append(el);

                  // load avatar:
                  if(opts.onGetAvatar)
                  {
                    opts.onGetAvatar(source["username"])
                      .done(function(avatar)
                      {
                        $(el).find('img[data-source="' + source["username"].escapeQuotes() + '"]').attr("src", avatar);
                      })
                      .fail(function(r)
                      {
                        $(el).find('img[data-source="' + source["username"].escapeQuotes() + '"]').attr("src", "images/image-missing.png");
                      });
                  }
                }
              }
            });

            $(ul).listview("refresh");
          })
          .always(function()
          {
            $.mobile.loading("hide");
          });
      }

      return null;
    },
    clear: function()
    {
      $(this).find("li").remove();
      $(this).listview("refresh");
    }
  };

  function createMessages(obj, options)
  {
    $(obj).data("jquery.messages", true);
    $(obj).data("jquery.messages.options", $.extend({pageSize: 10, tail: 0, onLoad: null, onSelect: null, onGetAvatar: null, onGetThumbnail: null}, options));

    $(obj).find("li").remove();
    $(obj).listview();
  }

  $.fn.messages = function(args)
  {
    if(methods[args])
    {
      var parameters = Array.prototype.slice.call(arguments, 1);

      return this.each(function()
      {
        if($(this).data("jquery.messages"))
        {
          methods[args].apply(this, parameters);

          return this;
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
        createMessages(this, args);
        methods["update"].apply(this);
      });
    }
  }
}(jQuery));
