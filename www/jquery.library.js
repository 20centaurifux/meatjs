(function($)
{
  var buildListItem = function(image)
  {
     return $('<li data-guid="' + image["guid"] + '" data-source="' + image["source"].escapeQuotes() + '" data-timestamp="' + image["created_on"]["$date"] + '">' +
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

  var findGUID = function(a, guid)
  {
    var length = a.length;

    for(var i = 0; i < length; i++)
    {
      if(a[i]["guid"] == guid)
      {
        return i;
      }
    }

    return -1;
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
      var library = this;
      var page = $(library).data("jquery.library.tail");
      var opts = $(library).data("jquery.library.options");

      if(triggerNext && !opts.silent)
      {
        setTimeout(function() { $.mobile.loading("show"); }, 1);
      }

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
                methods.touch.apply(library, [this, true, false, true]);
              });

              if(opts.onCompare)
              {
                methods.sort.apply(library);
              }
              else
              {
                methods.refresh.apply(library);
              }

              if(triggerNext)
              {
                if(!opts.silent)
                {
                  setTimeout(function() { $.mobile.loading("hide"); }, 1);
                }

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
    touch: function(image, insert, sort, noRefresh)
    {
      var opts = $(this).data("jquery.library.options");
      var objects = $(this).data("jquery.library.objects");
      var m = $(this).data("jquery.library.map");

      // test if image has already been inserted:
      var inserted = false;
      var li = m[image["guid"]];

      if(li)
      {
        var index = findGUID(objects, image["guid"]);
        var old = objects[index];

        // image found => update details (if necessary):
        if(old["comments_n"] != image["comments_n"]       ||
           old["score"]["up"] != image["score"]["up"]     ||
           old["score"]["down"] != image["score"]["down"] ||
           old["score"]["fav"] != image["score"]["fav"])
        {
          $(li).find('span[data-field="comments_n"]').html(image["comments_n"]);
          $(li).find('span[data-field="up"]').html(image["score"]["up"]);
          $(li).find('span[data-field="down"]').html(image["score"]["down"]);
          $(li).find('span[data-field="fav"]').html(image["score"]["fav"]);
        }
      }
      else if(insert)
      {
        // insert new image:
        objects.push(image);

        if(!sort)
        {
          var el = buildListItem(image);
          bindEvents(this, el);

          m[image["guid"]] = el;

          $(this).append(el);
        }

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
        methods.sort.apply(this, [noRefresh]);
      }
      else if(!noRefresh)
      {
        methods.refresh.apply(this);
      }

      // load thumbnail:
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
      var library = $(this);

      library.find("li").remove();
      library.data("jquery.library.selected", null);
      library.data("jquery.library.tail", 0);
      library.data("jquery.library.objects", new Array());
      library.data("jquery.library.map", {});

      methods.refresh.apply(this);
    },
    sort: function(noRefresh)
    {
      var library = $(this);
      var compare = library.data("jquery.library.options").onCompare;

      if(compare)
      {
        var objects = library.data("jquery.library.objects");
        var m = library.data("jquery.library.map");

        objects.sort(compare);

        var old = library.find("li").detach();

        $.each(objects, function(i, image)
        {
          library.append(m[image["guid"]]);
        });

        if(!noRefresh)
        {
          methods.refresh.apply(this);
        }
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
    },
    refresh: function()
    {
      var library = $(this);
      var objects = library.data("jquery.library.objects");
      var el = library.data("jquery.library.emptyNotification");

      if(objects.length == 0 && !el)
      {
        var el = $("<li>This library is empty.</li>");

        library.append(el);
        library.data("jquery.library.emptyNotification", el);
      }
      else if(objects.length && el)
      {
        el.remove();
        library.data("jquery.library.emptyNotification", null);
      }

      library.listview("refresh");
    }
  };

  function createLibrary(obj, options)
  {
    var sel = $(obj);

    if(!sel.data("jquery.library"))
    {
      sel.data("jquery.library", true);
      sel.data("jquery.library.tail", 0);
      sel.data("jquery.library.objects", new Array());
      sel.data("jquery.library.map", {});
      sel.data("jquery.emptyNotification", null);

      methods.refresh.apply(obj);
    }

    sel.data("jquery.library.options",
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
