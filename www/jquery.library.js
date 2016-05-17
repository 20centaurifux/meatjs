(function($)
{
  var buildObject = function(li)
  {
    var obj = {};

    obj["guid"] = $(li).data("guid");
    obj["source"] = $(li).data("source");
    obj["created_on"] = {"$date": $(li).data("timestamp")}
    obj["comments_n"] = parseInt($(li).find('span[data-field="comments_n"]').text(), 10);
    obj["score"] = {}
    obj["score"]["up"] = parseInt($(li).find('span[data-field="up"]').text(), 10);
    obj["score"]["down"] = parseInt($(li).find('span[data-field="down"]').text(), 10);
    obj["score"]["fav"] = parseInt($(li).find('span[data-field="fav"]').text(), 10);

    return obj;
  }

  var bindEvents = function(library, li)
  {
    var onSelect = $(library).data("jquery.library.options").onSelect;

    if(onSelect)
    {
      $(li).on("click", function()
      {
        onSelect($(this).data("guid"));

        $(library).data("jquery.library.selected", li);
      });
    }
  }

  var methods =
  {
    update: function()
    {
      var lastUpdate = $(this).data("lastUpdate");

      if(lastUpdate == null || (new Date().getTime() - lastUpdate) / 1000 > $(this).data("jquery.library.options").requestLimit)
      {
        var opts = $(this).data("jquery.library.options");

        if(!opts.silent)
        {
          setTimeout(function() { $.mobile.loading("show"); }, 1);
        }

        methods.loadPage.apply(this, [0])
          .always(function()
          {
            if(!opts.silent)
            {
              setTimeout(function() { $.mobile.loading("hide"); }, 1);
            }
          });

        $(this).data("lastUpdate", new Date().getTime());
      }
    },
    nextPage: function(triggerNext)
    {
      var page = $(this).data("jquery.library.tail");
      var library = this;

      return methods.loadPage.apply(this, [page + 1, triggerNext])
        .done(function(images)
        {
          if(images.length > 0)
          {
            $(library).data("jquery.library.tail", page + 1);
          }
        });
    },
    loadPage: function(page, triggerNext)
    {
      var opts = $(this).data("jquery.library.options");
      var f = opts.onLoad;

      if(f)
      {
        var library = this;

        return f(page, $(this).data("jquery.library.options").pageSize)
          .done(function(images)
          {
            if(images && images.length > 0)
            {
              $(images).each(function()
              {
                methods.touch.apply(library, [this, true, false]);
              });

              if(opts.onCompare)
              {
                methods.sort.apply(library);
              }

              if(triggerNext)
              {
                methods.next.apply(library);
              }
            }
          })
          .fail(function()
          {
            if(!opts.silent)
            {
              navigator.notification.alert("Couldn't load images, please try again.", null, "Request failed", "Ok");
            }
          });
      }

      return null;
    },
    touch: function(image, insert, sort)
    {
      var opts = $(this).data("jquery.library.options");

      // test if image has already been inserted:
      var li = $(this).find('li[data-guid="' + image["guid"] + '"]').first();
      var inserted = false;

      if(li.get(0))
      {
        // image found => update details:
        $(li).find('span[data-field="comments_n"]').html(image["comments_n"]);
        $(li).find('span[data-field="up"]').html(image["score"]["up"]);
        $(li).find('span[data-field="down"]').html(image["score"]["down"]);
        $(li).find('span[data-field="fav"]').html(image["score"]["fav"]);
      }
      else if(insert)
      {
        // insert new image:
        var el = $('<li data-guid="' + image["guid"] + '" data-source="' + image["source"].escapeQuotes() + '" data-timestamp="' + image["created_on"]["$date"] + '">' +
                   '<a href="#"><img data-source="' + image["source"].escapeQuotes() + '"src="images/image-loader.gif" alt="">' +
                   '<h2>' + image["source"].escapeHTML() + '</h2>' +
                   '<p><strong>Created on: </strong>' +
                   '<span data-field="date">' + new Date(image["created_on"]["$date"]).toLocaleString() + '</span></p>' +
                   '<p><strong>Comments: </strong>' +
                   '<span data-field="comments_n">' + image["comments_n"] + '</span></p>' +
                   '<p><strong>Score: </strong>' +
                   '<span data-field="up">' + image["score"]["up"] + '</span> up, ' +
                   '<span data-field="down">' + image["score"]["down"] + '</span> down, ' +
                   '<span data-field="fav">' + image["score"]["fav"] + '</span> favorite(s)</p>' +
                   '</a></li>');

        $(this).append(el);
        bindEvents(this, el);

        if(opts.onNewImage)
        {
          opts.onNewImage(image);
        }

        inserted = true;
      }

      // sort list:
      var compare = opts.onCompare;

      if(sort && compare)
      {
        methods.sort.apply(this);
      }

      // redraw listview control & load thumbnail:
      $(this).listview("refresh");

      if(inserted)
      {
        var client = new MeatStore().createClient();
        var obj = this;

        client.getThumbnail(image["source"])
          .success(function(thumbnail)
          {
            $(obj).find('img[data-source="' + image["source"].escapeQuotes() + '"]').attr("src", thumbnail);
          })
          .fail(function(r)
          {
            $(obj).find('img[data-source="' + image["source"].escapeQuotes() + '"]').attr("src", "images/image-missing.png");
          });
      }
    },
    remove: function(image)
    {
      var li = $(this).find('li[data-guid="' + image["guid"] + '"]').first();

      if(li.get(0))
      {
        $(li).remove();
      }
    },
    clear: function()
    {
      $(this).find("li").remove();
      $(this).listview("refresh");
      $(this).data("jquery.library.selected", null);
      $(this).data("jquery.library.tail", 0);

    },
    sort: function()
    {
      var compare = $(this).data("jquery.library.options").onCompare;

      if(compare)
      {
        var items = $(this).find("li").get();
        var library = this;

        items.sort(function(a, b)
        {
          return compare(buildObject(a), buildObject(b));
        });

        $(this).find("li").remove();

        $.each(items, function(i, li)
        {
          $(library).append(li);
          bindEvents(library, li);
        });
      }
    },
    next: function()
    {
      var li = $(this).data("jquery.library.selected");
      var n = $(li).next();

      if(n && n.get(0))
      {
        $(n).click();
      }
      else
      {
        methods.nextPage.apply(this, [true]);
      }
    },
    prev: function(f)
    {
      var li = $(this).data("jquery.library.selected");
      var p = $(li).prev();
      var success = false;

      if(p && p.get(0))
      {
        $(p).click();
        success = true;
      }

      if(f)
      {
        f(success);
      }
    }
  };

  function createLibrary(obj, options)
  {
    if(!$(obj).data("jquery.library"))
    {
      $(obj).data("jquery.library", true);
      $(obj).data("jquery.library.tail", 0);
    }

    $(obj).data("jquery.library.options",
                $.extend({pageSize: 10, onLoad: null, onCompare: null, requestLimit: 0, onNewMessage: null, silent: false},
                options));
  }

  $.fn.library = function(args)
  {
    if(methods[args])
    {
      var parameters = Array.prototype.slice.call(arguments, 1);

      return this.each(function()
      {
        if($(this).data("jquery.library"))
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
        createLibrary(this, args);
      });
    }
  }
}(jQuery));
