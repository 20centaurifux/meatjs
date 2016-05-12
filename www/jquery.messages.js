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
      var obj = this;
      var lastUpdate = $(obj).data("lastUpdate");
      var opts = $(this).data("jquery.messages.options");

      if(f && (lastUpdate == null || (new Date().getTime() - lastUpdate) / 1000 > opts.requestLimit))
      {
        var ul = this;

        if(!opts.silent)
        {
          setTimeout(function() { $.mobile.loading("show"); }, 50);
        }

        return f($(this).data("jquery.messages.options").pageSize)
          .done(function(messages)
          {
            var inserted = false;

            // insert messages:
            $(messages).each(function(i, msg)
            {
              if(!$(ul).find('li[data-id="' + msg["id"] + '"]').first().get(0))
              {
                var el = null;

                if(opts.onNewMessage)
                {
                  opts.onNewMessage(msg);
                }

                inserted = true;

                var created_on = new Date(msg["created_on"]["$date"]);

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

                    el = $('<li data-id="' + msg["id"] + '" data-destination="' + image["guid"] + ',' + msg["target"]["id"] + '" data-type="comment" data-timestamp="' + created_on.getTime() + '">' +
                           '<a href="#"><img data-source="' + image["source"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                           '<h2>' + image["source"].escapeHTML() + '</h2>' +
                           '<p>' + created_on.toLocaleString() + '</p>' +
                           '<p><em>' + text.escapeHTML() + '</em></p>' +
                           '<p>commented by <strong>' + author.escapeHTML() + '</strong></p>' +
                           '</a></li>');
                  }
                  else if(msg["type"] == "voted-object")
                  {
                    var liked = msg["target"]["voting"];

                    el = $('<li data-id="' + msg["id"] + '" data-destination="' + image["guid"] + '" data-type="image" data-timestamp="' + created_on.getTime() + '">' +
                           '<a href="#"><img data-source="' + image["source"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                           '<h2>' + image["source"].escapeHTML() + '</h2>' +
                           '<p>' + created_on.toLocaleString() + '</p>' +
                           '<p>' + author.escapeHTML() + ' <strong>' + (liked ? 'liked' : 'disliked') + '</strong> this picture.</p>' +
                           '</a></li>');                     
                  }
                  else
                  {
                    el = $('<li data-id="' + msg["id"] + '" data-destination="' + image["guid"] + '" data-type="image" data-timestamp="' + created_on.getTime() + '">' +
                           '<a href="#"><img data-source="' + image["source"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                           '<h2>' + image["source"].escapeHTML() + '</h2>' +
                           '<p>' +  created_on.toLocaleString() + '</p>' +
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

                  el = $('<li data-id="' + msg["id"] + '" data-timestamp="' + created_on.getTime() + '">' +
                         '<img data-source="' + source["username"].escapeQuotes() + '"src="images/image-loader.gif" alt="" date-timestamp="' + created_on.getTime() + '">' +
                         '<h2>' + source["username"].escapeHTML() + '</h2>' +
                         '<p>' + created_on.toLocaleString() + '</p>' +
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

            if(inserted)
            {
              var items = $(ul).find("li").get();

              items.sort(function(a, b)
              {
                return parseInt($(b).data("timestamp"), 10) - parseInt($(a).data("timestamp"), 10);
              });

              $(ul).find("li").remove();

              $.each(items, function(i, li)
              {
                $(ul).append(li);
                bindEvents(ul, li);
              });
            }

            $(obj).data("lastUpdate", new Date().getTime());

            $(ul).listview("refresh");
          })
          .fail(function()
          {
            if(!opts.silent)
            {
              navigator.notification.alert("Couldn't load messages, please try again.", null, "Request failed", "Ok");
            }
          })
          .always(function()
          {
            if(!opts.silent)
            {
              $.mobile.loading("hide");
            }
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
    $(obj).data("jquery.messages.options",
                $.extend({pageSize: 10, tail: 0, onLoad: null, onSelect: null, onGetAvatar: null, onGetThumbnail: null, onNewMessage: null, silent: false, requestLimit: 0},
                options));

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
