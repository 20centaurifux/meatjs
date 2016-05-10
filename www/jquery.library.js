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
      });
    }
  }

  var methods =
  {
    update: function()
    {
      methods.loadPage.apply(this, [0]);
    },
    nextPage: function()
    {
      var page = $(this).data("jquery.library.options").tail;
      var library = this;

      methods.loadPage.apply(this, [page + 1])
        .done(function(images)
        {
          if(images.length > 0)
          {
            $(library).data("jquery.library.options").tail++;
          }
        });
    },
    loadPage: function(page)
    {
      var f = $(this).data("jquery.library.options").onLoad;

      if(f)
      {
        setTimeout(function() { $.mobile.loading("show"); }, 50);

        var library = this;

        return f(page, $(this).data("jquery.library.options").pageSize)
          .done(function(images)
          {
            $(images).each(function()
            {
              methods.touch.apply(library, [this, true, false]);
            });

            if($(library).data("jquery.library.options").onCompare)
            {
              methods.sort.apply(library);
            }
          })
          .fail(function()
          {
            navigator.notification.alert("Couldn't load images, please try again.", null, "Request failed", "Ok");
          })
          .always(function()
          {
            $.mobile.loading("hide");
          });
      }

      return null;
    },
    touch: function(image, insert, sort)
    {
      // test if image has already been inserted:
      var li = $(this).find('li[data-guid="' + image["guid"] + '"]').first();

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
                   '<span data-field="up">' + image["score"]["up"] + '</span> up,' +
                   '<span data-field="down">' + image["score"]["down"] + '</span> down, ' +
                   '<span data-field="fav">' + image["score"]["fav"] + '</span> favs</p>' +
                   '</a></li>');

        $(this).append(el);
        bindEvents(this, el);
      }

      // sort list:
      var compare = $(this).data("jquery.library.options").onCompare;

      if(sort && compare)
      {
        methods.sort.apply(this);
      }

      // redraw listview control & load thumbnail:
      $(this).listview("refresh");

      var client = new MeatStore().createClient();

      client.getThumbnail(image["source"])
        .success(function(thumbnail)
        {
          $('img[data-source="' + image["source"].escapeQuotes() + '"]').attr("src", thumbnail);
        })
        .fail(function(r)
        {
          $('img[data-source="' + image["source"].escapeQuotes() + '"]').attr("src", "images/image-missing.png");
        });
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
    }
  };

  function createLibrary(obj, options)
  {
    $(obj).data("jquery.library", true);
    $(obj).data("jquery.library.options", $.extend({pageSize: 10, tail: 0, onLoad: null, onCompare: null}, options));
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
